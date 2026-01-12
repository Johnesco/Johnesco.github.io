# Claude Code Instructions for Resume Project

This file provides context for Claude Code (or other AI assistants) when editing this resume system.

## Project Overview

This is a JavaScript-powered resume website for John Escobedo. Resume data lives in a single JSON file and is rendered dynamically by multiple HTML pages for different output formats.

## Architecture

### Single Source of Truth
All resume content is stored in `js/resumeJSON.js`. Never hardcode resume content in HTML files.

### Shared Utilities
Common functions live in `js/resume-utils.js`:
- `getQueryParams()` - Parse URL query parameters
- `filterWorkByTags()` - Filter jobs by tag array
- `filterWorkByYears()` - Filter jobs by date range
- `filterSkills()` - Filter skill categories
- `oxfordComma()` - Format arrays as sentences
- `formatDate()` - Format date strings
- `applyFilters()` - Apply all filters to resume data

**Important**: The `DEFAULT_YEARS_FILTER` constant in `resume-utils.js` controls how many years of work history to show by default (currently 15).

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

### Changing Default Years Filter
Edit `DEFAULT_YEARS_FILTER` in `js/resume-utils.js` (currently 15)

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
├── js/resume-utils.js
├── js/main.js
└── css/style.css

plaintextresume.html
├── js/resumeJSON.js
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
