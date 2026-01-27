# Claude Code Instructions for Resume Project

This file provides context for Claude Code (or other AI assistants) when editing this resume system.

## Project Overview

This is a JavaScript-powered resume website for John Escobedo. Resume data lives in a single JSON file and is rendered dynamically by multiple HTML pages for different output formats.

## Architecture

### Single Source of Truth
All resume content is stored in `js/resumeJSON.js`. Never hardcode resume content in HTML files.

### Configuration
Default view settings are in `js/resume-config.js`:
- `defaultYears` - Years of work history to show (default: 15)
- `defaultTags` - Tags to filter by (default: null = show all)
- `excludeTags` - Tags to hide from default view (default: ['performer'])
- `defaultSkills` - Skill categories to show (default: null = show all)
- `maxYearsThreshold` - Years value that means "show all" (default: 50)

Note: `excludeTags` only applies when no `?tags=` URL parameter is provided. Users can still see excluded jobs via `?tags=performer`.

### Shared Utilities
Common functions live in `js/resume-utils.js`:
- `getQueryParams()` - Parse URL query parameters
- `filterWorkByTags()` - Filter jobs by tag array
- `filterWorkByYears()` - Filter jobs by date range
- `filterSkills()` - Filter skill categories
- `oxfordComma()` - Format arrays as sentences
- `formatDate()` - Format date strings
- `applyFilters()` - Apply all filters to resume data

### Page-Specific Renderers
- `js/main.js` - Renders styled resume for `index.html`
- `js/app-geeksi.js` - Renders Bootstrap version (uses jQuery, standalone)
- Inline scripts in `plaintextresume.html` and `workhistory.html`

## Key Conventions

### Resume Data Format
The `resumeJSON` object follows a modified JSON Resume schema:
- `basics` - Name, contact info, summary
- `work` - Array of job objects (includes `tags` array for filtering)
- `education` - Array of school objects
- `skills` - Array of skill category objects
- `languages` - Array of language objects

### Job Tags
Each job in `work` array should have a `tags` array for filtering:
```javascript
{
  name: "Company",
  tags: ["healthcare", "lead", "startup"]
}
```

### Highlight Groups
In job highlights, a leading space character starts a new `<ul>` group:
```javascript
highlights: [
  "First bullet",
  "Second bullet",
  " Third bullet starts new group", // Note leading space
  "Fourth bullet in new group"
]
```

### Date Format
Dates use `YYYY-MM-DD` format. Omit `endDate` for current positions.

## Common Tasks

### Adding a New Job
1. Edit `js/resumeJSON.js`
2. Add job object to beginning of `work` array (newest first)
3. Include appropriate `tags` for filtering
4. Test with `?years=1` to see only recent jobs

### Changing Default View Settings
Edit `js/resume-config.js` to change what appears by default (no URL params):
- `defaultYears: 15` - Show last 15 years of work history
- `defaultTags: null` - Set to `['healthcare', 'lead']` to filter by tags
- `excludeTags: ['performer']` - Hide jobs with these tags from default view
- `defaultSkills: null` - Set to `['programming']` to filter skill categories

### Adding a New Skill Category
1. Edit `js/resumeJSON.js`
2. Add object to `skills` array with `name` and `keywords` array

### Adding a New Tag
1. Add tag to job's `tags` array in `js/resumeJSON.js`
2. For visual timeline color coding, add CSS class in `workhistory.html`

## File Dependencies

```
index.html
├── js/resumeJSON.js
├── js/resume-config.js
├── js/resume-utils.js
├── js/main.js
└── css/style.css

plaintextresume.html
├── js/resumeJSON.js
├── js/resume-config.js
└── js/resume-utils.js

customize.html
└── js/resumeJSON.js

workhistory.html
└── js/resumeJSON.js

geeksiresume.html
├── js/resumeJSON.js
├── js/app-geeksi.js (jQuery-based, standalone)
└── css/resumeboot4.css
```

## Testing Changes

1. Open `index.html` in browser
2. Test filters with query params: `?years=5`, `?tags=healthcare`
3. Check `plaintextresume.html` renders correctly
4. Verify `customize.html` shows all tags and skills

## Notes

- No build process - edit and refresh
- Plain vanilla JavaScript (no framework) except `geeksiresume.html` which uses jQuery
- CSS uses custom properties (variables) defined in `:root`
- Print styles are included for PDF generation
