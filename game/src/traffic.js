// Traffic + parked cars for Solara Bay.
import { makeCar, driveCar, damageCar } from './vehicles.js';
import { dist2d } from './util.js';

const PARKED_SPOTS = [
  [44, 124, 0.3], [86, -46, -1.2], [-60, 20, 1.6], [120, -80, 0.9],
  [-100, -120, 2.2], [60, 140, -0.4],
];
// Rectangular road circuits for traffic.
const CIRCUITS = [
  [[-120, -120], [120, -120], [120, 120], [-120, 120]],
  [[-80, -80], [80, -80], [80, 80], [-80, 80]],
  [[-160, -40], [160, -40], [160, 40], [-160, 40]],
  [[-40, -160], [40, -160], [40, 160], [-40, 160]],
  [[-120, 0], [120, 0], [120, -120], [-120, -120]],
  [[0, -120], [0, 120], [-120, 120], [-120, -120]],
];
const TRAFFIC_COLORS = [0x3a6fd8, 0xd8a03a, 0x7a7a7a, 0x4a9a5a, 0xd86a3a, 0x8a4ad8];

export function initTraffic(G) {
  G.parked = [];
  PARKED_SPOTS.forEach(([x, z, h], i) => {
    const c = makeCar(G, 'parked', x, z, h, TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]);
    G.parked.push(c);
  });
  G.traffic = [];
  CIRCUITS.forEach((loop, i) => {
    const [x, z] = loop[i % loop.length];
    const c = makeCar(G, 'traffic', x, z, 0, TRAFFIC_COLORS[(i + 2) % TRAFFIC_COLORS.length]);
    c.loop = loop; c.wp = (i + 1) % loop.length;
    G.traffic.push(c);
  });
}

export function parkedCount(G) {
  return G.parked.filter((c) => !c.wrecked).length;
}

export function updateTraffic(G, dt) {
  const P = G.player;
  for (const car of G.traffic) {
    if (car.wrecked) continue;
    const [tx, tz] = car.loop[car.wp];
    const d = dist2d(car.x, car.z, tx, tz);
    if (d < 5) { car.wp = (car.wp + 1) % car.loop.length; continue; }
    // Steer toward the waypoint.
    const want = Math.atan2(tx - car.x, tz - car.z);
    let dh = want - car.heading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    const steer = Math.max(-1, Math.min(1, dh * 1.5));
    // Brake if the player's car is right ahead.
    let throttle = 0.55;
    if (P.inCar && P.car) {
      const pd = dist2d(car.x, car.z, P.car.x, P.car.z);
      if (pd < 18) {
        const ahead = Math.atan2(P.car.x - car.x, P.car.z - car.z);
        let da = ahead - car.heading;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        if (Math.abs(da) < 0.9) throttle = 0;
      }
    }
    driveCar(G, car, steer, throttle, false, dt);
    car.speed = Math.min(car.speed, 9);
    // Shove aside on contact with the player's car.
    if (P.inCar && P.car) {
      const pd = dist2d(car.x, car.z, P.car.x, P.car.z);
      if (pd < 4.5 && Math.abs(P.car.speed) > 6) {
        damageCar(G, car, 10);
        car.x += (car.x - P.car.x) * 0.4; car.z += (car.z - P.car.z) * 0.4;
        P.car.speed *= 0.9;
      }
    }
  }
}
