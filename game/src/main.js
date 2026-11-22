// Solara Bay — game loop, state machine, chase camera (main entry).
import { createAudio } from './audio.js';
import { buildCity } from './city.js';
import { createEffects } from './effects.js';
import { updateCars } from './vehicles.js';
import { initTraffic, updateTraffic } from './traffic.js';
import { initPedestrians, updatePedestrians } from './pedestrians.js';
import { initPolice, updatePolice } from './police.js';
import { updateVipers } from './combat.js';
import { initMissions, updateMissions } from './missions.js';
import { initPlayer, updatePlayer } from './player.js';
import { initInput } from './input.js';
import { initHud, updateHud } from './hud.js';
import { initMinimap, drawMinimap } from './minimap.js';
import { initDebug } from './debug.js';

const G = {
  state: 'menu', mission: 0, cash: 0, wanted: 0, stage: 0,
  elapsed: 0, mapZoom: 1, shootT: 0, decayT: 0,
  cars: [], peds: [], vipers: [], police: [], traffic: [], parked: [],
  keys: {}, pressed: new Set(), camOffset: 0, toast: '', missionText: '',
  scatterAt: null, holdT: 0,
};

function boot() {
  const T = window.THREE;
  G.renderer = new T.WebGLRenderer({ antialias: true });
  G.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  G.renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('app').appendChild(G.renderer.domElement);
  G.scene = new T.Scene();
  G.camera = new T.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 900);
  G.camera.position.set(0, 8, -12);
  G.audio = createAudio();
  G.effects = createEffects(G);
  buildCity(G);
  initPlayer(G);
  initTraffic(G);
  initPedestrians(G);
  initPolice(G);
  initMissions(G);
  initInput(G);
  initHud(G);
  initMinimap(G);
  initDebug(G);
  window.addEventListener('resize', () => {
    G.camera.aspect = window.innerWidth / window.innerHeight;
    G.camera.updateProjectionMatrix();
    G.renderer.setSize(window.innerWidth, window.innerHeight);
  });
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000));
    last = now;
    frame(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function frame(dt) {
  // Escape toggles pause.
  if (G.pressed.has('Escape') || G.pressed.has('escape')) {
    if (G.state === 'playing') G.state = 'paused';
    else if (G.state === 'paused') G.state = 'playing';
  }
  if (G.state === 'playing') {
    G.elapsed += dt;
    G.shootT = Math.max(0, G.shootT - dt);
    updatePlayer(G, dt);
    updateMissions(G, dt);
    updatePolice(G, dt);
    updateTraffic(G, dt);
    updatePedestrians(G, dt);
    updateVipers(G, dt);
    updateCars(G, dt);
    G.effects.update(dt);
    if (G.audio) { G.audio.tick(); G.audio.setEngine(G.player.inCar ? Math.abs(G.player.speed) * 3.6 : 0, G.player.inCar); }
  } else {
    G.effects.update(dt);
  }
  updateCamera(dt);
  updateHud(G);
  drawMinimap(G);
  G.renderer.render(G.scene, G.camera);
  G.pressed.clear();
}

function updateCamera(dt) {
  const P = G.player;
  const yaw = P.heading + (G.camOffset || 0);
  const dist = P.inCar ? 11 : 7.5;
  const height = P.inCar ? 4.4 : 3.4;
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  const tx = P.x - fx * dist, tz = P.z - fz * dist;
  const k = 1 - Math.exp(-7 * dt);
  G.camera.position.x += (tx - G.camera.position.x) * k;
  G.camera.position.y += (height - G.camera.position.y) * k;
  G.camera.position.z += (tz - G.camera.position.z) * k;
  const [sx, sy] = G.effects.shakeOffset();
  G.camera.position.x += sx * 0.4; G.camera.position.y += sy * 0.4;
  G.camera.lookAt(P.x + fx * 6, 1.6, P.z + fz * 6);
}

boot();
