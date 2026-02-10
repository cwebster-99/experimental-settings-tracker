/**
 * Generate a simple markdown table with all experimental settings, grouped by area
 * Flags settings that have been experimental for more than 60 days
 */

import { readFile, writeFile, mkdir } from 'fs/promises';

const INPUT_FILE = './found-settings.json';
const OUTPUT_FILE = './reports/all-settings.md';
const FLAG_DAYS = 60;

/**
 * Calculate the age of a setting in days from its addedDate
 */
function getAgeInDays(addedDate) {
    if (!addedDate) return null;
    const addedMs = new Date(addedDate).getTime();
    const nowMs = new Date().getTime();
    return Math.floor((nowMs - addedMs) / (24 * 60 * 60 * 1000));
}

async function generateTable() {
    const data = JSON.parse(await readFile(INPUT_FILE, 'utf-8'));
    
    // Ensure reports directory exists
    await mkdir('./reports', { recursive: true });
    
    // Sort by area then name
    const settings = data.settings.sort((a, b) => {
        if (a.area !== b.area) return a.area.localeCompare(b.area);
        return a.name.localeCompare(b.name);
    });
    
    const today = new Date().toISOString().split('T')[0];
    
    // Count flagged settings (experimental > 60 days)
    const flaggedSettings = settings.filter(s => {
        const age = getAgeInDays(s.addedDate);
        return age !== null && age > FLAG_DAYS;
    });

    let md = `# All Experimental Settings

*Generated: ${today}*

Total settings: ${settings.length}
`;

    if (flaggedSettings.length > 0) {
        md += `\n> ⚠️ **${flaggedSettings.length} setting(s)** have been experimental for more than ${FLAG_DAYS} days.\n`;
    }

    md += `
## Settings by Area

| Setting | Added Date | Default | Tags |
|---------|------------|---------|------|
`;

    let currentArea = null;
    for (const s of settings) {
        // Add area header row when area changes
        if (s.area !== currentArea) {
            currentArea = s.area;
            md += `| **${currentArea}** | | | |\n`;
        }
        
        const age = getAgeInDays(s.addedDate);
        const flag = age !== null && age > FLAG_DAYS ? ' ⚠️' : '';
        const addedDate = s.addedDate ? `${s.addedDate}${flag}` : '-';
        const def = s.default === null ? '*(null)*' : `\`${String(s.default).replace(/\|/g, '\\|')}\``;
        const tags = s.tags ? s.tags.join(', ') : '';
        md += `| \`${s.name}\` | ${addedDate} | ${def} | ${tags} |\n`;
    }

    if (flaggedSettings.length > 0) {
        md += `\n## ⚠️ Experimental for ${FLAG_DAYS}+ Days\n\n`;
        md += `${flaggedSettings.length} setting(s) have been experimental for more than ${FLAG_DAYS} days and may need review.\n\n`;
        md += `| Setting | Added Date | Age (days) | Owner | Area |\n`;
        md += `|---------|------------|------------|-------|------|\n`;

        // Sort flagged by age descending
        const sorted = [...flaggedSettings].map(s => ({
            ...s,
            ageInDays: getAgeInDays(s.addedDate)
        })).sort((a, b) => b.ageInDays - a.ageInDays);

        for (const s of sorted) {
            const owner = (s.addedBy && s.addedBy.name) || (s.owner && s.owner.name) || '-';
            const area = s.area || '-';
            md += `| \`${s.name}\` | ${s.addedDate} | ${s.ageInDays} | ${owner.replace(/\|/g, '\\|')} | ${area} |\n`;
        }
    }
    
    await writeFile(OUTPUT_FILE, md);
    console.log(`✅ Created ${OUTPUT_FILE} with ${settings.length} settings grouped by area (${flaggedSettings.length} flagged as 60+ days)`);
}

generateTable().catch(console.error);
