/**
 * Update tracking data for experimental settings
 * Compares current findings with historical data and updates run counts
 */

import { readFile, writeFile } from 'fs/promises';

const FOUND_SETTINGS_FILE = process.env.FOUND_SETTINGS_FILE || './found-settings.json';
const TRACKING_FILE = process.env.TRACKING_FILE || './experimental-settings.json';
const OUTPUT_REPORT_FILE = process.env.OUTPUT_REPORT_FILE || './tracking-report.json';

/**
 * Load JSON file with fallback to empty object
 */
async function loadJsonFile(filePath, defaultValue = {}) {
    try {
        const content = await readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.log(`Could not load ${filePath}, using default value`);
        return defaultValue;
    }
}

/**
 * Main tracking update function
 */
async function updateTracking() {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7); // YYYY-MM format
    
    console.log(`Updating tracking data for: ${currentMonth}`);
    
    // Load current findings from analysis
    const findings = await loadJsonFile(FOUND_SETTINGS_FILE, { settings: [] });
    const currentSettings = new Set(findings.settings.map(s => s.name));
    
    // Build maps of setting name to additional info
    const ownerMap = new Map();
    const areaMap = new Map();
    const defaultMap = new Map();
    const tagsMap = new Map();
    const addedDateMap = new Map();  // Git-based actual added date
    const addedCommitMap = new Map();
    const addedByMap = new Map();
    
    for (const setting of findings.settings) {
        if (setting.owner) {
            ownerMap.set(setting.name, setting.owner);
        }
        if (setting.area) {
            areaMap.set(setting.name, setting.area);
        }
        if (setting.default !== undefined) {
            defaultMap.set(setting.name, setting.default);
        }
        if (setting.tags) {
            tagsMap.set(setting.name, setting.tags);
        }
        // Git-based date info (from git pickaxe lookup)
        if (setting.addedDate) {
            addedDateMap.set(setting.name, setting.addedDate);
        }
        if (setting.addedCommit) {
            addedCommitMap.set(setting.name, setting.addedCommit);
        }
        if (setting.addedBy) {
            addedByMap.set(setting.name, setting.addedBy);
        }
    }
    
    console.log(`Current experimental settings found: ${currentSettings.size}`);
    console.log(`Settings with owner info: ${ownerMap.size}`);
    
    // Load existing tracking data
    const tracking = await loadJsonFile(TRACKING_FILE, {
        settings: {},
        lastRun: null,
        runCount: 0
    });
    
    const previousRunCount = tracking.runCount || 0;
    const newRunCount = previousRunCount + 1;
    
    console.log(`Previous run count: ${previousRunCount}, New run count: ${newRunCount}`);
    
    // Track changes for reporting
    const report = {
        date: today,
        runNumber: newRunCount,
        totalActive: 0,
        newSettings: [],
        removedSettings: [],
        existingSettings: []
    };
    
    // Update existing settings and detect removals
    for (const [settingName, settingData] of Object.entries(tracking.settings)) {
        if (currentSettings.has(settingName)) {
            // Setting still exists - increment run count
            const owner = ownerMap.get(settingName);
            const area = areaMap.get(settingName);
            const defaultValue = defaultMap.get(settingName);
            const tags = tagsMap.get(settingName);
            
            tracking.settings[settingName] = {
                ...settingData,
                runCount: (settingData.runCount || 0) + 1,
                lastSeen: today,
                // Update with latest info (or keep existing if new one is missing)
                ...(owner && { owner }),
                ...(area && { area }),
                ...(defaultValue !== undefined && { default: defaultValue }),
                ...(tags && { tags })
            };
            
            report.existingSettings.push({
                name: settingName,
                firstSeen: settingData.firstSeen,
                runCount: tracking.settings[settingName].runCount
            });
        } else if (!settingData.removedDate) {
            // Setting was removed this run
            tracking.settings[settingName] = {
                ...settingData,
                removedDate: today,
                removedAtRun: newRunCount
            };
            
            report.removedSettings.push({
                name: settingName,
                firstSeen: settingData.firstSeen,
                totalRuns: settingData.runCount,
                removedDate: today
            });
            
            console.log(`Setting removed: ${settingName}`);
        }
    }
    
    // Add new settings
    for (const settingName of currentSettings) {
        if (!tracking.settings[settingName]) {
            const owner = ownerMap.get(settingName);
            const area = areaMap.get(settingName);
            const defaultValue = defaultMap.get(settingName);
            const tags = tagsMap.get(settingName);
            const addedDate = addedDateMap.get(settingName);
            const addedCommit = addedCommitMap.get(settingName);
            const addedBy = addedByMap.get(settingName);
            
            // Use git-based addedDate if available, otherwise fall back to today
            const actualAddedDate = addedDate || today;
            
            tracking.settings[settingName] = {
                firstSeen: today,  // When the tracker first saw it
                firstSeenRun: newRunCount,
                addedDate: actualAddedDate,  // When it was actually added to the codebase
                ...(addedCommit && { addedCommit }),
                ...(addedBy && { addedBy }),
                runCount: 1,
                lastSeen: today,
                ...(owner && { owner }),
                ...(area && { area }),
                ...(defaultValue !== undefined && { default: defaultValue }),
                ...(tags && { tags })
            };
            
            report.newSettings.push({
                name: settingName,
                firstSeen: today,
                addedDate: actualAddedDate,
                ...(addedCommit && { addedCommit }),
                ...(addedBy && { addedBy }),
                ...(owner && { owner }),
                ...(area && { area }),
                ...(defaultValue !== undefined && { default: defaultValue }),
                ...(tags && { tags })
            });
            
            const ownerStr = owner ? ` (${owner.name})` : '';
            const dateStr = addedDate ? ` [added: ${addedDate}]` : '';
            console.log(`New setting: ${settingName}${ownerStr}${dateStr}`);
        } else {
            // Update info if we have it (always update to latest)
            const owner = ownerMap.get(settingName);
            const area = areaMap.get(settingName);
            const defaultValue = defaultMap.get(settingName);
            const tags = tagsMap.get(settingName);
            const addedDate = addedDateMap.get(settingName);
            const addedCommit = addedCommitMap.get(settingName);
            const addedBy = addedByMap.get(settingName);
            
            if (owner) {
                tracking.settings[settingName].owner = owner;
            }
            if (area) {
                tracking.settings[settingName].area = area;
            }
            if (defaultValue !== undefined) {
                tracking.settings[settingName].default = defaultValue;
            }
            if (tags) {
                tracking.settings[settingName].tags = tags;
            }
            // Update git info if we have it and it wasn't set before
            if (addedDate && !tracking.settings[settingName].addedDate) {
                tracking.settings[settingName].addedDate = addedDate;
            }
            if (addedCommit && !tracking.settings[settingName].addedCommit) {
                tracking.settings[settingName].addedCommit = addedCommit;
            }
            if (addedBy && !tracking.settings[settingName].addedBy) {
                tracking.settings[settingName].addedBy = addedBy;
            }
        }
    }
    
    // Count active settings
    report.totalActive = Object.values(tracking.settings)
        .filter(s => !s.removedDate).length;
    
    // Update metadata
    tracking.lastRun = today;
    tracking.runCount = newRunCount;
    
    // Save updated tracking data
    await writeFile(TRACKING_FILE, JSON.stringify(tracking, null, 2));
    console.log(`Tracking data saved to: ${TRACKING_FILE}`);
    
    // Save report for Slack notification
    await writeFile(OUTPUT_REPORT_FILE, JSON.stringify(report, null, 2));
    console.log(`Report saved to: ${OUTPUT_REPORT_FILE}`);
    
    // Print summary
    console.log('\n--- Summary ---');
    console.log(`Total active experimental settings: ${report.totalActive}`);
    console.log(`New settings this run: ${report.newSettings.length}`);
    console.log(`Removed settings this run: ${report.removedSettings.length}`);
    console.log(`Continuing from previous: ${report.existingSettings.length}`);
    
    return report;
}

// Run if called directly
updateTracking()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
