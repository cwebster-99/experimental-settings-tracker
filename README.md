# VS Code Experimental Settings Tracker

A GitHub Actions bot that monitors experimental settings in VS Code and Copilot Chat repositories, generating monthly markdown reports for settings introduced in the last 28 days.

## Features

- 📊 Scans [VS Code](https://github.com/microsoft/vscode) and [Copilot Chat](https://github.com/microsoft/vscode-copilot-chat) repositories
- 🏷️ Detects settings with `experimental`, `preview`, or `onExp` tags
- 📂 Scans both TypeScript files and `package.json` contribution files
- 📈 Tracks how long each setting has been experimental (run count)
- 🆕 Identifies new experimental settings from the last 28 days
- 🎓 Detects when settings graduate or are removed
- 📝 Generates dated markdown reports with setting details (author, default value, tags)
- 🏷️ Groups settings by area (first two segments of setting name)

## Requirements

- Node.js 20 or later
- Git

## Quick Start

```bash
# Clone this repository
git clone <your-repo-url>
cd vscode-experimental-tracker

# Run the full pipeline (auto-clones VS Code repos if needed)
npm start
```

The report will be generated in the `reports/` folder as `report-YYYY-MM-DD.md`.

## GitHub Actions Setup

### 1. Fork or Clone This Repository

Push this code to your own GitHub repository.

### 2. Run the Workflow

1. Go to **Actions** tab in your repository
2. Select **Monthly Experimental Settings Update** workflow
3. Click **Run workflow** → **Run workflow**
4. The workflow will generate a report and commit it to the `reports/` folder

## Workflow Schedule

The workflow runs automatically at **9 AM UTC on the 1st of every month**.

You can also trigger it manually anytime via the Actions tab.

## File Structure

```
├── .github/
│   └── workflows/
│       └── monthly-update.yml        # GitHub Actions workflow
├── scripts/
│   ├── analyze-experimental.js       # Scans VS Code for experimental settings
│   ├── get-owners.js                 # Gets git blame info for each setting
│   ├── update-tracking.js            # Updates run counts and tracking data
│   └── generate-report.js            # Generates dated markdown report
├── reports/
│   └── report-YYYY-MM-DD.md          # Generated reports (dated)
├── experimental-settings.json        # Tracking data (committed to repo)
├── tracking-report.json              # Latest run report
├── found-settings.json               # Current scan results
├── package.json
├── .gitignore
└── README.md
```

## Tracking Data Format

The `experimental-settings.json` file uses this format:

```json
{
  "settings": {
    "editor.someExperimentalFeature": {
      "firstSeen": "2026-01-01",
      "firstSeenRun": 1,
      "runCount": 3,
      "lastSeen": "2026-03-01",
      "area": "editor.experimental",
      "default": "false",
      "tags": ["experimental"],
      "owner": {
        "name": "Developer Name",
        "email": "dev@microsoft.com",
        "date": "2026-01-01",
        "commit": "abc1234"
      }
    },
    "workbench.anotherFeature": {
      "firstSeen": "2025-10-01",
      "firstSeenRun": 1,
      "runCount": 6,
      "lastSeen": "2026-02-01",
      "removedDate": "2026-03-01",
      "removedAtRun": 6
    }
  },
  "lastRun": "2026-03-01",
  "runCount": 6
}
```

## Report Format

The generated markdown reports include:

- **Summary**: Total active settings and count from last 28 days
- **Settings by Area**: Tables grouped by first two segments of setting name
- **Columns**: Setting Name, Author (from git blame), Default value, Tags

Example report snippet:

```markdown
### workbench.editor

| Setting Name | Author | Default | Tags |
|--------------|--------|---------|------|
| `workbench.editor.experimentalClose` | John Smith | `false` | `experimental` |
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run the full pipeline (auto-clones repos if needed) |
| `npm run setup` | Clone/update VS Code repositories |
| `npm run analyze` | Scan repos for experimental settings |
| `npm run get-owners` | Get git blame info for each setting |
| `npm run update-tracking` | Update historical tracking data |
| `npm run generate-report` | Generate the dated markdown report |

## License

MIT
