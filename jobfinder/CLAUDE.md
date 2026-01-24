# JobFinder - Project Context

## Overview
JobFinder is a vanilla HTML/JS/CSS app that aggregates job search links across 28+ job boards. Users can add custom search terms and customize which job boards to use. All preferences persist via localStorage.

## Files
```
index.html   # The app - all HTML, CSS, and JS
config.js    # Job board configuration by category
```

## How It Works
1. User adds a search term (e.g., "Software Engineer")
2. App generates links to all enabled job boards with that search term
3. User clicks individual links or "Open All Links" to search
4. Searches and site preferences persist in localStorage

## config.js Structure
```javascript
const CONFIG = {
  categories: [
    {
      name: "General",
      sites: [
        { name: "LinkedIn", url: "https://linkedin.com/jobs/search/?keywords={keyword}" },
        // ... more sites
      ]
    },
    // ... more categories: Tech, Remote, Startup
  ]
};
```

- `{keyword}` in URL gets replaced with encoded search term
- Categories group related job boards for organized display
- 4 categories: General (10), Tech (6), Remote (7), Startup (5)

## localStorage Keys
- `jobfinder_searches` - Array of saved search terms
- `jobfinder_enabled_sites` - Array of enabled site names (defaults to all)

## User Features
- Add/delete search terms
- Toggle job boards on/off via settings panel
- Click individual job board links
- "Open All Links" opens all enabled boards with 300ms delay
- All data persists across browser sessions

## Editing
- Edit `config.js` to add/modify job boards and categories
- Edit `index.html` for UI changes
- Refresh browser to see changes
- No build or restart needed
