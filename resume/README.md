# Interactive Resume

A dynamic, customizable resume website powered by vanilla JavaScript and JSON data. Filter by industry, years of experience, or skill categories to generate tailored resume views with shareable URLs.

---

## Features

- **Dynamic Rendering** – Resume generated from structured JSON data
- **Tag-Based Filtering** – Filter jobs by industry/role: healthcare, government, gaming, startup, accessibility, automation, and more
- **Years Filter** – Limit to recent X years of experience
- **Skills Filter** – Show/hide skill categories
- **Multiple Formats**
  - Styled resume with modern design
  - Plain text (ATS-optimized for applicant tracking systems)
  - Work history timeline visualization
- **Shareable URLs** – Customized filters saved in URL parameters
- **Print Optimized** – Clean PDF generation via browser print

---

## Pages

| File | Description |
|------|-------------|
| `index.html` | Main styled resume |
| `customize.html` | Filter UI with URL generator |
| `plaintextresume.html` | ATS-friendly plain text format |
| `workhistory.html` | Visual timeline of work history |

---

## URL Parameters

Customize the resume by adding query parameters:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `tags` | `?tags=healthcare,government` | Filter by job tags (comma-separated) |
| `years` | `?years=5` | Show only last N years |
| `skills` | `?skills=Testing,Leadership` | Filter skill categories |

**Example:**
```
index.html?tags=healthcare,lead&years=10
```

### Available Tags

`government` `healthcare` `lead` `accessibility` `agile` `startup` `robotics` `vr` `hardware` `entertainment` `ecommerce` `automation` `edtech` `gaming` `support` `mobile` `hipaa` `creative` `bilingual` `admin` `asl` `web` `adtech` `education` `instructor`

---

## Project Structure

```
resume/
├── index.html              # Main styled resume
├── customize.html          # Filter UI with URL generator
├── plaintextresume.html    # ATS-optimized plain text
├── workhistory.html        # Visual timeline
├── css/
│   └── style.css           # Styling + print styles
├── js/
│   ├── resumeJSON.js       # Resume data (JSON) - single source of truth
│   ├── main.js             # Rendering logic
│   └── app-geeksi.js       # Bootstrap version renderer
└── files/                  # PDF/DOCX downloads
```

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

All pages (`index.html`, `plaintextresume.html`, `workhistory.html`) read from this single JSON file, so edits propagate automatically.

---

## Tech Stack

- **Vanilla JavaScript** – No frameworks or build tools
- **CSS3** – Custom properties, Grid, Flexbox, print media queries
