// Solara Bay — GTA 6 round-10 rebuild #8 (Node 22, standard library only).
// Hands the game in: copies game/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json with the vendored make.fun library.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// THE FIX (rebuild #8): the output dir itself is NEVER touched. On the
// grader /output is a root-owned bind mount and this program runs as uid
// 65534, so chmodSync on the dir itself fails EPERM and the run exits 1 —
// that is exactly how round 10 died (run_completes, exit 1). clearContents
// below only removes the dir's CHILDREN, chmodding each child on the way
// down before removing it, the way the scored round-9 build did. The dir
// itself is only ever mkdirSync'd (a no-op when it already exists).

import {
  chmodSync, cpSync, existsSync, lstatSync, mkdirSync,
  readdirSync, rmdirSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function removeTree(p: string): void {
  // Chmod only this child path (never the output dir itself).
  try { chmodSync(p, 0o755); } catch { /* read-only leftovers still unlink */ }
  const st = lstatSync(p);
  if (st.isDirectory()) {
    for (const e of readdirSync(p)) removeTree(join(p, e));
    rmdirSync(p);
  } else {
    unlinkSync(p);
  }
}

function clearContents(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const e of readdirSync(dir)) removeTree(join(dir, e));
}

clearContents(out);
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
