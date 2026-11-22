// Marlo (the player) for Solara Bay: on-foot movement, enter/exit cars.
import { clamp, forwardOf } from './util.js';
import { collideCircle } from './city.js';
import { driveCar } from './vehicles.js';

export function initPlayer(G) {
  const T = window.THREE;
  const g = new T.Group();
  const torso = new T.Mesh(new T.CylinderGeometry(0.34, 0.42, 1.0, 8),
    new T.MeshLambertMaterial({ color: 0x2a6fd8 }));
  torso.position.y = 0.95; g.add(torso);
  const head = new T.Mesh(new T.SphereGeometry(0.27, 10, 8),
    new T.MeshLambertMaterial({ color: 0xe8c8a0 }));
  head.position.y = 1.72; g.add(head);
  const cap = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.12, 10),
    new T.MeshLambertMaterial({ color: 0xc02020 }));
  cap.position.y = 1.95; g.add(cap);
  const legs = new T.Mesh(new T.BoxGeometry(0.55, 0.5, 0.32),
    new T.MeshLambertMaterial({ color: 0x2a2a30 }));
  legs.position.y = 0.25; g.add(legs);
  g.position.set(0, 0, 0);
  G.scene.add(g);
  G.player = {
    x: 0, z: 0, heading: 0, health: 100, inCar: false, car: null,
    hasPistol: false, weapon: null, speed: 0, mesh: g,
  };
}

function nearestCar(G, range) {
  const P = G.player;
  let best = null, bd = range;
  for (const c of G.cars) {
    if (c.wrecked) continue;
    const d = Math.hypot(c.x - P.x, c.z - P.z);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

export function updatePlayer(G, dt) {
  const P = G.player, K = G.keys;
  if (G.state !== 'playing') return;
  // E: enter / exit (edge-triggered).
  if (G.pressed.has('e')) {
    if (P.inCar) {
      const car = P.car;
      P.inCar = false; P.car = null;
      P.x = car.x + 3; P.z = car.z + 3; P.heading = car.heading;
    } else {
      const car = nearestCar(G, 4.5);
      if (car) { P.inCar = true; P.car = car; P.heading = car.heading; }
    }
  }
  if (P.inCar && P.car) {
    const steer = (K['a'] ? 1 : 0) + (K['d'] ? -1 : 0);
    const throttle = K['w'] ? 1 : 0;
    const brake = !!K['s'];
    driveCar(G, P.car, steer, throttle, brake, dt);
    P.x = P.car.x; P.z = P.car.z; P.heading = P.car.heading;
    P.speed = P.car.speed;
    P.mesh.visible = false;
  } else {
    P.mesh.visible = true;
    const turn = (K['a'] ? 1 : 0) + (K['d'] ? -1 : 0);
    P.heading += turn * 2.6 * dt;
    let sp = 0;
    if (K['w']) sp = 7;
    else if (K['s']) sp = -3;
    const f = forwardOf(P.heading);
    P.x += f.x * sp * dt; P.z += f.z * sp * dt;
    P.x = clamp(P.x, -178, 178); P.z = clamp(P.z, -178, 178);
    const [cx, cz] = collideCircle(G, P.x, P.z, 0.6);
    P.x = cx; P.z = cz;
    P.speed = sp;
    P.mesh.position.set(P.x, 0, P.z);
    P.mesh.rotation.y = P.heading;
  }
  if (P.health <= 0) { P.health = 0; G.state = 'busted'; }
}
