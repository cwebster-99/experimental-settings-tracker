/**
 * Generate markdown report for settings introduced in the last 28 days
 * Uses git-based addedDate for accurate "recently added" detection
 * Outputs a dated markdown file with a table showing setting name, author, default, and tags
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const FOUND_SETTINGS_FILE = process.env.FOUND_SETTINGS_FILE || './found-settings.json';
const TRACKING_FILE = process.env.TRACKING_FILE || './experimental-settings.json';
const OUTPUT_DIR = process.env.OUTPUT_DIR || './reports';
const DAYS_BACK = parseInt(process.env.REPORT_DAYS || '28', 10);

/**
 * Load JSON file
 */
async function loadJsonFile(filePath) {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
}

/**
 * Check if a date string is within the last N days
 */
function isWithinDays(dateString, days) {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const now = new Date();
    const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return date >= cutoff;
}

/**
 * Escape pipe characters for markdown table cells
 */
function escapeMarkdown(str) {
    if (!str) return '';
    return String(str).replace(/\|/g, '\\|');
}

/**
 * Format tags array for display
 */
function formatTags(tags) {
    if (!tags || tags.length === 0) return '-';
    return tags.map(t => `\`${t}\``).join(', ');
}

/**
 * Format default value for display
 */
function formatDefault(defaultValue) {
    if (defaultValue === null || defaultValue === undefined) return '-';
    if (defaultValue === '<computed>') return '_computed_';
    return `\`${escapeMarkdown(defaultValue)}\``;
}

/**
 * Generate the markdown report
 */
async function generateReport() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log(`Generating report for settings introduced in last ${DAYS_BACK} days...`);
    
    // Load current findings
    const findings = await loadJsonFile(FOUND_SETTINGS_FILE);
    
    // Load persistent tracking data for flagged settings
    let tracking = { settings: {} };
    try {
        tracking = await loadJsonFile(TRACKING_FILE);
    } catch {
        console.log('Could not load tracking file, skipping flagged settings section.');
    }

    // Build list of flagged settings (experimental > 60 days)
    const flaggedSettings = [];
    const todayMs = new Date().getTime();
    for (const setting of findings.settings) {
        const tracked = tracking.settings && tracking.settings[setting.name];
        if (tracked && tracked.flagged) {
            const addedMs = new Date(tracked.addedDate).getTime();
            const ageInDays = Math.floor((todayMs - addedMs) / (24 * 60 * 60 * 1000));
            flaggedSettings.push({ ...setting, ageInDays, flaggedDate: tracked.flaggedDate });
        }
    }
    
    // Filter settings by addedDate (git-based actual introduction date)
    // Falls back to owner.date for backwards compatibility
    const recentSettings = findings.settings.filter(setting => {
        // Prefer git-based addedDate, fall back to owner.date
        const dateToCheck = setting.addedDate || (setting.owner && setting.owner.date);
        return isWithinDays(dateToCheck, DAYS_BACK);
    });
    
    console.log(`Found ${recentSettings.length} settings introduced in last ${DAYS_BACK} days (out of ${findings.settings.length} total)`);
    
    if (recentSettings.length === 0) {
        console.log('No recent settings to report.');
        
        // Still generate a report indicating no new settings
        const markdown = generateEmptyReport(dateStr, findings.settings.length, flaggedSettings);
        await writeReport(dateStr, markdown);
        return;
    }
    
    // Group and sort by area (first two segments of setting name)
    const groupedByArea = new Map();
    
    for (const setting of recentSettings) {
        const area = setting.area || extractArea(setting.name);
        if (!groupedByArea.has(area)) {
            groupedByArea.set(area, []);
        }
        groupedByArea.get(area).push(setting);
    }
    
    // Sort areas alphabetically
    const sortedAreas = Array.from(groupedByArea.keys()).sort();
    
    // Generate markdown
    const markdown = generateMarkdown(dateStr, recentSettings.length, findings.settings.length, sortedAreas, groupedByArea, flaggedSettings);
    
    await writeReport(dateStr, markdown);
}

/**
 * Extract area from setting name (first two segments)
 */
function extractArea(settingName) {
    const parts = settingName.split('.');
    if (parts.length >= 2) {
        return `${parts[0]}.${parts[1]}`;
    }
    return parts[0];
}

/**
 * Generate markdown content
 */
function generateMarkdown(dateStr, recentCount, totalCount, sortedAreas, groupedByArea, flaggedSettings = []) {
    const lines = [
        `# Experimental Settings Report - ${dateStr}`,
        '',
        `> Settings with \`experimental\` tag introduced in the last ${DAYS_BACK} days.`,
        '',
        `## Summary`,
        '',
        `- **New experimental settings (last ${DAYS_BACK} days):** ${recentCount}`,
        `- **Total active experimental settings:** ${totalCount}`,
        '',
        `## Settings by Area`,
        ''
    ];
    
    for (const area of sortedAreas) {
        const settings = groupedByArea.get(area);
        
        lines.push(`### ${area}`);
        lines.push('');
        lines.push('| Setting Name | Added Date | Author | Default | Tags |');
        lines.push('|--------------|------------|--------|---------|------|');
        
        // Sort settings within area alphabetically
        settings.sort((a, b) => a.name.localeCompare(b.name));
        
        for (const setting of settings) {
            const name = `\`${escapeMarkdown(setting.name)}\``;
            // Use git-based addedDate/addedBy, fall back to owner fields
            const addedDate = setting.addedDate || (setting.owner && setting.owner.date) || '-';
            const author = (setting.addedBy && setting.addedBy.name) || 
                           (setting.owner && setting.owner.name) || '-';
            const defaultVal = formatDefault(setting.default);
            const tags = formatTags(setting.tags);
            
            lines.push(`| ${name} | ${addedDate} | ${escapeMarkdown(author)} | ${defaultVal} | ${tags} |`);
        }
        
        lines.push('');
    }
    
    // Add flagged settings section
    lines.push(...generateFlaggedSection(flaggedSettings));

    lines.push('---');
    lines.push('');
    lines.push(`*Generated on ${new Date().toISOString()}*`);
    
    return lines.join('\n');
}

/**
 * Generate the flagged settings section
 */
function generateFlaggedSection(flaggedSettings) {
    const lines = [];

    lines.push(`## ⚠️ Experimental for 60+ Days`);
    lines.push('');

    if (flaggedSettings.length === 0) {
        lines.push('No settings have been experimental for more than 60 days.');
        lines.push('');
        return lines;
    }

    lines.push(`${flaggedSettings.length} setting(s) have been experimental for more than 60 days.`);
    lines.push('');
    lines.push('| Setting Name | Added Date | Age (days) | Owner | Area | Tags |');
    lines.push('|--------------|------------|------------|-------|------|------|');

    // Sort by age descending
    flaggedSettings.sort((a, b) => b.ageInDays - a.ageInDays);

    for (const setting of flaggedSettings) {
        const name = `\`${escapeMarkdown(setting.name)}\``;
        const addedDate = setting.addedDate || '-';
        const age = setting.ageInDays;
        const owner = (setting.addedBy && setting.addedBy.name) ||
                      (setting.owner && setting.owner.name) || '-';
        const area = setting.area || extractArea(setting.name);
        const tags = formatTags(setting.tags);

        lines.push(`| ${name} | ${addedDate} | ${age} | ${escapeMarkdown(owner)} | ${area} | ${tags} |`);
    }

    lines.push('');
    return lines;
}

/**
 * Generate empty report when no recent settings found
 */
function generateEmptyReport(dateStr, totalCount, flaggedSettings = []) {
    const flaggedSection = generateFlaggedSection(flaggedSettings);

    return [
        `# Experimental Settings Report - ${dateStr}`,
        '',
        `> Settings with \`experimental\` tag introduced in the last ${DAYS_BACK} days.`,
        '',
        `## Summary`,
        '',
        `- **New experimental settings (last ${DAYS_BACK} days):** 0`,
        `- **Total active experimental settings:** ${totalCount}`,
        '',
        `No new experimental settings were introduced in the last ${DAYS_BACK} days.`,
        '',
        ...flaggedSection,
        '---',
        '',
        `*Generated on ${new Date().toISOString()}*`
    ].join('\n');
}

/**
 * Write report to file
 */
async function writeReport(dateStr, markdown) {
    const filename = `report-${dateStr}.md`;
    let outputPath = join(OUTPUT_DIR, filename);
    
    // Check if file exists and append version number if it does
    let version = 2;
    while (existsSync(outputPath)) {
        const versionedFilename = `report-${dateStr}-v${version}.md`;
        outputPath = join(OUTPUT_DIR, versionedFilename);
        version++;
    }
    
    // Ensure reports directory exists by creating it with the write
    try {
        await writeFile(outputPath, markdown);
        console.log(`Report written to: ${outputPath}`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Directory doesn't exist, create it
            const { mkdir } = await import('fs/promises');
            await mkdir(OUTPUT_DIR, { recursive: true });
            await writeFile(outputPath, markdown);
            console.log(`Report written to: ${outputPath}`);
        } else {
            throw error;
        }
    }
}

// Run if called directly
generateReport()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
