// رسومات ثلاثية الأبعاد — Three.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const GREEN = 0x1e4a38, GREEN2 = 0x2a6049, GOLD = 0xc39a5c, CREAM = 0xf5ece5;
export const STATUS_COLORS = { todo: 0x9bb3a6, doing: GOLD, review: 0x3c6e9c, done: 0x3f8f63, goal: 0xf5ece5 };

function base(container, { camPos = [0, 8, 18], controls = true, bg = null, bloom = false, lights = true } = {}) {
  const w = container.clientWidth, h = container.clientHeight;
  const scene = new THREE.Scene();
  if (bg !== null) scene.background = new THREE.Color(bg);
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.5, 1200);
  camera.position.set(...camPos);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !bloom });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);
  if (lights) {
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xfff1dc, 1.2);
    sun.position.set(8, 16, 10); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30 });
    scene.add(sun);
  }
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

// ---------- لوحة المدير: حقل قمح وأشجار زيتون — كل شجرة مشروع ----------
// project: {id,name,progress,done,total,overdue,color}
function cardSprite(title, pct, accent = "#c39a5c") {
  const c = document.createElement("canvas"), g = c.getContext("2d");
  const W = 560, Hc = 170; c.width = W; c.height = Hc;
  g.fillStyle = "rgba(20,48,36,.92)"; g.beginPath(); g.roundRect(6, 6, W - 12, Hc - 34, 30); g.fill();
  g.strokeStyle = accent; g.lineWidth = 5; g.stroke();
  g.beginPath(); g.moveTo(W / 2 - 22, Hc - 30); g.lineTo(W / 2 + 22, Hc - 30); g.lineTo(W / 2, Hc - 6); g.closePath(); g.fillStyle = "rgba(20,48,36,.92)"; g.fill();
  g.direction = "rtl"; g.textAlign = "center"; g.fillStyle = "#fff"; g.font = "800 46px Tajawal, sans-serif";
  const t = title.length > 22 ? title.slice(0, 21) + "…" : title;
  g.fillText("🫒 " + t, W / 2, 62);
  const bx = 50, by = 88, bw = W - 170, bh = 22;
  g.fillStyle = "rgba(255,255,255,.18)"; g.beginPath(); g.roundRect(bx, by, bw, bh, 11); g.fill();
  const grd = g.createLinearGradient(bx, 0, bx + bw, 0); grd.addColorStop(0, "#d8b57f"); grd.addColorStop(1, accent);
  g.fillStyle = grd; g.beginPath(); g.roundRect(bx + bw * (1 - pct / 100), by, Math.max(bw * pct / 100, 12), bh, 11); g.fill();
  g.fillStyle = "#f4e8d6"; g.font = "800 38px Tajawal, sans-serif"; g.textAlign = "left"; g.direction = "ltr";
  g.fillText(pct + "%", bx + bw + 16, by + 20);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(4.6, 4.6 * Hc / W, 1); s.renderOrder = 10;
  return s;
}
function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const hashStr = (str) => [...String(str)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7) >>> 0;

export function farmScene(container, projects, { onSelect, onHover } = {}) {
  const ctx = base(container, { camPos: [0, 15, 40], lights: false });
  const { scene, camera, renderer, controls } = ctx;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const U = { uTime: { value: 0 } };
  ctx.onFrame((t) => (U.uTime.value = t));

  // سماء متدرجة دافئة
  { const c = document.createElement("canvas"); c.width = 4; c.height = 256; const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#7fb2d6"); gr.addColorStop(0.45, "#cfe0e3"); gr.addColorStop(0.75, "#f6e3bd"); gr.addColorStop(1, "#f2cf96");
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; scene.background = tx; }
  scene.fog = new THREE.Fog(0xf0dcb4, 85, 190);
  scene.add(new THREE.HemisphereLight(0xfff3d6, 0x4d5a2a, 0.85));
  const sun = new THREE.DirectionalLight(0xffdca8, 2.1);
  sun.position.set(-34, 46, 26); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004;
  Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 45, bottom: -45, near: 1, far: 160 });
  scene.add(sun);

  // تضاريس: حقل مستوٍ تقريباً + تلال بعيدة
  const FX = 42, FZ = 27; // نصف أبعاد الحقل
  const Hf = (x, z) => {
    let h = 0.35 * Math.sin(x * 0.09) * Math.cos(z * 0.08) + 0.18 * Math.sin(x * 0.23 + z * 0.17);
    const d = Math.max(Math.abs(x) / (FX + 6), Math.abs(z) / (FZ + 6));
    if (d > 1) h += Math.pow((d - 1) * 9, 1.6) * (0.9 + 0.5 * Math.sin(x * 0.07 + z * 0.05));
    return h;
  };
  { const geo = new THREE.PlaneGeometry(240, 200, 180, 150); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, cols = new Float32Array(p.count * 3), c = new THREE.Color();
    const soil = new THREE.Color(0xb8925a), grass = new THREE.Color(0x7e9442), hill = new THREE.Color(0x6f8a45), far = new THREE.Color(0xa8b07a);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = Hf(x, z); p.setY(i, h);
      const inField = Math.abs(x) < FX + 2 && Math.abs(z) < FZ + 2;
      const n = 0.5 + 0.5 * Math.sin(x * 0.5) * Math.cos(z * 0.43);
      if (inField) c.copy(soil).lerp(grass, 0.18 + n * 0.25); else c.copy(grass).lerp(hill, Math.min(1, h / 6)).lerp(far, Math.min(1, Math.max(0, (Math.hypot(x, z) - 70) / 50)));
      c.toArray(cols, i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    ground.receiveShadow = true; scene.add(ground); }

  // مواقع الأشجار (صفوف متناوبة)
  const n = projects.length, spots = [];
  if (n) {
    const cols = Math.min(n, Math.max(1, Math.ceil(Math.sqrt(n * 2.2)))), rows = Math.ceil(n / cols);
    const sx = Math.min(22, (FX * 2 - 14) / Math.max(cols - 1, 1)), sz = Math.min(18, (FZ * 2 - 14) / Math.max(rows - 1, 1));
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), cIn = i % cols, inRow = Math.min(cols, n - r * cols);
      const x = (cIn - (inRow - 1) / 2) * sx + (r % 2 ? sx * 0.25 : 0), z = (r - (rows - 1) / 2) * sz;
      spots.push([x, z]);
    }
  }
  const clear = (x, z) => spots.some(([a, b]) => Math.hypot(x - a, z - b) < 6.4) || Math.abs(z - FZ + 1) < 1.6 || Math.abs(x) < 1.3;

  // سنابل القمح (Instanced + ريح بالـ shader)
  { const stalk = new THREE.CylinderGeometry(0.025, 0.04, 1.35, 3); stalk.translate(0, 0.675, 0);
    const ear = new THREE.CylinderGeometry(0.075, 0.03, 0.42, 5); ear.translate(0, 1.55, 0);
    const awn = new THREE.ConeGeometry(0.05, 0.3, 3); awn.translate(0, 1.88, 0);
    const geo = mergeGeometries([stalk.toNonIndexed(), ear.toNonIndexed(), awn.toNonIndexed()]);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.85, color: 0xffffff });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = U.uTime;
      sh.vertexShader = "uniform float uTime;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
        vec3 ip = vec3(0.0);
        #ifdef USE_INSTANCING
          ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #endif
        float bend = smoothstep(0.0, 2.0, position.y); bend *= bend;
        float gust = sin(uTime * 0.6 + ip.x * 0.06) * 0.5 + 0.5;
        float w = sin(uTime * 1.7 + ip.x * 0.32 + ip.z * 0.21) * (0.12 + 0.16 * gust) + sin(uTime * 3.3 + ip.x * 1.7 + ip.z) * 0.035;
        transformed.x += w * bend; transformed.z += w * 0.45 * bend;`);
    };
    const N = 9000, inst = new THREE.InstancedMesh(geo, mat, N), m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), col = new THREE.Color();
    const tones = [0xe2bf62, 0xd6ad4b, 0xeacb7a, 0xc99a3c, 0xdab55a];
    const R = rng(42); let k = 0, tries = 0;
    while (k < N && tries < N * 4) {
      tries++;
      const x = (R() * 2 - 1) * FX, z = (R() * 2 - 1) * FZ;
      if (clear(x, z)) continue;
      const s = 0.75 + R() * 0.5; sc.set(s, s * (0.85 + R() * 0.35), s);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
      m.compose(new THREE.Vector3(x, Hf(x, z) - 0.05, z), q, sc); inst.setMatrixAt(k, m);
      col.setHex(tones[Math.floor(R() * tones.length)]).offsetHSL(0, 0, (R() - 0.5) * 0.08); inst.setColorAt(k, col);
      k++;
    }
    inst.count = k; inst.receiveShadow = true; scene.add(inst); }

  // سياج خشبي حول الحقل
  { const postG = new THREE.BoxGeometry(0.25, 1.4, 0.25), railG = new THREE.BoxGeometry(1, 0.12, 0.1);
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.95 });
    const posts = [], rails = [];
    const edge = (x1, z1, x2, z2) => { const L = Math.hypot(x2 - x1, z2 - z1), steps = Math.round(L / 3.2);
      for (let i = 0; i <= steps; i++) { const t = i / steps, x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t; posts.push([x, z]);
        if (i < steps) { const t2 = (i + 0.5) / steps; rails.push([x1 + (x2 - x1) * t2, z1 + (z2 - z1) * t2, Math.atan2(z2 - z1, x2 - x1), L / steps]); } } };
    const ex = FX + 2.5, ez = FZ + 2.5;
    edge(-ex, -ez, ex, -ez); edge(ex, -ez, ex, ez); edge(-ex, -ez, -ex, ez); edge(-ex, ez, -2.2, ez); edge(2.2, ez, ex, ez);
    const P = new THREE.InstancedMesh(postG, wood, posts.length), Rm = new THREE.InstancedMesh(railG, wood, rails.length * 2), m = new THREE.Matrix4();
    posts.forEach(([x, z], i) => { m.makeTranslation(x, Hf(x, z) + 0.6, z); P.setMatrixAt(i, m); });
    rails.forEach(([x, z, a, L], i) => { for (const [j, y] of [[0, 0.55], [1, 1.05]]) {
      m.compose(new THREE.Vector3(x, Hf(x, z) + y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a), new THREE.Vector3(L, 1, 1)); Rm.setMatrixAt(i * 2 + j, m); } });
    P.castShadow = Rm.castShadow = true; scene.add(P, Rm); }

  // ممر ترابي في المنتصف
  { const path = new THREE.Mesh(new THREE.PlaneGeometry(2.4, FZ * 2 + 6), new THREE.MeshStandardMaterial({ color: 0xc9a46e, roughness: 1 }));
    path.rotation.x = -Math.PI / 2; path.position.set(0, 0.42, 1); path.receiveShadow = true; scene.add(path); }

  // قناطر حجرية في الخلفية (من شعار الأكاديمية)
  { const shape = new THREE.Shape(); const L = 70, H = 9;
    shape.moveTo(-L / 2, 0); shape.lineTo(L / 2, 0); shape.lineTo(L / 2, H); shape.lineTo(-L / 2, H); shape.lineTo(-L / 2, 0);
    const n2 = 11, w = L / n2;
    for (let i = 0; i < n2; i++) { const cx = -L / 2 + w * (i + 0.5), hole = new THREE.Path(), r = w * 0.32;
      hole.moveTo(cx - r, 0.01); hole.lineTo(cx - r, H * 0.5); hole.absarc(cx, H * 0.5, r, Math.PI, 0, true); hole.lineTo(cx + r, 0.01); hole.lineTo(cx - r, 0.01); shape.holes.push(hole); }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 2.2, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15, bevelSegments: 1 });
    const aq = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xdcc7a1, roughness: 0.9 }));
    aq.position.set(0, Hf(0, -FZ - 22) - 0.5, -FZ - 22); aq.castShadow = aq.receiveShadow = true; scene.add(aq); }

  // أشجار سرو بعيدة
  { const g = new THREE.ConeGeometry(1, 1, 7), mat = new THREE.MeshStandardMaterial({ color: 0x3e5a2e, roughness: 1, flatShading: true });
    const R = rng(7), list = [];
    for (let i = 0; i < 70; i++) { const a = R() * Math.PI * 2, r = 58 + R() * 40, x = Math.cos(a) * r * 1.2, z = Math.sin(a) * r * 0.85;
      if (z > 10 && Math.abs(x) < 50) continue; list.push([x, z, 1.2 + R() * 0.8, 6 + R() * 6]); }
    const inst = new THREE.InstancedMesh(g, mat, list.length), m = new THREE.Matrix4();
    list.forEach(([x, z, r, h], i) => { m.compose(new THREE.Vector3(x, Hf(x, z) + h / 2 - 0.3, z), new THREE.Quaternion(), new THREE.Vector3(r, h, r)); inst.setMatrixAt(i, m); });
    inst.castShadow = true; scene.add(inst); }

  // غيوم تنساب
  { const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true, transparent: true, opacity: 0.92 });
    const R = rng(3);
    for (let i = 0; i < 7; i++) { const cl = new THREE.Group();
      for (let j = 0; j < 5; j++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(2 + R() * 2.2, 1), cm); b.position.set((j - 2) * 2.4, R() * 1.2, R() * 2); b.scale.y = 0.65; cl.add(b); }
      const z = -70 + R() * 60, y = 30 + R() * 14, sp = 0.6 + R() * 0.8, x0 = -120 + R() * 240;
      cl.position.set(x0, y, z); scene.add(cl);
      ctx.onFrame((t) => { cl.position.x = ((x0 + t * sp + 130) % 260) - 130; }); } }

  // ذرّات لقاح ذهبية
  { const N = 260, pos = new Float32Array(N * 3), R = rng(11);
    for (let i = 0; i < N; i++) pos.set([(R() * 2 - 1) * FX, 1 + R() * 7, (R() * 2 - 1) * FZ], i * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffe6a0, size: 0.16, transparent: true, opacity: 0.8, depthWrite: false }));
    scene.add(pts); ctx.onFrame((t) => { pts.position.y = Math.sin(t * 0.4) * 0.6; pts.rotation.y = Math.sin(t * 0.05) * 0.04; }); }

  // ---- أشجار الزيتون ----
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7c6a54, roughness: 1, flatShading: true });
  const leafTones = [0x7a8a48, 0x6a7b3c, 0x8d9d5e, 0x95a56e, 0x5f7036];
  const trees = [], hits = [];
  projects.forEach((p, i) => {
    const [x, z] = spots[i], y0 = Hf(x, z), R = rng(hashStr(p.id || p.name) + 1);
    const prog = Math.max(0, Math.min(100, p.progress || 0));
    const growth = 1.0 + 0.75 * (prog / 100); // شجيرة صغيرة ← شجرة معمّرة
    const tree = new THREE.Group(); tree.position.set(x, y0, z); scene.add(tree);
    const body = new THREE.Group(); body.scale.setScalar(growth); tree.add(body);
    // جذع ملتوٍ
    const tg = new THREE.CylinderGeometry(0.32, 0.62, 3.2, 9, 8); tg.translate(0, 1.6, 0);
    const tp = tg.attributes.position;
    for (let v = 0; v < tp.count; v++) { const yy = tp.getY(v), a = yy * 0.9, xx = tp.getX(v), zz = tp.getZ(v);
      tp.setXYZ(v, xx * Math.cos(a) - zz * Math.sin(a) + Math.sin(yy * 1.4) * 0.22, yy, xx * Math.sin(a) + zz * Math.cos(a) + Math.cos(yy * 1.1) * 0.15); }
    tg.computeVertexNormals();
    const trunk = new THREE.Mesh(tg, trunkMat); trunk.castShadow = true; body.add(trunk);
    for (let b = 0; b < 3; b++) { const bg = new THREE.CylinderGeometry(0.12, 0.24, 2, 6); bg.translate(0, 1, 0);
      const br = new THREE.Mesh(bg, trunkMat); br.position.set(0, 2.8, 0); br.rotation.set(0.55 + R() * 0.3, b * 2.1 + R(), 0, "YXZ"); br.castShadow = true; body.add(br); }
    // تاج متعدد الكتل
    const canopy = new THREE.Group(); canopy.position.y = 4.1; body.add(canopy);
    const leafMats = [];
    const blobs = 9 + Math.floor(R() * 4);
    for (let b = 0; b < blobs; b++) {
      const r = 1.05 + R() * 0.8, g = new THREE.IcosahedronGeometry(r, 1), gp = g.attributes.position;
      for (let v = 0; v < gp.count; v++) gp.setXYZ(v, gp.getX(v) * (0.9 + R() * 0.2), gp.getY(v) * (0.75 + R() * 0.15), gp.getZ(v) * (0.9 + R() * 0.2));
      g.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({ color: leafTones[Math.floor(R() * leafTones.length)], roughness: 0.9, flatShading: true, emissive: 0x000000 });
      leafMats.push(mat);
      const m = new THREE.Mesh(g, mat); const a = (b / blobs) * Math.PI * 2 + R() * 0.5, rr = b === 0 ? 0 : 1.2 + R() * 1.1;
      m.position.set(Math.cos(a) * rr, (R() - 0.3) * 1.3 + (b === 0 ? 0.6 : 0), Math.sin(a) * rr); m.castShadow = true; canopy.add(m);
    }
    // ثمار الزيتون = المهام المنجزة
    const olives = Math.min(60, Math.round((p.done || 0) * 3 + prog * 0.25));
    if (olives) { const og = new THREE.SphereGeometry(0.13, 8, 6); og.scale(1, 1.3, 1);
      const ripe = new THREE.MeshStandardMaterial({ color: 0x3b2440, roughness: 0.35, metalness: 0.1 }), green = new THREE.MeshStandardMaterial({ color: 0x8a9a2c, roughness: 0.4 });
      for (let o = 0; o < olives; o++) { const a = R() * Math.PI * 2, e = (R() - 0.35) * 1.2, rr = 2.1 + R() * 0.5;
        const ol = new THREE.Mesh(og, R() < prog / 100 ? ripe : green); ol.position.set(Math.cos(a) * rr * Math.cos(e), Math.sin(e) * 1.6 + 0.3, Math.sin(a) * rr * Math.cos(e)); canopy.add(ol); } }
    // حلقة الحالة
    const ringColor = prog >= 100 ? 0x2fbf71 : p.overdue ? 0xff4d4f : 0xe8c27a;
    const ring = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.8, 64), new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; tree.add(ring);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(5.9, 48), new THREE.MeshStandardMaterial({ color: 0x9a7448, roughness: 1 }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.03; disc.receiveShadow = true; tree.add(disc);
    if (prog >= 100) { const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.45), new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0xc08a20, emissiveIntensity: 1.2 }));
      star.scale.setScalar(1.6); star.position.y = 9.4 * growth; tree.add(star); ctx.onFrame((t) => { star.rotation.y = t * 1.8; star.position.y = 9.4 * growth + Math.sin(t * 2) * 0.25; }); }
    if (p.overdue) { const flag = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), trunkMat); pole.position.y = 1.2;
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshStandardMaterial({ color: 0xe5484d, side: THREE.DoubleSide, emissive: 0x551010 }));
      cloth.position.set(0.47, 2.1, 0); flag.add(pole, cloth); flag.position.set(3.4, 0, 2.6); flag.scale.setScalar(1.5); tree.add(flag);
      ctx.onFrame((t) => (cloth.rotation.y = Math.sin(t * 3 + i) * 0.35)); }
    const label = cardSprite(p.name, prog, prog >= 100 ? "#2fbf71" : p.overdue ? "#ff6b6b" : "#e8c27a");
    label.position.y = 7.6 * growth + 2.2; label.scale.multiplyScalar(1.5); tree.add(label);
    // هدف النقر (غير مرئي)
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 8.5 * growth + 3, 12), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = (8.5 * growth + 3) / 2; hit.userData = p; tree.add(hit); hits.push(hit);
    const ph = R() * 6;
    ctx.onFrame((t) => {
      canopy.rotation.z = Math.sin(t * 0.9 + ph) * 0.025; canopy.rotation.x = Math.cos(t * 0.7 + ph) * 0.02;
      ring.material.opacity = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(t * (p.overdue ? 4 : 2) + ph));
      const target = tree.userData.hover || tree.userData.selected ? 1.18 : 1; const s = ring.scale.x + (target - ring.scale.x) * 0.12; ring.scale.set(s, s, s);
      const e = tree.userData.hover || tree.userData.selected ? 0.16 : 0; leafMats.forEach((m) => m.emissive.setRGB(e * 0.9, e * 0.75, e * 0.2));
    });
    trees.push({ p, tree, x, z, y0, growth });
  });
  if (!n) { const s = textSprite("🌱 لا توجد مشاريع بعد — ازرع أول شجرة من «＋ مشروع جديد»", { size: 1.6 }); s.position.set(0, 4, 0); scene.add(s); }

  // ---- الكاميرا: حدود ثابتة تمنع ضياع المشهد ----
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 14; controls.maxDistance = 80;
  controls.minPolarAngle = 0.3; controls.maxPolarAngle = 1.42;
  controls.screenSpacePanning = false; controls.panSpeed = 0.7; controls.zoomSpeed = 0.8;
  controls.target.set(0, 5, -4);
  const clampT = () => { const t = controls.target; t.x = Math.max(-FX, Math.min(FX, t.x)); t.z = Math.max(-FZ, Math.min(FZ, t.z)); t.y = Math.max(1, Math.min(9, t.y)); };
  controls.addEventListener("change", clampT);
  controls.autoRotate = true; controls.autoRotateSpeed = 0.35;
  let idle; controls.addEventListener("start", () => { controls.autoRotate = false; clearTimeout(idle); });
  controls.addEventListener("end", () => { clearTimeout(idle); idle = setTimeout(() => { if (!selected) controls.autoRotate = true; }, 20000); });
  const home = { cam: new THREE.Vector3(0, 15, 40), tgt: new THREE.Vector3(0, 5, -4) };
  let fly = null;
  ctx.onFrame(() => { if (!fly) return; camera.position.lerp(fly.cam, 0.06); controls.target.lerp(fly.tgt, 0.06); if (camera.position.distanceTo(fly.cam) < 0.08) fly = null; });
  const flyTo = (cam, tgt) => { fly = { cam, tgt }; controls.autoRotate = false; };

  // ---- التفاعل ----
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), el = renderer.domElement, tip = document.getElementById("tip");
  let hovered = null, selected = null, downAt = null;
  const pick = (e) => { const r = el.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera); const h = ray.intersectObjects(hits, false)[0]; return h ? trees.find((t) => t.p === h.object.userData) : null; };
  el.addEventListener("pointermove", (e) => {
    const t = pick(e);
    if (hovered && hovered !== t) hovered.tree.userData.hover = false;
    hovered = t;
    if (t) { t.tree.userData.hover = true; el.style.cursor = "pointer";
      tip.innerHTML = onHover ? onHover(t.p) : t.p.name; tip.style.left = e.clientX + 14 + "px"; tip.style.top = e.clientY + 14 + "px"; tip.classList.remove("hidden"); }
    else { el.style.cursor = ""; tip.classList.add("hidden"); }
  });
  el.addEventListener("pointerleave", () => { tip.classList.add("hidden"); if (hovered) hovered.tree.userData.hover = false; hovered = null; });
  el.addEventListener("pointerdown", (e) => (downAt = [e.clientX, e.clientY]));
  el.addEventListener("pointerup", (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return; // سحب وليس نقرة
    const t = pick(e); select(t ? t.p.id : null, true);
  });
  function select(id, notify) {
    if (selected) selected.tree.userData.selected = false;
    selected = trees.find((t) => t.p.id === id) || null;
    if (selected) { const { x, z, growth } = selected; selected.tree.userData.selected = true;
      flyTo(new THREE.Vector3(x + 12, 7 + growth * 4, z + 20), new THREE.Vector3(x, 4 * growth, z)); }
    if (notify && onSelect) onSelect(selected ? selected.p : null);
  }
  return {
    dispose: () => { clearTimeout(idle); tip.classList.add("hidden"); ctx.dispose(); },
    reset: () => { select(null, true); flyTo(home.cam.clone(), home.tgt.clone()); },
    select: (id) => select(id, false),
    tour: () => { select(null, true); fly = null; controls.autoRotate = !controls.autoRotate; return controls.autoRotate; },
  };
}

// ---------- الخط الزمني ثلاثي الأبعاد: «طريق الإنجاز» بدبابيس بالونية (ألوان الهوية) ----------
// items: {id, label, who, start, end, status, priority, progress, overdue, tip}
// goals: {label, start, end, progress, tip}
export const TL_COLORS = { todo: "#9bb3a6", doing: "#c39a5c", review: "#4f9a72", done: "#1e4a38", goal: "#e3c18a", overdue: "#d9534f" };
export const TL_PRIO = { high: "#d9534f", med: "#3c7fc4", low: "#e8b923" };
function pinCard(lines, accent) {
  const c = document.createElement("canvas"), g = c.getContext("2d"), W = 620, H = 210; c.width = W; c.height = H;
  g.shadowColor = "rgba(30,74,56,.25)"; g.shadowBlur = 18; g.shadowOffsetY = 6;
  g.fillStyle = "#fffdf9"; g.beginPath(); g.roundRect(12, 10, W - 24, H - 30, 26); g.fill();
  g.shadowColor = "transparent"; g.fillStyle = accent; g.beginPath(); g.roundRect(W - 34, 10, 22, H - 30, [0, 26, 26, 0]); g.fill();
  g.direction = "rtl"; g.textAlign = "right";
  const [t1, t2, t3] = lines, x = W - 52;
  g.fillStyle = "#1e4a38"; g.font = "800 46px Tajawal, sans-serif"; g.fillText(t1.length > 24 ? t1.slice(0, 23) + "…" : t1, x, 64);
  g.fillStyle = "#6c7a72"; g.font = "600 34px Tajawal, sans-serif"; g.fillText(t2 || "", x, 112);
  g.fillStyle = accent; g.font = "800 34px Tajawal, sans-serif"; g.fillText(t3 || "", x, 158);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(8.4, 8.4 * H / W, 1); sp.renderOrder = 6; return sp;
}
function pinFace(top, bottom, color) {
  const c = document.createElement("canvas"), g = c.getContext("2d"), S = 256; c.width = c.height = S;
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 6, 0, Math.PI * 2); g.fill();
  g.lineWidth = 10; g.strokeStyle = color; g.globalAlpha = 0.25; g.stroke(); g.globalAlpha = 1;
  g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle"; g.direction = "rtl";
  g.font = `800 ${bottom ? 92 : 110}px Tajawal, sans-serif`; g.fillText(top, S / 2, bottom ? S / 2 - 22 : S / 2 + 6);
  if (bottom) { g.font = "700 46px Tajawal, sans-serif"; g.fillText(bottom, S / 2, S / 2 + 62); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sp.scale.set(1.18, 1.18, 1); sp.renderOrder = 5; return sp;
}
function softShadow() {
  const c = document.createElement("canvas"), g = c.getContext("2d"); c.width = c.height = 128;
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "rgba(30,50,40,.45)"); gr.addColorStop(1, "rgba(30,50,40,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; return m;
}
export function timelineScene(container, items, lanes, onClick, { goals = [] } = {}) {
  const ctx = base(container, { camPos: [0, 30, 60], lights: false });
  const { scene, camera, renderer, controls } = ctx;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  { const c = document.createElement("canvas"); c.width = 4; c.height = 256; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#e9efe8"); gr.addColorStop(0.55, "#f7f0e7"); gr.addColorStop(1, "#f1e4d2"); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; }
  scene.fog = new THREE.Fog(0xf3eadf, 120, 320);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9c7ad, 1.15));
  const sun = new THREE.DirectionalLight(0xfff2dc, 1.6);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.radius = 4;
  scene.add(sun, sun.target);

  const DAY = 86400000, today = new Date(new Date().toDateString());
  const dates = [...items.flatMap((i) => [+i.start, +i.end]), ...goals.flatMap((g) => [+g.start, +g.end]), +today];
  const min = Math.min(...dates) - 3 * DAY, max = Math.max(...dates) + 5 * DAY, span = Math.max(max - min, 14 * DAY);
  const days = span / DAY;
  // طريق متعرّج يدخل إلى العمق (مثل الصورة)
  const LEN = Math.max(90, Math.min(260, days * 1.5));
  const turns = Math.max(2, Math.round(LEN / 34)), A = 14;
  const pts = [];
  for (let k = 0; k <= turns * 6; k++) { const t = k / (turns * 6); pts.push(new THREE.Vector3(Math.sin(t * Math.PI * turns) * A * (0.75 + 0.25 * Math.cos(t * 3)), 0, LEN / 2 - t * LEN)); }
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const W = 6.6, TH = 0.45, NS = 600, sp = curve.getSpacedPoints(NS);
  const frame = (u) => { const p = curve.getPointAt(u), t = curve.getTangentAt(u); const n = new THREE.Vector3(-t.z, 0, t.x).normalize(); return { p, t, n }; };
  const uOf = (d) => Math.max(0, Math.min(1, (+d - min) / span));

  // الأرض
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0xf2e8da, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  { const ring = new THREE.Mesh(new THREE.CircleGeometry(LEN * 0.75, 64), new THREE.MeshStandardMaterial({ color: 0xe9f0e6, roughness: 1, transparent: true, opacity: 0.85 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; ring.scale.set(0.75, 1, 1); ring.receiveShadow = true; scene.add(ring); }

  // جسم الطريق (شريط بسماكة)
  { const pos = [], col = [], idx = [], cTop = new THREE.Color(0xdcd6cd), cMid = new THREE.Color(0xe8e3db), cSide = new THREE.Color(0xb9ae9f);
    for (let i = 0; i <= NS; i++) {
      const u = i / NS, { p, n } = frame(u);
      const L = p.clone().addScaledVector(n, W / 2), R = p.clone().addScaledVector(n, -W / 2);
      pos.push(L.x, TH, L.z, R.x, TH, R.z, L.x, 0, L.z, R.x, 0, R.z);
      const c = cTop.clone().lerp(cMid, 0.5 + 0.5 * Math.sin(u * 40));
      [c, c, cSide, cSide].forEach((cc) => col.push(cc.r, cc.g, cc.b));
      if (i < NS) { const a = i * 4, b = a + 4;
        idx.push(a, b, a + 1, a + 1, b, b + 1);            // السطح
        idx.push(a + 2, b + 2, a, a, b + 2, b);            // الجانب الأيسر
        idx.push(a + 1, b + 1, a + 3, a + 3, b + 1, b + 3); } // الجانب الأيمن
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const road = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide }));
    road.castShadow = true; road.receiveShadow = true; scene.add(road);
    // حافتان بيضاوان + خط منقّط ذهبي
    const edge = (off, color, w) => { const pp = [], ii = [];
      for (let i = 0; i <= NS; i++) { const { p, n } = frame(i / NS), a = p.clone().addScaledVector(n, off - w / 2), b = p.clone().addScaledVector(n, off + w / 2);
        pp.push(a.x, TH + 0.012, a.z, b.x, TH + 0.012, b.z); if (i < NS) { const k = i * 2; ii.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
      const eg = new THREE.BufferGeometry(); eg.setAttribute("position", new THREE.Float32BufferAttribute(pp, 3)); eg.setIndex(ii); eg.computeVertexNormals();
      const m = new THREE.Mesh(eg, new THREE.MeshStandardMaterial({ color, roughness: 0.6, side: THREE.DoubleSide })); m.receiveShadow = true; scene.add(m); };
    edge(W / 2 - 0.28, 0xffffff, 0.16); edge(-W / 2 + 0.28, 0xffffff, 0.16);
    const nd = Math.floor(curve.getLength() / 2.2), dg = new THREE.BoxGeometry(0.16, 0.03, 0.9), dm = new THREE.MeshStandardMaterial({ color: 0xc39a5c, roughness: 0.5 });
    const dash = new THREE.InstancedMesh(dg, dm, nd), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i < nd; i++) { const { p, t } = frame((i + 0.5) / nd); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(t.x, t.z)); m4.compose(new THREE.Vector3(p.x, TH + 0.02, p.z), q, new THREE.Vector3(1, 1, 1)); dash.setMatrixAt(i, m4); }
    scene.add(dash); }

  // أشجار زيتون/سرو صغيرة للزينة على الجانبين
  { const R = rng(19), cone = new THREE.ConeGeometry(1, 1, 7), sph = new THREE.IcosahedronGeometry(1, 0), trunkG = new THREE.CylinderGeometry(0.12, 0.16, 1, 5);
    const mC = new THREE.MeshStandardMaterial({ color: 0x4f7a55, roughness: 0.9, flatShading: true }), mO = new THREE.MeshStandardMaterial({ color: 0x8a9a5b, roughness: 0.9, flatShading: true }), mT = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 1 });
    const list = [];
    for (let i = 0; i < 40; i++) { const u = R(), { p, n } = frame(u), side = R() < 0.5 ? -1 : 1, d = W / 2 + 11 + R() * 20; const x = p.x + n.x * d * side, z = p.z + n.z * d * side;
      if (sp.some((q) => Math.hypot(q.x - x, q.z - z) < W / 2 + 9)) continue; list.push([x, z, R()]); }
    list.forEach(([x, z, r]) => { const g = new THREE.Group(); g.position.set(x, 0, z); const s = 0.6 + r * 0.6;
      const tr = new THREE.Mesh(trunkG, mT); tr.scale.set(s, s * 1.2, s); tr.position.y = 0.6 * s; g.add(tr);
      const top = r < 0.5 ? new THREE.Mesh(cone, mC) : new THREE.Mesh(sph, mO);
      if (r < 0.5) { top.scale.set(0.9 * s, 3.2 * s, 0.9 * s); top.position.y = 2.6 * s; } else { top.scale.set(1.5 * s, 1.1 * s, 1.5 * s); top.position.y = 1.9 * s; }
      top.castShadow = true; tr.castShadow = true; g.add(top); scene.add(g); }); }

  // شواخص الأشهر
  { const d0 = new Date(min); d0.setDate(1); d0.setMonth(d0.getMonth() + 1);
    const stoneG = new THREE.BoxGeometry(0.9, 1.3, 0.5), capG = new THREE.BoxGeometry(1.0, 0.18, 0.6);
    const stoneM = new THREE.MeshStandardMaterial({ color: 0xece3d4, roughness: 0.9 }), capM = new THREE.MeshStandardMaterial({ color: 0x2a6049, roughness: 0.6 });
    for (let d = new Date(d0); +d <= max; d.setMonth(d.getMonth() + 1)) {
      const { p, n, t } = frame(uOf(d)), side = d.getMonth() % 2 ? 1 : -1, o = p.clone().addScaledVector(n, side * (W / 2 + 1.4));
      const st = new THREE.Mesh(stoneG, stoneM), cp = new THREE.Mesh(capG, capM); st.position.set(o.x, 0.65, o.z); cp.position.set(o.x, 1.35, o.z);
      st.rotation.y = cp.rotation.y = Math.atan2(t.x, t.z); st.castShadow = true; scene.add(st, cp);
      const lb = textSprite(d.toLocaleDateString("ar-SY-u-nu-latn", { month: "long", year: "numeric" }), { size: 0.85, bg: "rgba(30,74,56,.92)", color: "#f4e8d6" });
      lb.position.set(o.x, 2.3, o.z); scene.add(lb);
    } }

  // البداية والنهاية
  const gate = (u, text, color) => { const { p, n, t } = frame(u), g = new THREE.Group(); g.position.copy(p); g.rotation.y = Math.atan2(t.x, t.z);
    const pm = new THREE.MeshStandardMaterial({ color, roughness: 0.5 }), post = new THREE.CylinderGeometry(0.18, 0.22, 4.6, 10);
    for (const sx of [-1, 1]) { const m = new THREE.Mesh(post, pm); m.position.set(sx * (W / 2 + 0.3), 2.3, 0); m.castShadow = true; g.add(m); }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(W + 1, 0.9, 0.25), pm); beam.position.y = 4.4; beam.castShadow = true; g.add(beam);
    scene.add(g); const lb = textSprite(text, { size: 1.1, bg: "rgba(30,74,56,.95)", color: "#ffffff" }); lb.position.set(p.x, 5.8, p.z); scene.add(lb); };
  gate(0.012, "🚩 البداية", 0x2a6049); gate(0.988, "🏁 خط النهاية", 0xc39a5c);

  // «اليوم»: قوس ذهبي نابض + كرة مضيئة تقطع الطريق حتى اليوم
  const uT = uOf(today);
  { const { p, t } = frame(uT), arch = new THREE.Mesh(new THREE.TorusGeometry(W / 2 + 0.9, 0.22, 14, 60, Math.PI), new THREE.MeshStandardMaterial({ color: 0xd9534f, emissive: 0xd9534f, emissiveIntensity: 0.35, roughness: 0.4 }));
    arch.position.set(p.x, TH, p.z); arch.rotation.y = Math.atan2(t.x, t.z) + Math.PI / 2; arch.castShadow = true; scene.add(arch);
    const lb = textSprite("📍 اليوم", { size: 1.25, bg: "rgba(217,83,79,.95)", color: "#fff" }); lb.position.set(p.x, W / 2 + 2.6, p.z); scene.add(lb);
    const halo = new THREE.Mesh(new THREE.RingGeometry(W / 2 + 0.6, W / 2 + 1.1, 48), new THREE.MeshBasicMaterial({ color: 0xd9534f, transparent: true, opacity: 0.4, depthWrite: false }));
    halo.rotation.x = -Math.PI / 2; halo.position.set(p.x, TH + 0.03, p.z); scene.add(halo);
    ctx.onFrame((tt) => { const k = 1 + 0.06 * Math.sin(tt * 3); arch.scale.set(k, k, k); halo.scale.setScalar(1 + 0.25 * ((tt * 0.8) % 1)); halo.material.opacity = 0.45 * (1 - ((tt * 0.8) % 1)); lb.position.y = W / 2 + 2.6 + Math.sin(tt * 2) * 0.15; });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xc39a5c, emissiveIntensity: 1.2 }));
    scene.add(orb); const light = new THREE.PointLight(0xffd59a, 6, 9); orb.add(light);
    ctx.onFrame((tt) => { const k = ((tt * 0.12) % 1) * Math.max(uT, 0.02), { p: q } = frame(k); orb.position.set(q.x, TH + 0.55 + Math.abs(Math.sin(tt * 6)) * 0.12, q.z); });
    // الجزء المقطوع من الطريق يتلوّن بالأخضر الفاتح
    const done = []; const ii = []; const steps = Math.max(2, Math.round(NS * uT));
    for (let i = 0; i <= steps; i++) { const { p: q, n } = frame((i / NS)), a = q.clone().addScaledVector(n, 0.9), b = q.clone().addScaledVector(n, -0.9);
      done.push(a.x, TH + 0.008, a.z, b.x, TH + 0.008, b.z); if (i < steps) { const k = i * 2; ii.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
    const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.Float32BufferAttribute(done, 3)); dg.setIndex(ii); dg.computeVertexNormals();
    scene.add(new THREE.Mesh(dg, new THREE.MeshStandardMaterial({ color: 0xbfd8c4, roughness: 0.8, transparent: true, opacity: 0.8, side: THREE.DoubleSide }))); }

  // الأهداف: شريط ذهبي على حافة الطريق بطول مدة الهدف
  goals.forEach((g, gi) => {
    const u1 = uOf(g.start), u2 = Math.max(uOf(g.end), u1 + 0.004), side = gi % 2 ? 1 : -1, n1 = Math.max(2, Math.round((u2 - u1) * NS)), pp = [], ii = [];
    for (let i = 0; i <= n1; i++) { const { p, n } = frame(u1 + (u2 - u1) * (i / n1)), a = p.clone().addScaledVector(n, side * (W / 2 + 0.25)), b = p.clone().addScaledVector(n, side * (W / 2 + 0.95));
      pp.push(a.x, 0.06, a.z, b.x, 0.06, b.z); if (i < n1) { const k = i * 2; ii.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(pp, 3)); sg.setIndex(ii); sg.computeVertexNormals();
    const strip = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: 0xe3c18a, emissive: 0xc39a5c, emissiveIntensity: 0.15, roughness: 0.5, side: THREE.DoubleSide })); scene.add(strip);
    ctx.onFrame((tt) => (strip.material.emissiveIntensity = 0.12 + 0.12 * (0.5 + 0.5 * Math.sin(tt * 2 + gi))));
  });

  // الدبابيس البالونية
  const prof = [new THREE.Vector2(0, 0)];
  for (let k = 0; k <= 28; k++) { const th = -1.05 + (k / 28) * (Math.PI / 2 + 1.05); prof.push(new THREE.Vector2(Math.cos(th), 2.25 + Math.sin(th))); }
  const pinG = new THREE.LatheGeometry(prof, 48);
  const pins = [], hits = [], labels = [];
  const all = [
    ...items.map((it) => ({ ...it, kind: "task", at: it.end })),
    ...goals.map((g) => ({ ...g, kind: "goal", at: g.end, status: "goal", priority: "goal", who: "" })),
  ].sort((a, b) => +a.at - +b.at);
  const placed = [];
  all.forEach((it, idx) => {
    const u = uOf(it.at), near = placed.filter((x) => Math.abs(x - u) < 0.045).length; placed.push(u);
    const off = [0, 5.2, -5.2, 10.4, -10.4, 15.6, -15.6][near % 7] * (it.kind === "goal" ? 1.25 : 1);
    const { p, n } = frame(u), base0 = p.clone().addScaledVector(n, off), onRoad = Math.abs(off) < W / 2;
    const color = it.kind === "goal" ? TL_COLORS.goal : it.overdue ? TL_COLORS.overdue : TL_COLORS[it.status] || TL_COLORS.todo;
    const s = (it.kind === "goal" ? 1.55 : it.priority === "high" ? 1.2 : it.priority === "low" ? 0.9 : 1.05) * 2.1;
    const root = new THREE.Group(); root.position.set(base0.x, onRoad ? TH : 0, base0.z); scene.add(root);
    const sh = softShadow(); sh.scale.set(2.2 * s, 1.4 * s, 1); sh.position.y = 0.02; root.add(sh);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55 * s, 0.78 * s, 40), new THREE.MeshBasicMaterial({ color: it.kind === "goal" ? 0xc39a5c : new THREE.Color(TL_PRIO[it.priority] || "#c39a5c"), transparent: true, opacity: 0.9, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; root.add(ring);
    const body = new THREE.Group(); body.scale.setScalar(s); root.add(body);
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.32, metalness: 0.05, emissive: new THREE.Color(color), emissiveIntensity: 0.05 });
    const pin = new THREE.Mesh(pinG, mat); pin.castShadow = true; body.add(pin);
    const gloss = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })); gloss.position.set(-0.45, 2.85, 0.55); body.add(gloss);
    const d = new Date(it.at);
    const face = it.kind === "goal" ? pinFace("🎯", null, "#8a6430") : it.status === "done" ? pinFace("✓", `${d.getDate()}/${d.getMonth() + 1}`, color) : pinFace(`${it.progress}%`, `${d.getDate()}/${d.getMonth() + 1}`, color);
    body.add(face);
    const card = pinCard(it.kind === "goal" ? [`🎯 ${it.label}`, `هدف · ينتهي ${d.getDate()}/${d.getMonth() + 1}`, `${it.progress}% منجز`] : [it.label, `👤 ${it.who || "غير مسندة"}`, `${it.overdue ? "⏰ متأخرة · " : ""}${it.progress}%`], color);
    card.position.set(0, 3.4 * s + 2.1, 0); root.add(card); labels.push(card);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.15 * s, 0.5 * s, 3.5 * s, 10), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1.75 * s; hit.userData = it; root.add(hit); hits.push(hit);
    const ph = idx * 0.7, st = { hover: 0, h: 0 };
    root.userData = st;
    root.scale.setScalar(0.001);
    ctx.onFrame((tt) => {
      if (tt > 0.3 + idx * 0.05 && root.scale.x < 1) root.scale.setScalar(Math.min(1, root.scale.x + 0.06));
      st.h += ((st.hover ? 1 : 0) - st.h) * 0.15;
      const bob = Math.sin(tt * 2 + ph) * 0.12 * s + st.h * 0.5 * s;
      body.position.y = bob; card.position.y = 3.4 * s + 2.1 + bob;
      const pul = 1 + (it.overdue ? 0.07 : 0.035) * Math.sin(tt * (it.overdue ? 6 : 2.6) + ph) + st.h * 0.12;
      body.scale.setScalar(s * pul); sh.scale.set(2.2 * s * (1 - bob * 0.15), 1.4 * s * (1 - bob * 0.15), 1);
      mat.emissiveIntensity = 0.05 + st.h * 0.25 + (it.overdue ? 0.2 * (0.5 + 0.5 * Math.sin(tt * 6)) : 0);
      ring.scale.setScalar(1 + 0.3 * ((tt * 0.7 + ph) % 1)); ring.material.opacity = 0.9 * (1 - ((tt * 0.7 + ph) % 1));
      // وجه الدبوس يواجه الكاميرا دائماً
      const c = body.worldToLocal(camera.position.clone()); c.y = 0; c.normalize().multiplyScalar(1.22); face.position.set(c.x, 2.25, c.z);
    });
    pins.push({ it, root, u });
  });
  if (!all.length) { const s0 = textSprite("لا توجد مهام بتواريخ بعد — أضف مهمة لتظهر على الطريق", { size: 1.4 }); s0.position.set(0, 4, 0); scene.add(s0); }

  // الإضاءة والظلال تغطي الطريق
  const box = new THREE.Box3().setFromPoints(sp), size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  const R0 = Math.max(size.x, size.z) / 2 + 15;
  sun.position.set(mid.x - R0 * 0.5, R0 * 1.1, mid.z + R0 * 0.6); sun.target.position.copy(mid);
  Object.assign(sun.shadow.camera, { left: -R0, right: R0, top: R0, bottom: -R0, near: 1, far: R0 * 4 }); sun.shadow.camera.updateProjectionMatrix();

  // الكاميرا: حدود تمنع الضياع
  const ext = Math.max(size.x, size.z);
  controls.minDistance = 10; controls.maxDistance = Math.min(ext * 1.15 + 25, 260);
  controls.minPolarAngle = 0.12; controls.maxPolarAngle = 1.38; controls.screenSpacePanning = false; controls.zoomSpeed = 0.85;
  controls.addEventListener("change", () => { const t = controls.target; t.x = Math.max(box.min.x - 8, Math.min(box.max.x + 8, t.x)); t.z = Math.max(box.min.z - 8, Math.min(box.max.z + 8, t.z)); t.y = Math.max(0, Math.min(6, t.y)); });
  const s0 = curve.getPointAt(0);
  const ovCam = () => new THREE.Vector3(mid.x + ext * 0.08, ext * 0.36 + 16, box.max.z + ext * 0.22 + 18), ovTgt = () => new THREE.Vector3(mid.x, 0, mid.z - ext * 0.05);
  let goalCam = ovCam(), goalTgt = ovTgt(), moving = true;
  camera.position.set(s0.x, 6, s0.z + 12); controls.target.copy(s0);
  ctx.onFrame(() => { if (!moving) return; camera.position.lerp(goalCam, 0.05); controls.target.lerp(goalTgt, 0.05); if (camera.position.distanceTo(goalCam) < 0.05) moving = false; });
  controls.addEventListener("start", () => (moving = false));
  const fly = (c, t) => { goalCam = c; goalTgt = t; moving = true; };

  // التفاعل: تلميح + نقرة (مع تمييز السحب عن النقر)
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), el = renderer.domElement, tip = document.getElementById("tip");
  let hov = null, downAt = null;
  const pick = (e) => { const r = el.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(mouse, camera); return ray.intersectObjects(hits, false)[0]?.object || null; };
  el.addEventListener("pointermove", (e) => {
    const o = pick(e), pinObj = o ? pins.find((x) => x.it === o.userData) : null;
    if (hov && hov !== pinObj) hov.root.userData.hover = 0;
    hov = pinObj;
    if (pinObj) { pinObj.root.userData.hover = 1; el.style.cursor = "pointer"; tip.innerHTML = pinObj.it.tip || pinObj.it.label; tip.style.left = e.clientX + 14 + "px"; tip.style.top = e.clientY + 14 + "px"; tip.classList.remove("hidden"); }
    else { el.style.cursor = ""; tip.classList.add("hidden"); }
  });
  el.addEventListener("pointerleave", () => { tip.classList.add("hidden"); if (hov) hov.root.userData.hover = 0; hov = null; });
  el.addEventListener("pointerdown", (e) => (downAt = [e.clientX, e.clientY]));
  el.addEventListener("pointerup", (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const o = pick(e); if (!o) return;
    const pp = pins.find((x) => x.it === o.userData);
    if (pp) { const w = pp.root.position; fly(new THREE.Vector3(w.x + 9, w.y + 12, w.z + 18), new THREE.Vector3(w.x, w.y + 4, w.z)); }
    onClick && onClick(o.userData);
  });

  return {
    dispose: () => { tip.classList.add("hidden"); ctx.dispose(); },
    focusToday: () => { const { p } = frame(uT); fly(new THREE.Vector3(p.x + 10, 16, p.z + 26), new THREE.Vector3(p.x, 3, p.z - 4)); },
    overview: () => fly(ovCam(), ovTgt()),
    top: () => fly(new THREE.Vector3(mid.x, Math.min(ext * 0.95 + 10, controls.maxDistance * 0.95), mid.z + 1), mid.clone()),
    toggleLabels: () => { const v = !labels[0]?.visible; labels.forEach((l) => (l.visible = v)); return v; },
  };
}
