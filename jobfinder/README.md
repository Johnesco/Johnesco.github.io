# JobFinder

A simple HTML page to browse job search links across multiple sites and keywords.

## Usage

1. Open `index.html` in your browser
2. Select an industry from the dropdown
3. Click individual links or "Open All" to batch-open

That's it. No install, no build, no dependencies.

## Customization

Edit `config.js` to change sites and keywords:

```javascript
const CONFIG = {
  sites: [
    { name: "LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords={keyword}" },
    { name: "Indeed", url: "https://www.indeed.com/jobs?q={keyword}" },
    // Add more sites...
  ],

  industries: {
    "gaming": [
      "Game QA Lead",
      "Game Test Manager",
      // Add more keywords...
    ],
    // Add more industries...
  }
};
```

**Sites:** Each site needs a `name` and `url` with `{keyword}` placeholder.

**Industries:** Group keywords by industry/category. The industry name becomes the dropdown option.

After editing, just refresh the page.

## Files

```
index.html   # The app - open this
config.js    # Your sites and keywords - edit this
```

## Current Industries

- software-qa (20 keywords)
- business-product (5)
- training-enablement (5)
- accessibility (4)
- ai-ml (4)
- trust-safety (3)
- manufacturing (3)
- av-events (4)
- gaming (6)
