// Debug API for Solara Bay (window.__solara) — the play-test's contract.
import { shootPistol, faceNearestParkedCar, faceNearestEnemy, aliveEnemies } from './combat.js';
import { damageCar, repairCar } from './vehicles.js';
import { parkedCount } from './traffic.js';

export function initDebug(G) {
  window.__solara = {
    state() {
      const P = G.player;
      return {
        state: G.state,
        mission: G.mission,
        cash: G.cash,
        wanted: G.wanted,
        health: Math.round(P.health),
        inCar: P.inCar,
        stage: G.stage,
        carHealth: P.inCar && P.car ? Math.round(P.car.health) : null,
        speedKmh: Math.round(Math.abs(P.speed) * 3.6),
        x: Math.round(P.x * 10) / 10,
        z: Math.round(P.z * 10) / 10,
        radio: G.audio ? G.audio.stationName() : 'VICE 101',
        mapZoom: G.mapZoom,
        enemies: aliveEnemies(G),
        parkedCars: parkedCount(G),
        hasPistol: P.hasPistol,
        weapon: P.weapon,
        elapsed: Math.round(G.elapsed * 10) / 10,
      };
    },
    teleport(x, z, heading) {
      const P = G.player;
      P.x = x; P.z = z; P.heading = heading;
      if (P.inCar && P.car) {
        P.car.x = x; P.car.z = z; P.car.heading = heading;
        P.car.mesh.position.set(x, 0, z);
        P.car.mesh.rotation.y = heading;
      }
      P.mesh.position.set(x, 0, z);
      P.mesh.rotation.y = heading;
      G.camOffset = 0;
    },
    damageCar(n) { if (G.player.car) damageCar(G, G.player.car, n); },
    repairCar() { if (G.player.car) repairCar(G, G.player.car); },
    givePistol() { G.player.hasPistol = true; G.player.weapon = 'pistol'; },
    faceNearestParkedCar() { faceNearestParkedCar(G); },
    faceNearestEnemy() { faceNearestEnemy(G); },
    click() { shootPistol(G); },
    heal() { G.player.health = 100; },
  };
}
