// Story missions M1–M6 for Solara Bay (exact coords + rewards from the spec).
import { makeCar } from './vehicles.js';
import { makeViper, aliveEnemies } from './combat.js';
import { dist2d } from './util.js';
import { writeSave } from './save.js';

const GARAGE = [-118, 116];
const PIER = [158, -40];
const CORAL = [78, 116];
const BANK = [-40, -80];
const SAFEHOUSE = [138, 76];
const BOSS_SPOT = [128.5, 50.5];

const NAMES = [
  'M1 — The First Coupe ($500)',
  'M2 — Lose the Heat ($1,300)',
  'M3 — The Package ($2,500)',
  'M4 — Marina Showdown ($4,000)',
  'M5 — The Bank Job ($7,000)',
  'M6 — The Last Job ($12,000)',
];

export function initMissions(G) {
  G.coupe = makeCar(G, 'coupe', 24, 26, 0.4, 0xc02020);
  G.getawayCar = null; G.bossCar = null;
  G.holdT = 0;
  G.missionText = NAMES[0];
}

function clearVipers(G) {
  for (const v of G.vipers) {
    if (!v.dead) { v.dead = true; G.scene.remove(v.mesh); }
  }
}

export function updateMissions(G, dt) {
  const P = G.player;
  if (G.state !== 'playing') return;
  G.missionText = NAMES[Math.min(G.mission, 5)] + (G.state === 'won' ? ' — DONE' : '');
  switch (G.mission) {
    case 0: { // M1: steal the coupe, deliver to Rico's Garage.
      if (G.stage === 0 && P.inCar && P.car === G.coupe) G.stage = 1;
      if (G.stage === 1 && P.inCar && P.car === G.coupe && dist2d(P.x, P.z, GARAGE[0], GARAGE[1]) < 8) {
        G.mission = 1; G.cash = 500; G.wanted = 2; G.stage = 0;
        if (G.audio) G.audio.cash();
        G.toast = 'M1 done — $500. Lose the heat!';
      }
      break;
    }
    case 1: { // M2: lose the heat (wanted decays to 0).
      if (G.wanted === 0) {
        G.mission = 2; G.cash = 1300; G.stage = 0;
        if (G.audio) G.audio.cash();
        G.toast = 'Heat lost — $1,300. The Package waits at the pier.';
      }
      break;
    }
    case 2: { // M3: pier ambush, then deliver to Coral Junction.
      if (G.stage === 0 && dist2d(P.x, P.z, PIER[0], PIER[1]) < 10) {
        makeViper(G, 150, -32); makeViper(G, 162, -48);
        G.stage = 1;
        G.toast = 'Ambush! Two Vipers at the pier.';
      }
      if (G.stage === 1 && dist2d(P.x, P.z, CORAL[0], CORAL[1]) < 8) {
        clearVipers(G);
        G.mission = 3; G.cash = 2500; G.stage = 0;
        P.hasPistol = true; P.weapon = 'pistol';
        makeViper(G, 96, 32); makeViper(G, 104, 40); makeViper(G, 100, 44);
        if (G.audio) G.audio.cash();
        G.toast = 'Package delivered — $2,500. Pistol issued. Clear Marina East.';
      }
      break;
    }
    case 3: { // M4: clear the 3 Marina East Vipers.
      if (aliveEnemies(G) === 0) {
        G.mission = 4; G.cash = 4000; G.stage = 0;
        if (G.audio) G.audio.cash();
        G.toast = 'Marina clear — $4,000. Hit the bank.';
      }
      break;
    }
    case 4: { // M5: hold E at the vault, steal the getaway car, reach the safehouse.
      if (G.stage === 0) {
        const d = dist2d(P.x, P.z, BANK[0], BANK[1]);
        if (d < 6 && G.keys['e'] && !P.inCar) {
          G.holdT += dt;
          if (G.holdT >= 4) {
            G.stage = 1; G.wanted = 3;
            G.getawayCar = makeCar(G, 'getaway', -46, 8, 0.8, 0x205020);
            G.toast = 'Vault cracked — wanted 3! Grab the getaway car.';
          }
        } else G.holdT = 0;
      } else if (G.stage === 1) {
        if (P.inCar && P.car === G.getawayCar) G.stage = 2;
      } else if (G.stage === 2) {
        if (P.inCar && P.car === G.getawayCar && dist2d(P.x, P.z, SAFEHOUSE[0], SAFEHOUSE[1]) < 8) {
          G.mission = 5; G.cash = 7000; G.stage = 0;
          makeViper(G, 122, 44); makeViper(G, 130, 52);
          G.bossCar = makeCar(G, 'boss', BOSS_SPOT[0], BOSS_SPOT[1], -0.6, 0x181818);
          if (G.audio) G.audio.cash();
          G.toast = 'Clean getaway — $7,000. Steal the boss coupe at the marina.';
        }
      }
      break;
    }
    case 5: { // M6: steal the boss coupe, deliver to Rico's Garage.
      if (G.stage === 0 && P.inCar && P.car === G.bossCar) G.stage = 1;
      if (G.stage === 1 && P.inCar && P.car === G.bossCar && dist2d(P.x, P.z, GARAGE[0], GARAGE[1]) < 8) {
        G.mission = 6; // all jobs done — so free roam never re-triggers the win
        G.state = 'won'; G.cash = 12000;
        writeSave(G);
        if (G.audio) G.audio.cash();
        G.toast = 'YOU WIN — $12,000!';
      }
      break;
    }
    default: break;
  }
}
