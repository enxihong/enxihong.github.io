# enxihong.github.io

Personal site: "What kind of vibe coder are you?" personality test (English, roast tone, 16personalities-inspired look). The old portfolio with 6 browser games is archived in `v1/`. Static site on GitHub Pages. Vanilla HTML/CSS/JS, no build tools, no dependencies.

## File structure (root: vibe coder test)

```
index.html        Shell: fonts, <div id="app">, script tags
style.css         All CSS (group colors: purple/yellow/green/coral)
js/types.js       GROUPS, AXES, TYPES (15 types: copy, traits, enemy)
js/questions.js   QUESTIONS (12; each option has points per type `t` and terminal reply `r`)
js/app.js         Hash router: #/ home, #/test terminal quiz, #/type/<id>, #/result/<id>/<t1-t2-t3-t4>
```

Scoring: points per type are normalized by the max a type can reach; trait bars are the type profiles weighted by match strength. The emoji `.figure` on type pages is a placeholder for 3D figures.

## Archive (v1/)

### File structure (v1/)

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

### Globals defined in main.js

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

### Each game exports

`{ init, start, stop, resize }` as a const (e.g. `const snake = (() => { ... })()`).

- `init()` — called when user selects the game; sets up canvas and shows overlay
- `start()` — called when overlay is tapped/clicked
- `stop()` — called when user navigates back
- `resize()` — called on window resize

### Local storage keys

`snake-best`, `tetris-best`, `fishy-best`, `breakout-best`, `pacman-best`

## Git-Workflow

- Feature-Branches dürfen ohne Rückfrage in main gemergt und gepusht werden.

## How to test locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```
