# 잔류 · static web game

This game lives separately from the repository's original dashboard. The published gh-pages files were restored at commit0981fbc954041a72420c9192be0e5d0373053b83 after the uncommitted game directory was absent in a refreshed workspace.

Run `PORT=4175 node game/serve.mjs` from the repository root. Validate with `node game/game.test.mjs`. Package with `python game/package-web.py`; deploy with `python game/deploy-pages.py` using an isolated Git index (does not replace or commit the main dashboard).

All published modules and assets are retained. Source imports are normalized; packaging adds a coherent cache version. Build helpers and tests are included with the published tree so future workspace recovery retains them.

## Grounding and recovery review

- Washer interior reuses unchanged `washer-animation.png` frames4–7. No free-floating face overlay while closed.
- Player crawl and Jeongwoo use measured native atlas crops, stable contact baseline and attached contact shadows; no vertical crawl bob.
- `thread-wrapping.png`: upper row is arm recovery with intact legs; lower row has **no lower body, thighs, knees or feet in any frame** and wraps the empty coat hem at floor level. Only successful completion restores the leg state.
- T still channels2.8 seconds; movement or opening the phone cancels without spending stock. Stow held light with R before wrapping so the held light is not suspended during the animation.
- New scene and geometry regression checks pass. Browser review uses seeded saves, fixed camera/lighting for visual inspection, and pauses the channel solely to inspect each sprite frame before resuming completion. It is not a full uninterrupted playthrough.
