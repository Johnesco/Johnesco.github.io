# JobFinder - Project Context

## Overview
JobFinder is a vanilla HTML/JS/CSS app that aggregates job search links across 14 built-in job boards (plus user-added custom boards). Users add search terms with priority tiers (Core/Growth/Reach), set a location, and get Location and Remote links for every enabled board. Two view modes — By Skill and By Board — organize results differently. Click tracking shows at-a-glance staleness per keyword×board combo. All preferences persist via localStorage.

## Files
```
index.html   # The app - all HTML, CSS, and JS
config.js    # Job board configuration by category
CLAUDE.md    # This file - project documentation
```

## How It Works
1. User adds search terms via textarea (single, or bulk comma/newline-separated) with an optional priority tier
2. User optionally sets a location (city, state) that applies to all searches
3. App generates links to all enabled job boards with two link types per board:
   - **Location** — keyword + city/state search (disabled/greyed out if no location set)
   - **Remote** — keyword + remote filter
4. User clicks links to open searches in new tabs; clicks are tracked with timestamps
5. Stats header shows saved searches count, active boards count, and today's search count
6. Two view modes let the user organize by search term or by job board
7. All data persists in localStorage across browser sessions

## config.js Structure
```javascript
const CONFIG = {
  categories: [
    {
      name: "General",
      sites: [
        {
          name: "LinkedIn",
          urls: {
            keyword: "https://www.linkedin.com/jobs/search/?keywords={keyword}",
            location: "https://www.linkedin.com/jobs/search/?keywords={keyword}&location={city}%2C%20{state}",
            remote: "https://www.linkedin.com/jobs/search/?keywords={keyword}&f_WT=2"
          }
        },
        // ... more sites
      ]
    },
    // ... more categories: Tech, Startup
  ]
};
```

Note: Each site has a `urls` object with `keyword`, `location`, and `remote` templates. The `keyword` URL is stored in config but not rendered as a link — only `location` and `remote` are shown to users.

### URL Placeholders
- `{keyword}` — replaced with URL-encoded search term
- `{city}` — replaced with URL-encoded city name
- `{state}` — replaced with URL-encoded state name

### Categories
- **General** (7): LinkedIn, Indeed, Glassdoor, ZipRecruiter, Monster, CareerBuilder, SimplyHired
- **Tech** (4): Dice, Built In, Stack Overflow, Crunchboard
- **Startup** (3): The Muse, Idealist, VentureLoop

## Priority System
Search terms can be assigned a priority tier when added (or changed later via Edit Searches):

| Tier | Color | Purpose |
|------|-------|---------|
| **Core** | `#00d9ff` (cyan) | Strong fit roles — search daily |
| **Growth** | `#4ade80` (green) | Adjacent roles worth monitoring |
| **Reach** | `#c084fc` (purple) | Aspirational pivots |
| *(none)* | `#888` (grey) | Uncategorized |

Priority affects:
- Card border color (left border in By Skill view)
- Grouping headers in both view modes
- Site name coloring in By Board view
- Order in Edit Searches panel (Core → Growth → Reach → No Priority)

## Click Tracking & Staleness
Every link click records a `keyword::siteName` → timestamp entry. Staleness tiers:

| Tier | Condition | Display |
|------|-----------|---------|
| **Fresh** | Clicked today | Green "✓ 2:30 PM" |
| **Recent** | 1–2 days ago | Muted grey "1d ago" |
| **Stale** | 3+ days ago | Amber "5d ago" |

Each card header shows a today counter: `3/14 today` (searches done today / total enabled boards).

The global "Searched Today" stat in the header counts all unique keyword×board combos clicked today.

## View Modes
Toggle between two views via the "By Skill" / "By Board" buttons:

### By Skill (default)
- One card per search term
- Cards grouped by priority tier (Core → Growth → Reach → No Priority)
- Inside each card, sites listed by category (General, Tech, Startup, Custom)
- Each site row shows Location + Remote links and staleness indicator
- Priority group headers are collapsible

### By Board
- One card per enabled job board
- Cards grouped by config category (General, Tech, Startup, Custom)
- Inside each card, search terms grouped by priority (Core → Growth → Reach → General)
- Each search row shows Location + Remote links and staleness indicator
- Both category headers and in-card priority sub-groups are collapsible

## localStorage Keys & Data Formats

### `jobfinder_searches`
Array of search objects with term and priority tier.
```javascript
[
  { "term": "QA Engineer", "priority": "core" },
  { "term": "DevOps Engineer", "priority": "growth" },
  { "term": "Product Manager", "priority": "reach" },
  { "term": "Data Analyst", "priority": "" }
]
```
**Priority values**: `"core"`, `"growth"`, `"reach"`, or `""` (no priority).
**Migration**: Old format was a plain string array. On load, strings are auto-migrated to `{ term, priority: "core" }`.

### `jobfinder_enabled_sites`
Array of enabled site names. Defaults to all sites if not set. On load, stale names (removed boards) are pruned and new boards are auto-added.
```javascript
["LinkedIn", "Indeed", "Glassdoor", "Dice"]
```

### `jobfinder_location`
User's location for location-based searches.
```javascript
{ "city": "Austin", "state": "Texas" }
```

### `jobfinder_clicks`
Tracks the last time each keyword×board combo was clicked. Key format is `"keyword::siteName"`, value is a Unix timestamp (ms). Either link type (Location or Remote) updates the same entry.
```javascript
{
  "Software Engineer::LinkedIn": 1707500000000,
  "QA Engineer::Indeed": 1707400000000
}
```

### `jobfinder_custom_sites`
Array of user-added custom job boards.
```javascript
[
  {
    "name": "FedEx Careers",
    "urls": {
      "keyword": "https://careers.fedex.com/jobs?keyword={keyword}",
      "location": "https://careers.fedex.com/jobs?keyword={keyword}&location_name={city}%2C%20{state}&location_type=1",
      "remote": "https://careers.fedex.com/jobs?keyword={keyword}&location_name=Remote%2C%20OR%2C%20USA&location_type=2"
    }
  }
]
```

#### Legacy Format (v1)
Old custom sites had a single `url` field instead of `urls` object:
```javascript
[{ "name": "MyBoard", "url": "https://example.com/jobs?q={keyword}" }]
```
**Migration**: Convert `url` to `urls.keyword`, set `location` and `remote` to null.

### `jobfinder_collapsed`
Object tracking which collapsible groups are collapsed. Keys vary by context:
- **Priority groups (By Skill view)**: `"core"`, `"growth"`, `"reach"`
- **Category groups (By Board view)**: `"General"`, `"Tech"`, `"Startup"`, `"Custom"`
- **In-card skill sub-groups (By Board view)**: `"LinkedIn::core"`, `"Dice::growth"`, etc.
```javascript
{
  "reach": true,
  "Startup": true,
  "LinkedIn::growth": true
}
```

### `jobfinder_view`
The active view mode. Either `"skill"` (default) or `"board"`.

## User Features
- Add search terms (single or bulk comma/newline-separated) with optional priority tier
- Delete search terms (via card × button or Edit Searches panel)
- Set global location (city, state) for location-based searches
- Clear location
- Click Location or Remote links per job board (open in new tab)
- Toggle job boards on/off via Customize Job Boards panel
- Add custom job boards with keyword, location, and remote URLs
- Edit existing custom job boards
- Delete custom job boards
- Switch between By Skill and By Board view modes
- Collapse/expand priority groups and category groups
- Edit searches: rename, reorder within priority group, change priority, delete
- Import/export all settings to JSON file
- Stats header: saved searches count, active boards count, today's search count

## Edit Searches Panel
Opened via the "Edit Searches" button. Shows all searches grouped by priority (Core → Growth → Reach → No Priority). Each row has:
- Text input for renaming (updates click data keys on rename)
- ▲/▼ buttons for reordering within the same priority group
- Priority dropdown to change tier
- × button to delete

## Custom Job Boards
Under the "Customize Job Boards" panel in the Advanced collapsible section. Form fields:
- **Board Name** (required) — must be unique across all boards
- **Keyword URL** (required) — must contain `{keyword}` placeholder
- **Location URL** (optional) — use `{keyword}`, `{city}`, `{state}`
- **Remote URL** (optional)

Supports add, edit (populates form with existing values), and delete. Custom boards appear in their own "Custom" category in both views.

## Adding a Custom Job Board
1. Go to the company's careers page
2. Search for a test keyword and note the URL
3. Replace the keyword with `{keyword}`
4. For location: also replace city with `{city}` and state with `{state}`
5. For remote: find the remote filter URL and replace keyword with `{keyword}`

## Export File Format
Users can export their settings to a JSON file for backup or transfer to another browser.

```javascript
{
  "version": 2,
  "exportDate": "2024-01-15T10:30:00.000Z",
  "searches": [
    { "term": "Software Engineer", "priority": "core" },
    { "term": "Product Manager", "priority": "growth" }
  ],
  "enabledSites": ["LinkedIn", "Indeed", "Dice"],
  "customSites": [
    {
      "name": "FedEx Careers",
      "urls": {
        "keyword": "https://careers.fedex.com/jobs?keyword={keyword}",
        "location": "https://careers.fedex.com/jobs?keyword={keyword}&location_name={city}%2C%20{state}&location_type=1",
        "remote": "https://careers.fedex.com/jobs?keyword={keyword}&location_name=Remote%2C%20OR%2C%20USA&location_type=2"
      }
    }
  ],
  "location": { "city": "Austin", "state": "Texas" },
  "clicks": {
    "Software Engineer::LinkedIn": 1707500000000,
    "Product Manager::Indeed": 1707400000000
  }
}
```

### Import Behavior
- Validates JSON structure before importing
- Migrates string search arrays to object format automatically
- Migrates v1 custom sites format automatically
- Imports clicks data
- Re-runs enabled sites loading to handle new custom boards
- Shows success/error alert to user

## Data Migrations
Two automatic migrations run on load:
1. **Searches**: Old string array `["QA Engineer"]` → object array `[{ term: "QA Engineer", priority: "core" }]`
2. **Custom sites**: v1 `{ url }` → v2 `{ urls: { keyword: url, location: null, remote: null } }`

Both migrations also run during import.

## Editing
- Edit `config.js` to add/modify built-in job boards and categories
- Edit `index.html` for UI changes
- Refresh browser to see changes
- No build or restart needed
