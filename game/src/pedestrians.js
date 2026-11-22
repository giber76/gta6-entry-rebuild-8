// Pedestrians for Solara Bay: sidewalk walkers who scatter from wrecks.
import { mulberry32, clamp } from './util.js';
import { collideCircle } from './city.js';

const SHIRTS = [0xd84a4a, 0x4a7ad8, 0x4ad88a, 0xd8c84a, 0x9a4ad8, 0x4ad8c8];

export function initPedestrians(G) {
  const T = window.THREE, rng = mulberry32(2024);
  G.peds = [];
  for (let i = 0; i < 18; i++) {
    const x = -150 + rng() * 300, z = -150 + rng() * 300;
    const g = new T.Group();
    const shirt = new T.Mesh(new T.CylinderGeometry(0.32, 0.4, 0.95, 8),
      new T.MeshLambertMaterial({ color: SHIRTS[i % SHIRTS.length] }));
    shirt.position.y = 0.95; g.add(shirt);
    const head = new T.Mesh(new T.SphereGeometry(0.26, 8, 6),
      new T.MeshLambertMaterial({ color: 0xe8c8a0 }));
    head.position.y = 1.65; g.add(head);
    const legs = new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.3),
      new T.MeshLambertMaterial({ color: 0x30343a }));
    legs.position.y = 0.25; g.add(legs);
    g.position.set(x, 0, z);
    G.scene.add(g);
    G.peds.push({
      x, z, heading: rng() * Math.PI * 2, speed: 1.2 + rng() * 0.8,
      mesh: g, dir: rng() > 0.5 ? 1 : -1, axis: rng() > 0.5 ? 'x' : 'z',
      scatterT: 0,
    });
  }
}

export function updatePedestrians(G, dt) {
  for (const p of G.peds) {
    if (G.scatterAt) {
      const d = Math.hypot(p.x - G.scatterAt.x, p.z - G.scatterAt.z);
      if (d < 25) { p.scatterT = 2.5; p.heading = Math.atan2(p.x - G.scatterAt.x, p.z - G.scatterAt.z); }
    }
    let sp = p.speed;
    if (p.scatterT > 0) { p.scatterT -= dt; sp = 5; }
    else {
      // Stroll along a sidewalk axis, turning around at the ends.
      const target = p.axis === 'x' ? Math.atan2(p.dir, 0) : Math.atan2(0, p.dir);
      let dh = target - p.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      p.heading += Math.max(-1.5 * dt, Math.min(1.5 * dt, dh));
    }
    p.x += Math.sin(p.heading) * sp * dt;
    p.z += Math.cos(p.heading) * sp * dt;
    if (Math.abs(p.x) > 150 || Math.abs(p.z) > 150) { p.dir *= -1; p.x = clamp(p.x, -150, 150); p.z = clamp(p.z, -150, 150); }
    const [cx, cz] = collideCircle(G, p.x, p.z, 0.5);
    p.x = cx; p.z = cz;
    p.mesh.position.set(p.x, 0, p.z);
    p.mesh.rotation.y = p.heading;
  }
  if (G.scatterAt) G.scatterAt = null;
}
