# Interactive Resume

A dynamic, customizable resume website powered by vanilla JavaScript and JSON data. Filter by industry, years of experience, or skill categories to generate tailored resume views with shareable URLs.

---

## Features

- **Dynamic Rendering** - Resume generated from structured JSON data
- **Profile-Based Filtering** - Predefined profiles (qa-lead, business-analyst, instructor, all) filter jobs and skills by matching tags
- **Years Filter** - Limit to recent X years of experience (default driven by active profile)
- **Additive History** - Show recent jobs with full detail, plus older jobs in a condensed section
- **Expandable Earlier Jobs** - Condensed jobs in "Additional Experience" can be clicked to reveal full details
- **Multiple Formats**
  - Styled resume with modern design
  - Plain text (ATS-optimized for applicant tracking systems)
  - Work history timeline visualization
  - Bootstrap-styled alternative
- **Shareable URLs** - Customized filters saved in URL parameters
- **ATS-Optimized Print** - PDF output uses single-column layout, standard section headers, and left-aligned content for reliable ATS parsing

---

## Pages

| File | Description |
|------|-------------|
| `index.html` | Main styled resume |
| `customize.html` | Filter UI with URL generator |
| `plaintextresume.html` | ATS-friendly plain text format |
| `workhistory.html` | Visual timeline of work history |
| `geeksiresume.html` | Bootstrap-styled version |
| `about.html` | System documentation |

---

## URL Parameters

Customize the resume by adding query parameters:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `profile` | `?profile=qa-lead` | Select a predefined profile (qa-lead, business-analyst, instructor, all) |
| `years` | `?years=10` | Override work history years (full-detail window) |
| `additional` | `?additional=5` | Override additional condensed years beyond work history |

**Example:**
```
index.html?profile=all&years=10
```

### Available Tags

Tags are used both for profile-based filtering and for job categorization:

**Profile tags** (match profile names): `qa-lead` `business-analyst` `instructor`

**Other tags**: `default` `event-host` `design` `security`

---

## Project Structure

```
resume/
├── index.html              # Main styled resume
├── customize.html          # Filter UI with URL generator
├── plaintextresume.html    # ATS-optimized plain text
├── workhistory.html        # Visual timeline
├── geeksiresume.html       # Bootstrap-styled version
├── about.html              # System documentation
├── css/
│   ├── style.css           # Main styling + print styles
│   └── resumeboot4.css     # Bootstrap version styles
├── js/
│   ├── resumeJSON.js       # Resume data (JSON) - single source of truth
│   ├── resume-config.js    # Profiles and default settings
│   ├── resume-utils.js     # Shared utility functions
│   ├── main.js             # Main resume renderer
│   └── app-geeksi.js       # Bootstrap version renderer
├── files/                  # PDF/DOCX downloads
├── README.md               # This file
└── CLAUDE.md               # AI assistant instructions
```

---

## Shared Utilities

The `js/resume-utils.js` file contains shared functions used by multiple pages:

- `getQueryParams()` - Parse URL query parameters (`years`, `additional`, `profile`, `format`)
- `getActiveProfile()` - Get active profile config from URL or default
- `getSummary()` - Get profile-specific summary text
- `getLabel()` - Get profile-specific label/title text
- `filterWorkByProfile()` - Filter jobs by profile name (matches job tags)
- `filterWorkByYears()` - Filter jobs by date range
- `filterSkillsByProfile()` - Filter skill categories by profile name (matches skill tags)
- `partitionJobs()` - Split jobs into recent (full detail) and earlier (condensed)
- `oxfordComma()` - Format arrays as comma-separated sentences
- `formatDate()` - Format date strings for display
- `applyFilters()` - Apply all filters to resume data

Default view settings are configured in `js/resume-config.js` via `RESUME_CONFIG.defaultWorkHistoryYears` (fallback: 15) and `RESUME_CONFIG.defaultProfile` (currently `"qa-lead"`).

---

## Editing Resume Data

All resume content lives in `js/resumeJSON.js`. The structure follows a modified [JSON Resume](https://jsonresume.org/) schema:

```javascript
var resumeJSON = {
  "basics": { name, label, email, phone, summary, location, profiles },
  "work": [
    {
      "name": "Company Name",
      "location": "City, ST",
      "position": "Job Title",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "summary": "Role description",
      "highlights": ["Achievement 1", "Achievement 2"],
      "tags": ["healthcare", "lead"]
    }
  ],
  "education": [...],
  "skills": [...],
  "languages": [...]
}
```

All pages read from this single JSON file, so edits propagate automatically.

---

## Additional Experience Section

When a profile with `additionalHistoryYears` is active, older jobs appear in a condensed "Additional Experience" section:

- Jobs display as one-liners: `+ Company | Position (dates)`
- Click any job to expand and see its full summary and highlights
- Click again to collapse
- The `+`/`−` icon indicates the expanded state
- Print/PDF keeps all jobs collapsed for a compact, ATS-friendly format

---

## Tech Stack

- **Vanilla JavaScript** - No frameworks or build tools (except Bootstrap version uses jQuery)
- **CSS3** - Custom properties, Grid, Flexbox, print media queries
- **No Build Process** - Edit files and refresh browser

---

## AI Assistance

See `CLAUDE.md` for instructions on how AI assistants (like Claude Code) should interact with this codebase.
