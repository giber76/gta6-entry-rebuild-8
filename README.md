# Solara Bay

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/giber76/gta6-entry-rebuild-8/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/giber76/gta6-entry-rebuild-8/reward.svg)](https://make.fun/bounty/gta6-01)

An open-world crime game in the spirit of GTA 6, built for the make.fun
gta6-01 bounty. Marlo, a driver in the coastal city of Solara Bay, runs six
story jobs — from stealing the first coupe to the $12,000 last job — while
traffic, pedestrians and the police fill the streets around him.

## What is in the game

- **Open world**: a seeded coastal grid city (garage, bank, marina, pier,
  safehouse) with an ocean on the east and south edges, palms, and a
  lighthouse beacon over Marina East.
- **Driving**: steal any car (E), arcade handling, top speed over 100 km/h,
  car damage with smoke, fire and wrecks that eject the driver.
- **Wanted level**: 0–3 stars. Police chase, ram, and can bust Marlo on foot;
  lose the heat by outrunning them until the wanted level decays.
- **Missions**: six story jobs with a cumulative $12,000 take — The First
  Coupe, Lose the Heat, The Package, Marina Showdown, The Bank Job, The
  Last Job — plus free roam after the win.
- **Combat**: a pistol (issued in M4) with drive-by shooting from the car,
  Vipers who hold, strafe and shoot back.
- **Feel**: procedural WebAudio radio (3 stations, R to cycle), engine hum,
  gunshots and explosions, a HUD with minimap (Z/X zoom), health, cash,
  wanted stars and speed, pause (Esc), and a localStorage save.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

WASD drive/walk, E enter car (hold E at the bank vault), mouse click shoot,
R radio, Z/X minimap zoom, Esc pause.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output dir and writes
`dossier.json` with the vendored make.fun library. It never touches the
output directory itself (only its contents), so it runs clean as an
unprivileged user against a root-owned bind-mounted `/output`.

## Layout

- `game/index.html` — page shell + HUD
- `game/src/main.js` — game loop, state machine, chase camera
- `game/src/city.js` — world geometry (roads, buildings, ocean, beacon)
- `game/src/missions.js` — M1–M6 story logic
- `game/src/vehicles.js` — car physics, damage, wrecks
- `game/src/traffic.js` — traffic loops + parked cars
- `game/src/police.js` — chase AI, rams, wanted decay
- `game/src/combat.js` — pistol raycast, drive-by, Vipers
- `game/src/player.js` — Marlo on foot and behind the wheel
- `game/src/pedestrians.js` — sidewalk walkers
- `game/src/audio.js` — procedural radio + sound effects
- `game/src/effects.js` — explosions, smoke, camera shake
- `game/src/hud.js` + `game/src/minimap.js` — HUD and minimap
- `game/src/input.js`, `game/src/debug.js`, `game/src/save.js`, `game/src/util.js`
- `game/vendor/three.min.js` — Three.js r159 (vendored)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
