// =====================================================================
//  💾 النسخة الاحتياطية الكاملة — ملف مستقل لا يعدّل أي ملف آخر
//  يضيف زراً في لوحة التحكم (للمشرف فقط) ينزّل ZIP فيه كل بيانات المنصة
// =====================================================================
import { createDemoClient } from "./demo.js";

const C = window.CONFIG || {};
const DEMO = !C.SUPABASE_URL || C.SUPABASE_URL.includes("YOUR-") || new URLSearchParams(location.search).has("demo");
const BUCKET = "team-files";
const LAST_KEY = "sanabel-last-backup";
const TABLES = [
  ["profiles", "الأعضاء"], ["projects", "المشاريع"], ["project_members", "عضوية المشاريع والصلاحيات"],
  ["goals", "الأهداف"], ["tasks", "المهام"], ["submissions", "الأعمال المرفوعة على المهام"],
  ["files", "ملفات المشاريع (مع محتوى الأكواد)"], ["file_versions", "سجل تعديلات الملفات"],
  ["notes", "المشاكل والملاحظات"], ["messages", "الرسائل والتعميمات"], ["message_reads", "حالة قراءة الرسائل"],
  ["library", "الأبحاث والكتب والمنوعات"], ["parts", "القطع المطلوبة"], ["contacts", "الأرقام المهمة"], ["activity", "سجل العمل"], ["platform_videos", "فيديوهات الشرح"],
];

let client = null, busy = false;
const sb = () => (client ||= DEMO ? createDemoClient() : window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (d) => new Date(d).toLocaleString("ar-SY-u-nu-latn", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
const safe = (s) => String(s || "").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_").trim().slice(0, 60) || "x";
const readLast = () => { try { return localStorage.getItem(LAST_KEY); } catch { return null; } };
const writeLast = (v) => { try { localStorage.setItem(LAST_KEY, v); } catch {} };

// ------------------------------------------------------------------ الزر في لوحة التحكم
function inject() {
  const anchor = document.getElementById("new-proj"); // يظهر في لوحة التحكم للمشرف فقط
  if (!anchor || document.getElementById("bk-btn")) return;
  const last = readLast(), days = last ? Math.floor((Date.now() - new Date(last)) / 86400000) : null;
  const wrap = document.createElement("span");
  wrap.className = "bk-wrap";
  wrap.innerHTML = `<button class="btn" id="bk-btn" title="ينزّل ملف ZIP فيه كل بيانات المنصة">💾 نسخة احتياطية كاملة</button>
    <small class="bk-last ${days === null || days > 30 ? "warn" : ""}">${last ? `آخر نسخة: ${days === 0 ? "اليوم" : `قبل ${days} يوم`}` : "لم تُؤخذ نسخة بعد"}</small>`;
  anchor.insertAdjacentElement("beforebegin", wrap);
  document.getElementById("bk-btn").onclick = openDialog;
}
new MutationObserver(inject).observe(document.body, { childList: true, subtree: true });

// ------------------------------------------------------------------ نافذة الخيارات والتقدّم
function overlay(html) {
  let o = document.getElementById("bk-ov");
  if (!o) { o = document.createElement("div"); o.id = "bk-ov"; document.body.appendChild(o);
    o.addEventListener("mousedown", (e) => { if (e.target === o && !busy) closeOv(); }); }
  o.innerHTML = `<div class="bk-box">${html}</div>`;
  o.classList.remove("hidden");
  return o;
}
const closeOv = () => document.getElementById("bk-ov")?.classList.add("hidden");

function openDialog() {
  overlay(`<div class="bk-head"><h3>💾 نسخة احتياطية كاملة</h3><button class="icon-btn" id="bk-x">✕</button></div>
    <p>ينزّل ملف <b>ZIP</b> واحد فيه كل بيانات المنصة: المشاريع، الأعضاء والصلاحيات، المهام وأعمالها، ملفات الأكواد وسجلها، الرسائل والتعميمات، الأبحاث والكتب، القطع، والأرقام المهمة.</p>
    <label class="bk-opt"><input type="checkbox" id="bk-media" checked> تضمين الملفات المرفوعة (صور، PDF، ملفات المهام…) <small>— يزيد الحجم والوقت</small></label>
    <p class="bk-note">🔐 الملف يحتوي على كل رسائل الفريق وبياناته: احفظه في مكان آمن ولا تشاركه. كلمات السر <b>غير</b> موجودة فيه.</p>
    <div class="bk-actions"><button class="btn gold" id="bk-go">⬇️ إنشاء النسخة وتنزيلها</button></div>`);
  document.getElementById("bk-x").onclick = closeOv;
  document.getElementById("bk-go").onclick = () => run(document.getElementById("bk-media").checked).catch((e) => {
    console.error(e);
    overlay(`<div class="bk-head"><h3>❌ تعذّر إنشاء النسخة</h3><button class="icon-btn" id="bk-x">✕</button></div><p>${esc(e.message || e)}</p>`);
    document.getElementById("bk-x").onclick = closeOv;
  });
}
function progressUI() {
  overlay(`<div class="bk-head"><h3>⏳ جارِ إنشاء النسخة الاحتياطية…</h3></div>
    <div class="bk-bar"><i id="bk-fill"></i></div><div id="bk-step" class="bk-step"></div><ul id="bk-log" class="bk-log"></ul>`);
  return {
    set: (p, step) => { document.getElementById("bk-fill").style.width = Math.round(p * 100) + "%"; if (step) document.getElementById("bk-step").textContent = step; },
    log: (t) => { const li = document.createElement("li"); li.textContent = t; document.getElementById("bk-log").appendChild(li); },
  };
}

// ------------------------------------------------------------------ جلب البيانات
async function fetchAll(table) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb().from(table).select("*").range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}
function toCSV(rows) {
  if (!rows.length) return "﻿";
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cell = (v) => { if (v == null) return ""; const s = typeof v === "object" ? JSON.stringify(v) : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return "﻿" + [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n");
}

async function run(withMedia) {
  if (!window.JSZip) throw new Error("مكتبة ZIP غير محمّلة — حدّث الصفحة وحاول مجدداً");
  const { data: { session } } = await sb().auth.getSession();
  if (!session) throw new Error("انتهت جلسة الدخول — سجّل الدخول من جديد");
  busy = true;
  try { await build(withMedia); } finally { busy = false; }
}
async function build(withMedia) {
  const ui = progressUI(), zip = new JSZip(), data = {}, counts = [], problems = [];

  // ١) الجداول
  for (let i = 0; i < TABLES.length; i++) {
    const [t, label] = TABLES[i];
    ui.set(i / TABLES.length * 0.55, `📋 ${label}…`);
    try {
      data[t] = await fetchAll(t);
      // لا نحفظ محتوى الملفات مرتين في CSV (يبقى كاملاً في JSON)
      zip.file(`data/${t}.json`, JSON.stringify(data[t], null, 1));
      zip.file(`excel/${t}.csv`, toCSV(t === "files" || t === "file_versions" ? data[t].map(({ content, ...r }) => ({ ...r, content_length: content ? content.length : 0 })) : data[t]));
      counts.push([label, data[t].length]);
      ui.log(`✅ ${label}: ${data[t].length}`);
    } catch (e) { data[t] = []; problems.push(`${label}: ${e.message || e}`); ui.log(`⚠️ ${label}: تعذّر (${e.message || e})`); }
  }

  // ٢) ملفات الأكواد كشجرة مجلدات حقيقية لكل مشروع
  const pname = Object.fromEntries((data.projects || []).map((p) => [p.id, safe(p.name)]));
  let codeN = 0;
  for (const f of data.files || []) {
    if (f.storage_path || f.content == null || f.path.endsWith("/.keep")) continue;
    zip.file(`projects/${pname[f.project_id] || f.project_id}/${f.path}`, f.content); codeN++;
  }
  ui.log(`🗂️ ملفات الأكواد: ${codeN}`);

  // ٣) الملفات المرفوعة (صور، PDF…)
  let mediaN = 0, mediaFail = 0;
  if (withMedia) {
    const paths = [...new Set([
      ...(data.files || []).map((x) => x.storage_path), ...(data.submissions || []).map((x) => x.file_path),
      ...(data.library || []).map((x) => x.file_path), ...(data.parts || []).map((x) => x.image_path),
    ].filter(Boolean))];
    const vpaths = (data.platform_videos || []).map((x) => x.file_path).filter(Boolean);
    for (const vp of vpaths) {
      try { const { data: vu } = await sb().storage.from("platform-media").createSignedUrls([vp], 3600); const r = await fetch(vu[0].signedUrl); if (!r.ok) throw 0; zip.file(`uploads/platform-media/${vp}`, await r.blob()); mediaN++; } catch { mediaFail++; }
    }
    for (let i = 0; i < paths.length; i += 50) {
      const chunk = paths.slice(i, i + 50);
      const { data: urls } = await sb().storage.from(BUCKET).createSignedUrls(chunk, 3600);
      for (const u of urls || []) {
        ui.set(0.55 + ((i + chunk.indexOf(u.path) + 1) / paths.length) * 0.35, `🖼️ الملفات المرفوعة ${Math.min(i + chunk.indexOf(u.path) + 1, paths.length)}/${paths.length}`);
        try { if (!u.signedUrl) throw 0; const r = await fetch(u.signedUrl); if (!r.ok) throw 0; zip.file(`uploads/${u.path}`, await r.blob()); mediaN++; }
        catch { mediaFail++; }
      }
    }
    ui.log(`🖼️ الملفات المرفوعة: ${mediaN}${mediaFail ? ` (تعذّر ${mediaFail})` : ""}`);
  }

  // ٤) ملف التعريف
  const now = new Date().toISOString();
  zip.file("اقرأني.txt", [
    "نسخة احتياطية كاملة — منصة الفرق المشاركة في المسابقات",
    "أكاديمية سنابل التقنية", `التاريخ: ${fmt(now)}`, `المصدر: ${DEMO ? "الوضع التجريبي" : C.SUPABASE_URL}`, "",
    "المحتويات:",
    ...counts.map(([l, n]) => `  • ${l}: ${n}`),
    `  • ملفات الأكواد كمجلدات: ${codeN}`, withMedia ? `  • الملفات المرفوعة: ${mediaN}` : "  • الملفات المرفوعة: غير مضمّنة", "",
    "المجلدات:",
    "  data/      ← كل الجداول بصيغة JSON (للاسترجاع الكامل)",
    "  excel/     ← نفس الجداول بصيغة CSV تفتح في Excel",
    "  projects/  ← ملفات كل مشروع بنفس ترتيب مجلداتها",
    "  uploads/   ← الصور وملفات PDF والملفات المرفوعة",
    ...(problems.length ? ["", "تنبيهات:", ...problems.map((p) => "  ! " + p)] : []),
  ].join("\r\n"));
  zip.file("data/_meta.json", JSON.stringify({ app: "sanabel-teams", version: 1, created_at: now, source: DEMO ? "demo" : C.SUPABASE_URL, counts: Object.fromEntries(Object.keys(data).map((k) => [k, data[k].length])), media: withMedia }, null, 1));

  // ٥) الضغط والتنزيل
  ui.set(0.92, "📦 ضغط الملف…");
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }, (m) => ui.set(0.92 + (m.percent / 100) * 0.08));
  const name = `sanabel-backup_${today()}.zip`;
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  writeLast(now);
  document.getElementById("bk-btn")?.closest(".bk-wrap")?.remove(); inject();
  overlay(`<div class="bk-head"><h3>✅ تم إنشاء النسخة الاحتياطية</h3><button class="icon-btn" id="bk-x">✕</button></div>
    <p>نُزّل الملف <b dir="ltr">${name}</b> (${(blob.size / 1048576).toFixed(1)} MB).</p>
    <ul class="bk-log">${counts.map(([l, n]) => `<li>${esc(l)}: <b>${n}</b></li>`).join("")}<li>ملفات الأكواد: <b>${codeN}</b></li>${withMedia ? `<li>الملفات المرفوعة: <b>${mediaN}</b></li>` : ""}</ul>
    ${problems.length ? `<p class="bk-note">⚠️ ${problems.map(esc).join("<br>")}</p>` : ""}
    <p class="bk-note">💡 احفظه في Google Drive أو على فلاشة، وكرّر النسخ مرة شهرياً على الأقل.</p>`);
  document.getElementById("bk-x").onclick = closeOv;
}

// ------------------------------------------------------------------ تنسيق (مضمّن هنا حتى لا نعدّل style.css)
document.head.insertAdjacentHTML("beforeend", `<style>
.bk-wrap{display:inline-flex;flex-direction:column;align-items:center;gap:2px}
.bk-last{font-size:11px;color:var(--muted)}.bk-last.warn{color:#b5483b;font-weight:700}
#bk-ov{position:fixed;inset:0;z-index:80;background:rgba(15,30,24,.55);display:grid;place-items:center;padding:16px}
#bk-ov.hidden{display:none}
.bk-box{background:var(--paper,#fffaf5);border-radius:18px;width:min(560px,100%);max-height:90vh;overflow:auto;padding:18px 20px;box-shadow:0 30px 70px rgba(0,0,0,.35);line-height:1.7}
.bk-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}.bk-head h3{margin:0;color:var(--green,#1e4a38)}
.bk-opt{display:flex!important;gap:8px;align-items:center;color:var(--ink,#1d2a24)!important;font-weight:700;margin:10px 0}
.bk-opt input{width:auto!important;margin:0!important}.bk-opt small{color:var(--muted);font-weight:400}
.bk-note{background:#f4e8d6;border-radius:10px;padding:8px 12px;font-size:13px}
.bk-actions{display:flex;justify-content:flex-end;margin-top:12px}
.bk-bar{height:12px;border-radius:99px;background:#e3ece6;overflow:hidden;margin:12px 0 6px}
.bk-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#c39a5c,#2a6049);transition:width .3s}
.bk-step{font-weight:700;color:var(--green,#1e4a38)}.bk-log{font-size:13px;color:var(--muted);margin:8px 0;padding-inline-start:18px}
</style>`);
