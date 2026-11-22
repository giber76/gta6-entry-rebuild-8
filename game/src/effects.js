// Visual effects for Solara Bay: explosions, smoke/fire, camera shake.
export function createEffects(G) {
  const T = window.THREE;
  const E = { list: [], shake: 0, flash: 0 };
  const smokeGeo = new T.SphereGeometry(0.7, 6, 5);
  const smokeMat = new T.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.55 });
  const fireMat = new T.MeshBasicMaterial({ color: 0xff7722, transparent: true, opacity: 0.85 });

  E.explode = function (x, z, big) {
    const s = big ? 1.6 : 1.0;
    const ball = new T.Mesh(new T.SphereGeometry(2.2 * s, 10, 8),
      new T.MeshBasicMaterial({ color: 0xffa020, transparent: true, opacity: 0.95 }));
    ball.position.set(x, 1.6, z); G.scene.add(ball);
    const light = new T.PointLight(0xff8820, 60, 40); light.position.set(x, 4, z); G.scene.add(light);
    E.list.push({ kind: 'boom', mesh: ball, light, life: 0.5, max: 0.5 });
    for (let i = 0; i < 10; i++) {
      const p = new T.Mesh(smokeGeo, smokeMat.clone());
      p.position.set(x + (Math.random() - 0.5) * 3, 1 + Math.random() * 2, z + (Math.random() - 0.5) * 3);
      p.userData.vy = 2 + Math.random() * 2; p.userData.vx = (Math.random() - 0.5) * 2; p.userData.vz = (Math.random() - 0.5) * 2;
      G.scene.add(p);
      E.list.push({ kind: 'smoke', mesh: p, life: 1.6, max: 1.6 });
    }
    E.shake = Math.max(E.shake, 0.55);
    if (G.audio) G.audio.explosion();
  };
  E.emitSmoke = function (x, z, burning) {
    const mat = burning ? fireMat.clone() : smokeMat.clone();
    const p = new T.Mesh(smokeGeo, mat);
    p.position.set(x, 1.6, z);
    p.userData.vy = 1.6 + Math.random(); p.userData.vx = (Math.random() - 0.5) * 0.6; p.userData.vz = (Math.random() - 0.5) * 0.6;
    G.scene.add(p);
    E.list.push({ kind: 'smoke', mesh: p, life: burning ? 0.7 : 1.2, max: 1.2 });
  };
  E.damageFlash = function () { E.flash = 0.35; };
  E.update = function (dt) {
    for (let i = E.list.length - 1; i >= 0; i--) {
      const e = E.list[i]; e.life -= dt;
      if (e.life <= 0) {
        G.scene.remove(e.mesh); if (e.light) G.scene.remove(e.light);
        E.list.splice(i, 1); continue;
      }
      const k = e.life / e.max;
      if (e.kind === 'boom') {
        e.mesh.scale.setScalar(1 + (1 - k) * 2.2);
        e.mesh.material.opacity = k; e.light.intensity = 60 * k;
      } else {
        e.mesh.position.y += e.mesh.userData.vy * dt;
        e.mesh.position.x += e.mesh.userData.vx * dt;
        e.mesh.position.z += e.mesh.userData.vz * dt;
        e.mesh.scale.setScalar(1 + (1 - k) * 1.6);
        e.mesh.material.opacity = 0.55 * k;
      }
    }
    E.shake = Math.max(0, E.shake - dt * 1.4);
    E.flash = Math.max(0, E.flash - dt);
  };
  E.shakeOffset = function () {
    if (E.shake <= 0) return [0, 0];
    return [(Math.random() - 0.5) * E.shake, (Math.random() - 0.5) * E.shake];
  };
  return E;
}
