// Minimap for Solara Bay: canvas, centred on Marlo, zoom 1x/2x/4x (Z/X).
import { ROADS, OCEAN_EDGE } from './city.js';
import { clamp } from './util.js';

const SIZE = 180;

export function initMinimap(G) {
  const cv = document.getElementById('minimap');
  cv.width = SIZE; cv.height = SIZE;
  G.minimapCtx = cv.getContext('2d');
}

function objective(G) {
  switch (G.mission) {
    case 0: return G.stage === 0 ? [24, 26] : [-118, 116];
    case 1: return null;
    case 2: return G.stage === 0 ? [158, -40] : [78, 116];
    case 3: return [100, 36];
    case 4: return G.stage === 0 ? [-40, -80] : G.stage === 1 ? [-46, 8] : [138, 76];
    case 5: return G.stage === 0 ? [128.5, 50.5] : [-118, 116];
    default: return null;
  }
}

export function drawMinimap(G) {
  const ctx = G.minimapCtx, P = G.player;
  if (!ctx) return;
  const span = 360 / G.mapZoom; // metres across the map
  const toPx = (x, z) => [
    ((x - P.x) / span + 0.5) * SIZE,
    ((z - P.z) / span + 0.5) * SIZE,
  ];
  // Base: land, then ocean where it lies.
  ctx.fillStyle = '#5a6b4a'; ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#1e6fa8';
  const [ox0, oy0] = toPx(OCEAN_EDGE, -180);
  if (ox0 < SIZE) ctx.fillRect(Math.max(0, ox0), 0, SIZE - Math.max(0, ox0), SIZE);
  const [ox1, oy1] = toPx(-180, OCEAN_EDGE);
  if (oy1 < SIZE) ctx.fillRect(0, Math.max(0, oy1), SIZE, SIZE - Math.max(0, oy1));
  // Roads.
  ctx.strokeStyle = '#3a3f45'; ctx.lineWidth = Math.max(1, 3 * G.mapZoom / 2);
  for (const c of ROADS) {
    const [x0, y0] = toPx(c, -180), [x1, y1] = toPx(c, 180);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    const [hx0, hy0] = toPx(-180, c), [hx1, hy1] = toPx(180, c);
    ctx.beginPath(); ctx.moveTo(hx0, hy0); ctx.lineTo(hx1, hy1); ctx.stroke();
  }
  // Buildings.
  ctx.fillStyle = '#8a8a7a';
  for (const b of G.buildings) {
    const [x0, y0] = toPx(b.x0, b.z0), [x1, y1] = toPx(b.x1, b.z1);
    if (x1 < 0 || y1 < 0 || x0 > SIZE || y0 > SIZE) continue;
    ctx.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
  }
  // Objective marker.
  const obj = objective(G);
  if (obj) {
    const [x, y] = toPx(obj[0], obj[1]);
    ctx.fillStyle = '#ffd020';
    ctx.beginPath(); ctx.arc(clamp(x, 4, SIZE - 4), clamp(y, 4, SIZE - 4), 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7a5a00'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  // Police dots.
  ctx.fillStyle = '#ff3030';
  for (const c of G.police) {
    if (c.wrecked) continue;
    const [x, y] = toPx(c.x, c.z);
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  }
  // Player arrow (centre). Map space: +x right, +z down; forward is
  // (sin h, cos h), so an up-pointing arrow needs rotation PI - h.
  const cx = SIZE / 2, cy = SIZE / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI - P.heading);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
  ctx.restore();
  // Border.
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, SIZE - 2, SIZE - 2);
}
