/**
 * Get owners for experimental settings using git blame
 * Reads found-settings.json and adds owner information
 */

import { readFile, writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const FOUND_SETTINGS_FILE = process.env.FOUND_SETTINGS_FILE || './found-settings.json';
const OUTPUT_FILE = process.env.OUTPUT_FILE || './found-settings.json';

/**
 * Run git blame on a specific line to get the author
 */
async function getBlameForLine(repoPath, filePath, lineNumber) {
    if (!lineNumber) return null;
    
    try {
        // Use git blame with porcelain format for easy parsing
        const cmd = `git -C "${repoPath}" blame -L ${lineNumber},${lineNumber} --porcelain -- "${filePath}"`;
        const { stdout } = await execAsync(cmd, { encoding: 'utf-8' });
        
        // Parse porcelain output
        const lines = stdout.split('\n');
        let author = null;
        let authorMail = null;
        let authorTime = null;
        let commitHash = null;
        
        for (const line of lines) {
            if (line.startsWith('author ')) {
                author = line.substring(7);
            } else if (line.startsWith('author-mail ')) {
                // Remove < and > from email
                authorMail = line.substring(12).replace(/[<>]/g, '');
            } else if (line.startsWith('author-time ')) {
                authorTime = parseInt(line.substring(12), 10);
            } else if (line.match(/^[0-9a-f]{40}/)) {
                commitHash = line.split(' ')[0];
            }
        }
        
        if (author && authorMail) {
            return {
                name: author,
                email: authorMail,
                date: authorTime ? new Date(authorTime * 1000).toISOString().split('T')[0] : null,
                commit: commitHash ? commitHash.substring(0, 7) : null
            };
        }
    } catch (error) {
        // Git blame failed (file might not be in git, or other error)
        console.error(`  Blame failed for ${filePath}:${lineNumber}: ${error.message}`);
    }
    
    return null;
}

/**
 * Process all settings and add owner information
 */
async function getOwners() {
    console.log('Loading found settings...');
    const content = await readFile(FOUND_SETTINGS_FILE, 'utf-8');
    const data = JSON.parse(content);
    
    console.log(`Processing ${data.settings.length} settings for ownership info...\n`);
    
    let processed = 0;
    let found = 0;
    
    for (const setting of data.settings) {
        processed++;
        
        if (!setting.repoPath || !setting.repoFile || !setting.line) {
            console.log(`  [${processed}/${data.settings.length}] Skipping ${setting.name} (missing location info)`);
            continue;
        }
        
        process.stdout.write(`  [${processed}/${data.settings.length}] ${setting.name}...`);
        
        const owner = await getBlameForLine(setting.repoPath, setting.repoFile, setting.line);
        
        if (owner) {
            setting.owner = owner;
            found++;
            console.log(` → ${owner.name} <${owner.email}>`);
        } else {
            console.log(' → (unknown)');
        }
    }
    
    console.log(`\nFound owners for ${found}/${data.settings.length} settings`);
    
    // Write updated data
    await writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`Results written to: ${OUTPUT_FILE}`);
    
    return data;
}

// Run if called directly
getOwners()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
