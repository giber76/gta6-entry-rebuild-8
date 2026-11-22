// HUD for Solara Bay: cash, wanted stars, health, speed, radio, mission, screens.
export function initHud(G) {
  G.el = {
    hud: document.getElementById('hud'),
    cash: document.getElementById('cash'),
    wanted: document.getElementById('wanted'),
    radio: document.getElementById('radio'),
    speed: document.getElementById('speed'),
    health: document.getElementById('health-fill'),
    mission: document.getElementById('mission'),
    toast: document.getElementById('toast'),
    screen: document.getElementById('screen'),
    screenTitle: document.getElementById('screen-title'),
    screenSub: document.getElementById('screen-sub'),
    btnNew: document.getElementById('btn-new'),
    btnFree: document.getElementById('btn-freeroam'),
    btnRetry: document.getElementById('btn-retry'),
  };
  G.el.btnNew.addEventListener('click', () => startGame(G));
  G.el.btnFree.addEventListener('click', () => {
    if (G.state === 'won') { G.state = 'playing'; G.el.screen.style.display = 'none'; }
  });
  G.el.btnRetry.addEventListener('click', () => window.location.reload());
  G.toastT = 0;
}

export function startGame(G) {
  if (G.audio) G.audio.ensure();
  G.state = 'playing';
  G.el.screen.style.display = 'none';
  G.el.hud.style.display = 'block';
}

function stars(n) {
  let s = '';
  for (let i = 0; i < 3; i++) s += i < n ? '★' : '☆';
  return s;
}

export function updateHud(G) {
  const E = G.el, P = G.player;
  if (G.state === 'menu') {
    E.screen.style.display = 'flex';
    E.screenTitle.textContent = 'SOLARA BAY';
    E.screenSub.textContent = 'Six jobs. One city. $12,000 on the line.';
    E.btnNew.style.display = 'inline-block';
    E.btnFree.style.display = 'none';
    E.btnRetry.style.display = 'none';
    E.hud.style.display = 'none';
    return;
  }
  if (G.state === 'won') {
    E.screen.style.display = 'flex';
    E.screenTitle.textContent = 'YOU WIN';
    E.screenSub.textContent = 'All six jobs done — $12,000. Solara Bay is yours.';
    E.btnNew.style.display = 'none';
    E.btnFree.style.display = 'inline-block';
    E.btnRetry.style.display = 'none';
  } else if (G.state === 'busted') {
    E.screen.style.display = 'flex';
    E.screenTitle.textContent = 'BUSTED';
    E.screenSub.textContent = 'The Bay keeps what it takes. Try again, Marlo.';
    E.btnNew.style.display = 'none';
    E.btnFree.style.display = 'none';
    E.btnRetry.style.display = 'inline-block';
  } else if (G.state === 'paused') {
    E.screen.style.display = 'flex';
    E.screenTitle.textContent = 'PAUSED';
    E.screenSub.textContent = 'Press Escape to keep driving.';
    E.btnNew.style.display = 'none';
    E.btnFree.style.display = 'none';
    E.btnRetry.style.display = 'none';
  } else {
    E.screen.style.display = 'none';
  }
  E.hud.style.display = G.state === 'menu' ? 'none' : 'block';
  E.cash.textContent = '$' + G.cash.toLocaleString('en-US');
  E.wanted.textContent = stars(G.wanted);
  E.wanted.style.color = G.wanted > 0 ? '#ff4040' : '#ffffff';
  E.radio.textContent = '♪ ' + (G.audio ? G.audio.stationName() : 'VICE 101');
  E.speed.textContent = P.inCar ? Math.round(Math.abs(P.speed) * 3.6) + ' km/h' : '';
  E.health.style.width = Math.max(0, P.health) + '%';
  E.health.style.background = P.health > 50 ? '#4ad88a' : P.health > 25 ? '#e8a020' : '#e84040';
  E.mission.textContent = G.missionText + (P.hasPistol ? '  •  PISTOL' : '');
  if (G.toast) { E.toast.textContent = G.toast; E.toast.style.opacity = '1'; G.toastT = 3; G.toast = ''; }
  if (G.toastT > 0) {
    G.toastT -= 1 / 60;
    if (G.toastT <= 0) E.toast.style.opacity = '0';
  }
}
