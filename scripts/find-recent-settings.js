/**
 * Find experimental settings that were recently added to the codebase
 * Uses git history to find settings based on actual commit dates, not script run dates
 */

import { readFile, writeFile } from 'fs/promises';
import { findSettingsAddedSince, daysAgo, getLatestCommitDate } from './git-history.js';

const TRACKING_FILE = process.env.TRACKING_FILE || './experimental-settings.json';
const OUTPUT_FILE = process.env.RECENT_OUTPUT_FILE || './recent-settings.json';

// Default to last 7 days, can be overridden with DAYS_BACK env var
const DAYS_BACK = parseInt(process.env.DAYS_BACK || '7', 10);

// Repositories to scan
const REPOS = [
    {
        name: 'VS Code',
        path: process.env.VSCODE_PATH || './vscode'
    },
    {
        name: 'Copilot Chat',
        path: process.env.COPILOT_CHAT_PATH || './vscode-copilot-chat'
    }
];

/**
 * Load JSON file with fallback
 */
async function loadJsonFile(filePath, defaultValue = {}) {
    try {
        const content = await readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return defaultValue;
    }
}

/**
 * Check if a repository exists and has a .git directory
 */
async function isGitRepo(repoPath) {
    try {
        await readFile(`${repoPath}/.git/HEAD`, 'utf-8');
        return true;
    } catch {
        // Try as a worktree
        try {
            await readFile(`${repoPath}/.git`, 'utf-8');
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Main function to find recently added settings
 */
async function findRecentSettings() {
    const sinceDate = daysAgo(DAYS_BACK);
    
    console.log('🔍 Finding Recently Added Experimental Settings');
    console.log('='.repeat(50));
    console.log(`📅 Looking for settings added since: ${sinceDate} (${DAYS_BACK} days ago)`);
    console.log('');
    
    // Load existing tracking data to compare
    const tracking = await loadJsonFile(TRACKING_FILE, { settings: {} });
    const knownSettings = new Set(Object.keys(tracking.settings));
    
    console.log(`📊 Currently tracking ${knownSettings.size} settings`);
    console.log('');
    
    const allRecentSettings = [];
    
    for (const repo of REPOS) {
        if (!await isGitRepo(repo.path)) {
            console.log(`⚠️  ${repo.name}: Repository not found at ${repo.path}`);
            continue;
        }
        
        const latestCommit = await getLatestCommitDate(repo.path);
        console.log(`📦 ${repo.name} (latest commit: ${latestCommit})`);
        
        try {
            const recentSettings = await findSettingsAddedSince(repo.path, sinceDate);
            
            console.log(`   Found ${recentSettings.length} settings added since ${sinceDate}`);
            
            for (const setting of recentSettings) {
                const isNew = !knownSettings.has(setting.name);
                const status = isNew ? '🆕 NEW' : '📋 Known';
                
                console.log(`   ${status}: ${setting.name}`);
                console.log(`          Added: ${setting.date} by ${setting.author}`);
                console.log(`          Commit: ${setting.commit}`);
                
                allRecentSettings.push({
                    ...setting,
                    repoName: repo.name,
                    repoPath: repo.path,
                    isNewToTracking: isNew
                });
            }
        } catch (error) {
            console.error(`   Error scanning ${repo.name}: ${error.message}`);
        }
        
        console.log('');
    }
    
    // Separate truly new settings from already-tracked ones
    const newSettings = allRecentSettings.filter(s => s.isNewToTracking);
    const existingSettings = allRecentSettings.filter(s => !s.isNewToTracking);
    
    console.log('='.repeat(50));
    console.log('📊 Summary');
    console.log(`   Total settings added in last ${DAYS_BACK} days: ${allRecentSettings.length}`);
    console.log(`   New (not yet tracked): ${newSettings.length}`);
    console.log(`   Already tracked: ${existingSettings.length}`);
    
    // Sort by date (most recent first)
    allRecentSettings.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Create output
    const output = {
        generatedAt: new Date().toISOString(),
        searchPeriod: {
            since: sinceDate,
            daysBack: DAYS_BACK
        },
        summary: {
            total: allRecentSettings.length,
            new: newSettings.length,
            alreadyTracked: existingSettings.length
        },
        settings: allRecentSettings
    };
    
    await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`\n📄 Results saved to: ${OUTPUT_FILE}`);
    
    // If there are new settings, list them prominently
    if (newSettings.length > 0) {
        console.log('\n🆕 New Settings Not Yet In Tracking:');
        console.log('-'.repeat(40));
        for (const setting of newSettings) {
            console.log(`  • ${setting.name}`);
            console.log(`    Added ${setting.date} by ${setting.author} (${setting.repoName})`);
        }
    }
    
    return output;
}

// Run if called directly
findRecentSettings()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
