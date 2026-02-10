/**
 * Analyze VS Code repositories for experimental settings
 * Scans TypeScript configuration files AND package.json files for settings
 * with 'experimental', 'preview', or 'onExp' tags
 * 
 * Now includes git history lookup to find the actual date when settings were added
 */

import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { writeFile } from 'fs/promises';
import { batchGetSettingDates } from './git-history.js';

const OUTPUT_FILE = process.env.OUTPUT_FILE || './found-settings.json';
const SKIP_GIT_LOOKUP = process.env.SKIP_GIT_LOOKUP === 'true';

// Tags that indicate experimental/preview settings
const EXPERIMENTAL_TAGS = ['experimental', 'preview', 'onExp'];

// Repositories to scan
const REPOS = [
    {
        name: 'VS Code',
        path: process.env.VSCODE_PATH || './vscode',
        searchDirs: ['src/vs', 'extensions']
    },
    {
        name: 'Copilot Chat',
        path: process.env.COPILOT_CHAT_PATH || './vscode-copilot-chat',
        searchDirs: ['src', 'extensions'],
        // Also scan root package.json for contributes.configuration
        packageJsonPaths: ['package.json']
    }
];

/**
 * Recursively find all TypeScript files in a directory
 */
async function findTsFiles(dir, files = []) {
    try {
        const entries = await readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            
            if (entry.isDirectory()) {
                // Skip node_modules and test directories
                if (entry.name !== 'node_modules' && !entry.name.includes('test')) {
                    await findTsFiles(fullPath, files);
                }
            } else if (entry.name.endsWith('.ts')) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        // Directory doesn't exist or not accessible
    }
    
    return files;
}

/**
 * Extract area from setting name (first two segments)
 * e.g., "workbench.editor.experimentalFeature" -> "workbench.editor"
 */
function extractArea(settingName) {
    const parts = settingName.split('.');
    if (parts.length >= 2) {
        return `${parts[0]}.${parts[1]}`;
    }
    return parts[0];
}

/**
 * Extract default value from setting block content
 */
function extractDefault(blockContent) {
    // Look for default: <value> pattern
    const defaultMatch = blockContent.match(/default\s*:\s*([^,}\n]+)/);
    if (defaultMatch) {
        let value = defaultMatch[1].trim();
        // Clean up trailing commas or whitespace
        value = value.replace(/,\s*$/, '').trim();
        // If it's a complex expression, mark as computed
        if (value.includes('(') || value.includes('?') || value.match(/^[A-Z][a-zA-Z]*\./)) {
            return '<computed>';
        }
        return value;
    }
    return null;
}

/**
 * Extract all tags from setting block content
 */
function extractTags(blockContent) {
    const tagsMatch = blockContent.match(/tags\s*:\s*\[([^\]]*)\]/);
    if (tagsMatch) {
        const tagsContent = tagsMatch[1];
        const tagMatches = tagsContent.match(/['"]([^'"]+)['"]/g);
        if (tagMatches) {
            return tagMatches.map(t => t.replace(/['"]/g, ''));
        }
    }
    return [];
}

/**
 * Check if content contains any experimental tags
 */
function hasExperimentalTag(content) {
    for (const tag of EXPERIMENTAL_TAGS) {
        if (content.includes(`'${tag}'`) || content.includes(`"${tag}"`)) {
            return true;
        }
    }
    return false;
}

/**
 * Extract experimental settings from file content (TypeScript files)
 */
function extractExperimentalSettings(content, filePath) {
    const settings = [];
    
    // Use line-by-line parsing to capture full setting blocks
    const lines = content.split('\n');
    let currentSetting = null;
    let currentSettingLine = null;
    let braceDepth = 0;
    let inSettingBlock = false;
    let blockContent = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Look for setting name pattern (must contain a dot, e.g. "editor.fontSize")
        const settingMatch = line.match(/['"`]([a-zA-Z][a-zA-Z0-9_.]+)['"`]\s*:\s*\{/);
        if (settingMatch && !inSettingBlock && settingMatch[1].includes('.')) {
            currentSetting = settingMatch[1];
            currentSettingLine = i + 1; // 1-based line number
            inSettingBlock = true;
            braceDepth = 1;
            blockContent = line;
            continue;
        }
        
        if (inSettingBlock) {
            blockContent += '\n' + line;
            braceDepth += (line.match(/\{/g) || []).length;
            braceDepth -= (line.match(/\}/g) || []).length;
            
            if (braceDepth <= 0) {
                // Block complete - check if it has any experimental tag
                if (hasExperimentalTag(blockContent)) {
                    if (currentSetting && !settings.find(s => s.name === currentSetting)) {
                        const defaultValue = extractDefault(blockContent);
                        const tags = extractTags(blockContent);
                        const area = extractArea(currentSetting);
                        
                        settings.push({
                            name: currentSetting,
                            file: filePath,
                            line: currentSettingLine,
                            area: area,
                            default: defaultValue,
                            tags: tags
                        });
                    }
                }
                
                inSettingBlock = false;
                currentSetting = null;
                currentSettingLine = null;
                blockContent = '';
            }
        }
    }
    
    return settings;
}

/**
 * Extract experimental settings from package.json contributes.configuration
 */
function extractSettingsFromPackageJson(content, filePath) {
    const settings = [];
    
    try {
        const pkg = JSON.parse(content);
        const configurations = pkg.contributes?.configuration;
        
        if (!configurations) {
            return settings;
        }
        
        // Configuration can be an object or array
        const configArray = Array.isArray(configurations) ? configurations : [configurations];
        
        for (const config of configArray) {
            const properties = config.properties;
            if (!properties) continue;
            
            for (const [settingName, settingDef] of Object.entries(properties)) {
                const tags = settingDef.tags || [];
                
                // Check if any experimental tag is present
                const hasExpTag = tags.some(tag => 
                    EXPERIMENTAL_TAGS.includes(tag.toLowerCase())
                );
                
                if (hasExpTag) {
                    const area = extractArea(settingName);
                    
                    // Find approximate line number by searching for the setting name
                    const lines = content.split('\n');
                    let lineNumber = 1;
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].includes(`"${settingName}"`)) {
                            lineNumber = i + 1;
                            break;
                        }
                    }
                    
                    settings.push({
                        name: settingName,
                        file: filePath,
                        line: lineNumber,
                        area: area,
                        default: settingDef.default !== undefined ? JSON.stringify(settingDef.default) : null,
                        tags: tags
                    });
                }
            }
        }
    } catch (error) {
        console.error(`   Error parsing ${filePath}: ${error.message}`);
    }
    
    return settings;
}

/**
 * Check if a repo directory exists
 */
async function checkRepoExists(repoPath) {
    try {
        await readdir(repoPath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Analyze a single repository for experimental settings
 */
async function analyzeRepo(repo) {
    console.log(`\n📦 Analyzing ${repo.name} at: ${repo.path}`);
    
    // Check if the repo exists
    if (!await checkRepoExists(repo.path)) {
        console.log(`   ⚠️  Repository not found, skipping...`);
        return [];
    }
    
    const repoSettings = [];
    
    // Scan TypeScript files in search directories
    for (const searchDir of repo.searchDirs) {
        const fullSearchPath = join(repo.path, searchDir);
        console.log(`   Searching in: ${searchDir}`);
        
        const tsFiles = await findTsFiles(fullSearchPath);
        console.log(`   Found ${tsFiles.length} TypeScript files`);
        
        for (const file of tsFiles) {
            try {
                const content = await readFile(file, 'utf-8');
                const relativePath = relative(repo.path, file);
                const settings = extractExperimentalSettings(content, `[${repo.name}] ${relativePath}`);
                
                // Add repo information for git blame
                for (const setting of settings) {
                    setting.repoPath = repo.path;
                    setting.repoFile = relativePath;
                    setting.repoName = repo.name;
                }
                
                if (settings.length > 0) {
                    console.log(`     Found ${settings.length} experimental settings in ${relativePath}`);
                    repoSettings.push(...settings);
                }
            } catch (error) {
                console.error(`   Error reading ${file}: ${error.message}`);
            }
        }
    }
    
    // Scan package.json files for contributes.configuration settings
    if (repo.packageJsonPaths) {
        console.log(`   Scanning package.json files for configuration settings...`);
        
        for (const pkgPath of repo.packageJsonPaths) {
            const fullPath = join(repo.path, pkgPath);
            try {
                const content = await readFile(fullPath, 'utf-8');
                const settings = extractSettingsFromPackageJson(content, `[${repo.name}] ${pkgPath}`);
                
                // Add repo information for git blame
                for (const setting of settings) {
                    setting.repoPath = repo.path;
                    setting.repoFile = pkgPath;
                    setting.repoName = repo.name;
                }
                
                if (settings.length > 0) {
                    console.log(`     Found ${settings.length} experimental settings in ${pkgPath}`);
                    repoSettings.push(...settings);
                }
            } catch (error) {
                // File doesn't exist, skip
            }
        }
    }
    
    // Also scan all extension package.json files
    const extensionsPath = join(repo.path, 'extensions');
    if (await checkRepoExists(extensionsPath)) {
        console.log(`   Scanning extension package.json files...`);
        const extPackageJsons = await findPackageJsonFiles(extensionsPath);
        
        for (const file of extPackageJsons) {
            try {
                const content = await readFile(file, 'utf-8');
                const relativePath = relative(repo.path, file);
                const settings = extractSettingsFromPackageJson(content, `[${repo.name}] ${relativePath}`);
                
                for (const setting of settings) {
                    setting.repoPath = repo.path;
                    setting.repoFile = relativePath;
                    setting.repoName = repo.name;
                }
                
                if (settings.length > 0) {
                    console.log(`     Found ${settings.length} experimental settings in ${relativePath}`);
                    repoSettings.push(...settings);
                }
            } catch (error) {
                // Skip errors
            }
        }
    }
    
    return repoSettings;
}

/**
 * Find all package.json files in a directory (for extensions)
 */
async function findPackageJsonFiles(dir, files = []) {
    try {
        const entries = await readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            
            if (entry.isDirectory()) {
                if (entry.name !== 'node_modules') {
                    await findPackageJsonFiles(fullPath, files);
                }
            } else if (entry.name === 'package.json') {
                files.push(fullPath);
            }
        }
    } catch (error) {
        // Directory doesn't exist or not accessible
    }
    
    return files;
}

/**
 * Main analysis function
 */
async function analyzeExperimentalSettings() {
    console.log('🔍 VS Code Experimental Settings Analyzer');
    console.log('=========================================');
    
    const allSettings = [];
    let reposFound = 0;
    
    for (const repo of REPOS) {
        const settings = await analyzeRepo(repo);
        if (settings.length > 0) {
            reposFound++;
        }
        allSettings.push(...settings);
    }
    
    if (reposFound === 0) {
        console.error('\n❌ Error: No repositories found.');
        console.error('Please run "npm run setup" first to clone the repositories.\n');
        process.exit(1);
    }
    
    // Deduplicate by setting name
    const uniqueSettings = [];
    const seen = new Set();
    
    for (const setting of allSettings) {
        if (!seen.has(setting.name)) {
            seen.add(setting.name);
            uniqueSettings.push(setting);
        }
    }
    
    console.log(`\n✅ Total unique experimental settings found: ${uniqueSettings.length}`);
    
    // Lookup git history to find when each setting was actually added
    if (!SKIP_GIT_LOOKUP) {
        console.log('\n📜 Looking up git history for settings...');
        
        // Group settings by repo for batch processing
        const settingsByRepo = new Map();
        for (const setting of uniqueSettings) {
            if (!settingsByRepo.has(setting.repoPath)) {
                settingsByRepo.set(setting.repoPath, []);
            }
            settingsByRepo.get(setting.repoPath).push(setting);
        }
        
        for (const [repoPath, settings] of settingsByRepo) {
            console.log(`   Looking up ${settings.length} settings in ${repoPath}...`);
            
            try {
                const gitDates = await batchGetSettingDates(repoPath, settings);
                
                let foundCount = 0;
                for (const setting of settings) {
                    const gitInfo = gitDates.get(setting.name);
                    if (gitInfo) {
                        setting.addedDate = gitInfo.date;
                        setting.addedCommit = gitInfo.commit;
                        setting.addedBy = {
                            name: gitInfo.author,
                            email: gitInfo.authorEmail
                        };
                        foundCount++;
                    }
                }
                
                console.log(`   Found git history for ${foundCount}/${settings.length} settings`);
            } catch (error) {
                console.error(`   Error looking up git history: ${error.message}`);
            }
        }
    } else {
        console.log('\n⏭️  Skipping git history lookup (SKIP_GIT_LOOKUP=true)');
    }
    
    // Sort by area, then by name
    uniqueSettings.sort((a, b) => {
        const areaCompare = a.area.localeCompare(b.area);
        if (areaCompare !== 0) return areaCompare;
        return a.name.localeCompare(b.name);
    });
    
    // Write output
    const output = {
        timestamp: new Date().toISOString(),
        count: uniqueSettings.length,
        settings: uniqueSettings
    };
    
    await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`📄 Results written to: ${OUTPUT_FILE}`);
    
    return output;
}

// Run if called directly
analyzeExperimentalSettings()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
