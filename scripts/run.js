#!/usr/bin/env node
/**
 * Main runner script - executes the full analysis pipeline
 * Usage: node scripts/run.js [--setup]
 */

import { spawn } from 'child_process';
import { access } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

const STEPS = [
    { name: 'Analyze experimental settings', script: 'analyze-experimental.js' },
    { name: 'Get owners via git blame', script: 'get-owners.js' },
    { name: 'Update tracking data', script: 'update-tracking.js' },
    { name: 'Generate markdown report', script: 'generate-report.js' },
    { name: 'Generate all-settings table', script: 'generate-table.js' }
];

/**
 * Run a script and return a promise
 */
function runScript(scriptPath, name) {
    return new Promise((resolve, reject) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`▶ ${name}`);
        console.log('='.repeat(60));
        
        const child = spawn('node', [scriptPath], {
            cwd: ROOT_DIR,
            stdio: 'inherit',
            shell: true
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${name} failed with exit code ${code}`));
            }
        });
        
        child.on('error', (err) => {
            reject(new Error(`Failed to start ${name}: ${err.message}`));
        });
    });
}

/**
 * Check if VS Code repo exists
 */
async function checkVSCodeRepo() {
    const vscodePath = join(ROOT_DIR, 'vscode');
    try {
        await access(vscodePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const shouldSetup = args.includes('--setup') || args.includes('-s');
    
    console.log('🚀 VS Code Experimental Settings Tracker');
    console.log(`   Running from: ${ROOT_DIR}\n`);
    
    // Check if VS Code repo exists
    const repoExists = await checkVSCodeRepo();
    
    if (!repoExists) {
        console.log('⚠️  VS Code repository not found.');
        console.log('   Running setup to clone repositories...\n');
        await runScript(join(__dirname, 'setup.js'), 'Setup repositories');
    } else if (shouldSetup) {
        console.log('📥 Updating repositories...\n');
        await runScript(join(__dirname, 'setup.js'), 'Setup repositories');
    }
    
    // Run all analysis steps
    for (const step of STEPS) {
        await runScript(join(__dirname, step.script), step.name);
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Pipeline complete!');
    console.log('='.repeat(60));
    console.log('\nOutput files in reports/:');
    console.log('  - report-YYYY-MM-DD.md  (settings from last 28 days)');
    console.log('  - all-settings.md       (all settings table)');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
    });
