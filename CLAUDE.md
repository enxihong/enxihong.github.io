# enxihong.github.io

Personal site. The old portfolio with 6 browser games is archived in `v1/` (git tag `v1-archive`); the root is being rebuilt. Static site on GitHub Pages. Vanilla HTML/CSS/JS, no build tools, no dependencies.

## File structure (v1/)

```
v1/index.html      HTML structure + <link>/<script> tags only (~110 lines)
v1/style.css       All CSS (~247 lines)
v1/js/main.js      Shared globals, screen switching, event wiring (~90 lines)
v1/js/snake.js     Snake game (~70 lines)
v1/js/tetris.js    Tetris game (~95 lines)
v1/js/fishy.js     Fishy game (~200 lines)
v1/js/breakout.js  Breakout game (~220 lines)
v1/js/draw.js      Draw tool (~130 lines)
v1/js/pacman.js    Pac-Man game (~320 lines)
```

## Globals defined in main.js

These are used by all game files:

- `$` — `document.getElementById` shorthand
- `canvas`, `ctx` — the single shared `<canvas>` element
- `overlay`, `overlayTitle`, `overlaySub` — overlay DOM refs
- `scoreEl`, `levelEl`, `levelItem`, `bestEl` — score UI DOM refs
- `ctrlSnake`, `ctrlTetris`, `ctrlPacman`, `drawToolbar` — control panel refs
- `activeGame` — string: which game is active (`'snake'`, `'tetris'`, etc.)
- `showOverlay(title, sub)` / `hideOverlay()` — overlay control
- `resizeCanvas(cols, rows)` — sizes canvas to fit, returns cell size in px
- `resizeFishyCanvas()` — full-bleed canvas for Fishy
- `calcCell(cols, rows)` — returns px per cell without resizing

## Each game exports

`{ init, start, stop, resize }` as a const (e.g. `const snake = (() => { ... })()`).

- `init()` — called when user selects the game; sets up canvas and shows overlay
- `start()` — called when overlay is tapped/clicked
- `stop()` — called when user navigates back
- `resize()` — called on window resize

## Local storage keys

`snake-best`, `tetris-best`, `fishy-best`, `breakout-best`, `pacman-best`

## Git-Workflow

- Feature-Branches dürfen ohne Rückfrage in main gemergt und gepusht werden.

## How to test locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```
