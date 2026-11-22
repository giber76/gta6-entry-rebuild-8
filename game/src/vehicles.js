// Cars: factory, arcade physics, damage, wrecks (Solara Bay).
import { clamp, forwardOf } from './util.js';
import { collideCircle } from './city.js';

const PALETTE = [0x3a6fd8, 0xd8a03a, 0x7a7a7a, 0x4a9a5a, 0xd86a3a, 0x8a4ad8];
let nextId = 1;

export function makeCar(G, kind, x, z, heading, color) {
  const T = window.THREE;
  const group = new T.Group();
  const bodyMat = new T.MeshLambertMaterial({ color: color ?? 0x888888 });
  const body = new T.Mesh(new T.BoxGeometry(2.0, 0.85, 4.4), bodyMat);
  body.position.y = 0.75; group.add(body);
  const cabin = new T.Mesh(new T.BoxGeometry(1.8, 0.7, 2.2),
    new T.MeshLambertMaterial({ color: kind === 'police' ? 0x222222 : 0x1a2a3a }));
  cabin.position.set(0, 1.5, -0.3); group.add(cabin);
  if (kind === 'police') {
    const stripe = new T.Mesh(new T.BoxGeometry(2.05, 0.3, 4.45), new T.MeshLambertMaterial({ color: 0x111111 }));
    stripe.position.y = 0.75; group.add(stripe);
    const bar = new T.Mesh(new T.BoxGeometry(1.2, 0.25, 0.5), new T.MeshBasicMaterial({ color: 0xff2020 }));
    bar.position.set(0, 1.95, -0.3); group.add(bar);
  }
  const wheelGeo = new T.CylinderGeometry(0.42, 0.42, 0.35, 10);
  const wheelMat = new T.MeshLambertMaterial({ color: 0x181818 });
  for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const w = new T.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2; w.position.set(wx, 0.42, wz); group.add(w);
  }
  group.position.set(x, 0, z); group.rotation.y = heading;
  G.scene.add(group);
  const car = {
    id: nextId++, kind, x, z, heading, speed: 0, health: 100,
    wrecked: false, wreckTimer: 0, mesh: group, smokeT: 0,
  };
  G.cars.push(car);
  return car;
}

export function damageCar(G, car, n) {
  if (!car || car.wrecked) return;
  car.health -= n;
  if (car.health <= 0) { car.health = 0; wreckCar(G, car); }
}

export function repairCar(G, car) {
  if (!car) return;
  car.health = 100; car.wrecked = false; car.wreckTimer = 0;
}

export function wreckCar(G, car) {
  if (car.wrecked) return;
  car.wrecked = true; car.wreckTimer = 8; car.speed = 0;
  G.effects.explode(car.x, car.z, car.kind === 'police');
  G.scatterAt = { x: car.x, z: car.z };
  if (G.player.car === car) {
    G.player.car = null; G.player.inCar = false;
    G.player.x = car.x + 3; G.player.z = car.z + 3;
  }
}

// Arcade drive: steer -1 (right) .. +1 (left); throttle 0..1; brake bool.
export function driveCar(G, car, steer, throttle, brake, dt) {
  const TOP = 35, ACCEL = 22;
  if (throttle > 0) car.speed += ACCEL * throttle * dt;
  if (brake) car.speed -= (car.speed > 0 ? 26 : 10) * dt;
  car.speed -= car.speed * 0.2 * dt; // drag
  car.speed = clamp(car.speed, -8, TOP);
  const turn = 1.9 * clamp(car.speed / 10, -1, 1);
  car.heading += steer * turn * dt;
  const f = forwardOf(car.heading);
  const px = car.x, pz = car.z;
  car.x += f.x * car.speed * dt;
  car.z += f.z * car.speed * dt;
  car.x = clamp(car.x, -178, 178); car.z = clamp(car.z, -178, 178);
  const [cx, cz] = collideCircle(G, car.x, car.z, 2.2);
  if (Math.hypot(cx - car.x, cz - car.z) > 0.05) {
    if (Math.abs(car.speed) > 12) damageCar(G, car, 4);
    car.speed *= 0.55;
  }
  car.x = cx; car.z = cz;
  car.mesh.position.set(car.x, 0, car.z);
  car.mesh.rotation.y = car.heading;
}

export function updateCars(G, dt) {
  for (const car of G.cars) {
    if (car.wrecked) {
      car.wreckTimer -= dt;
      if (car.wreckTimer <= 0) {
        if (car.kind === 'traffic') {
          // Respawn on a road far from the player.
          car.health = 100; car.wrecked = false;
          car.x = -120 + ((car.id * 37) % 240); car.z = -160;
          car.heading = 0; car.speed = 0;
          car.mesh.position.set(car.x, 0, car.z);
        } else if (car.kind === 'boss') {
          car.health = 100; car.wrecked = false;
          car.x = 128.5; car.z = 50.5; car.heading = 0;
          car.mesh.position.set(car.x, 0, car.z);
        }
        // parked / police / coupe / getaway stay wrecked (police respawn via police.js)
      }
      continue;
    }
    if (car.health < 50) {
      car.smokeT -= dt;
      if (car.smokeT <= 0) {
        car.smokeT = car.health < 25 ? 0.12 : 0.3;
        G.effects.emitSmoke(car.x, car.z, car.health < 25);
      }
    }
  }
}
