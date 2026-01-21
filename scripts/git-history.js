/**
 * Git history utilities for tracking when settings were introduced
 * Uses git log with pickaxe (-S) to find the actual commit where a setting was added
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Execute a git command in a repository
 */
async function gitExec(command, repoPath) {
    try {
        const { stdout, stderr } = await execPromise(command, {
            cwd: repoPath,
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large diffs
        });
        return { stdout: stdout.trim(), stderr: stderr.trim(), success: true };
    } catch (error) {
        return { stdout: '', stderr: error.message, success: false };
    }
}

/**
 * Find the commit where a setting was first introduced using git pickaxe
 * @param {string} repoPath - Path to the git repository
 * @param {string} filePath - Relative path to the file containing the setting
 * @param {string} settingName - The setting name to search for
 * @returns {Object|null} - { commit, date, author, authorEmail } or null
 */
export async function getSettingAddedDate(repoPath, filePath, settingName) {
    // Use -S (pickaxe) to find commits that introduced/removed the string
    // --reverse gives us the first commit (when it was added)
    // --diff-filter=A would only show when file was added, but we want when the string was added
    const command = `git log -S "${settingName}" --pretty=format:"%H|%aI|%an|%ae" --reverse -- "${filePath}"`;
    
    const { stdout, success } = await gitExec(command, repoPath);
    
    if (!success || !stdout) {
        return null;
    }
    
    // Get the first line (first commit where the setting appeared)
    const firstLine = stdout.split('\n')[0];
    if (!firstLine) return null;
    
    const [commit, date, author, email] = firstLine.split('|');
    
    return {
        commit: commit.substring(0, 7), // Short hash
        fullCommit: commit,
        date: date.split('T')[0], // Just the date part (YYYY-MM-DD)
        isoDate: date,
        author,
        authorEmail: email
    };
}

/**
 * Find all settings that were added in recent commits
 * @param {string} repoPath - Path to the git repository
 * @param {string} sinceDate - ISO date string (YYYY-MM-DD) to search from
 * @param {string[]} experimentalTags - Tags to look for (e.g., ['experimental', 'preview'])
 * @returns {Object[]} - Array of { settingName, commit, date, author, file }
 */
export async function findSettingsAddedSince(repoPath, sinceDate, experimentalTags = ['experimental', 'preview', 'onExp']) {
    const recentSettings = [];
    
    // Get commits since the date that modified relevant files
    const logCommand = `git log --since="${sinceDate}" --pretty=format:"%H|%aI|%an|%ae" --name-only -- "*.ts" "**/package.json"`;
    const { stdout: logOutput, success: logSuccess } = await gitExec(logCommand, repoPath);
    
    if (!logSuccess || !logOutput) {
        return recentSettings;
    }
    
    // Parse the log output to get commit info and changed files
    const commits = parseGitLog(logOutput);
    
    for (const commitInfo of commits) {
        // For each commit, get the diff to find new settings
        const diffCommand = `git show ${commitInfo.commit} --unified=0 --no-color -- ${commitInfo.files.map(f => `"${f}"`).join(' ')}`;
        const { stdout: diffOutput, success: diffSuccess } = await gitExec(diffCommand, repoPath);
        
        if (!diffSuccess || !diffOutput) continue;
        
        // Parse the diff for new settings with experimental tags
        const newSettings = parseAddedSettings(diffOutput, experimentalTags);
        
        for (const setting of newSettings) {
            recentSettings.push({
                ...setting,
                commit: commitInfo.commit.substring(0, 7),
                fullCommit: commitInfo.commit,
                date: commitInfo.date,
                author: commitInfo.author,
                authorEmail: commitInfo.authorEmail
            });
        }
    }
    
    // Deduplicate by setting name (keep the earliest occurrence)
    const seen = new Map();
    for (const setting of recentSettings) {
        if (!seen.has(setting.name) || new Date(setting.date) < new Date(seen.get(setting.name).date)) {
            seen.set(setting.name, setting);
        }
    }
    
    return Array.from(seen.values());
}

/**
 * Parse git log output with --name-only format
 */
function parseGitLog(output) {
    const commits = [];
    const lines = output.split('\n');
    
    let currentCommit = null;
    
    for (const line of lines) {
        if (line.includes('|')) {
            // This is a commit line
            if (currentCommit) {
                commits.push(currentCommit);
            }
            
            const [commit, isoDate, author, email] = line.split('|');
            currentCommit = {
                commit,
                date: isoDate.split('T')[0],
                isoDate,
                author,
                authorEmail: email,
                files: []
            };
        } else if (line.trim() && currentCommit) {
            // This is a file path
            currentCommit.files.push(line.trim());
        }
    }
    
    if (currentCommit) {
        commits.push(currentCommit);
    }
    
    return commits;
}

/**
 * Parse a git diff to find newly added settings with experimental tags
 */
function parseAddedSettings(diffOutput, experimentalTags) {
    const settings = [];
    const lines = diffOutput.split('\n');
    
    let currentFile = null;
    let inAddedBlock = false;
    let blockContent = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Track current file from diff header
        if (line.startsWith('+++ b/')) {
            currentFile = line.substring(6);
            continue;
        }
        
        // Only process added lines (starting with +)
        if (line.startsWith('+') && !line.startsWith('+++')) {
            const addedContent = line.substring(1);
            
            // Look for setting definitions with experimental tags in added lines
            // Pattern for TypeScript: 'settingName': { ... tags: ['experimental'] }
            const settingMatch = addedContent.match(/['"`]([a-zA-Z][a-zA-Z0-9_.]+)['"`]\s*:\s*\{/);
            
            if (settingMatch) {
                // Look ahead in the diff for tags in subsequent added lines
                let blockEnd = i;
                let tempBlock = addedContent;
                let braceCount = (addedContent.match(/\{/g) || []).length - (addedContent.match(/\}/g) || []).length;
                
                while (braceCount > 0 && blockEnd < lines.length - 1) {
                    blockEnd++;
                    const nextLine = lines[blockEnd];
                    if (nextLine.startsWith('+') && !nextLine.startsWith('+++')) {
                        tempBlock += '\n' + nextLine.substring(1);
                        braceCount += (nextLine.match(/\{/g) || []).length;
                        braceCount -= (nextLine.match(/\}/g) || []).length;
                    } else if (!nextLine.startsWith('-') && !nextLine.startsWith('@@')) {
                        // Context line
                        tempBlock += '\n' + nextLine;
                        braceCount += (nextLine.match(/\{/g) || []).length;
                        braceCount -= (nextLine.match(/\}/g) || []).length;
                    }
                }
                
                // Check if this block contains an experimental tag
                for (const tag of experimentalTags) {
                    if (tempBlock.includes(`'${tag}'`) || tempBlock.includes(`"${tag}"`)) {
                        settings.push({
                            name: settingMatch[1],
                            file: currentFile,
                            tag
                        });
                        break;
                    }
                }
            }
            
            // Also check for package.json style: "settingName": { "tags": ["experimental"] }
            // This is simpler - just look for the pattern in added lines
            const jsonSettingMatch = addedContent.match(/"([a-zA-Z][a-zA-Z0-9_.]+)"\s*:\s*\{/);
            if (jsonSettingMatch && currentFile?.endsWith('package.json')) {
                // Similar block parsing for JSON
                let blockEnd = i;
                let tempBlock = addedContent;
                let braceCount = (addedContent.match(/\{/g) || []).length - (addedContent.match(/\}/g) || []).length;
                
                while (braceCount > 0 && blockEnd < lines.length - 1) {
                    blockEnd++;
                    const nextLine = lines[blockEnd];
                    if (nextLine.startsWith('+')) {
                        tempBlock += '\n' + nextLine.substring(1);
                        braceCount += (nextLine.match(/\{/g) || []).length;
                        braceCount -= (nextLine.match(/\}/g) || []).length;
                    }
                }
                
                for (const tag of experimentalTags) {
                    if (tempBlock.includes(`"${tag}"`)) {
                        if (!settings.find(s => s.name === jsonSettingMatch[1])) {
                            settings.push({
                                name: jsonSettingMatch[1],
                                file: currentFile,
                                tag
                            });
                        }
                        break;
                    }
                }
            }
        }
    }
    
    return settings;
}

/**
 * Get the date of the most recent commit in a repository
 */
export async function getLatestCommitDate(repoPath) {
    const command = 'git log -1 --pretty=format:"%aI"';
    const { stdout, success } = await gitExec(command, repoPath);
    
    if (success && stdout) {
        return stdout.split('T')[0];
    }
    return null;
}

/**
 * Calculate date N days ago in YYYY-MM-DD format
 */
export function daysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
}

/**
 * Batch lookup for multiple settings - runs in parallel for speed
 * @param {string} repoPath - Path to the git repository
 * @param {Object[]} settings - Array of { name, repoFile } objects
 * @param {number} concurrency - Max parallel lookups (default 10)
 * @returns {Map} - Map of settingName -> git info
 */
export async function batchGetSettingDates(repoPath, settings, concurrency = 10) {
    const results = new Map();
    
    // Create lookup tasks
    const tasks = settings.map(setting => ({
        name: setting.name,
        file: setting.repoFile
    }));
    
    // Process in batches for controlled parallelism
    for (let i = 0; i < tasks.length; i += concurrency) {
        const batch = tasks.slice(i, i + concurrency);
        
        const batchResults = await Promise.all(
            batch.map(async task => {
                try {
                    const gitInfo = await getSettingAddedDate(repoPath, task.file, task.name);
                    return { name: task.name, gitInfo };
                } catch (error) {
                    return { name: task.name, gitInfo: null };
                }
            })
        );
        
        for (const { name, gitInfo } of batchResults) {
            if (gitInfo) {
                results.set(name, gitInfo);
            }
        }
    }
    
    return results;
}
