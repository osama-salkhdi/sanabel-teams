// =====================================================================
//  📱 التطبيق: تثبيت المنصة على الهاتف (PWA) + دعم تطبيق أندرويد (APK)
//  ملف مستقل — لا يغيّر أي ملف آخر
// =====================================================================
const NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const UA = navigator.userAgent, IOS = /iphone|ipad|ipod/i.test(UA), ANDROID = /android/i.test(UA);
const STANDALONE = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const owner = location.hostname.endsWith(".github.io") ? location.hostname.split(".")[0] : "osama-salkhdi";
const repo = location.hostname.endsWith(".github.io") ? location.pathname.split("/")[1] || "sanabel-teams" : "sanabel-teams";
const APK_URL = `https://github.com/${owner}/${repo}/releases/download/android-latest/sanabel-teams.apk`;
let deferred = null;

// ---------------- خدمة العمل دون اتصال (للمتصفح فقط)
if (!NATIVE && "serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; renderLogin(); });
addEventListener("appinstalled", () => { deferred = null; document.querySelectorAll(".app-get").forEach((x) => x.remove()); });

function choices(compact) {
  const parts = [];
  if (ANDROID || !IOS) parts.push(`<a class="btn gold app-btn" href="${APK_URL}" target="_blank" rel="noopener">🤖 تحميل تطبيق أندرويد (APK)</a>`);
  if (deferred) parts.push(`<button type="button" class="btn app-btn" data-install>📲 تثبيت من المتصفح</button>`);
  if (IOS) parts.push(`<div class="app-hint">🍏 على الآيفون: اضغط زر <b>المشاركة</b> ⬆️ في Safari ثم <b>«إضافة إلى الشاشة الرئيسية»</b></div>`);
  else if (!deferred) parts.push(`<div class="app-hint">💡 أو من قائمة المتصفح ⋮ ← <b>«تثبيت التطبيق»</b> / «إضافة إلى الشاشة الرئيسية»</div>`);
  return `<div class="app-get ${compact ? "compact" : ""}"><b>📱 استخدم المنصة كتطبيق موبايل</b>${parts.join("")}
    <small>أو تابع من المتصفح مباشرة — نفس الحساب ونفس البيانات</small></div>`;
}
function bind(root) {
  root.querySelectorAll("[data-install]").forEach((b) => (b.onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; }));
}
function renderLogin() {
  if (NATIVE || STANDALONE) return;
  const form = document.getElementById("login-form"); if (!form) return;
  form.querySelector(".app-get")?.remove();
  form.insertAdjacentHTML("beforeend", choices(false)); bind(form);
}
function headerButton() {
  if (NATIVE || STANDALONE) return;
  const bar = document.querySelector(".top-actions"); if (!bar || document.getElementById("app-hdr")) return;
  bar.insertAdjacentHTML("afterbegin", `<button class="hdr-btn" id="app-hdr" title="تطبيق الموبايل">📱</button>`);
  document.getElementById("app-hdr").onclick = (e) => {
    e.stopPropagation();
    let pop = document.getElementById("app-pop");
    if (pop) return pop.remove();
    document.body.insertAdjacentHTML("beforeend", `<div id="app-pop">${choices(true)}</div>`);
    pop = document.getElementById("app-pop"); bind(pop);
    setTimeout(() => document.addEventListener("click", function off(ev) { if (!pop.contains(ev.target)) { pop.remove(); document.removeEventListener("click", off); } }), 0);
  };
}
renderLogin(); headerButton();

// ---------------- قائمة الموبايل: خلفية معتمة + إغلاق بالضغط خارجها
(function navBackdrop() {
  const nav = document.getElementById("nav"); if (!nav) return;
  let bd = null;
  const sync = () => {
    const open = nav.classList.contains("open") && innerWidth <= 900;
    if (open && !bd) { bd = document.createElement("div"); bd.className = "nav-backdrop"; bd.onclick = () => nav.classList.remove("open"); document.body.appendChild(bd); }
    if (!open && bd) { bd.remove(); bd = null; }
  };
  new MutationObserver(sync).observe(nav, { attributes: true, attributeFilter: ["class"] });
})();

// ---------------- داخل تطبيق أندرويد
if (NATIVE) {
  document.documentElement.classList.add("native-app");
  const P = window.Capacitor.Plugins || {};
  try { P.StatusBar?.setBackgroundColor({ color: "#16372a" }); P.StatusBar?.setStyle({ style: "DARK" }); } catch {}
  const toast = (m) => { const t = document.getElementById("toasts"); if (!t) return; const d = document.createElement("div"); d.className = "toast"; d.textContent = m; t.appendChild(d); setTimeout(() => d.remove(), 3800); };
  // تنزيل الملفات (ZIP، صور المخطط، النسخة الاحتياطية…) → حفظ ومشاركة عبر نافذة أندرويد
  const b64 = (blob) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
  async function saveNative(href, name) {
    try {
      toast("⏳ تجهيز الملف…");
      const blob = await (await fetch(href)).blob();
      const safe = (name || "file").replace(/[\\/:*?"<>|]+/g, "_");
      const w = await P.Filesystem.writeFile({ path: safe, data: await b64(blob), directory: "CACHE" });
      await P.Share.share({ title: safe, dialogTitle: "حفظ أو مشاركة الملف", files: [w.uri] });
    } catch (e) { if (!/cancel/i.test(String(e?.message || e))) toast("تعذّر حفظ الملف: " + (e?.message || e)); }
  }
  const origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.hasAttribute("download") && /^(blob:|data:)/.test(this.href)) { saveNative(this.href, this.getAttribute("download")); return; }
    return origClick.call(this);
  };
  // النوافذ الجديدة: الروابط تفتح في المتصفح، والطباعة متاحة من نسخة الويب
  const origOpen = window.open;
  window.open = function (url, ...rest) {
    if (!url) { toast("🖨️ طباعة التقارير متاحة من نسخة الويب على اللابتوب"); return null; }
    try { const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; origClick.call(a); return null; } catch { return origOpen.call(window, url, ...rest); }
  };
  // زر الرجوع في أندرويد
  P.App?.addListener("backButton", () => {
    const vis = (sel) => { const el = document.querySelector(sel); return el && !el.classList.contains("hidden") ? el : null; };
    if (document.querySelector(".ctx-menu")) return document.querySelectorAll(".ctx-menu").forEach((m) => m.remove());
    if (vis("#bk-ov")) return document.getElementById("bk-ov").classList.add("hidden");
    if (vis("#modal")) return document.getElementById("modal-close").click();
    if (vis("#fpanel")) return document.getElementById("fp-x")?.click();
    if (document.querySelector("#drawer.open")) return document.getElementById("drawer").classList.remove("open");
    if (document.querySelector("#nav.open")) return document.getElementById("nav").classList.remove("open");
    const home = document.querySelector('#nav a[data-v="dashboard"]') || document.querySelector('#nav a[data-v="overview"]');
    if (home && !home.classList.contains("active")) return home.click();
    P.App.minimizeApp ? P.App.minimizeApp() : P.App.exitApp();
  });
}

document.head.insertAdjacentHTML("beforeend", `<style>
.app-get{margin-top:16px;padding:14px;border-radius:14px;background:#f4ede4;border:1px dashed #c39a5c;display:flex;flex-direction:column;gap:8px;text-align:center}
.app-get b{color:#1e4a38}.app-get small{color:#6c7a72}
.app-btn{justify-content:center;width:100%}
.app-hint{font-size:13px;color:#4b5a52;background:#fff;border-radius:10px;padding:8px}
#app-pop{position:fixed;top:70px;left:16px;z-index:90;width:min(340px,calc(100vw - 32px));background:#fffaf5;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.3);padding:6px}
#app-pop .app-get{margin:0}
.native-app #logout-btn{padding:5px 9px}
</style>`);
