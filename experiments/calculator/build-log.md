# Calculator Build Log

A step-by-step record of building a simple calculator webpage.

---

## Step 0 — Project Setup
**Prompt:** "From the begining of this chat, I need you to record all prompts that I give you. We are going to build an HTML+CSS+JS page that acts as a simple calculator. But we are going to record each step of this so that at the end of it we have to things. A working calculator on a webpage, and a step-by-step description of how it was built."

**Action:** Created the `calculator/` directory and this build log. Waiting for the first build instruction.

---

## Step 1 — 7-Segment LCD Display
**Prompt:** "The calculator will have a display of 20 digits, they will imitate 7 segment LCD screens with internal shadows and transparency to make it more believable."

**Action:** Created `index.html` with:
- A calculator shell with dark background and rounded bezel
- A green-tinted LCD display panel (gradient background with inset shadows to look recessed)
- 20 digit cells, each containing 7 CSS-shaped segments (a–g) using `clip-path` for the classic hexagonal segment shape
- "Off" segments are faintly visible at 12% opacity (like real LCDs where inactive segments are ghosted)
- "On" segments render at 85% opacity with inset shadow for depth
- Each digit has an accompanying decimal point pip
- A `renderDisplay(str)` JS function that parses a string (digits, minus, dots, spaces) into right-aligned 7-segment output
- Segment map covers 0–9, minus, space, E, r, o (for "Error" display)
- Display initialized showing "0"

---

## Step 2 — Button Keyboard & Calculator Logic
**Prompt:** "add a keyboard providing all numbers and typical buttons (+ - / * = etc) and a few advanced funtions."

**Action:** Added a full button grid and wired up calculator logic:

### Button layout (5-column grid, 6 rows):
| Row | Buttons |
|-----|---------|
| 1 | MC, MR, M+, M−, AC |
| 2 | √, x², 1/x, %, CE |
| 3 | 7, 8, 9, ÷, ← (backspace) |
| 4 | 4, 5, 6, ×, ± |
| 5 | 1, 2, 3, −, = (spans 2 rows) |
| 6 | 0 (wide), ., + |

### Button styles (5 visual classes):
- **btn-num** — dark grey for number keys
- **btn-op** — purple for operators (+, −, ×, ÷)
- **btn-eq** — accent blue for equals
- **btn-fn** — dark blue-grey for advanced functions
- **btn-clr** — red-tinted for AC / CE

All buttons have 3D press effect (translateY + box-shadow shift on `:active`).

### Calculator engine:
- Standard input chaining: enter number → operator → number → equals
- Operator chaining: `5 + 3 * ` evaluates `5 + 3` immediately and stages `8 *`
- `formatNumber()` caps output to 20 digits, falls back to exponential notation
- Error handling for divide-by-zero, negative sqrt, and overflow

### Advanced functions:
- **√** — square root (errors on negative)
- **x²** — square
- **1/x** — reciprocal (errors on zero)
- **%** — context-aware: `200 + 10%` = 220, standalone `50%` = 0.5
- **±** — toggle sign
- **←** — backspace (delete last digit)
- **MC/MR/M+/M−** — memory register (store, recall, add, subtract)
- **CE** — clear entry (current input only), **AC** — full reset

### Keyboard support:
- 0–9, `.`, `+`, `-`, `*`, `/`, Enter/=, Backspace, Escape, %

---

## Step 3 — Explainer Page
**Prompt:** "stop logging prompts: with what we have now, can we make the page show both the final steps and all the build process in an explainer page?"

**Action:** Restructured index.html into a combined explainer + live demo:
- Hero section with title and subtitle
- Live interactive calculator at the top
- "How It Was Built" section below with styled step cards
- Each card shows the original prompt (styled as a quote bubble), a summary of what was done, and collapsible code snippets with syntax highlighting
- Step 3 is self-referential — it documents its own creation
- Still fully self-contained: one HTML file, no dependencies

---
