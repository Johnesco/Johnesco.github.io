# JobFinder - Project Context

## Overview
JobFinder is a vanilla HTML/JS/CSS app that aggregates job search links across 17 job boards. Users can add custom search terms, set a location, and customize which job boards to use. Each job board supports up to three search types: keyword-only, keyword+location, and keyword+remote. All preferences persist via localStorage.

## Files
```
index.html   # The app - all HTML, CSS, and JS
config.js    # Job board configuration by category
CLAUDE.md    # This file - project documentation
```

## How It Works
1. User adds a search term (e.g., "Software Engineer")
2. User optionally sets a location (city, state) that applies to all searches
3. App generates links to all enabled job boards with three options per board:
   - **Keyword** - searches by keyword only
   - **Location** - searches by keyword + city/state (only shown if location is set)
   - **Remote** - searches for remote jobs with that keyword
4. User clicks individual links to search specific boards
5. Searches, location, and site preferences persist in localStorage

## config.js Structure (v2 - Current)
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
    // ... more categories: Tech, Remote, Startup
  ]
};
```

### URL Placeholders
- `{keyword}` - replaced with URL-encoded search term
- `{city}` - replaced with URL-encoded city name
- `{state}` - replaced with URL-encoded state name

### Categories
- **General** (7): LinkedIn, Indeed, Glassdoor, ZipRecruiter, Monster, CareerBuilder, SimplyHired
- **Tech** (4): Dice, Built In, Stack Overflow, Crunchboard
- **Remote** (3): RemoteOK, Working Nomads, JustRemote (keyword-only, inherently remote)
- **Startup** (3): The Muse, Idealist, VentureLoop

## localStorage Keys & Data Formats

### `jobfinder_searches`
Array of saved search terms (strings).
```javascript
["Software Engineer", "Product Manager", "Data Analyst"]
```

### `jobfinder_enabled_sites`
Array of enabled site names. Defaults to all sites if not set.
```javascript
["LinkedIn", "Indeed", "Glassdoor", "Dice"]
```

### `jobfinder_location`
User's location for location-based searches.
```javascript
{ "city": "Austin", "state": "Texas" }
```

### `jobfinder_custom_sites` (v2 - Current)
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

## User Features
- Add/delete search terms
- Set global location (city, state) for location-based searches
- Toggle job boards on/off via settings panel
- Click Keyword, Location, or Remote links per job board
- Add custom job boards with keyword, location, and remote URLs
- Edit existing custom job boards
- All data persists across browser sessions

## Adding a Custom Job Board
1. Go to the company's careers page
2. Search for a test keyword and note the URL
3. Replace the keyword with `{keyword}`
4. For location: also replace city with `{city}` and state with `{state}`
5. For remote: find the remote filter URL and replace keyword with `{keyword}`

## Data Migration
When loading custom sites, check for legacy format and migrate:
- If site has `url` but not `urls`, convert to: `{ urls: { keyword: url } }`
- Always preserve existing data, never clear localStorage

## Export File Format
Users can export their settings to a JSON file for backup or transfer to another browser.

```javascript
{
  "version": 2,
  "exportDate": "2024-01-15T10:30:00.000Z",
  "searches": ["Software Engineer", "Product Manager"],
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
  "location": { "city": "Austin", "state": "Texas" }
}
```

### Import Behavior
- Validates JSON structure before importing
- Migrates v1 custom sites format automatically
- Merges with existing enabled sites for new custom boards
- Shows success/error alert to user

## Editing
- Edit `config.js` to add/modify built-in job boards and categories
- Edit `index.html` for UI changes
- Refresh browser to see changes
- No build or restart needed
