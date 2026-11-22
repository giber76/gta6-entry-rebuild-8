// Save support for Solara Bay (localStorage).
export function writeSave(G) {
  try {
    localStorage.setItem('solara-bay-save-v1', JSON.stringify({
      cash: G.cash, mission: G.mission, state: G.state,
      x: G.player.x, z: G.player.z, savedAt: Date.now(),
    }));
  } catch (e) { /* storage unavailable — the game still plays */ }
}
export function readSave() {
  try {
    const raw = localStorage.getItem('solara-bay-save-v1');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
