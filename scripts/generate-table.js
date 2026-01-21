/**
 * Generate a simple markdown table with all experimental settings, grouped by area
 */

import { readFile, writeFile, mkdir } from 'fs/promises';

const INPUT_FILE = './found-settings.json';
const OUTPUT_FILE = './reports/all-settings.md';

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
    
    let md = `# All Experimental Settings

*Generated: ${today}*

Total settings: ${settings.length}

## Settings by Area

| Setting | Default | Tags |
|---------|---------|------|
`;

    let currentArea = null;
    for (const s of settings) {
        // Add area header row when area changes
        if (s.area !== currentArea) {
            currentArea = s.area;
            md += `| **${currentArea}** | | |\n`;
        }
        
        const def = s.default === null ? '*(null)*' : `\`${String(s.default).replace(/\|/g, '\\|')}\``;
        const tags = s.tags ? s.tags.join(', ') : '';
        md += `| \`${s.name}\` | ${def} | ${tags} |\n`;
    }
    
    await writeFile(OUTPUT_FILE, md);
    console.log(`✅ Created ${OUTPUT_FILE} with ${settings.length} settings grouped by area`);
}

generateTable().catch(console.error);
