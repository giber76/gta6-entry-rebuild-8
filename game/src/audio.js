// Procedural WebAudio for Solara Bay: 3 radio stations + sound effects.
// No audio files — every sound is synthesized.
const STATIONS = [
  { name: 'SOLARA FM', bpm: 112, root: 55, scale: [0, 3, 5, 7, 10], wave: 'sawtooth' },
  { name: 'BAY 97.5', bpm: 96, root: 65.41, scale: [0, 2, 4, 7, 9], wave: 'triangle' },
  { name: 'VICE 101', bpm: 128, root: 49, scale: [0, 3, 5, 6, 10], wave: 'square' },
];

export function createAudio() {
  const A = {
    ctx: null, master: null, musicGain: null, station: 2, step: 0, nextStep: 0,
    engineOsc: null, engineGain: null, muted: false,
  };
  A.ensure = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    try {
      A.ctx = new (window.AudioContext || window.webkitAudioContext)();
      A.master = A.ctx.createGain(); A.master.gain.value = 0.5; A.master.connect(A.ctx.destination);
      A.musicGain = A.ctx.createGain(); A.musicGain.gain.value = 0.22; A.musicGain.connect(A.master);
      A.engineOsc = A.ctx.createOscillator(); A.engineOsc.type = 'sawtooth'; A.engineOsc.frequency.value = 55;
      A.engineGain = A.ctx.createGain(); A.engineGain.gain.value = 0.0;
      A.engineOsc.connect(A.engineGain); A.engineGain.connect(A.master); A.engineOsc.start();
      A.nextStep = A.ctx.currentTime + 0.1;
    } catch (e) { A.ctx = null; }
  };
  A.stationName = function () { return STATIONS[A.station].name; };
  A.cycleStation = function () { A.station = (A.station + 1) % STATIONS.length; A.step = 0; };
  A.setEngine = function (speedKmh, inCar) {
    if (!A.ctx || !A.engineOsc) return;
    const t = A.ctx.currentTime;
    A.engineOsc.frequency.setTargetAtTime(45 + speedKmh * 1.1, t, 0.08);
    A.engineGain.gain.setTargetAtTime(inCar ? 0.05 : 0.0, t, 0.1);
  };
  A.blip = function (freq, dur, type, vol) {
    if (!A.ctx) return;
    const t = A.ctx.currentTime, o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(A.master); o.start(t); o.stop(t + dur + 0.02);
  };
  A.shot = function () {
    if (!A.ctx) return;
    const t = A.ctx.currentTime, len = 0.12, buf = A.ctx.createBuffer(1, A.ctx.sampleRate * len, A.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = A.ctx.createBufferSource(); src.buffer = buf;
    const g = A.ctx.createGain(); g.gain.value = 0.35;
    const f = A.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
    src.connect(f); f.connect(g); g.connect(A.master); src.start(t);
    A.blip(180, 0.08, 'square', 0.12);
  };
  A.explosion = function () {
    if (!A.ctx) return;
    const t = A.ctx.currentTime, len = 0.7, buf = A.ctx.createBuffer(1, A.ctx.sampleRate * len, A.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * (1 - i / d.length);
    const src = A.ctx.createBufferSource(); src.buffer = buf;
    const g = A.ctx.createGain(); g.gain.value = 0.5;
    const f = A.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
    src.connect(f); f.connect(g); g.connect(A.master); src.start(t);
    A.blip(60, 0.5, 'sine', 0.4);
  };
  A.cash = function () { A.blip(880, 0.12, 'sine', 0.2); setTimeout(() => A.blip(1320, 0.18, 'sine', 0.2), 90); };
  A.tick = function () {
    if (!A.ctx) return;
    const st = STATIONS[A.station], now = A.ctx.currentTime;
    const stepDur = 60 / st.bpm / 4;
    while (A.nextStep < now + 0.15) {
      const s = A.step % 16, t = A.nextStep;
      const bassNote = st.root * Math.pow(2, st.scale[(s >> 2) % st.scale.length] / 12);
      if (s % 4 === 0) {
        const o = A.ctx.createOscillator(), g = A.ctx.createGain();
        o.type = 'sine'; o.frequency.value = bassNote;
        g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 3.5);
        o.connect(g); g.connect(A.musicGain); o.start(t); o.stop(t + stepDur * 4);
      }
      if (s % 2 === 0) {
        const o = A.ctx.createOscillator(), g = A.ctx.createGain();
        o.type = st.wave; o.frequency.value = bassNote * 4 * Math.pow(2, st.scale[(s * 7) % st.scale.length] / 12);
        g.gain.setValueAtTime(0.10, t); g.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 1.5);
        o.connect(g); g.connect(A.musicGain); o.start(t); o.stop(t + stepDur * 2);
      }
      const h = A.ctx.createBufferSource(), hg = A.ctx.createGain();
      const hb = A.ctx.createBuffer(1, 2205, A.ctx.sampleRate), hd = hb.getChannelData(0);
      for (let i = 0; i < hd.length; i++) hd[i] = (Math.random() * 2 - 1) * (1 - i / hd.length);
      h.buffer = hb; hg.gain.setValueAtTime(s % 4 === 2 ? 0.12 : 0.05, t);
      hg.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      h.connect(hg); hg.connect(A.musicGain); h.start(t);
      A.step++; A.nextStep += stepDur;
    }
  };
  return A;
}
