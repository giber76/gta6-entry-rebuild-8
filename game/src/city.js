// Solara Bay world geometry: coastal grid city, ocean east/south, beacon.
// Buildings never spawn inside mission clear zones or on roads.
import { mulberry32 } from './util.js';

export const ROADS = [-160, -120, -80, -40, 0, 40, 80, 120, 160];
export const OCEAN_EDGE = 168; // water starts beyond this on east (+x) and south (+z)
export const CLEAR_ZONES = [
  [24, 26], [-118, 116], [78, 116], [100, 36], [126, 48], [158, -40],
  [-40, -80], [-40, -77], [-46, 8], [138, 76], [44, 124], [86, -46], [0, 0],
  [160, 160], [-160, 160], [-160, -160], [160, -160],
];
const CLEAR_R = 15;

function nearClear(x, z) {
  for (const [cx, cz] of CLEAR_ZONES) {
    if (Math.hypot(x - cx, z - cz) < CLEAR_R) return true;
  }
  return false;
}

export function buildCity(G) {
  const T = window.THREE, rng = mulberry32(1337);
  const scene = G.scene;
  G.buildings = [];
  G.ocean = { edge: OCEAN_EDGE };

  // Sky + fog + lights.
  scene.background = new T.Color(0x87bfe8);
  scene.fog = new T.Fog(0x9fc8e8, 220, 520);
  const sun = new T.DirectionalLight(0xfff2d8, 1.15);
  sun.position.set(120, 180, 60); scene.add(sun);
  scene.add(new T.HemisphereLight(0xbfe3ff, 0x8a7a5a, 0.85));

  // Ground (land only — never paints over the sea).
  const ground = new T.Mesh(
    new T.PlaneGeometry(348, 348),
    new T.MeshLambertMaterial({ color: 0x9aa578 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(-6, 0, -6);
  scene.add(ground);

  // Ocean: east strip + south strip, slightly below ground level.
  const seaMat = new T.MeshLambertMaterial({ color: 0x1e6fa8 });
  const seaE = new T.Mesh(new T.PlaneGeometry(90, 420), seaMat);
  seaE.rotation.x = -Math.PI / 2; seaE.position.set(213, -0.4, 0); scene.add(seaE);
  const seaS = new T.Mesh(new T.PlaneGeometry(360, 90), seaMat);
  seaS.rotation.x = -Math.PI / 2; seaS.position.set(-6, -0.4, 213); scene.add(seaS);
  // Beach sand along the waterline.
  const sandMat = new T.MeshLambertMaterial({ color: 0xdcc98f });
  const sandE = new T.Mesh(new T.PlaneGeometry(10, 348), sandMat);
  sandE.rotation.x = -Math.PI / 2; sandE.position.set(173, 0.05, -6); scene.add(sandE);
  const sandS = new T.Mesh(new T.PlaneGeometry(348, 10), sandMat);
  sandS.rotation.x = -Math.PI / 2; sandS.position.set(-6, 0.05, 173); scene.add(sandS);

  // Roads: dark strips on every grid line.
  const roadMat = new T.MeshLambertMaterial({ color: 0x3a3f45 });
  for (const c of ROADS) {
    const v = new T.Mesh(new T.PlaneGeometry(10, 348), roadMat);
    v.rotation.x = -Math.PI / 2; v.position.set(c, 0.08, -6); scene.add(v);
    const h = new T.Mesh(new T.PlaneGeometry(348, 10), roadMat);
    h.rotation.x = -Math.PI / 2; h.position.set(-6, 0.08, c); scene.add(h);
  }
  // Road centre dashes.
  const dashMat = new T.MeshBasicMaterial({ color: 0xd8d8d8 });
  for (const c of ROADS) {
    for (let d = -160; d <= 160; d += 16) {
      const dv = new T.Mesh(new T.PlaneGeometry(1.2, 5), dashMat);
      dv.rotation.x = -Math.PI / 2; dv.position.set(c, 0.12, d); scene.add(dv);
      const dh = new T.Mesh(new T.PlaneGeometry(5, 1.2), dashMat);
      dh.rotation.x = -Math.PI / 2; dh.position.set(d, 0.12, c); scene.add(dh);
    }
  }

  // Buildings: 1-3 per block, pastel towers, kept off roads and clear zones.
  const palette = [0xe8b48a, 0x9fc3d8, 0xd8d8c8, 0xe8a0a0, 0xa8c8a0, 0xc8b8d8, 0xf0d8a0];
  const centers = [-140, -100, -60, -20, 20, 60, 100, 140];
  for (const bx of centers) {
    for (const bz of centers) {
      const n = 1 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i++) {
        const ox = (rng() - 0.5) * 16, oz = (rng() - 0.5) * 16;
        const x = bx + ox, z = bz + oz;
        if (nearClear(x, z)) continue;
        const w = 7 + rng() * 6, d = 7 + rng() * 6, h = 8 + rng() * 26;
        const col = palette[Math.floor(rng() * palette.length)];
        const b = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshLambertMaterial({ color: col }));
        b.position.set(x, h / 2, z); scene.add(b);
        const roof = new T.Mesh(new T.BoxGeometry(w * 0.7, 1, d * 0.7), new T.MeshLambertMaterial({ color: 0x5a5a5a }));
        roof.position.set(x, h + 0.5, z); scene.add(roof);
        // Lit windows: a few emissive quads on the faces.
        const winMat = new T.MeshBasicMaterial({ color: 0xffe9a0 });
        for (let k = 0; k < 4; k++) {
          const win = new T.Mesh(new T.PlaneGeometry(1.6, 2.2), winMat);
          win.position.set(x - w / 2 - 0.05, 3 + rng() * (h - 5), z - d / 2 + 1 + rng() * (d - 2));
          win.rotation.y = -Math.PI / 2; scene.add(win);
        }
        G.buildings.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
      }
    }
  }

  // District landmarks.
  const mkBox = (x, z, w, h, d, col) => {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshLambertMaterial({ color: col }));
    m.position.set(x, h / 2, z); scene.add(m); return m;
  };
  // Rico's Garage (south-west) — big low workshop with a sign slab.
  mkBox(-118, 116, 18, 7, 12, 0xc86828);
  // Bank (vault) — stone block with columns.
  mkBox(-40, -80, 16, 10, 12, 0xd8d0c0);
  for (let i = -1; i <= 1; i++) {
    const col = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 10, 8), new T.MeshLambertMaterial({ color: 0xf0ead8 }));
    col.position.set(-40 + i * 5, 5, -73); scene.add(col);
  }
  // Safehouse — small house with a red roof.
  mkBox(138, 76, 10, 6, 9, 0xe8e0c8);
  const roof = new T.Mesh(new T.ConeGeometry(8, 4, 4), new T.MeshLambertMaterial({ color: 0xa03028 }));
  roof.position.set(138, 8, 76); roof.rotation.y = Math.PI / 4; scene.add(roof);
  // Pier deck (east edge) — wooden planks over the land, stopping at the water.
  const pier = new T.Mesh(new T.BoxGeometry(18, 1, 8), new T.MeshLambertMaterial({ color: 0x8a6a42 }));
  pier.position.set(159, 0.5, -40); scene.add(pier);
  // Marina beacon — tall glowing pillar, the M6 landmark.
  const beacon = new T.Mesh(
    new T.CylinderGeometry(0.8, 1.4, 26, 10),
    new T.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.22 }),
  );
  beacon.position.set(126, 13, 48); scene.add(beacon);
  const beaconBase = new T.Mesh(new T.CylinderGeometry(2.2, 2.8, 3, 10), new T.MeshLambertMaterial({ color: 0x707880 }));
  beaconBase.position.set(126, 1.5, 48); scene.add(beaconBase);
  const beaconTip = new T.Mesh(new T.SphereGeometry(1.2, 10, 8), new T.MeshBasicMaterial({ color: 0xfff2b0 }));
  beaconTip.position.set(126, 26.5, 48); scene.add(beaconTip);

  // Palms along the roads.
  const trunkMat = new T.MeshLambertMaterial({ color: 0x7a5a38 });
  const leafMat = new T.MeshLambertMaterial({ color: 0x2e8b4a });
  for (let i = 0; i < 46; i++) {
    const road = ROADS[Math.floor(rng() * ROADS.length)];
    const along = -150 + rng() * 300;
    const side = rng() > 0.5 ? 7.5 : -7.5;
    const px = rng() > 0.5 ? road + side : along, pz = rng() > 0.5 ? along : road + side;
    if (nearClear(px, pz) || px > 164 || pz > 164) continue;
    const trunk = new T.Mesh(new T.CylinderGeometry(0.25, 0.4, 6, 6), trunkMat);
    trunk.position.set(px, 3, pz); scene.add(trunk);
    const crown = new T.Mesh(new T.ConeGeometry(2.4, 3, 7), leafMat);
    crown.position.set(px, 7, pz); scene.add(crown);
  }
}

// Push a circle (x, z, radius r) out of every building AABB. Returns corrected [x, z].
export function collideCircle(G, x, z, r) {
  for (const b of G.buildings) {
    const nx = Math.max(b.x0, Math.min(x, b.x1));
    const nz = Math.max(b.z0, Math.min(z, b.z1));
    const dx = x - nx, dz = z - nz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 < 1e-6) { x = b.x1 + r; continue; }
      const d = Math.sqrt(d2);
      x = nx + (dx / d) * r; z = nz + (dz / d) * r;
    }
  }
  return [x, z];
}
