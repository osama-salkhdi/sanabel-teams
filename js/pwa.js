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
  // 🖨️ الطباعة داخل التطبيق: التقرير يتحول إلى ملف PDF (A4) ثم نافذة حفظ/مشاركة/طباعة
  const LIBS = ["https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js", "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"];
  // محرر الأكواد يعرّف define (AMD) فنخفيه مؤقتاً حتى تُسجَّل المكتبة على window
  const loadJs = (src) => new Promise((res, rej) => {
    const def = window.define; window.define = undefined;
    const done = (f) => () => { window.define = def; f(); };
    const s = document.createElement("script"); s.src = src;
    s.onload = done(res); s.onerror = done(() => rej(new Error("تعذّر تحميل مكتبة PDF — تحقق من الإنترنت")));
    document.head.appendChild(s);
  });
  let busy = false;
  async function reportToPdf(html) {
    if (busy) return; busy = true;
    const fr = document.createElement("iframe");
    try {
      toast("⏳ تجهيز التقرير PDF…");
      if (!window.html2canvas) await loadJs(LIBS[0]);
      if (!window.jspdf) await loadJs(LIBS[1]);
      const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "report";
      html = html.replace(/<script>[\s\S]*?<\/script>/g, "").replace("</style>", "body{margin:0;padding:0 2px}tr,li,.boxes,.meta,.big,.sign{break-inside:avoid}</style>");
      const W = 760; // عرض صفحة A4 بالبكسل (بعد الهوامش)
      fr.style.cssText = `position:fixed;left:-20000px;top:0;width:${W}px;height:1200px;border:0;visibility:hidden`;
      document.body.appendChild(fr);
      const d = fr.contentDocument; d.open(); d.write(html); d.close();
      await Promise.race([new Promise((r) => (d.readyState === "complete" ? r() : fr.addEventListener("load", r, { once: true }))), new Promise((r) => setTimeout(r, 6000))]);
      await Promise.race([d.fonts.ready, new Promise((r) => setTimeout(r, 4000))]);
      await Promise.race([Promise.all([...d.images].map((im) => im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))), new Promise((r) => setTimeout(r, 5000))]);
      await new Promise((r) => setTimeout(r, 300));
      // أشرطة الإنجاز: تُرسم كتدرّج لوني حتى تظهر بدقة في PDF
      d.querySelectorAll(".pb").forEach((pb) => { const v = parseFloat(pb.firstElementChild?.style.width) || 0; pb.innerHTML = ""; pb.style.background = `linear-gradient(to left, #c39a5c ${v}%, #e3ece6 ${v}%)`; });
      const body = d.body, H = Math.ceil(body.scrollHeight);
      fr.style.height = H + "px";
      // نقاط قطع الصفحات: بين الأسطر والعناوين وليس في منتصفها
      const bTop = body.getBoundingClientRect().top;
      const cuts = [...body.querySelectorAll("tr,li,h3,header,.meta,.big,.boxes,.comment,.sign,footer,p,table")].map((e) => Math.round(e.getBoundingClientRect().bottom - bTop)).sort((a, b) => a - b);
      const scale = 2;
      const canvas = await window.html2canvas(body, { scale, width: W, windowWidth: W, height: H, windowHeight: H, backgroundColor: "#ffffff", useCORS: true, logging: false });
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      const M = 12, pw = 210 - 2 * M, ph = 297 - 2 * M, pagePx = Math.floor(ph * W / pw);
      let y = 0, first = true;
      while (y < H - 2) {
        let end = Math.min(y + pagePx, H);
        if (end < H) { const ok = cuts.filter((c) => c > y + pagePx * 0.5 && c <= end); if (ok.length) end = ok[ok.length - 1]; }
        const sl = document.createElement("canvas"); sl.width = W * scale; sl.height = (end - y) * scale;
        const cx = sl.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, sl.width, sl.height);
        cx.drawImage(canvas, 0, y * scale, W * scale, (end - y) * scale, 0, 0, W * scale, (end - y) * scale);
        if (!first) pdf.addPage(); first = false;
        pdf.addImage(sl.toDataURL("image/jpeg", 0.92), "JPEG", M, M, pw, (end - y) * pw / W);
        y = end;
      }
      const n = pdf.getNumberOfPages();
      for (let i = 1; i <= n; i++) { pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(150); pdf.text(`${i} / ${n}`, 105, 292, { align: "center" }); }
      pdf.setProperties({ title });
      const day = new Date().toISOString().slice(0, 10);
      const kind = /قطع/.test(title) ? "parts" : /المشروع/.test(title) ? "project-report" : "member-report";
      await saveNative(URL.createObjectURL(pdf.output("blob")), `sanabel_${kind}_${day}.pdf`);
    } catch (e) { toast("تعذّر إنشاء PDF: " + (e?.message || e)); }
    finally { fr.remove(); busy = false; }
  }
  // النوافذ الجديدة: الروابط تفتح في المتصفح، ونافذة الطباعة تتحول إلى PDF
  const origOpen = window.open;
  window.open = function (url, ...rest) {
    if (!url) {
      let buf = "";
      return { closed: false, focus() {}, close() {}, print() {}, document: { write: (s) => { buf += s; }, writeln: (s) => { buf += s + "\n"; }, open() {}, close: () => reportToPdf(buf) } };
    }
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
