/**
 * Setup script - clones the VS Code repositories needed for analysis
 * Run this once before running the analysis scripts locally
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { access } from 'fs/promises';

const execAsync = promisify(exec);

const REPOS = [
    {
        name: 'vscode',
        url: 'https://github.com/microsoft/vscode.git',
        dir: './vscode'
    },
    {
        name: 'vscode-copilot-chat',
        url: 'https://github.com/microsoft/vscode-copilot-chat.git',
        dir: './vscode-copilot-chat'
    }
];

/**
 * Check if a directory exists
 */
async function dirExists(path) {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

/**
 * Clone or update a repository
 */
async function setupRepo(repo) {
    const exists = await dirExists(repo.dir);
    
    if (exists) {
        console.log(`📁 ${repo.name}: Already exists, pulling latest...`);
        try {
            const { stdout } = await execAsync(`git -C "${repo.dir}" pull --ff-only`, { encoding: 'utf-8' });
            console.log(`   ✅ Updated: ${stdout.trim() || 'Already up to date'}`);
        } catch (error) {
            console.log(`   ⚠️  Pull failed, trying fetch + reset...`);
            await execAsync(`git -C "${repo.dir}" fetch origin`, { encoding: 'utf-8' });
            await execAsync(`git -C "${repo.dir}" reset --hard origin/main`, { encoding: 'utf-8' });
            console.log(`   ✅ Reset to origin/main`);
        }
    } else {
        console.log(`📥 ${repo.name}: Cloning (this may take a while)...`);
        try {
            await execAsync(`git clone "${repo.url}" "${repo.dir}"`, { encoding: 'utf-8' });
            console.log(`   ✅ Cloned successfully`);
        } catch (error) {
            console.error(`   ❌ Clone failed: ${error.message}`);
            throw error;
        }
    }
    
    // Get current commit
    try {
        const { stdout } = await execAsync(`git -C "${repo.dir}" rev-parse --short HEAD`, { encoding: 'utf-8' });
        console.log(`   📌 At commit: ${stdout.trim()}`);
    } catch {
        // Ignore
    }
}

/**
 * Main setup function
 */
async function setup() {
    console.log('🚀 VS Code Experimental Settings Tracker - Setup\n');
    console.log('This will clone/update the VS Code repositories needed for analysis.\n');
    
    for (const repo of REPOS) {
        await setupRepo(repo);
        console.log('');
    }
    
    console.log('✨ Setup complete! You can now run:\n');
    console.log('   npm run analyze         - Scan for experimental settings');
    console.log('   npm run get-owners      - Get git blame info');
    console.log('   npm run generate-report - Generate the markdown report');
    console.log('   npm start               - Run the full pipeline\n');
}

// Run if called directly
setup()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    });
