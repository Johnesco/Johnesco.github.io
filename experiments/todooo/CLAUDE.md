# Evolving

An app that evolves one version at a time.

## Structure

- `index.html` — lists every version with a one-line description
- `001/index.html`, `002/index.html`, ... — each version is a standalone HTML file
- Every significant change gets its own numbered directory (001–999)
- The root index links to all of them in order

## Rules

- Vanilla HTML + CSS + JS only. No frameworks, no dependencies, no build tools.
- Each version is a single self-contained `index.html` file.
- localStorage key per version: `todooo-NNN` (so they never clash).
- Dark theme: `#1a1a2e` background, `#16213e` cards, `#7c83ff` accent.
- Each version builds on what came before, adding or transforming one major thing.
- After creating a new version, add it to the root `index.html` with its number and description.
