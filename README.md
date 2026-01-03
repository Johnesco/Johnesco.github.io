# John Escobedo - Interactive Resume

A dynamic, customizable resume website powered by vanilla JavaScript and JSON data. Filter by industry, years of experience, or skill categories to generate tailored resume views with shareable URLs.

**🔗 [View Live Resume](https://johnesco.github.io/resume/)**

---

## Features

- **Dynamic Rendering** – Resume generated from structured JSON data
- **Tag-Based Filtering** – Filter jobs by industry/role: healthcare, government, gaming, startup, accessibility, automation, and more
- **Years Filter** – Limit to recent X years of experience
- **Skills Filter** – Show/hide skill categories
- **Multiple Formats**
  - Styled resume with modern design
  - Plain text (ATS-optimized for applicant tracking systems)
  - Bootstrap-based alternate layout
- **Shareable URLs** – Customized filters saved in URL parameters
- **Print Optimized** – Clean PDF generation via browser print

---

## Quick Links

| Link | Description |
|------|-------------|
| [View Resume](https://johnesco.github.io/resume/) | Main styled resume |
| [Customize Resume](https://johnesco.github.io/resume/customize.html) | Filter and generate custom URLs |
| [Plain Text Resume](https://johnesco.github.io/resume/plaintextresume.html) | ATS-friendly format |

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
https://johnesco.github.io/resume/?tags=healthcare,lead&years=10
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
├── geeksiresume.html       # Bootstrap alternate layout
├── css/
│   └── style.css           # Styling + print styles
├── js/
│   ├── resumeJSON.js       # Resume data (JSON)
│   ├── main.js             # Rendering logic
│   └── app-geeksi.js       # Bootstrap version renderer
└── files/                  # PDF/DOCX downloads
```

---

## Editing Resume Data

All resume content lives in `resume/js/resumeJSON.js`. The structure follows a modified [JSON Resume](https://jsonresume.org/) schema:

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

---

## Tech Stack

- **Vanilla JavaScript** – No frameworks or build tools
- **CSS3** – Custom properties, Grid, Flexbox, print media queries
- **GitHub Pages** – Static hosting

---

## Local Development

1. Clone the repository
2. Open `resume/index.html` in a browser
3. Edit `resume/js/resumeJSON.js` to update content

No build step required.

---

## License

Personal portfolio – not intended for redistribution.
