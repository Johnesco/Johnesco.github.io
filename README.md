# johnesco.github.io

John Escobedo's portfolio, hosted on GitHub Pages: **[johnesco.github.io](https://johnesco.github.io/)**

Pushing to `master` publishes the site. There is no build step.

## Change what the portfolio shows

Edit [`projects.json`](projects.json). `index.html` draws the page from it.

| Field | Meaning |
|---|---|
| `name` | Title shown on the page |
| `url` | Full URL, including `https://` |
| `blurb` | What it is, in plain words |
| `status` | `featured` (in the "Top projects" carousel, with a screenshot), `listed` (in "More to try") or `hidden` (not drawn) |
| `group` | For `listed` projects: one of the names in `groups` |
| `tech` | Optional, for `featured` projects: what it's built with |
| `image` | Optional, for `featured` projects: a file in `img/`, about 1000×625 |

The order in the file is the order on the page.

`hidden` only removes a project from this page. The project stays reachable at its own URL, and this file is public, so keep private notes out of it. To take a project offline, turn off Pages in that project's repo.

## How projects get here

Each project lives in its own repo and folder under `C:\code`. Any repo with Pages turned on is served at `johnesco.github.io/<repo>/`, so this site only links to it. Don't copy projects in here, and don't create a folder here with the same name as a Pages repo.

Small pieces with no repo of their own, like `experiments/`, can stay in this repo.

## Preview locally

The page loads `projects.json`, so opening `index.html` directly from disk won't show the list. Serve it with [Portman](https://github.com/Johnesco/portman), which needs Flask (`pip install flask`):

```bash
python C:/code/portman/portman.py add portfolio C:/code/Johnesco.github.io
python C:/code/portman/portman.py
```

Then open http://127.0.0.1:9000/portfolio/. Project links go to the live sites.
