// Police for Solara Bay: chase, rams, wanted decay, respawn.
import { makeCar, driveCar, damageCar } from './vehicles.js';
import { dist2d, clamp } from './util.js';

const POLICE_TOP = 27;

export function initPolice(G) {
  G.police = [];
  G.decayT = 0;
}

function spawnPolice(G) {
  const P = G.player;
  const a = (G.police.length * 2.1) + 0.7;
  const x = clamp(P.x + Math.sin(a) * 50, -170, 170);
  const z = clamp(P.z + Math.cos(a) * 50, -170, 170);
  const car = makeCar(G, 'police', x, z, Math.atan2(P.x - x, P.z - z), 0xe8e8e8);
  car.ramT = 0; car.catchT = 0; car.leaveT = 0;
  G.police.push(car);
}

export function updatePolice(G, dt) {
  const P = G.player;
  // Spawn while wanted.
  if (G.wanted > 0 && G.police.length < 2 && G.state === 'playing') spawnPolice(G);
  // Wanted decay: only when no police car is within 30 m.
  if (G.wanted > 0) {
    let nearest = Infinity;
    for (const c of G.police) if (!c.wrecked) nearest = Math.min(nearest, dist2d(c.x, c.z, P.x, P.z));
    if (nearest > 30) {
      G.decayT += dt;
      if (G.decayT >= 8) { G.decayT = 0; G.wanted = Math.max(0, G.wanted - 1); }
    } else G.decayT = 0;
  }
  for (let i = G.police.length - 1; i >= 0; i--) {
    const car = G.police[i];
    if (car.wrecked) {
      if (car.wreckTimer <= 0) {
        G.scene.remove(car.mesh);
        G.cars.splice(G.cars.indexOf(car), 1);
        G.police.splice(i, 1);
      }
      continue;
    }
    const d = dist2d(car.x, car.z, P.x, P.z);
    if (G.wanted === 0) {
      // Disengage: drive away, despawn when far.
      car.leaveT += dt;
      const away = Math.atan2(car.x - P.x, car.z - P.z);
      let dh = away - car.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      driveCar(G, car, clamp(dh * 1.5, -1, 1), 0.7, false, dt);
      car.speed = Math.min(car.speed, 20);
      if (d > 90 || car.leaveT > 8) {
        G.scene.remove(car.mesh);
        G.cars.splice(G.cars.indexOf(car), 1);
        G.police.splice(i, 1);
      }
      continue;
    }
    // Chase the player.
    const want = Math.atan2(P.x - car.x, P.z - car.z);
    let dh = want - car.heading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    driveCar(G, car, clamp(dh * 1.8, -1, 1), 1, false, dt);
    car.speed = Math.min(car.speed, POLICE_TOP);
    // Ram the player's car.
    car.ramT -= dt;
    if (P.inCar && P.car && d < 4.5 && car.ramT <= 0) {
      car.ramT = 1.5;
      damageCar(G, P.car, 5);
      const push = 0.25;
      P.car.x += ((P.car.x - car.x) / (d || 1)) * push;
      P.car.z += ((P.car.z - car.z) / (d || 1)) * push;
      P.car.speed *= 0.92;
    }
    // Catch Marlo on foot.
    if (!P.inCar && d < 3) {
      car.catchT += dt;
      if (car.catchT > 2) { G.state = 'busted'; }
    } else car.catchT = 0;
  }
}
