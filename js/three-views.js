// رسومات ثلاثية الأبعاد — Three.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const GREEN = 0x1e4a38, GREEN2 = 0x2a6049, GOLD = 0xc39a5c, CREAM = 0xf5ece5;
export const STATUS_COLORS = { todo: 0x9bb3a6, doing: GOLD, review: 0x3c6e9c, done: 0x3f8f63, goal: 0xf5ece5 };

function base(container, { camPos = [0, 8, 18], controls = true, bg = null, bloom = false } = {}) {
  const w = container.clientWidth, h = container.clientHeight;
  const scene = new THREE.Scene();
  if (bg !== null) scene.background = new THREE.Color(bg);
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
  camera.position.set(...camPos);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !bloom });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.2);
  sun.position.set(8, 16, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30 });
  scene.add(sun);
  let ctl = null;
  if (controls) {
    ctl = new OrbitControls(camera, renderer.domElement);
    ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI / 2.05;
  }
  let composer = null;
  if (bloom) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.85, 0.55, 0.72));
    composer.addPass(new OutputPass());
  }
  const hooks = [];
  let raf, alive = true;
  const clock = new THREE.Clock();
  const loop = () => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    hooks.forEach((f) => f(t));
    ctl && ctl.update();
    composer ? composer.render() : renderer.render(scene, camera);
  };
  loop();
  const ro = new ResizeObserver(() => {
    const W = container.clientWidth, H = container.clientHeight;
    if (!W || !H) return;
    camera.aspect = W / H; camera.updateProjectionMatrix(); renderer.setSize(W, H); composer?.setSize(W, H);
  });
  ro.observe(container);
  const dispose = () => {
    alive = false; cancelAnimationFrame(raf); ro.disconnect();
    ctl && ctl.dispose(); renderer.dispose();
    scene.traverse((o) => { o.geometry?.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m?.dispose?.()); });
    renderer.domElement.remove();
  };
  return { scene, camera, renderer, controls: ctl, onFrame: (f) => hooks.push(f), dispose };
}

// تفاعل الفأرة: تلميح + نقر
function picking(ctx, objects, onHover, onClick) {
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  const tip = document.getElementById("tip");
  const el = ctx.renderer.domElement;
  let hovered = null;
  const pick = (e) => {
    const r = el.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(mouse, ctx.camera);
    return ray.intersectObjects(objects, false)[0]?.object || null;
  };
  el.addEventListener("pointermove", (e) => {
    const o = pick(e);
    if (hovered && hovered !== o) hovered.scale.setScalar(1);
    hovered = o;
    if (o) {
      o.scale.setScalar(1.08);
      tip.innerHTML = onHover(o.userData);
      tip.style.left = e.clientX + 14 + "px"; tip.style.top = e.clientY + 14 + "px";
      tip.classList.remove("hidden"); el.style.cursor = "pointer";
    } else { tip.classList.add("hidden"); el.style.cursor = ""; }
  });
  el.addEventListener("pointerleave", () => tip.classList.add("hidden"));
  el.addEventListener("click", (e) => { const o = pick(e); if (o && onClick) onClick(o.userData); });
}

function textSprite(text, { size = 0.8, color = "#ffffff", bg = "rgba(22,55,42,.85)" } = {}) {
  const c = document.createElement("canvas"), g = c.getContext("2d");
  const fs = 64; g.font = `700 ${fs}px Tajawal, sans-serif`;
  const w = Math.ceil(g.measureText(text).width) + 50; c.width = w; c.height = fs + 36;
  g.font = `700 ${fs}px Tajawal, sans-serif`;
  g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, c.width, c.height, 24); g.fill();
  g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle"; g.direction = "rtl";
  g.fillText(text, w / 2, c.height / 2 + 4);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  s.scale.set((size * c.width) / c.height, size, 1);
  s.renderOrder = 10;
  return s;
}

// ---------- خلفية شاشة الدخول: سنابل ذهبية تدور ----------
export function loginBackground(canvas) {
  const holder = canvas.parentElement;
  const ctx = base(holder, { camPos: [0, 0, 30], controls: false });
  canvas.remove(); ctx.renderer.domElement.style.position = "absolute"; ctx.renderer.domElement.style.inset = "0";
  const N = 1400, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const g = new THREE.Color(GOLD), c2 = new THREE.Color(0x7fb39a);
  for (let i = 0; i < N; i++) {
    const r = 8 + Math.random() * 22, a = Math.random() * Math.PI * 2, y = (Math.random() - 0.5) * 30;
    pos.set([Math.cos(a) * r, y, Math.sin(a) * r - 10], i * 3);
    (Math.random() > 0.35 ? g : c2).toArray(col, i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.18, vertexColors: true, transparent: true, opacity: 0.85 }));
  ctx.scene.add(pts);
  // أقواس مستوحاة من الشعار
  const arches = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(6 + i * 1.6, 0.18, 8, 80, Math.PI),
      new THREE.MeshStandardMaterial({ color: i % 2 ? GOLD : 0x3f8f63, metalness: 0.4, roughness: 0.4, transparent: true, opacity: 0.35 }));
    arches.add(m);
  }
  arches.position.set(0, -12, -14); ctx.scene.add(arches);
  ctx.onFrame((t) => { pts.rotation.y = t * 0.03; arches.rotation.y = Math.sin(t * 0.3) * 0.3; });
  return ctx.dispose;
}

// ---------- لوحة المدير: أعمدة المشاريع على شكل قوس الشعار ----------
export function projectsScene(container, projects, onClick) {
  const ctx = base(container, { camPos: [0, 9, 20] });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.MeshStandardMaterial({ color: 0x16372a, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; ctx.scene.add(floor);
  for (let i = 1; i <= 4; i++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(i * 3.6, i * 3.6 + 0.05, 96), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; ctx.scene.add(ring);
  }
  const pickables = [];
  const n = Math.max(projects.length, 1);
  projects.forEach((p, i) => {
    const a = Math.PI - (Math.PI * (i + 0.5)) / n; // قوس نصف دائري
    const R = 9, x = Math.cos(a) * R, z = -Math.sin(a) * R + 3;
    const H = 0.6 + (p.progress / 100) * 8;
    const ghost = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 8.6, 32), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 }));
    ghost.position.set(x, 4.3, z); ctx.scene.add(ghost);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, H, 32),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(p.color || "#c39a5c"), metalness: 0.35, roughness: 0.35, emissive: 0x111111 }));
    col.position.set(x, H / 2, z); col.castShadow = true;
    col.userData = p; pickables.push(col); ctx.scene.add(col);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.4, 6), new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.6, roughness: 0.3 }));
    cap.position.set(x, H + 0.7, z); ctx.scene.add(cap);
    const lbl = textSprite(`${p.name} — ${p.progress}%`, { size: 0.75 });
    lbl.position.set(x, H + 2.1, z); ctx.scene.add(lbl);
    ctx.onFrame((t) => { cap.rotation.y = t * 1.2 + i; });
  });
  if (!projects.length) { const s = textSprite("لا توجد مشاريع بعد", { size: 1 }); s.position.y = 2; ctx.scene.add(s); }
  ctx.controls.autoRotate = true; ctx.controls.autoRotateSpeed = 0.6;
  picking(ctx, pickables, (p) => `<b>${p.name}</b><br>الإنجاز: ${p.progress}%<br>المهام: ${p.done}/${p.total}`, onClick);
  return ctx.dispose;
}

// ---------- الخط الزمني ثلاثي الأبعاد (تصميم «النهر الزمني» المضيء) ----------
// items: {id, label, start, end, status, priority, lane, progress, overdue, tip}
// goals: {label, start, end, progress, tip}
export const TL_STATUS = { todo: 0x8fa39a, doing: 0xf2b544, review: 0x8b7cf6, done: 0x2fbf71 };
export const TL_PRIORITY = { high: 0xff4d4f, med: 0x3b82f6, low: 0xf5c518 };
export function timelineScene(container, items, lanes, onClick, { goals = [] } = {}) {
  const BG = 0x07140f;
  const ctx = base(container, { camPos: [-10, 26, 46], bloom: true });
  const { scene, camera, controls } = ctx;
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, 0.0105);
  scene.add(new THREE.HemisphereLight(0x9fe6c7, 0x0b1a14, 0.6));

  const DAY = 86400000, today = new Date(new Date().toDateString());
  const dates = [...items.flatMap((i) => [+i.start, +i.end]), ...goals.flatMap((g) => [+g.start, +g.end]), +today];
  const min = Math.min(...dates) - 4 * DAY, max = Math.max(...dates) + 6 * DAY;
  const days = (max - min) / DAY;
  const LEN = Math.max(50, Math.min(150, days * 0.75));
  const X = (d) => -LEN / 2 + ((+d - min) / (max - min)) * LEN;
  const GAP = 7, nL = Math.max(lanes.length, 1);
  const laneZ = (l) => (lanes.indexOf(l) - (nL - 1) / 2) * GAP;
  const zFront = (nL * GAP) / 2 + 1.5, zBack = -(nL * GAP) / 2 - 1.5; // الأمام = جهة الكاميرا

  // نجوم ذهبية وخضراء بالخلفية
  { const N = 900, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    const c1 = new THREE.Color(0xd8b57f), c2 = new THREE.Color(0x5fd3a0);
    for (let i = 0; i < N; i++) {
      pos.set([(Math.random() - 0.5) * LEN * 2.4, 6 + Math.random() * 60, (Math.random() - 0.5) * 220], i * 3);
      (Math.random() > 0.5 ? c1 : c2).toArray(col, i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.25, vertexColors: true, transparent: true, opacity: 0.7 }));
    scene.add(stars); ctx.onFrame((t) => (stars.rotation.y = Math.sin(t * 0.05) * 0.05)); }

  // أرضية زجاجية داكنة + شبكة
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(LEN + 40, nL * GAP + 40),
    new THREE.MeshStandardMaterial({ color: 0x0c2219, roughness: 0.35, metalness: 0.6 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.02; scene.add(floor);
  const grid = new THREE.GridHelper(Math.max(LEN + 40, nL * GAP + 40), Math.round((LEN + 40) / 2), 0x1f6b50, 0x123a2c);
  grid.material.transparent = true; grid.material.opacity = 0.35; scene.add(grid);

  const glow = (color, intensity = 1.6, opacity = 1) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, transparent: opacity < 1, opacity, roughness: 0.4 });

  // مسارات الأعضاء
  lanes.forEach((l, i) => {
    const z = laneZ(l);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(LEN + 6, 0.02, 0.08), glow(i % 2 ? 0x2a8f68 : 0xc39a5c, 0.9, 0.55));
    strip.position.set(0, 0.01, z); scene.add(strip);
    for (let x = -LEN / 2 - 7; x < LEN / 2; x += 32) {
      const lbl = textSprite("👤 " + l, { size: 1.25, bg: i % 2 ? "rgba(42,96,73,.92)" : "rgba(195,154,92,.95)" });
      lbl.position.set(x, 0.9, z - GAP * 0.32); scene.add(lbl);
    }
  });

  // محور الزمن الأمامي مع نبضة ضوء تجري عليه
  const axis = new THREE.Mesh(new THREE.BoxGeometry(LEN + 6, 0.05, 0.12), glow(0xd8b57f, 2.2));
  axis.position.set(0, 0.03, zFront); scene.add(axis);
  const runner = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), glow(0xfff1c9, 4));
  scene.add(runner);
  ctx.onFrame((t) => { const k = (t * 0.08) % 1; runner.position.set(-LEN / 2 - 3 + k * (LEN + 6), 0.25, zFront); });

  // علامات الأشهر والأسابيع
  const d0 = new Date(min); d0.setDate(1);
  for (let d = new Date(d0); +d <= max; d.setMonth(d.getMonth() + 1)) {
    if (+d < min) continue;
    const x = X(d);
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, zFront - zBack), glow(0xc39a5c, 1.2, 0.5));
    line.position.set(x, 0.02, (zFront + zBack) / 2); scene.add(line);
    const s = textSprite(d.toLocaleDateString("ar-SY-u-nu-latn", { month: "long", year: "numeric" }), { size: 1.4, bg: "rgba(10,30,22,.85)", color: "#f4e8d6" });
    s.position.set(x, 1, zFront + 3); scene.add(s);
  }
  for (let t = min - (min % (7 * DAY)); t <= max; t += 7 * DAY) {
    if (t < min) continue;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), glow(0xd8b57f, 1.5));
    tick.position.set(X(t), 0.15, zFront); scene.add(tick);
  }

  // بوابة «اليوم»
  const tx = X(today), R = (zFront - zBack) / 2 + 0.5;
  const portal = new THREE.Mesh(new THREE.TorusGeometry(R, 0.12, 16, 96, Math.PI), glow(0xff6b5b, 3));
  portal.rotation.y = Math.PI / 2; portal.position.set(tx, 0, (zFront + zBack) / 2); scene.add(portal);
  const veil = new THREE.Mesh(new THREE.CircleGeometry(R, 64, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xff6b5b, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }));
  veil.rotation.y = Math.PI / 2; veil.position.copy(portal.position); scene.add(veil);
  const tl = textSprite("اليوم", { size: 1.8, bg: "rgba(255,107,91,.95)" }); tl.position.set(tx, R + 1.4, (zFront + zBack) / 2); scene.add(tl);
  ctx.onFrame((t) => { const k = 1 + Math.sin(t * 2.2) * 0.02; portal.scale.set(k, k, k); veil.material.opacity = 0.05 + Math.sin(t * 2.2) * 0.03; });

  // الأهداف: أقواس ذهبية (مستوحاة من أقواس الشعار) تمتد على مدة الهدف
  const pick = [];
  goals.forEach((g, i) => {
    const x1 = X(g.start), x2 = Math.max(X(g.end), x1 + 1), r = (x2 - x1) / 2, z = zBack - 2 - i * 2.2;
    const ghost = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 10, 96, Math.PI), glow(0xc39a5c, 0.6, 0.35));
    ghost.position.set((x1 + x2) / 2, 0, z); scene.add(ghost);
    if (g.progress > 0) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(r, 0.16, 12, 96, Math.PI * (g.progress / 100)), glow(0xe8c27a, 2.6));
      arc.rotation.y = Math.PI; arc.position.copy(ghost.position); scene.add(arc);
    }
    const hit = new THREE.Mesh(new THREE.TorusGeometry(r, 0.6, 6, 48, Math.PI), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(ghost.position); hit.userData = g; pick.push(hit); scene.add(hit);
    const s = textSprite(`🎯 ${g.label} · ${g.progress}%`, { size: 1.3, bg: "rgba(195,154,92,.95)" });
    s.position.set((x1 + x2) / 2, r + 1, z); scene.add(s);
  });

  // المهام: كبسولات زجاجية يمتلئ داخلها بنسبة الإنجاز، قاعدتها بلون الأولوية
  const labels = [];
  const H = 3.4;
  const slots = {};
  items.sort((a, b) => +a.end - +b.end).forEach((it, idx) => {
    const x1 = X(it.start), x2 = Math.max(X(it.end), x1 + 0.3);
    const key = it.lane; slots[key] ||= [];
    let off = 0; const near = slots[key].filter((x) => Math.abs(x - x2) < 2.2).length;
    off = [0, 1.8, -1.8, 3.2, -3.2][near % 5]; slots[key].push(x2);
    const z = laneZ(it.lane) + off;
    const sc = TL_STATUS[it.status] ?? 0xffffff, pc = it.status === "done" ? 0x2fbf71 : TL_PRIORITY[it.priority] ?? 0x3b82f6;
    // شريط المدة على الأرض
    const dur = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.3, x2 - x1), 0.06, 0.7), glow(sc, 0.9, 0.75));
    dur.position.set((x1 + x2) / 2, 0.04, z); scene.add(dur);
    const group = new THREE.Group(); group.position.set(x2, 0, z); scene.add(group);
    // قاعدة بلون الأولوية
    const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.26, 48), glow(pc, 1.8));
    baseRing.position.y = 0.13; group.add(baseRing);
    // الكبسولة الزجاجية
    const glass = new THREE.Mesh(new THREE.CapsuleGeometry(0.72, H, 8, 28),
      new THREE.MeshPhysicalMaterial({ color: 0xd9fff0, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.1, clearcoat: 1, depthWrite: false }));
    glass.position.y = 0.75 + H / 2 + 0.3; group.add(glass);
    // السائل الداخلي = نسبة الإنجاز
    const fillH = Math.max(0.15, (H + 0.9) * (it.progress / 100));
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, fillH, 32), glow(sc, 2.2));
    fill.position.y = 0.42 + fillH / 2; group.add(fill);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), glow(pc, 3)); cap.position.y = 0.75 + H + 1.4; group.add(cap);
    if (it.status === "done") {
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), glow(0xffd36b, 3.5));
      star.position.y = H + 3; group.add(star);
      ctx.onFrame((t) => { star.rotation.y = t * 2; star.position.y = H + 3 + Math.sin(t * 2 + idx) * 0.15; });
    }
    if (it.overdue) ctx.onFrame((t) => (baseRing.material.emissiveIntensity = 1 + Math.abs(Math.sin(t * 4)) * 3));
    glass.userData = fill.userData = baseRing.userData = it; pick.push(glass, fill, baseRing);
    const lbl = textSprite(it.label.length > 26 ? it.label.slice(0, 25) + "…" : it.label, { size: 0.95, bg: "rgba(8,24,18,.88)", color: "#f4e8d6" });
    lbl.position.set(0, H + 4.2, 0); group.add(lbl); labels.push(lbl);
    // ظهور متتابع + تمايل خفيف
    group.scale.setScalar(0.001);
    const delay = 0.4 + idx * 0.06;
    ctx.onFrame((t) => {
      if (t > delay && group.scale.x < 1) group.scale.setScalar(Math.min(1, group.scale.x + 0.05));
      glass.position.y = 0.75 + H / 2 + 0.3 + Math.sin(t * 1.4 + idx) * 0.08;
    });
  });
  if (!items.length && !goals.length) { const s = textSprite("لا توجد مهام بتواريخ بعد", { size: 1.4 }); s.position.y = 3; scene.add(s); }

  // كاميرا: حركة دخول سينمائية + تنقل سلس
  controls.target.set(0, 1, 0); controls.maxDistance = LEN * 1.6; controls.minDistance = 6;
  const ovCam = () => new THREE.Vector3(-LEN * 0.08, 13 + nL * 1.5, LEN * 0.3 + nL * 4.5), ovTgt = () => new THREE.Vector3(-LEN * 0.05, 1.5, -2);
  let goalCam = ovCam(), goalTgt = ovTgt(), moving = true;
  camera.position.set(-LEN * 0.6, 60, LEN * 1.1);
  ctx.onFrame(() => {
    if (!moving) return;
    camera.position.lerp(goalCam, 0.045); controls.target.lerp(goalTgt, 0.045);
    if (camera.position.distanceTo(goalCam) < 0.05) moving = false;
  });
  controls.addEventListener("start", () => (moving = false));
  const fly = (cam, tgt) => { goalCam = cam; goalTgt = tgt; moving = true; };

  picking(ctx, pick, (it) => it.tip, onClick);
  return {
    dispose: ctx.dispose,
    focusToday: () => fly(new THREE.Vector3(tx - 10, 12, zFront + 16), new THREE.Vector3(tx + 4, 2, 0)),
    overview: () => fly(ovCam(), ovTgt()),
    top: () => fly(new THREE.Vector3(0, LEN * 0.75, 2), new THREE.Vector3(0, 0, 0)),
    toggleLabels: () => { const v = !labels[0]?.visible; labels.forEach((l) => (l.visible = v)); return v; },
  };
}
