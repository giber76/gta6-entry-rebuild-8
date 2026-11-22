// Combat for Solara Bay: pistol shooting (manual raycast), Vipers.
import { damageCar } from './vehicles.js';
import { dist2d, angNorm } from './util.js';

export function makeViper(G, x, z) {
  const T = window.THREE;
  const g = new T.Group();
  const body = new T.Mesh(new T.CylinderGeometry(0.34, 0.42, 1.0, 8),
    new T.MeshLambertMaterial({ color: 0x2a2a30 }));
  body.position.y = 0.95; g.add(body);
  const band = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 0.22, 8),
    new T.MeshBasicMaterial({ color: 0xd02020 }));
  band.position.y = 1.25; g.add(band);
  const head = new T.Mesh(new T.SphereGeometry(0.26, 8, 6),
    new T.MeshLambertMaterial({ color: 0xc8a880 }));
  head.position.y = 1.68; g.add(head);
  const gun = new T.Mesh(new T.BoxGeometry(0.12, 0.12, 0.7),
    new T.MeshLambertMaterial({ color: 0x111111 }));
  gun.position.set(0, 1.2, 0.45); g.add(gun);
  g.position.set(x, 0, z);
  G.scene.add(g);
  const v = { x, z, heading: 0, health: 30, mesh: g, shootT: 1 + Math.random(), strafe: 1, strafeT: 2, dead: false };
  G.vipers.push(v);
  return v;
}

export function aliveEnemies(G) {
  return G.vipers.filter((v) => !v.dead).length;
}

export function updateVipers(G, dt) {
  const P = G.player;
  for (const v of G.vipers) {
    if (v.dead) continue;
    const d = dist2d(v.x, v.z, P.x, P.z);
    const toPlayer = Math.atan2(P.x - v.x, P.z - v.z);
    v.strafeT -= dt;
    if (v.strafeT <= 0) { v.strafeT = 2 + Math.random(); v.strafe *= -1; }
    // Hold at ~15 m: close in when far, back off when close, strafe sideways.
    let mx = 0, mz = 0;
    if (d > 18) { mx += Math.sin(toPlayer) * 2.2; mz += Math.cos(toPlayer) * 2.2; }
    else if (d < 10) { mx -= Math.sin(toPlayer) * 2.2; mz -= Math.cos(toPlayer) * 2.2; }
    mx += Math.cos(toPlayer) * 1.5 * v.strafe; mz -= Math.sin(toPlayer) * 1.5 * v.strafe;
    v.x += mx * dt; v.z += mz * dt;
    v.heading = toPlayer;
    v.mesh.position.set(v.x, 0, v.z);
    v.mesh.rotation.y = v.heading;
    // Shoot back.
    v.shootT -= dt;
    if (v.shootT <= 0 && d < 60 && G.state === 'playing') {
      v.shootT = 1.5;
      if (Math.random() < 0.5) {
        P.health -= 4;
        G.effects.damageFlash();
        if (P.health <= 0) { P.health = 0; G.state = 'busted'; }
      }
    }
  }
}

function aimDir(G) {
  const h = G.player.heading + (G.camOffset || 0);
  return { x: Math.sin(h), z: Math.cos(h) };
}

export function shootPistol(G) {
  const P = G.player;
  if (!P.hasPistol || G.shootT > 0 || G.state !== 'playing') return;
  G.shootT = 0.3;
  if (G.audio) G.audio.shot();
  const ox = P.inCar && P.car ? P.car.x : P.x;
  const oz = P.inCar && P.car ? P.car.z : P.z;
  const aim = aimDir(G);
  let best = null, bestD = 70;
  const consider = (x, z, ref, kind) => {
    const dx = x - ox, dz = z - oz, d = Math.hypot(dx, dz);
    if (d > 70 || d < 0.5) return;
    const ang = Math.abs(angNorm(Math.atan2(dx, dz) - Math.atan2(aim.x, aim.z)));
    if (ang < 0.09 && d < bestD) { bestD = d; best = { ref, kind }; }
  };
  for (const c of G.parked) if (!c.wrecked) consider(c.x, c.z, c, 'car');
  for (const c of G.traffic) if (!c.wrecked) consider(c.x, c.z, c, 'car');
  for (const c of G.police) if (!c.wrecked) consider(c.x, c.z, c, 'car');
  if (G.bossCar && !G.bossCar.wrecked) consider(G.bossCar.x, G.bossCar.z, G.bossCar, 'car');
  for (const v of G.vipers) if (!v.dead) consider(v.x, v.z, v, 'viper');
  if (!best) return;
  if (best.kind === 'car') damageCar(G, best.ref, 15);
  else {
    best.ref.health -= 15;
    if (best.ref.health <= 0) {
      best.ref.dead = true;
      best.ref.mesh.rotation.x = Math.PI / 2;
      best.ref.mesh.position.y = 0.4;
      G.effects.emitSmoke(best.ref.x, best.ref.z, false);
    }
  }
}

export function faceNearestParkedCar(G) {
  const P = G.player;
  let best = null, bd = Infinity;
  for (const c of G.parked) {
    if (c.wrecked) continue;
    const d = dist2d(P.x, P.z, c.x, c.z);
    if (d < bd) { bd = d; best = c; }
  }
  if (!best) return;
  const h = Math.atan2(best.x - P.x, best.z - P.z);
  P.heading = h; G.camOffset = 0;
  if (P.inCar && P.car) P.car.heading = h;
}

export function faceNearestEnemy(G) {
  const P = G.player;
  let best = null, bd = Infinity;
  for (const v of G.vipers) {
    if (v.dead) continue;
    const d = dist2d(P.x, P.z, v.x, v.z);
    if (d < bd) { bd = d; best = v; }
  }
  if (!best) return;
  const h = Math.atan2(best.x - P.x, best.z - P.z);
  P.heading = h; G.camOffset = 0;
}
