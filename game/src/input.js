// Keyboard + mouse input for Solara Bay (held keys, edge presses, camera orbit).
import { shootPistol } from './combat.js';

export function initInput(G) {
  G.keys = {};
  G.pressed = new Set();
  G.camOffset = 0;
  let dragging = false, lastX = 0;

  window.addEventListener('keydown', (ev) => {
    const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    if (['w', 'a', 's', 'd', 'r', 'e', 'z', 'x', ' '].includes(k)) ev.preventDefault();
    if (!ev.repeat) {
      G.pressed.add(k);
      if (k === 'r' && G.state === 'playing' && G.audio) G.audio.cycleStation();
      if (k === 'z' && G.state === 'playing') G.mapZoom = G.mapZoom === 1 ? 2 : 4;
      if (k === 'x' && G.state === 'playing') G.mapZoom = G.mapZoom === 4 ? 2 : 1;
    }
    G.keys[k] = true;
  });
  window.addEventListener('keyup', (ev) => {
    const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    G.keys[k] = false;
  });
  window.addEventListener('blur', () => { G.keys = {}; });

  const cv = G.renderer.domElement;
  cv.addEventListener('mousedown', (ev) => {
    dragging = true; lastX = ev.clientX;
    if (G.state === 'playing') shootPistol(G);
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('mousemove', (ev) => {
    if (!dragging) return;
    G.camOffset += (ev.clientX - lastX) * 0.004;
    G.camOffset = Math.max(-1.2, Math.min(1.2, G.camOffset));
    lastX = ev.clientX;
  });
}
