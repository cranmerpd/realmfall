# Realmfall

A world that runs in the browser. Realms settle, move grain down rivers, go hungry, take people in or turn them away, fight, and sometimes break.

There is no account and no install. The simulation stays on the machine that opened the page. Nothing you do is uploaded.

## Play

[https://cranmerpd.github.io/realmfall/](https://cranmerpd.github.io/realmfall/)

Send that link. Anyone with it can open the game. It is not behind a login. It is also not listed anywhere else, so it stays with the people you give it to.

If a new version looks like the old one, hard-refresh: Cmd-Shift-R on a Mac, Ctrl-Shift-R on Windows.

## On the page

- **States** colors the realms. **Faith** is a separate layer. A province is a mix of beliefs, not a flag.
- White marks are settlements. They grow and shrink with the people in them.
- Click a realm for its people, hunger, grain, government, and whether the fields are in drought.
- **v0.15 · notes** opens the version history. **Log** is what happened in this world, not the history of the program.
- **New map** starts another world. Leaving the browser tab pauses the years instead of racing to catch up.

## Files

No build step. GitHub Pages serves this folder as it is.

| Path | What it is |
|---|---|
| `index.html` | The page |
| `css/realmfall.css` | Layout |
| `js/notes.js` | Version history shown in the page |
| `js/state.js` | Shared numbers and the map canvas |
| `js/world.js` | Continents, rivers, the first people |
| `js/sim.js` | Years: food, settlement, war, faith, government |
| `js/view.js` | Drawing, the side panel, the clock |

`CHANGELOG.md` is the same history as the notes panel.
