// =====================================================================
//  منصة الفرق المشاركة في المسابقات — أكاديمية سنابل التقنية
// =====================================================================
import { loginBackground, farmScene, timelineScene, TL_COLORS, TL_PRIO } from "./three-views.js";
import { createDemoClient, resetDemo } from "./demo.js";
import { createFilesView } from "./files-view.js";

const C = window.CONFIG;
const DEMO = C.SUPABASE_URL.includes("YOUR-") || new URLSearchParams(location.search).has("demo");
const sb = DEMO ? createDemoClient() : window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
const BUCKET = "team-files";

const S = {
  me: null, profiles: [], projects: [], memberships: [],
  pid: null, view: null, cleanup: [], channel: null, notes: [], notesFilter: "all",
  libAll: false, loginDispose: null,
};

// ---------------------------------------------------------------- أدوات
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("ar-SY-u-nu-latn", { year: "numeric", month: "short", day: "numeric" }) : "—");
const fmtTime = (d) => (d ? new Date(d).toLocaleString("ar-SY-u-nu-latn", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const daysLeft = (d) => Math.ceil((new Date(d) - new Date(todayStr())) / 86400000);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

const STATUS = { todo: "للتنفيذ", doing: "قيد العمل", review: "للمراجعة", done: "منجزة" };
const TYPES = { research: "بحث", code: "برمجة", design: "تصميم", build: "تجميع/تصنيع", other: "أخرى" };
const PRIORITY = { low: "منخفضة", med: "متوسطة", high: "عالية" };
const PRIO_COLOR = { high: "#e5484d", med: "#2f7de1", low: "#f2c00f" };
const STATUS_COLOR = { todo: "#8fa39a", doing: "#f59e0b", review: "#8b5cf6", done: "#16a34a" };
const PERIODS = { month: "شهري", quarter: "ربع سنوي", half: "نصف سنوي", year: "سنوي" };
const NOTE_KINDS = { issue: "⚠️ مشكلة / خطأ", note: "📝 ملاحظة", announcement: "📢 تعميم" };
const SECTIONS = { research: "أبحاث مهمة", books: "كتب مهمة", misc: "منوعات" };
const LANGS = [
  ["python", "Python"], ["cpp", "C++ / Arduino"], ["c", "C"], ["java", "Java"], ["javascript", "JavaScript"],
  ["typescript", "TypeScript"], ["csharp", "C#"], ["html", "HTML"], ["css", "CSS"], ["json", "JSON"],
  ["markdown", "Markdown"], ["shell", "Bash / Shell"], ["sql", "SQL"], ["yaml", "YAML"], ["xml", "XML"], ["plaintext", "نص عادي"],
];
const EXT_LANG = { py: "python", ino: "cpp", cpp: "cpp", cc: "cpp", hpp: "cpp", h: "cpp", c: "c", java: "java", js: "javascript", mjs: "javascript",
  ts: "typescript", cs: "csharp", html: "html", htm: "html", css: "css", json: "json", md: "markdown", sh: "shell", sql: "sql",
  yml: "yaml", yaml: "yaml", xml: "xml", txt: "plaintext", m: "plaintext", launch: "xml", urdf: "xml" };
const langOf = (path) => EXT_LANG[(path.split(".").pop() || "").toLowerCase()] || "plaintext";
const langOptions = (sel) => LANGS.map(([v, l]) => `<option value="${v}" ${v === sel ? "selected" : ""}>${l}</option>`).join("");
const opts = (obj, sel) => Object.entries(obj).map(([v, l]) => `<option value="${v}" ${v === sel ? "selected" : ""}>${l}</option>`).join("");

const isAdmin = () => S.me?.role === "admin";
const myRole = () => (isAdmin() ? "admin" : S.memberships.find((m) => m.project_id === S.pid && m.user_id === S.me.id)?.role);
const canEdit = () => isAdmin() || ["editor", "manager"].includes(myRole());
const isManager = () => isAdmin() || myRole() === "manager";
const canEditTask = (t) => isManager() || (canEdit() && (t.assignee === S.me.id || t.created_by === S.me.id));
const ROLE_LABEL = { admin: "المدير العام", manager: "مدير المشروع", editor: "عضو (محرر)", viewer: "مشاهد" };
const project = () => S.projects.find((p) => p.id === S.pid);
const prof = (id) => S.profiles.find((p) => p.id === id);
const pname = (id) => prof(id)?.full_name || prof(id)?.username || "—";
const initials = (id) => (pname(id) || "؟").trim().charAt(0);
const teamOf = (pid = S.pid) => S.memberships.filter((m) => m.project_id === pid).map((m) => ({ ...prof(m.user_id), prole: m.role })).filter((p) => p.id);
const taskProg = (t) => (t.status === "done" ? 100 : t.progress || 0);
const isOverdue = (t) => t.due_date && t.status !== "done" && t.due_date < todayStr();

function toast(msg, type = "ok") {
  const el = document.createElement("div");
  el.className = "toast " + (type === "err" ? "err" : "");
  el.textContent = msg;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 3800);
}
const fail = (e) => { console.error(e); toast(e?.message || String(e), "err"); };
const must = ({ data, error }) => { if (error) throw error; return data; };

// ---------------------------------------------------------------- نافذة منبثقة
function openModal(title, html, { onSubmit, onOpen, wide } = {}) {
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = html;
  $(".modal-box").style.width = wide ? "min(1100px,100%)" : "";
  $("#modal").classList.remove("hidden");
  const form = $("#modal-body form.mform");
  if (form && onSubmit) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const btn = form.querySelector("[type=submit]");
      btn && (btn.disabled = true);
      try {
        const fd = new FormData(form);
        const data = Object.fromEntries([...fd.keys()].map((k) => [k, fd.getAll(k).length > 1 ? fd.getAll(k) : fd.get(k)]));
        await onSubmit(data, form);
      } catch (err) { fail(err); } finally { btn && (btn.disabled = false); }
    };
  }
  onOpen && onOpen($("#modal-body"));
}
const closeModal = () => { $("#modal").classList.add("hidden"); $("#modal-body").innerHTML = ""; };
$("#modal-close").onclick = closeModal;
$("#modal").addEventListener("mousedown", (e) => { if (e.target.id === "modal") closeModal(); });
const confirmBox = (msg) => window.confirm(msg);

// ---------------------------------------------------------------- الملفات (Storage)
const safeName = (n) => {
  const ext = (n.match(/\.[a-z0-9]{1,8}$/i) || [""])[0];
  const base = n.slice(0, n.length - ext.length).replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 40) || "file";
  return base + ext.toLowerCase();
};
async function compressImage(file, max = 1600, q = 0.82) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml" || file.size < 350000) return file;
  const img = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = Object.assign(document.createElement("canvas"), { width: Math.round(img.width * s), height: Math.round(img.height * s) });
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", q));
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}
async function uploadFile(file, folder) {
  const f = await compressImage(file);
  if (f.size > 50 * 1024 * 1024) throw new Error("حجم الملف أكبر من 50MB — ارفعه على Drive وضع الرابط");
  const path = `${S.pid}/${folder}/${Date.now()}_${safeName(f.name)}`;
  must(await sb.storage.from(BUCKET).upload(path, f, { contentType: f.type || "application/octet-stream" }));
  return path;
}
const urlCache = new Map();
async function signed(paths) {
  const need = [...new Set(paths.filter((p) => p && !urlCache.has(p)))];
  if (need.length) {
    const { data } = await sb.storage.from(BUCKET).createSignedUrls(need, 3600 * 6);
    (data || []).forEach((d) => d.signedUrl && urlCache.set(d.path, d.signedUrl));
  }
  return (p) => urlCache.get(p) || "";
}
async function log(action, details = "") {
  if (!canEdit()) return;
  await sb.from("activity").insert({ project_id: S.pid, user_id: S.me.id, action, details: String(details).slice(0, 500) });
}

// ---------------------------------------------------------------- الدخول
async function boot() {
  if (DEMO) {
    $("#login-err").insertAdjacentHTML("afterend", `<div style="margin-top:12px;background:#f4e8d6;border-radius:10px;padding:10px;font-size:13px;text-align:right">
      🧪 <b>وضع تجريبي</b> (بيانات محفوظة في متصفحك فقط)<br>المشرف: <b dir="ltr">admin</b> / <b dir="ltr">admin</b><br>مدير مشروع: <b dir="ltr">omar</b> / <b dir="ltr">1234</b> — عضو: <b dir="ltr">ahmad</b> / <b dir="ltr">1234</b></div>`);
    const t = $(".top-actions");
    t.insertAdjacentHTML("afterbegin", `<button class="btn ghost sm" id="demo-reset" title="إعادة البيانات التجريبية">🧪 تجريبي ↺</button>`);
    $("#demo-reset").onclick = () => confirmBox("إعادة البيانات التجريبية من البداية؟") && resetDemo();
  }
  const { data: { session } } = await sb.auth.getSession();
  session ? startApp() : showLogin();
}
function showLogin() {
  $("#app").classList.add("hidden");
  $("#login").classList.remove("hidden");
  if (!S.loginDispose && $("#login-bg")) try { S.loginDispose = loginBackground($("#login-bg")); } catch (e) { console.warn(e); }
}
$("#login-form").onsubmit = async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const user = String(fd.get("username")).trim().toLowerCase();
  const email = user.includes("@") ? user : `${user}@${C.EMAIL_DOMAIN}`;
  $("#login-err").textContent = "";
  const { error } = await sb.auth.signInWithPassword({ email, password: fd.get("password") });
  if (error) { $("#login-err").textContent = "اسم المستخدم أو كلمة السر غير صحيحة"; return; }
  startApp();
};
$("#logout-btn").onclick = async () => { await sb.auth.signOut(); location.hash = ""; location.reload(); };

async function startApp() {
  try {
    const { data: { user } } = await sb.auth.getUser();
    S.me = must(await sb.from("profiles").select("*").eq("id", user.id).single());
  } catch (e) { await sb.auth.signOut(); showLogin(); $("#login-err").textContent = "تعذر تحميل الحساب: " + (e.message || e); return; }
  S.loginDispose?.(); S.loginDispose = null;
  $("#login").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#me-name").textContent = S.me.full_name || S.me.username;
  $("#me-role").textContent = isAdmin() ? "مدير المنصة" : "عضو فريق";
  await loadCore();
  const saved = localStorage.getItem("pid");
  S.pid = S.projects.find((p) => p.id === saved)?.id || S.projects[0]?.id || null;
  fillProjectSelect();
  buildNav();
  subscribe();
  initInbox();
  const v = location.hash.slice(1);
  go(v || (isAdmin() ? "dashboard" : "overview"), true);
}
async function loadCore() {
  const [pr, pj, pm] = await Promise.all([
    sb.from("profiles").select("*").order("created_at"),
    sb.from("projects").select("*").order("created_at"),
    sb.from("project_members").select("*"),
  ]);
  S.profiles = must(pr); S.projects = must(pj); S.memberships = must(pm);
}
function fillProjectSelect() {
  const sel = $("#project-select");
  sel.innerHTML = S.projects.length ? S.projects.map((p) => `<option value="${p.id}" ${p.id === S.pid ? "selected" : ""}>📁 ${esc(p.name)}</option>`).join("")
    : `<option>لا توجد مشاريع</option>`;
  sel.onchange = () => selectProject(sel.value);
}
function selectProject(id) {
  S.pid = id; localStorage.setItem("pid", id);
  $("#project-select").value = id;
  subscribe();
  if (NO_PROJECT.includes(S.view)) go("overview"); else render();
}

// ---------------------------------------------------------------- التنقل
const NAV = [
  { sec: "الإدارة", admin: true, items: [["dashboard", "🏛️", "لوحة التحكم"], ["inbox", "📨", "الرسائل والتعميمات"], ["members", "👥", "الأعضاء والصلاحيات"], ["videos", "🎬", "فيديو شرح عن المنصة"]] },
  { sec: "التواصل", member: true, items: [["inbox", "📨", "صندوق الوارد"], ["videos", "🎬", "فيديو شرح عن المنصة"]] },
  { sec: "المشروع", items: [["overview", "📊", "نظرة عامة"], ["tasks", "✅", "المهام"], ["files", "🗂️", "ملفات المشروع"], ["plan", "🗓️", "الخطة ومخطط جانت"], ["timeline", "🌐", "الخط الزمني 3D"], ["activity", "🕓", "سجل العمل"]] },
  { sec: "المخزون المعرفي", items: [["research", "🔬", "أبحاث مهمة"], ["books", "📚", "كتب مهمة"], ["misc", "🧩", "منوعات"], ["parts", "🔩", "القطع المطلوبة"], ["contacts", "📇", "أرقام مهمة"]] },
  { sec: "التقارير", admin: true, items: [["reports", "🖨️", "التقارير والتقييم"]] },
];
function buildNav() {
  $("#nav").innerHTML = NAV.filter((g) => (!g.admin || isAdmin()) && (!g.member || !isAdmin())).map((g) =>
    `<div class="sec">${g.sec}</div>` + g.items.map(([v, i, l]) => `<a href="#${v}" data-v="${v}"><i class="ico3d">${i}</i><span>${l}</span>${v === "inbox" ? `<b class="nav-badge hidden" id="nav-inbox-badge"></b>` : ""}</a>`).join("")).join("");
  $("#menu-btn").onclick = () => $("#nav").classList.toggle("open");
}
const ADMIN_ONLY = ["dashboard", "members", "reports"];
const NO_PROJECT = ["dashboard", "members", "inbox", "videos"];
window.addEventListener("hashchange", () => { const v = location.hash.slice(1); if (v && v !== S.view && S.me) go(v, true); });
function go(view, fromHash) {
  if (!VIEWS[view] || (ADMIN_ONLY.includes(view) && !isAdmin())) view = isAdmin() ? "dashboard" : "overview";
  S.view = view;
  if (!fromHash || location.hash.slice(1) !== view) history.replaceState(null, "", "#" + view);
  render();
}
async function render() {
  S.cleanup.forEach((f) => { try { f(); } catch {} }); S.cleanup = [];
  $("#tip").classList.add("hidden");
  $$("#nav a").forEach((a) => a.classList.toggle("active", a.dataset.v === S.view));
  $("#nav").classList.remove("open");
  const main = $("#main");
  if (!NO_PROJECT.includes(S.view) && !S.pid) {
    main.innerHTML = `<div class="empty"><img src="assets/emblem.png" width="160"><h2>لا يوجد مشروع بعد</h2><p>${isAdmin() ? "أنشئ مشروعاً من لوحة التحكم" : "لم تتم إضافتك إلى أي مشروع بعد — تواصل مع المشرف"}</p></div>`;
    return;
  }
  main.innerHTML = `<div class="empty">⏳ جارِ التحميل…</div>`;
  try { await VIEWS[S.view](main); } catch (e) { fail(e); main.innerHTML = `<div class="empty">حدث خطأ: ${esc(e.message || e)}</div>`; }
}
const head = (title, sub = "", actions = "") =>
  `<div class="page-head"><div><h2>${title}</h2>${sub ? `<div class="sub">${sub}</div>` : ""}</div><div class="spacer"></div>${actions}</div>`;

// ---------------------------------------------------------------- التحديث اللحظي + الملاحظات
function subscribe() {
  if (S.channel) sb.removeChannel(S.channel);
  if (!S.pid) return;
  const f = `project_id=eq.${S.pid}`;
  S.channel = sb.channel("p-" + S.pid)
    .on("postgres_changes", { event: "*", schema: "public", table: "notes", filter: f }, (p) => {
      if (p.eventType === "INSERT" && p.new.user_id !== S.me.id) toast(`${NOTE_KINDS[p.new.kind]}: ${p.new.title}`);
      loadNotes();
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity", filter: f }, (p) => {
      if (p.new.user_id !== S.me.id) toast(`${pname(p.new.user_id)}: ${p.new.action}`);
      if (S.view === "activity" && $("#modal").classList.contains("hidden")) render();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: f }, () => {
      if (["tasks", "overview"].includes(S.view) && $("#modal").classList.contains("hidden") && !S.dragging) render();
    })
    .subscribe();
  loadNotes();
}
$("#notes-btn").onclick = () => $("#drawer").classList.toggle("open");
async function loadNotes() {
  if (!S.pid) return;
  S.notes = must(await sb.from("notes").select("*").eq("project_id", S.pid).order("created_at", { ascending: false }));
  const open = S.notes.filter((n) => n.kind === "issue" && !n.resolved).length;
  $("#notes-badge").textContent = open; $("#notes-badge").classList.toggle("hidden", !open);
  renderDrawer();
}
function renderDrawer() {
  const d = $("#drawer"), F = S.notesFilter;
  const list = S.notes.filter((n) => F === "all" || n.kind === F)
    .sort((a, b) => (a.kind === "announcement" ? -1 : 0) - (b.kind === "announcement" ? -1 : 0) || a.resolved - b.resolved);
  d.innerHTML = `
    <div class="row"><h3 style="margin:0">📋 المشاكل والملاحظات</h3><div class="spacer"></div><button class="icon-btn" onclick="document.getElementById('drawer').classList.remove('open')">✕</button></div>
    <div class="filters" style="margin-top:10px">${[["all", "الكل"], ["issue", "⚠️ مشاكل وأخطاء"], ["note", "📝 ملاحظات"]]
      .map(([k, l]) => `<button class="chip ${F === k ? "on" : ""}" data-f="${k}">${l}</button>`).join("")}</div>
    ${canEdit() ? `<form id="note-form" class="card" style="padding:12px;margin-bottom:12px">
      <select name="kind">${Object.entries(NOTE_KINDS).filter(([k]) => k !== "announcement").map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>
      <input name="title" placeholder="العنوان" required style="margin-top:6px">
      <textarea name="body" placeholder="التفاصيل (اختياري)" style="margin-top:6px;min-height:60px"></textarea>
      <button class="btn sm" style="margin-top:6px">إضافة</button></form>` : ""}
    ${list.map((n) => `<div class="note ${n.kind} ${n.resolved ? "resolved" : ""}">
        <div class="row"><b>${esc(n.title)}</b><div class="spacer"></div>
        ${n.kind === "issue" && canEdit() ? `<button class="btn ghost sm" data-res="${n.id}">${n.resolved ? "↩︎ إعادة فتح" : "✔ تم الحل"}</button>` : ""}
        ${isAdmin() || n.user_id === S.me.id ? `<button class="icon-btn" data-del="${n.id}" title="حذف">🗑</button>` : ""}</div>
        ${n.body ? `<div style="white-space:pre-wrap;margin:4px 0">${esc(n.body)}</div>` : ""}
        <small>${NOTE_KINDS[n.kind]} · ${esc(pname(n.user_id))} · ${fmtTime(n.created_at)}</small></div>`).join("") || `<div class="empty">لا شيء هنا 🌾</div>`}`;
  $$("[data-f]", d).forEach((b) => (b.onclick = () => { S.notesFilter = b.dataset.f; renderDrawer(); }));
  const nf = $("#note-form", d);
  if (nf) nf.onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(nf));
    try { must(await sb.from("notes").insert({ ...fd, project_id: S.pid, user_id: S.me.id })); log(`أضاف ${NOTE_KINDS[fd.kind]}`, fd.title); loadNotes(); } catch (er) { fail(er); }
  };
  $$("[data-res]", d).forEach((b) => (b.onclick = async () => {
    const n = S.notes.find((x) => x.id === b.dataset.res);
    await sb.from("notes").update({ resolved: !n.resolved }).eq("id", n.id); loadNotes();
  }));
  $$("[data-del]", d).forEach((b) => (b.onclick = async () => { if (confirmBox("حذف؟")) { await sb.from("notes").delete().eq("id", b.dataset.del); loadNotes(); } }));
}

// ---------------------------------------------------------------- استدعاء دالة المدير
async function adminCall(body) {
  const { data, error } = await sb.functions.invoke("admin-users", { body });
  if (error) {
    let m = error.message;
    try { m = (await error.context.json()).error || m; } catch {}
    throw new Error(m);
  }
  return data;
}

// =====================================================================
//                                 الواجهات
// =====================================================================
const VIEWS = {};

// ---------------------------------------------------------------- لوحة تحكم المدير
VIEWS.dashboard = async (main) => {
  await loadCore(); fillProjectSelect();
  const tasks = must(await sb.from("tasks").select("project_id,status,progress,due_date"));
  const stats = S.projects.map((p) => {
    const t = tasks.filter((x) => x.project_id === p.id);
    return { ...p, total: t.length, done: t.filter((x) => x.status === "done").length, progress: avg(t.map(taskProg)), overdue: t.filter(isOverdue).length };
  });
  const members = S.profiles.filter((p) => p.role !== "admin");
  main.innerHTML = head("لوحة التحكم", `أهلاً ${esc(S.me.full_name || "")} — نظرة شاملة على كل الفرق والمشاريع`,
    `<button class="btn gold" id="new-proj">＋ مشروع جديد</button>`) + `
    <div class="kpis">
      <div class="kpi"><b>${S.projects.length}</b><span>مشاريع</span></div>
      <div class="kpi"><b>${members.length}</b><span>أعضاء</span></div>
      <div class="kpi"><b>${tasks.length}</b><span>مهمة إجمالاً</span></div>
      <div class="kpi"><b>${avg(stats.map((s) => s.progress))}%</b><span>متوسط الإنجاز</span></div>
      <div class="kpi"><b style="color:var(--red)">${tasks.filter(isOverdue).length}</b><span>مهام متأخرة</span></div>
    </div>
    <div class="farm-wrap" id="farm-wrap">
      <div class="three-d farm" id="proj3d"></div>
      <div class="farm-hud">
        <button class="btn3d" id="farm-reset">🔄 إعادة الضبط</button>
        <button class="btn3d" id="farm-tour">🎥 جولة تلقائية</button>
        <button class="btn3d" id="farm-fs">⛶ ملء الشاشة</button>
      </div>
      <div class="farm-legend">
        <b>🌳 كل شجرة زيتون = مشروع</b>
        <span>📏 حجم الشجرة = نسبة الإنجاز</span><span>🫒 الثمار = المهام المنجزة</span>
        <span><i style="background:#e8c27a"></i>جارٍ</span><span><i style="background:#2fbf71"></i>مكتمل ⭐</span><span><i style="background:#ff4d4f"></i>مهام متأخرة 🚩</span>
        <small>🖱️ اسحب للتدوير · العجلة للتكبير (بحدود) · زر يمين للتحريك · انقر على شجرة</small>
      </div>
      <div class="farm-card hidden" id="farm-card"></div>
    </div>
    <h3 style="margin:22px 0 10px;color:var(--green)">المشاريع</h3>
    <div class="cards">${stats.map((p) => `
      <div class="card">
        <div class="row"><span class="dot" style="background:${esc(p.color)}"></span><h3 style="margin:0">${esc(p.name)}</h3><div class="spacer"></div><span class="tag gold">${esc(p.competition || "مسابقة")}</span></div>
        <p class="muted" style="min-height:2.4em">${esc(p.description || "")}</p>
        <div class="row" style="justify-content:space-between"><small>${fmtDate(p.start_date)} ← ${fmtDate(p.end_date)}</small><b>${p.progress}%</b></div>
        <div class="progress" style="margin:6px 0 10px"><div style="width:${p.progress}%"></div></div>
        <div class="row"><small>✅ ${p.done}/${p.total}</small>${p.overdue ? `<span class="tag red">${p.overdue} متأخرة</span>` : ""}<div class="spacer"></div>
          ${teamOf(p.id).map((m) => `<span class="avatar" title="${esc(m.full_name)}" style="width:26px;height:26px;font-size:12px">${esc((m.full_name || "?")[0])}</span>`).join("")}</div>
        <div class="row" style="margin-top:12px">
          <button class="btn sm" data-open="${p.id}">فتح</button>
          <button class="btn ghost sm" data-team="${p.id}">👥 الفريق</button>
          <button class="btn ghost sm" data-edit="${p.id}">✏️ تعديل</button>
          <button class="btn ghost sm" data-del="${p.id}">🗑</button>
        </div>
      </div>`).join("") || `<div class="empty">لا توجد مشاريع — ابدأ بإنشاء مشروع</div>`}</div>`;
  const farmCard = (p) => {
    const box = $("#farm-card");
    if (!p) return box.classList.add("hidden");
    const team = teamOf(p.id);
    box.innerHTML = `<button class="icon-btn fc-x" id="fc-x">✕</button>
      <div class="row"><span class="ring" style="--p:${p.progress};width:78px;height:78px"><div style="width:60px;height:60px;font-size:17px">${p.progress}%</div></span>
        <div style="flex:1;min-width:0"><h3 style="margin:0">${esc(p.name)}</h3><span class="tag gold">${esc(p.competition || "مسابقة")}</span></div></div>
      ${p.description ? `<p class="muted" style="margin:8px 0">${esc(p.description)}</p>` : ""}
      <div class="fc-stats"><div><b>${p.done}/${p.total}</b><small>مهام منجزة</small></div><div><b style="color:${p.overdue ? "var(--red)" : "inherit"}">${p.overdue}</b><small>متأخرة</small></div>
        <div><b>${p.end_date ? Math.max(0, daysLeft(p.end_date)) : "—"}</b><small>يوماً متبقياً</small></div></div>
      <div class="row" style="margin:8px 0">${team.map((m) => `<span class="avatar" title="${esc(m.full_name)}${m.prole === "manager" ? " ⭐" : ""}">${esc((m.full_name || "?")[0])}</span>`).join("") || `<small class="muted">لا أعضاء بعد</small>`}</div>
      <div class="row"><button class="btn gold" id="fc-open">📂 فتح المشروع</button><button class="btn ghost sm" id="fc-team">👥 الفريق</button><button class="btn ghost sm" id="fc-edit">✏️</button></div>`;
    box.classList.remove("hidden");
    $("#fc-x").onclick = () => farm.reset();
    $("#fc-open").onclick = () => selectProject(p.id);
    $("#fc-team").onclick = () => teamForm(S.projects.find((x) => x.id === p.id));
    $("#fc-edit").onclick = () => projectForm(S.projects.find((x) => x.id === p.id));
  };
  const farm = farmScene($("#proj3d"), stats, {
    onSelect: farmCard,
    onHover: (p) => `<b>🫒 ${esc(p.name)}</b><br>الإنجاز: ${p.progress}% · المهام: ${p.done}/${p.total}${p.overdue ? `<br>🚩 ${p.overdue} متأخرة` : ""}<br><small>انقر لعرض التفاصيل</small>`,
  });
  S.cleanup.push(farm.dispose);
  $("#farm-reset").onclick = () => farm.reset();
  $("#farm-tour").onclick = (e) => e.currentTarget.classList.toggle("off", !farm.tour());
  $("#farm-fs").onclick = () => (document.fullscreenElement ? document.exitFullscreen() : $("#farm-wrap").requestFullscreen?.());
  $("#new-proj").onclick = () => projectForm();
  $$("[data-open]").forEach((b) => (b.onclick = () => selectProject(b.dataset.open)));
  $$("[data-edit]").forEach((b) => (b.onclick = () => projectForm(S.projects.find((p) => p.id === b.dataset.edit))));
  $$("[data-team]").forEach((b) => (b.onclick = () => teamForm(S.projects.find((p) => p.id === b.dataset.team))));
  $$("[data-del]").forEach((b) => (b.onclick = async () => {
    const p = S.projects.find((x) => x.id === b.dataset.del);
    if (prompt(`سيُحذف المشروع "${p.name}" وكل محتوياته نهائياً.\nاكتب اسم المشروع للتأكيد:`) !== p.name) return;
    try { must(await sb.from("projects").delete().eq("id", p.id)); toast("تم الحذف"); if (S.pid === p.id) S.pid = null; render(); } catch (e) { fail(e); }
  }));
};

function projectForm(p = {}) {
  openModal(p.id ? "تعديل المشروع" : "مشروع جديد", `<form class="mform">
    <label>اسم المشروع<input name="name" required value="${esc(p.name)}"></label>
    <label>المسابقة<input name="competition" value="${esc(p.competition)}" placeholder="مثال: تحدي علوم المستقبل"></label>
    <label>الوصف<textarea name="description">${esc(p.description)}</textarea></label>
    <div class="grid3"><label>البداية<input type="date" name="start_date" value="${p.start_date || todayStr()}"></label>
    <label>النهاية<input type="date" name="end_date" value="${p.end_date || iso(addDays(new Date(), 90))}"></label>
    <label>اللون<input type="color" name="color" value="${p.color || "#c39a5c"}" style="height:42px"></label></div>
    <div class="form-actions"><button class="btn" type="submit">حفظ</button></div></form>`, {
    onSubmit: async (d) => {
      const row = { ...d, start_date: d.start_date || null, end_date: d.end_date || null };
      if (p.id) must(await sb.from("projects").update(row).eq("id", p.id));
      else { const np = must(await sb.from("projects").insert(row).select().single()); S.pid = np.id; localStorage.setItem("pid", np.id); }
      closeModal(); toast("تم الحفظ"); await loadCore(); fillProjectSelect(); subscribe(); render();
    },
  });
}
function teamForm(p) {
  const cur = Object.fromEntries(S.memberships.filter((m) => m.project_id === p.id).map((m) => [m.user_id, m.role]));
  const people = S.profiles.filter((x) => x.role !== "admin");
  openModal(`فريق: ${p.name}`, `<form class="mform">
    <p class="muted">حدّد دور كل عضو في هذا المشروع:<br><b>⭐ مدير المشروع</b>: يضيف ويعدّل مهام كل الأعضاء ويسندها لهم.<br><b>✏️ عضو</b>: يضيف مهامه هو فقط ويعمل عليها ويرفع ملفات.<br><b>👁️ مشاهد</b>: يطّلع فقط.</p>
    <table><tr><th>العضو</th><th>الصلاحية</th></tr>
    ${people.map((x) => `<tr><td>${esc(x.full_name)} <small class="muted">@${esc(x.username)}</small></td><td><select name="r_${x.id}">
      <option value="">— غير مشارك —</option><option value="manager" ${cur[x.id] === "manager" ? "selected" : ""}>⭐ مدير المشروع</option><option value="editor" ${cur[x.id] === "editor" ? "selected" : ""}>✏️ عضو</option>
      <option value="viewer" ${cur[x.id] === "viewer" ? "selected" : ""}>👁️ مشاهد</option></select></td></tr>`).join("")}</table>
    ${people.length ? "" : `<p class="empty">أضف أعضاء أولاً من صفحة الأعضاء</p>`}
    <div class="form-actions"><button class="btn" type="submit">حفظ الفريق</button></div></form>`, {
    onSubmit: async (d) => {
      const rows = Object.entries(d).filter(([k, v]) => k.startsWith("r_") && v).map(([k, v]) => ({ project_id: p.id, user_id: k.slice(2), role: v }));
      must(await sb.from("project_members").delete().eq("project_id", p.id));
      if (rows.length) must(await sb.from("project_members").insert(rows));
      closeModal(); toast("تم تحديث الفريق"); await loadCore(); render();
    },
  });
}

// ---------------------------------------------------------------- الأعضاء
VIEWS.members = async (main) => {
  await loadCore();
  main.innerHTML = head("الأعضاء والصلاحيات", "أنت فقط من يُنشئ الحسابات ويضع كلمات السر ويعدّلها", `<button class="btn gold" id="new-mem">＋ عضو جديد</button>`) + `
    <div class="card tbl-wrap"><table>
    <tr><th></th><th>الاسم</th><th>اسم المستخدم</th><th>الاختصاص</th><th>المشاريع والصلاحيات</th><th></th></tr>
    ${S.profiles.map((u) => `<tr>
      <td><span class="avatar">${esc((u.full_name || u.username)[0])}</span></td>
      <td><b>${esc(u.full_name)}</b> ${u.role === "admin" ? `<span class="tag gold">مدير</span>` : ""}</td>
      <td dir="ltr" style="text-align:right">${esc(u.username)}</td>
      <td>${esc(u.specialty || "—")}</td>
      <td>${S.memberships.filter((m) => m.user_id === u.id).map((m) => `<span class="tag ${m.role === "viewer" ? "gray" : ""}">${esc(S.projects.find((p) => p.id === m.project_id)?.name)} · ${ROLE_LABEL[m.role]}</span>`).join(" ") || "—"}</td>
      <td class="row"><button class="btn ghost sm" data-pw="${u.id}">🔑 كلمة السر</button>
        <button class="btn ghost sm" data-ed="${u.id}">✏️</button>
        ${u.id !== S.me.id ? `<button class="btn ghost sm" data-rm="${u.id}">🗑</button>` : ""}</td></tr>`).join("")}
    </table></div>`;
  $("#new-mem").onclick = () => openModal("عضو جديد", `<form class="mform">
    <div class="grid2"><label>الاسم الكامل<input name="full_name" required></label>
    <label>الاختصاص / الدور<input name="specialty" placeholder="مبرمج، باحث، تصميم…"></label></div>
    <div class="grid2"><label>اسم المستخدم (إنجليزي)<input name="username" required dir="ltr" pattern="[a-zA-Z0-9._-]{3,30}" placeholder="ahmad"></label>
    <label>كلمة السر<input name="password" required dir="ltr" minlength="6" value="${Math.random().toString(36).slice(2, 10)}"></label></div>
    <div class="grid2"><label>إضافته إلى مشروع<select name="project"><option value="">— لاحقاً —</option>${S.projects.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></label>
    <label>الدور<select name="prole"><option value="editor">✏️ عضو</option><option value="manager">⭐ مدير المشروع</option><option value="viewer">👁️ مشاهد</option></select></label></div>
    <div class="form-actions"><button class="btn" type="submit">إنشاء الحساب</button></div></form>`, {
    onSubmit: async (d) => {
      const r = await adminCall({ action: "create", username: d.username.toLowerCase(), password: d.password, full_name: d.full_name, specialty: d.specialty });
      if (d.project) must(await sb.from("project_members").insert({ project_id: d.project, user_id: r.id, role: d.prole }));
      const link = location.href.split("#")[0];
      openModal("تم إنشاء الحساب ✅", `<p>أرسل هذه البيانات للعضو:</p>
        <pre id="cred" style="background:#f4ede6;padding:12px;border-radius:10px">رابط المنصة: ${esc(link)}\nاسم المستخدم: ${esc(d.username.toLowerCase())}\nكلمة السر: ${esc(d.password)}</pre>
        <button class="btn" id="copy-cred">📋 نسخ</button>`, { onOpen: () => ($("#copy-cred").onclick = () => { navigator.clipboard.writeText($("#cred").textContent); toast("تم النسخ"); }) });
      render();
    },
  });
  $$("[data-pw]").forEach((b) => (b.onclick = () => {
    const u = prof(b.dataset.pw);
    openModal(`كلمة سر جديدة: ${u.full_name}`, `<form class="mform"><label>كلمة السر الجديدة<input name="password" required minlength="6" dir="ltr" value="${Math.random().toString(36).slice(2, 10)}"></label>
      <div class="form-actions"><button class="btn" type="submit">تغيير</button></div></form>`, {
      onSubmit: async (d) => { await adminCall({ action: "set_password", user_id: u.id, password: d.password }); closeModal(); toast(`تم تغيير كلمة سر ${u.full_name}: ${d.password}`); },
    });
  }));
  $$("[data-ed]").forEach((b) => (b.onclick = () => {
    const u = prof(b.dataset.ed);
    openModal("تعديل العضو", `<form class="mform"><label>الاسم الكامل<input name="full_name" value="${esc(u.full_name)}" required></label>
      <label>الاختصاص<input name="specialty" value="${esc(u.specialty)}"></label>
      <div class="form-actions"><button class="btn" type="submit">حفظ</button></div></form>`, {
      onSubmit: async (d) => { must(await sb.from("profiles").update(d).eq("id", u.id)); closeModal(); render(); },
    });
  }));
  $$("[data-rm]").forEach((b) => (b.onclick = async () => {
    const u = prof(b.dataset.rm);
    if (!confirmBox(`حذف حساب ${u.full_name} نهائياً؟ (تبقى أعماله في المشاريع)`)) return;
    try { await adminCall({ action: "delete", user_id: u.id }); toast("تم الحذف"); render(); } catch (e) { fail(e); }
  }));
};

// ---------------------------------------------------------------- نظرة عامة
VIEWS.overview = async (main) => {
  const p = project();
  const [tasks, goals, acts] = await Promise.all([
    sb.from("tasks").select("*").eq("project_id", S.pid).then(must),
    sb.from("goals").select("*").eq("project_id", S.pid).then(must),
    sb.from("activity").select("*").eq("project_id", S.pid).order("created_at", { ascending: false }).limit(12).then(must),
  ]);
  const prog = avg(tasks.map(taskProg));
  const done = tasks.filter((t) => t.status === "done").length;
  const left = p.end_date ? daysLeft(p.end_date) : null;
  const team = teamOf();
  const upcoming = tasks.filter((t) => t.status !== "done" && t.due_date && daysLeft(t.due_date) <= 7).sort((a, b) => a.due_date.localeCompare(b.due_date));
  main.innerHTML = head(esc(p.name), `${esc(p.competition || "")} · ${fmtDate(p.start_date)} ← ${fmtDate(p.end_date)} · صلاحيتك: <b>${ROLE_LABEL[myRole()] || "—"}</b>`) + `
    <div class="kpis">
      <div class="kpi" style="display:flex;align-items:center;gap:14px"><div class="ring" style="--p:${prog}"><div>${prog}%</div></div><span>نسبة إنجاز<br>المشروع</span></div>
      <div class="kpi"><b>${done}/${tasks.length}</b><span>مهام منجزة</span></div>
      <div class="kpi"><b>${tasks.filter((t) => t.status === "doing" || t.status === "review").length}</b><span>قيد العمل والمراجعة</span></div>
      <div class="kpi"><b style="color:var(--red)">${tasks.filter(isOverdue).length}</b><span>متأخرة</span></div>
      <div class="kpi"><b>${left === null ? "—" : left < 0 ? "انتهى" : left}</b><span>يوماً متبقياً</span></div>
    </div>
    <div class="two-col">
      <div class="card"><h3>إنجاز أعضاء الفريق</h3><canvas id="ch-members" height="130"></canvas></div>
      <div class="card"><h3>حالة المهام</h3><canvas id="ch-status" height="200"></canvas></div>
    </div>
    <div class="two-col" style="margin-top:16px">
      <div class="card"><h3>الأهداف</h3>${goals.length ? goals.map((g) => {
        const gp = avg(tasks.filter((t) => t.goal_id === g.id).map(taskProg));
        return `<div style="margin-bottom:12px"><div class="row"><b>${esc(g.title)}</b><span class="tag gold">${PERIODS[g.period]}</span><div class="spacer"></div><b>${gp}%</b></div>
          <div class="progress" style="margin-top:6px"><div style="width:${gp}%"></div></div></div>`;
      }).join("") : `<p class="muted">لم تُحدَّد أهداف بعد — من صفحة الخطة</p>`}</div>
      <div class="card"><h3>⏰ مواعيد قريبة</h3>${upcoming.map((t) => `<div class="row" style="padding:6px 0;border-bottom:1px dashed var(--line)">
        <a href="javascript:void 0" data-task="${t.id}">${esc(t.title)}</a><div class="spacer"></div>
        <span class="tag ${isOverdue(t) ? "red" : "gold"}">${isOverdue(t) ? "متأخرة" : fmtDate(t.due_date)}</span></div>`).join("") || `<p class="muted">لا مواعيد خلال أسبوع</p>`}</div>
    </div>
    <div class="card" style="margin-top:16px"><h3>آخر النشاطات</h3><div class="feed">${feedHtml(acts)}</div></div>`;
  const ch1 = new Chart($("#ch-members"), {
    type: "bar",
    data: { labels: team.map((m) => m.full_name), datasets: [
      { label: "منجزة", data: team.map((m) => tasks.filter((t) => t.assignee === m.id && t.status === "done").length), backgroundColor: "#2a6049", borderRadius: 6 },
      { label: "متبقية", data: team.map((m) => tasks.filter((t) => t.assignee === m.id && t.status !== "done").length), backgroundColor: "#c39a5c", borderRadius: 6 }] },
    options: { plugins: { legend: { labels: { font: { family: "Tajawal" } } } }, scales: { x: { stacked: true, ticks: { font: { family: "Tajawal" } } }, y: { stacked: true, ticks: { precision: 0 } } } },
  });
  const ch2 = new Chart($("#ch-status"), {
    type: "doughnut",
    data: { labels: Object.values(STATUS), datasets: [{ data: Object.keys(STATUS).map((s) => tasks.filter((t) => t.status === s).length), backgroundColor: ["#9bb3a6", "#c39a5c", "#3c6e9c", "#2a6049"] }] },
    options: { cutout: "62%", plugins: { legend: { position: "bottom", labels: { font: { family: "Tajawal" } } } } },
  });
  S.cleanup.push(() => ch1.destroy(), () => ch2.destroy());
  $$("[data-task]").forEach((a) => (a.onclick = () => openTask(a.dataset.task)));
};
function feedHtml(acts) {
  return acts.map((a) => `<div class="item"><span class="avatar">${esc(initials(a.user_id))}</span>
    <div><b>${esc(pname(a.user_id))}</b> ${esc(a.action)} ${a.details ? `<span class="muted">— ${esc(a.details)}</span>` : ""}<br><small class="muted">${fmtTime(a.created_at)}</small></div></div>`).join("") || `<p class="muted">لا نشاط بعد</p>`;
}

// ---------------------------------------------------------------- المهام
VIEWS.tasks = async (main) => {
  const tasks = must(await sb.from("tasks").select("*").eq("project_id", S.pid).order("created_at"));
  const subs = must(await sb.from("submissions").select("task_id").eq("project_id", S.pid));
  const F = S.taskFilter || "all", MODE = S.taskMode || "tiles";
  const shown = tasks.filter((t) => F === "all" || (F === "mine" ? t.assignee === S.me.id : F in STATUS ? t.status === F : t.priority === F));
  const nSub = (id) => subs.filter((x) => x.task_id === id).length;
  const tile = (t) => {
    const done = t.status === "done", p = taskProg(t);
    return `<div class="tile ${done ? "done" : "pr-" + t.priority} ${isOverdue(t) ? "late" : ""}" data-id="${t.id}" draggable="${MODE === "board" && canEditTask(t)}">
      <div class="tile-shine"></div>
      <div class="tile-top"><span class="pill">${done ? "✔ منجزة" : "● " + PRIORITY[t.priority]}</span><span class="pill ghost">${TYPES[t.type]}</span></div>
      <div class="tile-title">${esc(t.title)}</div>
      <div class="tile-meta"><span>👤 ${esc(pname(t.assignee))}</span>${t.due_date ? `<span>${isOverdue(t) ? "⏰ متأخرة" : "📅 " + fmtDate(t.due_date)}</span>` : ""}</div>
      ${t.status !== "todo" ? `<div class="tile-bar"><div style="width:${p}%;--bc:${STATUS_COLOR[t.status]}"></div></div>
        <div class="tile-foot"><span class="st-dot" style="--bc:${STATUS_COLOR[t.status]}">${STATUS[t.status]}</span><b>${p}%</b></div>`
        : `<div class="tile-foot"><span class="st-dot" style="--bc:${STATUS_COLOR.todo}">${STATUS.todo}</span></div>`}
      <div class="tile-icons">${nSub(t.id) ? `<span>📎 ${nSub(t.id)}</span>` : ""}${t.score != null ? `<span>⭐ ${t.score}/10</span>` : ""}</div>
    </div>`;
  };
  const order = { doing: 0, review: 1, todo: 2, done: 3 }, prio = { high: 0, med: 1, low: 2 };
  main.innerHTML = head("المهام", isManager() ? "أنت مدير — يمكنك إضافة المهام لأي عضو وتعديلها" : "تضيف مهامك أنت فقط · انقر على أي مربع للتفاصيل ورفع العمل",
    `<div class="seg"><button class="${MODE === "tiles" ? "on" : ""}" data-mode="tiles">▦ مربعات</button><button class="${MODE === "board" ? "on" : ""}" data-mode="board">▥ أعمدة</button></div>
     ${canEdit() ? `<button class="btn gold pulse" id="new-task">＋ مهمة جديدة</button>` : ""}`) + `
    <div class="filters">${[["all", "الكل"], ["mine", "مهامي"], ...Object.entries(STATUS), ["high", "🔴 عالية"], ["med", "🔵 متوسطة"], ["low", "🟡 منخفضة"]]
      .map(([k, l]) => `<button class="chip ${F === k ? "on" : ""}" data-tf="${k}">${l}</button>`).join("")}</div>
    <div class="legend-row"><span><i style="background:${PRIO_COLOR.high}"></i>أولوية عالية</span><span><i style="background:${PRIO_COLOR.med}"></i>متوسطة</span>
      <span><i style="background:${PRIO_COLOR.low}"></i>منخفضة</span><span><i style="background:${STATUS_COLOR.done}"></i>منجزة</span>
      <span class="muted">· الشريط: <b style="color:${STATUS_COLOR.doing}">قيد العمل</b> / <b style="color:${STATUS_COLOR.review}">للمراجعة</b> / <b style="color:${STATUS_COLOR.done}">منجزة</b></span></div>
    ${MODE === "tiles"
      ? `<div class="tiles">${shown.sort((a, b) => order[a.status] - order[b.status] || prio[a.priority] - prio[b.priority]).map(tile).join("") || `<div class="empty">لا مهام هنا</div>`}</div>`
      : `<div class="kanban">${Object.entries(STATUS).map(([st, l]) => { const col = shown.filter((t) => t.status === st);
          return `<div class="col" data-col="${st}"><h4><span><span class="st-dot" style="--bc:${STATUS_COLOR[st]}"></span>${l}</span><span class="tag">${col.length}</span></h4>${col.map(tile).join("")}</div>`; }).join("")}</div>`}`;
  $("#new-task") && ($("#new-task").onclick = () => taskForm());
  $$("[data-tf]").forEach((b) => (b.onclick = () => { S.taskFilter = b.dataset.tf; render(); }));
  $$("[data-mode]").forEach((b) => (b.onclick = () => { S.taskMode = b.dataset.mode; render(); }));
  $$(".tile").forEach((el) => {
    el.onclick = () => openTask(el.dataset.id);
    tilt(el);
    el.ondragstart = (e) => { S.dragging = true; e.dataTransfer.setData("text", el.dataset.id); };
    el.ondragend = () => (S.dragging = false);
  });
  $$(".col").forEach((col) => {
    col.ondragover = (e) => { e.preventDefault(); col.classList.add("drag-over"); };
    col.ondragleave = () => col.classList.remove("drag-over");
    col.ondrop = async (e) => {
      e.preventDefault(); col.classList.remove("drag-over"); S.dragging = false;
      const id = e.dataTransfer.getData("text"), st = col.dataset.col, t = tasks.find((x) => x.id === id);
      if (!t || t.status === st) return;
      if (!canEditTask(t)) return toast("يمكنك تحريك مهامك فقط", "err");
      try { await setStatus(t, st); render(); } catch (er) { fail(er); }
    };
  });
};
// ميلان ثلاثي الأبعاد يتبع الفأرة
function tilt(el, max = 10) {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateZ(6px)`;
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`); el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  });
  el.addEventListener("pointerleave", () => (el.style.transform = ""));
}
async function setStatus(t, st) {
  const upd = { status: st, updated_at: new Date().toISOString() };
  if (st === "done") { upd.progress = 100; upd.completed_at = new Date().toISOString(); } else upd.completed_at = null;
  if (st === "review" && (t.progress || 0) < 90) upd.progress = 90;
  must(await sb.from("tasks").update(upd).eq("id", t.id));
  log(`نقل المهمة إلى «${STATUS[st]}»`, t.title);
}
async function taskForm(t = {}) {
  const goals = must(await sb.from("goals").select("id,title").eq("project_id", S.pid));
  const team = teamOf();
  openModal(t.id ? "تعديل المهمة" : "مهمة جديدة", `<form class="mform">
    <label>العنوان<input name="title" required value="${esc(t.title)}"></label>
    <label>الوصف والمطلوب<textarea name="description">${esc(t.description)}</textarea></label>
    <div class="grid3"><label>النوع<select name="type">${opts(TYPES, t.type || "research")}</select></label>
      <label>الأولوية<select name="priority">${opts(PRIORITY, t.priority || "med")}</select></label>
      <label>الحالة<select name="status">${opts(STATUS, t.status || "todo")}</select></label></div>
    <div class="grid2">${isManager()
      ? `<label>المسؤول عن المهمة<select name="assignee" required><option value="">— اختر العضو —</option>${team.map((m) => `<option value="${m.id}" ${m.id === t.assignee ? "selected" : ""}>${esc(m.full_name)}${m.prole === "manager" ? " ⭐" : ""}</option>`).join("")}</select></label>`
      : `<label>المسؤول عن المهمة<div class="assignee-fixed"><span class="avatar">${esc(initials(t.assignee || S.me.id))}</span><b>${esc(pname(t.assignee || S.me.id))}</b><small class="muted">${t.id ? "" : "(أنت)"}</small></div>
         <input type="hidden" name="assignee" value="${t.assignee || S.me.id}"></label>`}
      <label>يتبع الهدف<select name="goal_id"><option value="">— بلا هدف —</option>${goals.map((g) => `<option value="${g.id}" ${g.id === t.goal_id ? "selected" : ""}>${esc(g.title)}</option>`).join("")}</select></label></div>
    <div class="grid3"><label>تاريخ البدء<input type="date" name="start_date" value="${t.start_date || todayStr()}"></label>
      <label>الموعد النهائي<input type="date" name="due_date" value="${t.due_date || iso(addDays(new Date(), 7))}"></label>
      <label>نسبة الإنجاز %<input type="number" name="progress" min="0" max="100" value="${t.progress || 0}"></label></div>
    <div class="form-actions">${t.id && canEditTask(t) ? `<button type="button" class="btn danger" id="del-task">حذف</button><div class="spacer"></div>` : ""}<button class="btn" type="submit">حفظ</button></div></form>`, {
    onSubmit: async (d) => {
      if (!isManager()) d.assignee = t.assignee || S.me.id;
      const row = { ...d, assignee: d.assignee || null, goal_id: d.goal_id || null, start_date: d.start_date || null, due_date: d.due_date || null,
        progress: d.status === "done" ? 100 : +d.progress || 0, updated_at: new Date().toISOString() };
      if (d.status === "done" && t.status !== "done") row.completed_at = new Date().toISOString();
      if (t.id) { must(await sb.from("tasks").update(row).eq("id", t.id)); log("عدّل المهمة", d.title); }
      else { must(await sb.from("tasks").insert({ ...row, project_id: S.pid, created_by: S.me.id })); log("أضاف مهمة", d.title); }
      closeModal(); toast("تم الحفظ"); render();
    },
    onOpen: () => { const del = $("#del-task"); if (del) del.onclick = async () => {
      if (!confirmBox("حذف المهمة وكل ما رُفع عليها؟")) return;
      must(await sb.from("tasks").delete().eq("id", t.id)); log("حذف مهمة", t.title); closeModal(); render();
    }; },
  });
}
async function openTask(id) {
  const t = must(await sb.from("tasks").select("*").eq("id", id).single());
  const subs = must(await sb.from("submissions").select("*").eq("task_id", id).order("created_at"));
  const url = await signed(subs.map((s) => s.file_path));
  const ed = canEditTask(t), up = canEdit();
  const subHtml = (s) => {
    let body = "";
    if (s.kind === "image" && s.file_path) body = `<a href="${url(s.file_path)}" target="_blank"><img src="${url(s.file_path)}" loading="lazy"></a>`;
    else if (s.kind === "file" && s.file_path) body = `<a class="btn ghost sm" href="${url(s.file_path)}" target="_blank">⬇️ فتح / تنزيل الملف</a>`;
    else if (s.kind === "code") body = `<div class="row"><span class="tag blue">${esc(LANGS.find((l) => l[0] === s.language)?.[1] || s.language)}</span>
      <button class="btn ghost sm" data-tofile="${s.id}">↪︎ أضِفه إلى ملفات المشروع</button></div><pre>${esc(s.content)}</pre>`;
    else if (s.kind === "link") body = `<a href="${esc(s.content)}" target="_blank" dir="ltr">${esc(s.content)}</a>`;
    else body = `<div style="white-space:pre-wrap">${esc(s.content)}</div>`;
    return `<div class="sub-item"><div class="row"><b>${esc(s.title || "")}</b><div class="spacer"></div><small class="muted">${esc(pname(s.user_id))} · ${fmtTime(s.created_at)}</small>
      ${ed || s.user_id === S.me.id ? `<button class="icon-btn" data-delsub="${s.id}">🗑</button>` : ""}</div>${body}</div>`;
  };
  openModal(t.title, `
    <div class="row" style="margin-bottom:10px"><span class="tag">${STATUS[t.status]}</span><span class="tag gold">${TYPES[t.type]}</span>
      <span class="tag" style="background:${PRIO_COLOR[t.priority]};color:${t.priority === "low" ? "#3a2f00" : "#fff"}">أولوية ${PRIORITY[t.priority]}</span>
      <span>👤 ${esc(pname(t.assignee))}</span><span>📅 ${fmtDate(t.start_date)} ← ${fmtDate(t.due_date)}</span>
      ${isOverdue(t) ? `<span class="tag red">متأخرة</span>` : ""}<div class="spacer"></div>${ed ? `<button class="btn ghost sm" id="edit-task">✏️ تعديل</button>` : ""}</div>
    ${t.description ? `<div class="card" style="white-space:pre-wrap;margin-bottom:12px">${esc(t.description)}</div>` : ""}
    <div class="row" style="margin-bottom:14px"><b>الإنجاز</b><input type="range" id="tp" min="0" max="100" step="5" value="${taskProg(t)}" ${ed ? "" : "disabled"} style="flex:1"><b id="tpv">${taskProg(t)}%</b>
      ${ed ? `<select id="ts" style="width:auto">${opts(STATUS, t.status)}</select>` : ""}</div>
    ${isAdmin() ? `<div class="card" style="margin-bottom:14px;background:var(--gold-soft)"><h3>⭐ تقييم المشرف</h3>
      <div class="grid2"><label>الدرجة من 10<input type="number" id="sc" min="0" max="10" value="${t.score ?? ""}"></label>
      <label>ملاحظات التقييم<input id="fb" value="${esc(t.feedback)}"></label></div><button class="btn sm" id="save-score">حفظ التقييم</button></div>`
      : t.score != null ? `<div class="card" style="margin-bottom:14px;background:var(--gold-soft)">⭐ تقييم المشرف: <b>${t.score}/10</b> ${t.feedback ? "— " + esc(t.feedback) : ""}</div>` : ""}
    <h3 style="color:var(--green)">📎 الأعمال المرفوعة (${subs.length})</h3>
    ${subs.map(subHtml).join("") || `<p class="muted">لم يُرفع شيء بعد</p>`}
    ${up ? `<form class="mform card" style="margin-top:12px"><h3>رفع عمل جديد</h3>
      <div class="grid2"><label>النوع<select name="kind" id="sk">
        <option value="file">📄 ملف (PDF، Word، …)</option><option value="image">🖼️ صورة</option><option value="code">💻 كود برمجي</option>
        <option value="link">🔗 رابط</option><option value="text">📝 نص / ملخص</option></select></label>
        <label>العنوان<input name="title" placeholder="مثال: ملخص البحث الأول"></label></div>
      <div id="sk-fields"></div>
      <div class="form-actions"><button class="btn gold" type="submit">⬆️ رفع</button></div></form>` : ""}`, {
    wide: true,
    onOpen: (box) => {
      if (!up) return;
      const fields = {
        file: `<label>الملفات<input type="file" name="file" multiple required></label>`,
        image: `<label>الصور<input type="file" name="file" accept="image/*" multiple required></label>`,
        code: `<div class="grid2"><label>لغة البرمجة<select name="language" id="sl">${langOptions("python")}</select></label>
          <label>أو اختر ملف الكود<input type="file" id="codefile"></label></div>
          <label>الكود<textarea name="content" id="codetxt" dir="ltr" style="font-family:monospace;min-height:200px" required></textarea></label>`,
        link: `<label>الرابط<input name="content" type="url" dir="ltr" required placeholder="https://"></label>`,
        text: `<label>النص<textarea name="content" required style="min-height:160px"></textarea></label>`,
      };
      const setK = () => {
        $("#sk-fields").innerHTML = fields[$("#sk").value];
        const cf = $("#codefile");
        if (cf) cf.onchange = async () => { const f = cf.files[0]; if (!f) return; $("#codetxt").value = await f.text(); $("#sl").value = langOf(f.name); };
      };
      $("#sk").onchange = setK; setK();
      if (ed) {
        $("#edit-task").onclick = () => taskForm(t);
        const tp = $("#tp");
        tp.oninput = () => ($("#tpv").textContent = tp.value + "%");
        tp.onchange = async () => {
          const upd = { progress: +tp.value, updated_at: new Date().toISOString() };
          if (t.status === "todo" && +tp.value > 0) upd.status = "doing";
          must(await sb.from("tasks").update(upd).eq("id", t.id)); log(`حدّث الإنجاز إلى ${tp.value}%`, t.title); toast("تم التحديث"); render();
        };
        $("#ts").onchange = async () => { await setStatus(t, $("#ts").value); toast("تم تغيير الحالة"); openTask(t.id); render(); };
      }
      $$("[data-delsub]", box).forEach((b) => (b.onclick = async () => {
        if (!confirmBox("حذف هذا العمل؟")) return;
        const s = subs.find((x) => x.id === b.dataset.delsub);
        if (s.file_path) await sb.storage.from(BUCKET).remove([s.file_path]);
        must(await sb.from("submissions").delete().eq("id", s.id)); openTask(t.id);
      }));
      $$("[data-tofile]", box).forEach((b) => (b.onclick = async () => {
        const s = subs.find((x) => x.id === b.dataset.tofile);
        const ext = Object.entries(EXT_LANG).find(([, v]) => v === s.language)?.[0] || "txt";
        const path = prompt("مسار الملف داخل مجلد المشروع:", `src/${safeName(s.title || "code").replace(/\.\w+$/, "")}.${ext}`);
        if (!path) return;
        try { await saveProjectFile(path.trim(), s.content, s.language, true); toast("أُضيف إلى ملفات المشروع"); } catch (e) { fail(e); }
      }));
    },
    onSubmit: async (d, form) => {
      const files = form.querySelector("input[name=file]")?.files;
      if (files && files.length) {
        for (const f of files) {
          const path = await uploadFile(f, "tasks");
          must(await sb.from("submissions").insert({ project_id: S.pid, task_id: t.id, user_id: S.me.id, kind: d.kind, title: d.title || f.name, file_path: path }));
        }
      } else {
        must(await sb.from("submissions").insert({ project_id: S.pid, task_id: t.id, user_id: S.me.id, kind: d.kind, title: d.title, content: d.content, language: d.language || null }));
      }
      if (t.status === "todo" && ed) await setStatus(t, "doing");
      log("رفع عملاً على المهمة", t.title); toast("تم الرفع ✅"); openTask(t.id);
    },
  });
  if (isAdmin()) $("#save-score").onclick = async () => {
    const sc = $("#sc").value === "" ? null : Math.max(0, Math.min(10, +$("#sc").value));
    must(await sb.from("tasks").update({ score: sc, feedback: $("#fb").value || null }).eq("id", t.id)); toast("تم حفظ التقييم");
  };
}

// ---------------------------------------------------------------- ملفات المشروع (محرر أكواد + سجل)
let monacoP;
function loadMonaco() {
  if (monacoP) return monacoP;
  const base = "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min";
  window.MonacoEnvironment = { getWorkerUrl: () => `data:text/javascript;charset=utf-8,${encodeURIComponent(`self.MonacoEnvironment={baseUrl:'${base}/'};importScripts('${base}/vs/base/worker/workerMain.js');`)}` };
  monacoP = new Promise((res) => { window.require.config({ paths: { vs: base + "/vs" } }); window.require(["vs/editor/editor.main"], () => res(window.monaco)); });
  return monacoP;
}
async function saveProjectFile(path, content, language, isNew) {
  const ex = must(await sb.from("files").select("id,content").eq("project_id", S.pid).eq("path", path).maybeSingle());
  if (ex) {
    if (isNew && !confirmBox(`الملف ${path} موجود — استبداله؟`)) return null;
    must(await sb.from("files").update({ content, language, ...(S.filesLegacy ? {} : { size: new Blob([content]).size }), updated_by: S.me.id, updated_at: new Date().toISOString() }).eq("id", ex.id));
    must(await sb.from("file_versions").insert({ project_id: S.pid, file_id: ex.id, path, action: "update", content, user_id: S.me.id }));
    log("عدّل الملف", path); return ex.id;
  }
  const f = must(await sb.from("files").insert({ project_id: S.pid, path, content, language, ...(S.filesLegacy ? {} : { size: new Blob([content]).size }), updated_by: S.me.id }).select("id").single());
  must(await sb.from("file_versions").insert({ project_id: S.pid, file_id: f.id, path, action: "create", content, user_id: S.me.id }));
  log("أنشأ الملف", path); return f.id;
}
let filesWS;
VIEWS.files = (main) => {
  filesWS ||= createFilesView({ sb, S, $, $$, esc, toast, fail, must, openModal, closeModal, confirmBox, canEdit, pname, project, log, fmtTime, head, BUCKET, loadMonaco, signed, safeName });
  return filesWS.view(main);
};

// ---------------------------------------------------------------- الخطة + جانت
VIEWS.plan = async (main) => {
  const [goals, tasks] = await Promise.all([
    sb.from("goals").select("*").eq("project_id", S.pid).order("start_date").then(must),
    sb.from("tasks").select("*").eq("project_id", S.pid).then(must),
  ]);
  const P = S.planPeriod || "all";
  const gprog = (g) => avg(tasks.filter((t) => t.goal_id === g.id).map(taskProg));
  const byPeriod = Object.keys(PERIODS).map((k) => { const gs = goals.filter((g) => g.period === k); return [k, gs.length, avg(gs.map(gprog))]; });
  const now = todayStr();
  main.innerHTML = head("الخطة ومخطط جانت", "الأهداف الشهرية والربعية ونصف السنوية والسنوية — نسبة كل هدف تُحسب من مهامه",
    canEdit() ? `<button class="btn gold" id="new-goal">＋ هدف جديد</button>` : "") + `
    <div class="kpis">${byPeriod.map(([k, n, p]) => `<div class="kpi" style="display:flex;gap:12px;align-items:center">
      <div class="ring" style="--p:${p};width:84px;height:84px"><div style="width:64px;height:64px;font-size:18px">${p}%</div></div>
      <div><b style="font-size:20px">${PERIODS[k]}</b><span>${n} أهداف</span></div></div>`).join("")}</div>
    <div class="card"><div class="period-tabs">${[["all", "الكل"], ...Object.entries(PERIODS)].map(([k, l]) => `<button class="chip ${P === k ? "on" : ""}" data-pp="${k}">${l}</button>`).join("")}
      <span class="spacer"></span><span class="muted">الحالية: ${goals.filter((g) => g.start_date <= now && g.end_date >= now).length} · المتبقية: ${goals.filter((g) => gprog(g) < 100).length}</span></div>
      <div class="tbl-wrap"><table><tr><th>الهدف</th><th>الفترة</th><th>من</th><th>إلى</th><th>المهام</th><th style="width:28%">الإنجاز</th><th></th></tr>
      ${goals.filter((g) => P === "all" || g.period === P).map((g) => { const gp = gprog(g), n = tasks.filter((t) => t.goal_id === g.id);
        return `<tr><td><b>${esc(g.title)}</b></td><td><span class="tag gold">${PERIODS[g.period]}</span></td><td>${fmtDate(g.start_date)}</td><td>${fmtDate(g.end_date)}</td>
        <td>${n.filter((t) => t.status === "done").length}/${n.length}</td><td><div class="row"><div class="progress" style="flex:1"><div style="width:${gp}%"></div></div><b>${gp}%</b></div></td>
        <td>${canEdit() ? `<button class="icon-btn" data-eg="${g.id}">✏️</button><button class="icon-btn" data-dg="${g.id}">🗑</button>` : ""}</td></tr>`; }).join("") || `<tr><td colspan="7" class="empty">لا أهداف بعد</td></tr>`}
      </table></div></div>
    <div class="card" style="margin-top:16px"><div class="row"><h3 style="margin:0">مخطط جانت</h3><div class="spacer"></div>
      ${["Day", "Week", "Month"].map((m) => `<button class="chip ${(S.ganttMode || "Week") === m ? "on" : ""}" data-gm="${m}">${{ Day: "يومي", Week: "أسبوعي", Month: "شهري" }[m]}</button>`).join("")}</div>
      <p class="muted">${canEdit() ? "اسحب الأشرطة لتغيير التواريخ · " : ""}انقر على مهمة لفتحها</p><div class="gantt-wrap"><svg id="gantt"></svg></div></div>`;
  $("#new-goal") && ($("#new-goal").onclick = () => goalForm());
  $$("[data-pp]").forEach((b) => (b.onclick = () => { S.planPeriod = b.dataset.pp; render(); }));
  $$("[data-gm]").forEach((b) => (b.onclick = () => { S.ganttMode = b.dataset.gm; render(); }));
  $$("[data-eg]").forEach((b) => (b.onclick = () => goalForm(goals.find((g) => g.id === b.dataset.eg))));
  $$("[data-dg]").forEach((b) => (b.onclick = async () => { if (confirmBox("حذف الهدف؟ (تبقى المهام)")) { must(await sb.from("goals").delete().eq("id", b.dataset.dg)); render(); } }));
  const items = [
    ...goals.filter((g) => g.start_date && g.end_date).map((g) => ({ id: "g_" + g.id, name: "🎯 " + g.title, start: g.start_date, end: g.end_date, progress: gprog(g), custom_class: "goal" })),
    ...tasks.map((t) => { const s = t.start_date || t.created_at.slice(0, 10), e = t.due_date && t.due_date >= s ? t.due_date : iso(addDays(s, 2));
      return { id: t.id, name: `${t.title}${t.assignee ? " — " + pname(t.assignee) : ""}`, start: s, end: e, progress: taskProg(t), custom_class: "st-" + t.status, dependencies: t.goal_id && goals.some((g) => g.id === t.goal_id && g.start_date && g.end_date) ? "g_" + t.goal_id : "" }; }),
  ];
  if (!items.length) { $(".gantt-wrap").innerHTML = `<div class="empty">أضف مهاماً بتواريخ لتظهر هنا</div>`; return; }
  new Gantt("#gantt", items, {
    view_mode: S.ganttMode || "Week", language: "en", bar_height: 24, padding: 16,
    on_click: (it) => { if (!it.id.startsWith("g_")) openTask(it.id); },
    on_date_change: async (it, start, end) => {
      if (!canEdit()) return toast("ليست لديك صلاحية التعديل", "err");
      const s = iso(start), e = iso(end);
      if (it.id.startsWith("g_")) await sb.from("goals").update({ start_date: s, end_date: e }).eq("id", it.id.slice(2));
      else { await sb.from("tasks").update({ start_date: s, due_date: e }).eq("id", it.id); log("غيّر مواعيد مهمة", it.name); }
      toast("تم تحديث التاريخ");
    },
    custom_popup_html: (it) => `<div class="details-container" style="direction:rtl;padding:8px 12px;font-family:Tajawal"><b>${esc(it.name)}</b><br>${fmtDate(it._start)} ← ${fmtDate(it._end)}<br>الإنجاز: ${it.progress}%</div>`,
  });
};
function goalForm(g = {}) {
  const now = new Date(), span = { month: 1, quarter: 3, half: 6, year: 12 };
  openModal(g.id ? "تعديل الهدف" : "هدف جديد", `<form class="mform">
    <label>الهدف<input name="title" required value="${esc(g.title)}" placeholder="مثال: إنهاء النموذج الأولي للروبوت"></label>
    <div class="grid3"><label>الفترة<select name="period" id="gp">${opts(PERIODS, g.period || "month")}</select></label>
    <label>من<input type="date" name="start_date" id="gs" value="${g.start_date || todayStr()}"></label>
    <label>إلى<input type="date" name="end_date" id="ge" value="${g.end_date || iso(new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()))}"></label></div>
    <p class="muted">💡 اربط المهام بهذا الهدف من نموذج المهمة لتُحسب نسبة إنجازه تلقائياً</p>
    <div class="form-actions"><button class="btn" type="submit">حفظ</button></div></form>`, {
    onOpen: () => ($("#gp").onchange = () => { const s = new Date($("#gs").value || todayStr()); $("#ge").value = iso(new Date(s.getFullYear(), s.getMonth() + span[$("#gp").value], s.getDate())); }),
    onSubmit: async (d) => {
      if (g.id) must(await sb.from("goals").update(d).eq("id", g.id));
      else { must(await sb.from("goals").insert({ ...d, project_id: S.pid })); log("أضاف هدفاً", d.title); }
      closeModal(); render();
    },
  });
}

// ---------------------------------------------------------------- الخط الزمني ثلاثي الأبعاد
VIEWS.timeline = async (main) => {
  const [goals, tasks] = await Promise.all([
    sb.from("goals").select("*").eq("project_id", S.pid).then(must),
    sb.from("tasks").select("*").eq("project_id", S.pid).then(must),
  ]);
  const team = teamOf(), who = S.tlWho || "";
  const shown = tasks.filter((t) => !who || t.assignee === who);
  const items = shown.map((t) => {
    const st = new Date(t.start_date || t.created_at), en = t.due_date ? new Date(t.due_date) : addDays(st, 2);
    return { id: t.id, label: t.title, who: t.assignee ? pname(t.assignee) : "", start: st, end: en < st ? addDays(st, 1) : en, status: t.status, priority: t.priority, progress: taskProg(t), overdue: isOverdue(t),
      tip: `<b>${esc(t.title)}</b><br><span style="color:${TL_COLORS[t.status]}">●</span> ${STATUS[t.status]} · ${taskProg(t)}%<br>أولوية <b style="color:${TL_PRIO[t.priority]}">${PRIORITY[t.priority]}</b><br>👤 ${esc(pname(t.assignee))}<br>📅 ${fmtDate(t.start_date)} ← ${fmtDate(t.due_date)}${isOverdue(t) ? "<br>⏰ <b>متأخرة</b>" : ""}<br><small>انقر للفتح</small>` };
  });
  const gl = who ? [] : goals.filter((g) => g.start_date && g.end_date).map((g) => {
    const p = avg(tasks.filter((t) => t.goal_id === g.id).map(taskProg));
    return { label: g.title, start: new Date(g.start_date), end: new Date(g.end_date), progress: p, tip: `🎯 <b>${esc(g.title)}</b><br>${PERIODS[g.period]} · ${p}%<br>${fmtDate(g.start_date)} ← ${fmtDate(g.end_date)}` };
  });
  main.innerHTML = head("🛣️ الخط الزمني ثلاثي الأبعاد", "طريق المشروع من البداية إلى خط النهاية: كل دبوس مهمة في موعد تسليمها · الرقم = نسبة الإنجاز · الشريط الذهبي على الحافة = مدة الهدف") + `
    <div class="tl-wrap light" id="tl-wrap">
      <div class="three-d xl" id="tl3d"></div>
      <div class="tl-hud">
        <select id="tl-who" class="tl-sel"><option value="">👥 كل الأعضاء</option>${team.map((m) => `<option value="${m.id}" ${who === m.id ? "selected" : ""}>👤 ${esc(m.full_name)}</option>`).join("")}</select>
        <button class="btn3d" id="tl-today">📍 اليوم</button><button class="btn3d" id="tl-all">🌐 عرض كامل</button>
        <button class="btn3d" id="tl-top">🗺️ من الأعلى</button><button class="btn3d" id="tl-lbl">🏷️ البطاقات</button><button class="btn3d" id="tl-fs">⛶ ملء الشاشة</button>
      </div>
      <div class="tl-legend">
        <div><b>لون الدبوس</b>${Object.entries(STATUS).map(([k, l]) => `<span><i style="background:${TL_COLORS[k]}"></i>${l}</span>`).join("")}<span><i style="background:${TL_COLORS.overdue}"></i>متأخرة</span><span><i style="background:${TL_COLORS.goal}"></i>هدف</span></div>
        <div><b>الحلقة النابضة</b><span><i style="background:${TL_PRIO.high}"></i>أولوية عالية</span><span><i style="background:${TL_PRIO.med}"></i>متوسطة</span><span><i style="background:${TL_PRIO.low}"></i>منخفضة</span></div>
        <div class="muted">🖱️ اسحب للتدوير · العجلة للتكبير (بحدود) · زر يمين للتحريك · انقر على دبوس لفتح المهمة</div>
      </div>
    </div>`;
  const tl = timelineScene($("#tl3d"), items, [], (it) => it.id && openTask(it.id), { goals: gl });
  S.cleanup.push(tl.dispose);
  $("#tl-who").onchange = (e) => { S.tlWho = e.target.value; render(); };
  $("#tl-today").onclick = tl.focusToday; $("#tl-all").onclick = tl.overview; $("#tl-top").onclick = tl.top;
  $("#tl-lbl").onclick = (e) => e.currentTarget.classList.toggle("off", !tl.toggleLabels());
  $("#tl-fs").onclick = () => (document.fullscreenElement ? document.exitFullscreen() : $("#tl-wrap").requestFullscreen?.());
};

// ---------------------------------------------------------------- سجل العمل
VIEWS.activity = async (main) => {
  const who = S.actWho || "";
  let q = sb.from("activity").select("*").eq("project_id", S.pid).order("created_at", { ascending: false }).limit(250);
  if (who) q = q.eq("user_id", who);
  const acts = must(await q);
  main.innerHTML = head("سجل العمل", "كل ما أضافه أو عدّله أعضاء الفريق") + `
    <div class="filters"><button class="chip ${!who ? "on" : ""}" data-w="">الجميع</button>${teamOf().concat(isAdmin() ? [S.me] : []).map((m) =>
      `<button class="chip ${who === m.id ? "on" : ""}" data-w="${m.id}">${esc(m.full_name)}</button>`).join("")}</div>
    <div class="card feed">${feedHtml(acts)}</div>`;
  $$("[data-w]").forEach((b) => (b.onclick = () => { S.actWho = b.dataset.w; render(); }));
};

// ---------------------------------------------------------------- المكتبة: أبحاث / كتب / منوعات
const ytId = (u) => (u || "").match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)?.[1];
const linkIcon = (u = "") => /instagram/.test(u) ? "📸" : /facebook|fb\.watch/.test(u) ? "📘" : /tiktok/.test(u) ? "🎵" : /drive\.google|docs\.google/.test(u) ? "📁"
  : /github/.test(u) ? "💻" : /\.pdf($|\?)/i.test(u) ? "📄" : /arxiv|ieee|sciencedirect|springer|researchgate|scholar/.test(u) ? "🔬" : "🔗";
const libView = (section) => async (main) => {
  let q = sb.from("library").select("*").eq("section", section).order("created_at", { ascending: false });
  if (!(isAdmin() && S.libAll)) q = q.eq("project_id", S.pid);
  const items = must(await q);
  const url = await signed(items.map((i) => i.file_path));
  const tags = [...new Set(items.flatMap((i) => (i.tags || "").split(",").map((t) => t.trim()).filter(Boolean)))];
  const icon = { research: "🔬", books: "📚", misc: "🧩" }[section];
  main.innerHTML = head(`${icon} ${SECTIONS[section]}`, "مخزون معرفي يبقى للمشاريع القادمة — روابط، يوتيوب، إنستغرام، فيسبوك، درايف، ملفات، صور، نماذج 3D",
    `${isAdmin() ? `<label class="row" style="margin:0;color:var(--ink)"><input type="checkbox" id="lib-all" style="width:auto" ${S.libAll ? "checked" : ""}> من كل المشاريع</label>` : ""}
     ${canEdit() ? `<button class="btn gold" id="lib-add">＋ إضافة</button>` : ""}`) + `
    <div class="filters"><input id="lib-q" placeholder="🔍 بحث…"><button class="chip on" data-tag="">الكل</button>${tags.map((t) => `<button class="chip" data-tag="${esc(t)}">#${esc(t)}</button>`).join("")}</div>
    <div class="cards" id="lib-grid"></div>`;
  let tag = "", qs = "";
  const draw = () => {
    const list = items.filter((i) => (!tag || (i.tags || "").split(",").map((x) => x.trim()).includes(tag)) &&
      (!qs || `${i.title} ${i.notes} ${i.tags} ${i.url}`.toLowerCase().includes(qs)));
    $("#lib-grid").innerHTML = list.map((i) => {
      const yt = ytId(i.url);
      const thumb = yt ? `<div class="lib-thumb" style="background-image:url(https://i.ytimg.com/vi/${yt}/hqdefault.jpg)"><span style="background:rgba(0,0,0,.55);color:#fff;border-radius:50%;width:56px;height:56px;display:grid;place-items:center;font-size:24px">▶</span></div>`
        : i.kind === "image" ? `<div class="lib-thumb" style="background-image:url('${url(i.file_path) || esc(i.url)}')"></div>`
        : i.kind === "model" ? `<div class="lib-thumb">🧊</div>` : i.kind === "file" ? `<div class="lib-thumb">📄</div>` : `<div class="lib-thumb">${linkIcon(i.url)}</div>`;
      return `<div class="card lib-card">${thumb}<div class="t">${esc(i.title)}</div>
        ${i.notes ? `<div class="muted" style="font-size:13px">${esc(i.notes).slice(0, 160)}</div>` : ""}
        <div class="row">${(i.tags || "").split(",").filter((t) => t.trim()).map((t) => `<span class="tag">#${esc(t.trim())}</span>`).join("")}</div>
        <div class="row"><small class="muted">${esc(pname(i.user_id))} · ${fmtDate(i.created_at)}${S.libAll ? ` · ${esc(S.projects.find((p) => p.id === i.project_id)?.name || "")}` : ""}</small><div class="spacer"></div>
          <button class="btn sm" data-view="${i.id}">فتح</button>${canEdit() && i.project_id === S.pid ? `<button class="icon-btn" data-dl="${i.id}">🗑</button>` : ""}</div></div>`;
    }).join("") || `<div class="empty">لا عناصر بعد ${icon}</div>`;
    $$("[data-view]").forEach((b) => (b.onclick = () => viewLibItem(items.find((i) => i.id === b.dataset.view), url)));
    $$("[data-dl]").forEach((b) => (b.onclick = async () => {
      const i = items.find((x) => x.id === b.dataset.dl);
      if (!confirmBox(`حذف "${i.title}"؟`)) return;
      if (i.file_path) await sb.storage.from(BUCKET).remove([i.file_path]);
      must(await sb.from("library").delete().eq("id", i.id)); render();
    }));
  };
  draw();
  $("#lib-q").oninput = (e) => { qs = e.target.value.toLowerCase(); draw(); };
  $$("[data-tag]").forEach((b) => (b.onclick = () => { tag = b.dataset.tag; $$("[data-tag]").forEach((x) => x.classList.toggle("on", x === b)); draw(); }));
  $("#lib-all") && ($("#lib-all").onchange = (e) => { S.libAll = e.target.checked; render(); });
  $("#lib-add") && ($("#lib-add").onclick = () => openModal(`إضافة إلى ${SECTIONS[section]}`, `<form class="mform">
    <label>العنوان<input name="title" required></label>
    <label>النوع<select name="kind" id="lk"><option value="link">🔗 رابط (يوتيوب، إنستغرام، فيسبوك، درايف، مقال…)</option>
      <option value="file">📄 ملف (PDF، ورقة بحثية، كتاب)</option><option value="image">🖼️ صورة</option><option value="model">🧊 نموذج ثلاثي الأبعاد (GLB/GLTF)</option></select></label>
    <label id="lk-url">الرابط<input name="url" type="url" dir="ltr" placeholder="https://"></label>
    <label id="lk-file" class="hidden">الملف<input type="file" name="file"></label>
    <label>وسوم (مفصولة بفواصل)<input name="tags" placeholder="ذكاء اصطناعي, حساسات, مرجع"></label>
    <label>ملاحظات / ملخص<textarea name="notes"></textarea></label>
    <div class="form-actions"><button class="btn" type="submit">حفظ</button></div></form>`, {
    onOpen: () => ($("#lk").onchange = () => { const k = $("#lk").value; $("#lk-url").classList.toggle("hidden", k === "file" || k === "model"); $("#lk-file").classList.toggle("hidden", k === "link");
      $("#lk-file input").accept = k === "image" ? "image/*" : k === "model" ? ".glb,.gltf" : ""; }),
    onSubmit: async (d, form) => {
      const f = form.querySelector("input[name=file]").files[0];
      if (d.kind !== "link" && !f && !d.url) throw new Error("اختر ملفاً");
      if (d.kind === "link" && !d.url) throw new Error("ضع الرابط");
      const file_path = f && d.kind !== "link" ? await uploadFile(f, "library") : null;
      must(await sb.from("library").insert({ project_id: S.pid, section, kind: d.kind, title: d.title, url: d.url || null, file_path, tags: d.tags, notes: d.notes, user_id: S.me.id }));
      log(`أضاف إلى ${SECTIONS[section]}`, d.title); closeModal(); toast("تمت الإضافة"); render();
    },
  }));
};
function viewLibItem(i, url) {
  const src = url(i.file_path) || i.url, yt = ytId(i.url);
  let body;
  if (yt) body = `<div style="aspect-ratio:16/9"><iframe src="https://www.youtube.com/embed/${yt}" style="width:100%;height:100%;border:0;border-radius:12px" allowfullscreen></iframe></div>`;
  else if (i.kind === "image") body = `<img src="${src}" style="max-width:100%;border-radius:12px">`;
  else if (i.kind === "model") body = `<model-viewer src="${src}" camera-controls auto-rotate shadow-intensity="1" ar style="width:100%;height:60vh;background:#16372a;border-radius:12px"></model-viewer>`;
  else if (i.kind === "file" && /\.pdf$/i.test(i.file_path || "")) body = `<iframe src="${src}" style="width:100%;height:70vh;border:0;border-radius:12px"></iframe>`;
  else body = `<div class="empty" style="font-size:60px">${linkIcon(src)}</div>`;
  openModal(i.title, `${body}${i.notes ? `<p style="white-space:pre-wrap">${esc(i.notes)}</p>` : ""}
    <div class="form-actions"><a class="btn" href="${esc(src)}" target="_blank" rel="noopener">↗️ فتح في نافذة جديدة</a></div>`, { wide: true });
}
VIEWS.research = libView("research");
VIEWS.books = libView("books");
VIEWS.misc = libView("misc");

// ---------------------------------------------------------------- القطع
const PART_ST = { needed: "مطلوبة", ordered: "تم الطلب", received: "وصلت" };
VIEWS.parts = async (main) => {
  const parts = must(await sb.from("parts").select("*").eq("project_id", S.pid).order("created_at"));
  const url = await signed(parts.map((p) => p.image_path));
  const total = parts.reduce((a, p) => a + (+p.price || 0) * (p.qty || 1), 0);
  main.innerHTML = head("🔩 القطع التي يحتاجها المشروع", "", `${isAdmin() ? `<button class="btn ghost" id="pp-print">🖨️ طباعة القائمة</button>` : ""}${canEdit() ? `<button class="btn gold" id="pp-add">＋ قطعة</button>` : ""}`) + `
    <div class="kpis"><div class="kpi"><b>${parts.length}</b><span>قطعة</span></div>
      ${Object.entries(PART_ST).map(([k, l]) => `<div class="kpi"><b>${parts.filter((p) => p.status === k).length}</b><span>${l}</span></div>`).join("")}
      <div class="kpi"><b>${total.toLocaleString("en")}</b><span>التكلفة التقديرية</span></div></div>
    <div class="card tbl-wrap"><table><tr><th></th><th>القطعة</th><th>الكمية</th><th>السعر</th><th>المجموع</th><th>الحالة</th><th>الشراء</th><th></th></tr>
    ${parts.map((p) => `<tr><td>${p.image_path || p.image_url ? `<img class="part-img" src="${url(p.image_path) || esc(p.image_url)}">` : `<div class="part-img" style="display:grid;place-items:center">🔩</div>`}</td>
      <td><b>${esc(p.name)}</b>${p.notes ? `<br><small class="muted">${esc(p.notes)}</small>` : ""}</td><td>${p.qty}</td><td>${p.price ?? "—"}</td><td>${p.price ? (+p.price * p.qty).toLocaleString("en") : "—"}</td>
      <td>${canEdit() ? `<select data-ps="${p.id}" style="width:auto">${opts(PART_ST, p.status)}</select>` : `<span class="tag">${PART_ST[p.status]}</span>`}</td>
      <td>${p.url ? `<a class="btn sm" href="${esc(p.url)}" target="_blank" rel="noopener">🛒 شراء</a>` : "—"}</td>
      <td>${canEdit() ? `<button class="icon-btn" data-pe="${p.id}">✏️</button><button class="icon-btn" data-pd="${p.id}">🗑</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="8" class="empty">لا قطع بعد</td></tr>`}
    </table></div>`;
  const form = (p = {}) => openModal(p.id ? "تعديل القطعة" : "قطعة جديدة", `<form class="mform">
    <div class="grid2"><label>اسم القطعة<input name="name" required value="${esc(p.name)}"></label><label>رابط الشراء<input name="url" type="url" dir="ltr" value="${esc(p.url)}"></label></div>
    <div class="grid3"><label>الكمية<input name="qty" type="number" min="1" value="${p.qty || 1}"></label><label>السعر للقطعة<input name="price" type="number" step="any" value="${p.price ?? ""}"></label>
      <label>الحالة<select name="status">${opts(PART_ST, p.status || "needed")}</select></label></div>
    <div class="grid2"><label>صورة (رفع)<input type="file" name="img" accept="image/*"></label><label>أو رابط صورة<input name="image_url" type="url" dir="ltr" value="${esc(p.image_url)}"></label></div>
    <label>ملاحظات<input name="notes" value="${esc(p.notes)}" placeholder="المواصفات، البديل…"></label>
    <div class="form-actions"><button class="btn" type="submit">حفظ</button></div></form>`, {
    onSubmit: async (d, f) => {
      const img = f.querySelector("input[name=img]").files[0];
      const row = { name: d.name, url: d.url || null, qty: +d.qty || 1, price: d.price === "" ? null : +d.price, status: d.status, image_url: d.image_url || null, notes: d.notes };
      if (img) row.image_path = await uploadFile(img, "parts");
      if (p.id) must(await sb.from("parts").update(row).eq("id", p.id));
      else { must(await sb.from("parts").insert({ ...row, project_id: S.pid, user_id: S.me.id })); log("أضاف قطعة", d.name); }
      closeModal(); render();
    },
  });
  $("#pp-add") && ($("#pp-add").onclick = () => form());
  $$("[data-pe]").forEach((b) => (b.onclick = () => form(parts.find((p) => p.id === b.dataset.pe))));
  $$("[data-pd]").forEach((b) => (b.onclick = async () => { if (confirmBox("حذف القطعة؟")) { must(await sb.from("parts").delete().eq("id", b.dataset.pd)); render(); } }));
  $$("[data-ps]").forEach((s) => (s.onchange = async () => { must(await sb.from("parts").update({ status: s.value }).eq("id", s.dataset.ps)); log(`غيّر حالة قطعة إلى «${PART_ST[s.value]}»`, parts.find((p) => p.id === s.dataset.ps).name); render(); }));
  if ($("#pp-print")) $("#pp-print").onclick = () => printDoc(`قائمة القطع — ${project().name}`, partsTable(parts, url, total));
};
const partsTable = (parts, url, total) => `<table><tr><th>#</th><th>صورة</th><th>القطعة</th><th>الكمية</th><th>السعر</th><th>المجموع</th><th>الحالة</th><th>رابط الشراء</th></tr>
  ${parts.map((p, i) => `<tr><td>${i + 1}</td><td>${p.image_path || p.image_url ? `<img src="${url(p.image_path) || esc(p.image_url)}" style="width:46px;height:46px;object-fit:cover;border-radius:6px">` : ""}</td>
  <td>${esc(p.name)}</td><td>${p.qty}</td><td>${p.price ?? "—"}</td><td>${p.price ? (+p.price * p.qty).toLocaleString("en") : "—"}</td><td>${PART_ST[p.status]}</td>
  <td style="font-size:10px;direction:ltr;word-break:break-all">${esc(p.url || "")}</td></tr>`).join("")}
  <tr><td colspan="5"><b>الإجمالي</b></td><td colspan="3"><b>${total.toLocaleString("en")}</b></td></tr></table>`;

// ---------------------------------------------------------------- التقارير والتقييم
function evaluate(m, tasks, subs, edits) {
  const mine = tasks.filter((t) => t.assignee === m.id);
  const done = mine.filter((t) => t.status === "done");
  const withDue = done.filter((t) => t.due_date && t.completed_at);
  const onTime = withDue.filter((t) => t.completed_at.slice(0, 10) <= t.due_date).length;
  const scores = mine.filter((t) => t.score != null).map((t) => t.score * 10);
  const nSubs = subs.filter((s) => s.user_id === m.id).length, nEdits = edits.filter((e) => e.user_id === m.id).length;
  const parts = [[pct(done.length, mine.length), 0.35], [withDue.length ? pct(onTime, withDue.length) : null, 0.25], [scores.length ? avg(scores) : null, 0.3], [Math.min(100, (nSubs + nEdits) * 5), 0.1]].filter(([v]) => v !== null);
  const wsum = parts.reduce((a, [, w]) => a + w, 0);
  const overall = mine.length ? Math.round(parts.reduce((a, [v, w]) => a + v * w, 0) / wsum) : 0;
  const grade = overall >= 90 ? "ممتاز" : overall >= 80 ? "جيد جداً" : overall >= 65 ? "جيد" : overall >= 50 ? "مقبول" : "يحتاج متابعة";
  return { mine, done, overdue: mine.filter(isOverdue).length, completion: pct(done.length, mine.length), onTime: withDue.length ? pct(onTime, withDue.length) : null,
    quality: scores.length ? avg(scores) : null, nSubs, nEdits, overall, grade };
}
VIEWS.reports = async (main) => {
  const [tasks, subs, edits] = await Promise.all([
    sb.from("tasks").select("*").eq("project_id", S.pid).then(must),
    sb.from("submissions").select("user_id").eq("project_id", S.pid).then(must),
    sb.from("file_versions").select("user_id").eq("project_id", S.pid).then(must),
  ]);
  if (!isAdmin()) { main.innerHTML = `<div class="empty">🔒 التقارير متاحة للمشرف فقط</div>`; return; }
  const team = teamOf();
  const rows = team.map((m) => ({ m, e: evaluate(m, tasks, subs, edits) }));
  main.innerHTML = head("🖨️ التقارير والتقييم", "التقييم الشامل = الإنجاز 35% + الالتزام بالمواعيد 25% + تقييم المشرف 30% + النشاط 10%",
    isAdmin() ? `<button class="btn gold" id="rp-proj">🖨️ تقرير المشروع الكامل</button>` : "") + `
    <div class="card tbl-wrap"><table><tr><th>العضو</th><th>المهام</th><th>الإنجاز</th><th>الالتزام بالمواعيد</th><th>تقييم المشرف</th><th>الأعمال المرفوعة</th><th>تعديلات الملفات</th><th>التقييم الشامل</th><th></th></tr>
    ${rows.map(({ m, e }) => `<tr><td><b>${esc(m.full_name)}</b><br><small class="muted">${esc(m.specialty || "")}</small></td>
      <td>${e.done.length}/${e.mine.length}${e.overdue ? ` <span class="tag red">${e.overdue} متأخرة</span>` : ""}</td><td>${e.completion}%</td><td>${e.onTime ?? "—"}${e.onTime != null ? "%" : ""}</td>
      <td>${e.quality ?? "—"}${e.quality != null ? "%" : ""}</td><td>${e.nSubs}</td><td>${e.nEdits}</td>
      <td><div class="row"><div class="progress" style="width:90px"><div style="width:${e.overall}%"></div></div><b>${e.overall}%</b><span class="tag gold">${e.grade}</span></div></td>
      <td><button class="btn sm" data-rm="${m.id}">🖨️ تقرير</button></td></tr>`).join("") || `<tr><td colspan="9" class="empty">لا أعضاء في هذا المشروع</td></tr>`}
    </table></div>`;
  $$("[data-rm]").forEach((b) => (b.onclick = () => {
    const { m, e } = rows.find((r) => r.m.id === b.dataset.rm);
    const go = (comment = "") => printDoc(`تقرير أداء — ${m.full_name}`, memberReport(m, e, comment));
    if (!isAdmin()) return go();
    openModal("ملاحظة المشرف على التقرير", `<form class="mform"><label>كلمة/ملاحظة المشرف (اختياري)<textarea name="c" placeholder="نقاط القوة، ما يحتاج تحسيناً، توصيات…"></textarea></label>
      <div class="form-actions"><button class="btn" type="submit">🖨️ طباعة</button></div></form>`, { onSubmit: async (d) => { closeModal(); go(d.c); } });
  }));
  $("#rp-proj") && ($("#rp-proj").onclick = async () => {
    const [goals, parts, notes, acts] = await Promise.all([
      sb.from("goals").select("*").eq("project_id", S.pid).then(must), sb.from("parts").select("*").eq("project_id", S.pid).then(must),
      sb.from("notes").select("*").eq("project_id", S.pid).then(must), sb.from("activity").select("*").eq("project_id", S.pid).order("created_at", { ascending: false }).limit(25).then(must),
    ]);
    const url = await signed(parts.map((p) => p.image_path));
    printDoc(`تقرير المشروع — ${project().name}`, projectReport(tasks, goals, parts, notes, acts, rows, url));
  });
};
const bar = (v) => `<div class="pb"><div style="width:${v || 0}%"></div></div>`;
function memberReport(m, e, comment) {
  const p = project();
  return `<div class="meta"><div><b>العضو:</b> ${esc(m.full_name)} (${esc(m.username)})</div><div><b>الاختصاص:</b> ${esc(m.specialty || "—")}</div>
    <div><b>المشروع:</b> ${esc(p.name)}</div><div><b>المسابقة:</b> ${esc(p.competition || "—")}</div><div><b>تاريخ التقرير:</b> ${fmtDate(new Date())}</div><div><b>الصلاحية:</b> ${ROLE_LABEL[m.prole] || "—"}</div></div>
  <div class="big"><div class="score">${e.overall}%</div><div class="grade">${e.grade}</div><div class="muted">التقييم الشامل</div></div>
  <div class="boxes"><div><b>${e.done.length}/${e.mine.length}</b>مهام منجزة</div><div><b>${e.completion}%</b>نسبة الإنجاز</div>
    <div><b>${e.onTime ?? "—"}${e.onTime != null ? "%" : ""}</b>الالتزام بالمواعيد</div><div><b>${e.quality ?? "—"}${e.quality != null ? "%" : ""}</b>تقييم المشرف</div>
    <div><b>${e.nSubs}</b>أعمال مرفوعة</div><div><b>${e.nEdits}</b>تعديلات أكواد</div><div><b style="color:#b5483b">${e.overdue}</b>مهام متأخرة</div></div>
  <h3>تفاصيل المهام</h3><table><tr><th>المهمة</th><th>النوع</th><th>الحالة</th><th>الموعد</th><th>أُنجزت</th><th>الإنجاز</th><th>الدرجة</th><th>ملاحظات المشرف</th></tr>
  ${e.mine.map((t) => `<tr><td>${esc(t.title)}</td><td>${TYPES[t.type]}</td><td>${STATUS[t.status]}${isOverdue(t) ? " ⚠️" : ""}</td><td>${fmtDate(t.due_date)}</td><td>${fmtDate(t.completed_at)}</td>
    <td>${bar(taskProg(t))}</td><td>${t.score ?? "—"}</td><td>${esc(t.feedback || "")}</td></tr>`).join("") || `<tr><td colspan="8">لا مهام</td></tr>`}</table>
  ${comment ? `<h3>ملاحظة المشرف</h3><div class="comment">${esc(comment)}</div>` : ""}
  <div class="sign"><div>المشرف: ${esc(S.me.full_name)}</div><div>التوقيع: ..................</div></div>`;
}
function projectReport(tasks, goals, parts, notes, acts, rows, url) {
  const p = project(), prog = avg(tasks.map(taskProg));
  const gp = (g) => avg(tasks.filter((t) => t.goal_id === g.id).map(taskProg));
  const total = parts.reduce((a, x) => a + (+x.price || 0) * (x.qty || 1), 0);
  return `<div class="meta"><div><b>المشروع:</b> ${esc(p.name)}</div><div><b>المسابقة:</b> ${esc(p.competition || "—")}</div><div><b>المدة:</b> ${fmtDate(p.start_date)} ← ${fmtDate(p.end_date)}</div>
    <div><b>تاريخ التقرير:</b> ${fmtDate(new Date())}</div><div><b>عدد الأعضاء:</b> ${teamOf().length}</div><div><b>الأيام المتبقية:</b> ${p.end_date ? Math.max(0, daysLeft(p.end_date)) : "—"}</div></div>
  ${p.description ? `<p>${esc(p.description)}</p>` : ""}
  <div class="big"><div class="score">${prog}%</div><div class="muted">نسبة إنجاز المشروع</div></div>
  <div class="boxes">${Object.entries(STATUS).map(([k, l]) => `<div><b>${tasks.filter((t) => t.status === k).length}</b>${l}</div>`).join("")}
    <div><b style="color:#b5483b">${tasks.filter(isOverdue).length}</b>متأخرة</div><div><b>${notes.filter((n) => n.kind === "issue" && !n.resolved).length}</b>مشاكل مفتوحة</div></div>
  <h3>الأهداف</h3><table><tr><th>الهدف</th><th>الفترة</th><th>من</th><th>إلى</th><th>الإنجاز</th></tr>
  ${goals.map((g) => `<tr><td>${esc(g.title)}</td><td>${PERIODS[g.period]}</td><td>${fmtDate(g.start_date)}</td><td>${fmtDate(g.end_date)}</td><td>${bar(gp(g))} ${gp(g)}%</td></tr>`).join("") || `<tr><td colspan="5">لا أهداف</td></tr>`}</table>
  <h3>أداء الفريق</h3><table><tr><th>العضو</th><th>المهام</th><th>الإنجاز</th><th>المواعيد</th><th>تقييم المشرف</th><th>الشامل</th><th>التقدير</th></tr>
  ${rows.map(({ m, e }) => `<tr><td>${esc(m.full_name)}</td><td>${e.done.length}/${e.mine.length}</td><td>${e.completion}%</td><td>${e.onTime ?? "—"}</td><td>${e.quality ?? "—"}</td><td>${bar(e.overall)} ${e.overall}%</td><td>${e.grade}</td></tr>`).join("")}</table>
  <h3>المهام المتبقية</h3><table><tr><th>المهمة</th><th>المسؤول</th><th>الحالة</th><th>الموعد</th><th>الإنجاز</th></tr>
  ${tasks.filter((t) => t.status !== "done").sort((a, b) => (a.due_date || "9").localeCompare(b.due_date || "9")).map((t) => `<tr><td>${esc(t.title)}</td><td>${esc(pname(t.assignee))}</td><td>${STATUS[t.status]}${isOverdue(t) ? " ⚠️" : ""}</td><td>${fmtDate(t.due_date)}</td><td>${bar(taskProg(t))}</td></tr>`).join("") || `<tr><td colspan="5">لا مهام متبقية 🎉</td></tr>`}</table>
  <h3>المشاكل المفتوحة</h3><ul>${notes.filter((n) => n.kind === "issue" && !n.resolved).map((n) => `<li><b>${esc(n.title)}</b> — ${esc(n.body || "")}</li>`).join("") || "<li>لا يوجد</li>"}</ul>
  ${parts.length ? `<h3>القطع المطلوبة</h3>${partsTable(parts, url, total)}` : ""}
  <h3>آخر النشاطات</h3><table>${acts.map((a) => `<tr><td>${fmtTime(a.created_at)}</td><td>${esc(pname(a.user_id))}</td><td>${esc(a.action)} ${esc(a.details || "")}</td></tr>`).join("")}</table>
  <div class="sign"><div>المشرف: ${esc(S.me.full_name)}</div><div>التوقيع: ..................</div></div>`;
}
function printDoc(title, body) {
  if (!isAdmin()) return toast("الطباعة متاحة للمشرف فقط", "err");
  const logo = new URL("assets/logo.png", location.href).href;
  const w = window.open("", "_blank");
  if (!w) return toast("اسمح بالنوافذ المنبثقة للطباعة", "err");
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
  <style>@page{size:A4;margin:14mm}body{font-family:Tajawal,sans-serif;color:#1d2a24;font-size:12.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  header{display:flex;align-items:center;gap:14px;border-bottom:3px solid #c39a5c;padding-bottom:10px;margin-bottom:14px}header img{width:80px}
  header h1{margin:0;color:#1e4a38;font-size:20px}header p{margin:2px 0;color:#8a6430}
  h3{color:#1e4a38;border-inline-start:4px solid #c39a5c;padding-inline-start:8px;margin:18px 0 8px}
  table{width:100%;border-collapse:collapse;margin-bottom:6px}th,td{border:1px solid #e6dccf;padding:5px 7px;text-align:right}th{background:#1e4a38;color:#fff}
  tr:nth-child(even) td{background:#fbf6f1}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 14px;background:#f5ece5;padding:10px;border-radius:8px}
  .big{text-align:center;margin:16px 0}.score{font-size:46px;font-weight:800;color:#1e4a38}.grade{display:inline-block;background:#c39a5c;color:#fff;padding:3px 18px;border-radius:99px;font-weight:800;font-size:16px}
  .muted{color:#6c7a72}.boxes{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.boxes>div{border:1px solid #e6dccf;border-radius:8px;padding:8px;text-align:center;color:#6c7a72}
  .boxes b{display:block;font-size:20px;color:#1e4a38}.pb{display:inline-block;width:80px;height:8px;background:#e3ece6;border-radius:9px;overflow:hidden;vertical-align:middle}.pb>div{height:100%;background:#c39a5c}
  .comment{background:#f4e8d6;padding:10px;border-radius:8px;white-space:pre-wrap}.sign{display:flex;justify-content:space-between;margin-top:40px;font-weight:700}
  footer{margin-top:24px;text-align:center;color:#8a6430;font-size:11px;border-top:1px solid #e6dccf;padding-top:6px}</style></head><body>
  <header><img src="${logo}"><div><h1>${esc(title)}</h1><p>${esc(C.ACADEMY_NAME)} — ${esc(C.PLATFORM_NAME)}</p></div></header>
  ${body}<footer>جذورٌ صامدة… وعقولٌ تُثمر — ${esc(C.ACADEMY_NAME)}</footer>
  <script>document.fonts.ready.then(()=>setTimeout(()=>print(),400))<\/script></body></html>`);
  w.document.close();
}

// ---------------------------------------------------------------- صندوق الوارد: رسائل + تعميمات + شات
S.msgs = []; S.reads = new Set(); S.allReads = []; S.inboxSel = "ann";
const myProjects = () => S.memberships.filter((m) => m.user_id === S.me.id).map((m) => m.project_id);
const annVisible = (m) => isAdmin() || m.project_id == null || myProjects().includes(m.project_id);
const isUnread = (m) => m.sender !== S.me.id && !S.reads.has(m.id) && (m.kind === "announcement" ? annVisible(m) : m.recipient === S.me.id);
function chatPeople() {
  if (isAdmin()) return S.profiles.filter((p) => p.id !== S.me.id);
  const mates = new Set(S.memberships.filter((m) => myProjects().includes(m.project_id)).map((m) => m.user_id));
  return S.profiles.filter((p) => p.id !== S.me.id && (p.role === "admin" || mates.has(p.id)));
}
async function loadMessages() {
  const [m, r] = await Promise.all([
    sb.from("messages").select("*").order("created_at", { ascending: true }).limit(3000),
    sb.from("message_reads").select("message_id,user_id"),
  ]);
  S.msgs = must(m); S.allReads = must(r);
  S.reads = new Set(S.allReads.filter((x) => x.user_id === S.me.id).map((x) => x.message_id));
  updateBell();
}
function updateBell() {
  const n = S.msgs.filter(isUnread).length;
  const b = $("#inbox-badge"); b.textContent = n > 99 ? "99+" : n; b.classList.toggle("hidden", !n);
  $("#inbox-btn").classList.toggle("ringing", n > 0);
  const nb = $("#nav-inbox-badge"); if (nb) { nb.textContent = n; nb.classList.toggle("hidden", !n); }
  document.title = (n ? `(${n}) ` : "") + C.PLATFORM_NAME;
}
async function markRead(list) {
  const ids = list.filter(isUnread).map((m) => m.id);
  if (!ids.length) return;
  ids.forEach((id) => S.reads.add(id)); updateBell();
  await sb.from("message_reads").upsert(ids.map((id) => ({ message_id: id, user_id: S.me.id })), { onConflict: "message_id,user_id", ignoreDuplicates: true });
}
function ding() {
  try {
    const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain();
    o.connect(g); g.connect(a.destination); o.type = "sine";
    o.frequency.setValueAtTime(880, a.currentTime); o.frequency.exponentialRampToValueAtTime(1320, a.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, a.currentTime); g.gain.exponentialRampToValueAtTime(0.25, a.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.5);
    o.start(); o.stop(a.currentTime + 0.5);
  } catch {}
}
function notifyMsg(m) {
  const title = m.kind === "announcement" ? `📢 تعميم جديد: ${m.subject || ""}` : `💬 رسالة من ${pname(m.sender)}`;
  toast(`${title} — ${String(m.body).slice(0, 70)}`); ding();
  if ("Notification" in window && Notification.permission === "granted" && document.hidden)
    try { new Notification(title, { body: String(m.body).slice(0, 140), icon: "assets/favicon.png" }); } catch {}
}
function initInbox() {
  $("#inbox-btn").onclick = () => go("inbox");
  loadMessages().catch(fail);
  if (S.inboxChannel) sb.removeChannel(S.inboxChannel);
  S.inboxChannel = sb.channel("inbox-" + S.me.id)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
      const m = p.new; if (S.msgs.some((x) => x.id === m.id)) return;
      S.msgs.push(m);
      if (isUnread(m)) notifyMsg(m);
      updateBell();
      if (S.view === "inbox") renderInbox();
    }).subscribe();
  clearInterval(S.inboxPoll);
  S.inboxPoll = setInterval(async () => {
    const before = S.msgs.filter(isUnread).length;
    await loadMessages().catch(() => {});
    const now = S.msgs.filter(isUnread);
    if (now.length > before) notifyMsg(now.at(-1));
    if (S.view === "inbox" && now.length !== before) renderInbox();
  }, 45000);
  if ("Notification" in window && Notification.permission === "default") setTimeout(() => Notification.requestPermission().catch(() => {}), 5000);
}
VIEWS.inbox = async (main) => {
  await loadMessages();
  main.innerHTML = head(isAdmin() ? "📨 الرسائل والتعميمات" : "📨 صندوق الوارد",
    isAdmin() ? "أرسل تعميماً للجميع أو لفريق مشروع، وتراسل مع كل عضو مباشرة" : "تعميمات المشرف ومحادثاتك مع المشرف وزملاء فريقك") +
    `<div class="inbox"><div class="inbox-list" id="ib-list"></div><div class="inbox-pane" id="ib-pane"></div></div>`;
  renderInbox();
};
function renderInbox() {
  const list = $("#ib-list"), pane = $("#ib-pane"); if (!list) return;
  const draft = $("#chat-form textarea")?.value || "";
  const anns = S.msgs.filter((m) => m.kind === "announcement" && annVisible(m));
  const unAnn = anns.filter(isUnread).length;
  const conv = (pid) => S.msgs.filter((m) => m.kind === "chat" && ((m.sender === pid && m.recipient === S.me.id) || (m.sender === S.me.id && m.recipient === pid)));
  const people = chatPeople().map((p) => { const c = conv(p.id); return { p, last: c.at(-1), un: c.filter(isUnread).length }; })
    .sort((a, b) => (b.last?.created_at || "").localeCompare(a.last?.created_at || "") || (b.p.role === "admin") - (a.p.role === "admin"));
  list.innerHTML = `<div class="ib-item ${S.inboxSel === "ann" ? "on" : ""}" data-sel="ann"><span class="ib-av ann">📢</span>
      <div><b>التعميمات</b><small>${anns.length} تعميم${unAnn ? ` · ${unAnn} جديد` : ""}</small></div>${unAnn ? `<i class="ib-un">${unAnn}</i>` : ""}</div>
    <div class="sec-t">المحادثات</div>` + people.map(({ p, last, un }) => `
    <div class="ib-item ${S.inboxSel === p.id ? "on" : ""}" data-sel="${p.id}"><span class="ib-av ${p.role === "admin" ? "gold" : ""}">${esc((p.full_name || p.username)[0])}</span>
      <div><b>${esc(p.full_name)}</b>${p.role === "admin" ? ` <span class="tag gold">المشرف</span>` : ""}
      <small>${last ? esc(((last.sender === S.me.id ? "أنت: " : "") + last.body).slice(0, 42)) : "ابدأ محادثة"}</small></div>${un ? `<i class="ib-un">${un}</i>` : ""}</div>`).join("");
  $$("[data-sel]", list).forEach((el) => (el.onclick = () => { S.inboxSel = el.dataset.sel; renderInbox(); }));

  if (S.inboxSel === "ann") {
    pane.innerHTML = `<div class="pane-scroll">${isAdmin() ? `<form id="ann-form" class="card ann-compose"><h3>📢 تعميم جديد</h3>
        <div class="grid2"><label>العنوان<input name="subject" required placeholder="مثال: اجتماع الفريق يوم الخميس"></label>
        <label>يُرسل إلى<select name="project_id"><option value="">📣 جميع الأعضاء</option>${S.projects.map((p) => `<option value="${p.id}">فريق: ${esc(p.name)}</option>`).join("")}</select></label></div>
        <label>نص التعميم<textarea name="body" required></textarea></label>
        <div class="form-actions"><button class="btn gold pulse" type="submit">📤 إرسال التعميم</button></div></form>` : ""}
      ${anns.slice().reverse().map((m) => {
        const readers = S.allReads.filter((r) => r.message_id === m.id).length;
        const target = m.project_id ? `فريق ${S.projects.find((p) => p.id === m.project_id)?.name || ""}` : "الجميع";
        return `<div class="ann ${isUnread(m) ? "new" : ""}"><div class="row"><span class="ann-ico">📢</span><b>${esc(m.subject || "تعميم")}</b>${isUnread(m) ? `<span class="tag red">جديد</span>` : ""}
          <div class="spacer"></div><span class="tag gold">إلى: ${esc(target)}</span>${isAdmin() ? `<button class="icon-btn" data-delmsg="${m.id}" title="حذف">🗑</button>` : ""}</div>
          <div class="ann-body">${esc(m.body)}</div><small class="muted">${esc(pname(m.sender))} · ${fmtTime(m.created_at)}${isAdmin() ? ` · 👁 قرأه ${readers}` : ""}</small></div>`;
      }).join("") || `<div class="empty">لا تعميمات بعد 📭</div>`}</div>`;
    const f = $("#ann-form");
    if (f) f.onsubmit = async (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(f));
      try {
        const m = must(await sb.from("messages").insert({ kind: "announcement", sender: S.me.id, subject: d.subject, body: d.body, project_id: d.project_id || null }).select().single());
        if (!S.msgs.some((x) => x.id === m.id)) S.msgs.push(m);
        toast("تم إرسال التعميم ✅"); renderInbox();
      } catch (er) { fail(er); }
    };
    $$("[data-delmsg]", pane).forEach((b) => (b.onclick = async () => {
      if (!confirmBox("حذف هذا التعميم؟")) return;
      must(await sb.from("messages").delete().eq("id", +b.dataset.delmsg || b.dataset.delmsg));
      S.msgs = S.msgs.filter((m) => String(m.id) !== b.dataset.delmsg); renderInbox();
    }));
    setTimeout(() => markRead(anns), 1500);
    return;
  }
  const other = prof(S.inboxSel);
  if (!other) { S.inboxSel = "ann"; return renderInbox(); }
  const c = conv(other.id);
  pane.innerHTML = `<div class="chat-head"><span class="ib-av ${other.role === "admin" ? "gold" : ""}">${esc((other.full_name || other.username)[0])}</span>
      <div><b>${esc(other.full_name)}</b><small>${other.role === "admin" ? "المشرف" : esc(other.specialty || "عضو فريق")}</small></div></div>
    <div class="chat-body" id="chat-body">${c.map((m, i) => {
      const day = new Date(m.created_at).toDateString(), prevDay = i ? new Date(c[i - 1].created_at).toDateString() : "";
      return `${day !== prevDay ? `<div class="chat-day">${fmtDate(m.created_at)}</div>` : ""}<div class="bubble ${m.sender === S.me.id ? "me" : "them"}">
        <div>${esc(m.body).replace(/\n/g, "<br>")}</div><small>${new Date(m.created_at).toLocaleTimeString("ar-SY-u-nu-latn", { hour: "2-digit", minute: "2-digit" })}</small></div>`;
    }).join("") || `<div class="empty">لا رسائل بعد — اكتب أول رسالة 👋</div>`}</div>
    <form id="chat-form" class="chat-input"><textarea name="body" rows="1" placeholder="اكتب رسالة… (Enter للإرسال، Shift+Enter لسطر جديد)" required></textarea><button class="btn gold btn-send" type="submit">➤</button></form>`;
  const body = $("#chat-body"); body.scrollTop = body.scrollHeight;
  const ta = $("#chat-form textarea"); ta.value = draft; ta.focus();
  ta.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#chat-form").requestSubmit(); } };
  ta.oninput = () => { ta.style.height = "auto"; ta.style.height = Math.min(140, ta.scrollHeight) + "px"; };
  $("#chat-form").onsubmit = async (e) => {
    e.preventDefault(); const text = ta.value.trim(); if (!text) return;
    ta.value = "";
    try {
      const m = must(await sb.from("messages").insert({ kind: "chat", sender: S.me.id, recipient: other.id, body: text }).select().single());
      if (!S.msgs.some((x) => x.id === m.id)) S.msgs.push(m);
      renderInbox();
    } catch (er) { ta.value = text; fail(er); }
  };
  markRead(c);
}

// ---------------------------------------------------------------- أرقام مهمة (مجتمع المهتمين)
const digits = (v) => String(v || "").replace(/[^\d+]/g, "").replace(/^00/, "+");
const waLink = (v) => `https://wa.me/${digits(v).replace(/^\+/, "")}`;
const tgLink = (v) => { v = String(v).trim(); if (/^https?:/.test(v)) return v; if (/^[+\d][\d\s-]+$/.test(v)) return `https://t.me/${digits(v)}`; return `https://t.me/${v.replace(/^@/, "")}`; };
const SOCIAL = [[/facebook|fb\.com/, "📘", "فيسبوك"], [/instagram/, "📸", "إنستغرام"], [/linkedin/, "💼", "لينكدإن"], [/twitter|x\.com/, "𝕏", "X"], [/youtube|youtu\.be/, "▶️", "يوتيوب"],
  [/tiktok/, "🎵", "تيك توك"], [/github/, "💻", "GitHub"], [/researchgate|scholar/, "🎓", "بحثي"], [/./, "🔗", "رابط"]];
const socialOf = (u) => SOCIAL.find(([r]) => r.test(u));
VIEWS.contacts = async (main) => {
  let q = sb.from("contacts").select("*").order("name");
  if (!(isAdmin() && S.libAll)) q = q.eq("project_id", S.pid);
  const items = must(await q);
  const tags = [...new Set(items.flatMap((i) => (i.tags || "").split(",").map((t) => t.trim()).filter(Boolean)))];
  main.innerHTML = head("📇 أرقام مهمة", "دليل مجتمع المهتمين بمجال المشروع: خبراء، مهندسون، موردون، داعمون — مع واتساب وتيليغرام وصفحاتهم",
    `${isAdmin() ? `<label class="row" style="margin:0;color:var(--ink)"><input type="checkbox" id="ct-all" style="width:auto" ${S.libAll ? "checked" : ""}> من كل المشاريع</label>` : ""}
     <button class="btn ghost" id="ct-vcf">⬇️ تصدير لجهات الهاتف</button>${canEdit() ? `<button class="btn gold pulse" id="ct-add">＋ إضافة شخص</button>` : ""}`) + `
    <div class="filters"><input id="ct-q" placeholder="🔍 ابحث بالاسم، الاختصاص، الجهة…"><button class="chip on" data-tag="">الكل (${items.length})</button>${tags.map((t) => `<button class="chip" data-tag="${esc(t)}">#${esc(t)}</button>`).join("")}</div>
    <div class="cards" id="ct-grid"></div>`;
  let tag = "", qs = "", shown = items;
  const draw = () => {
    shown = items.filter((i) => (!tag || (i.tags || "").split(",").map((x) => x.trim()).includes(tag)) &&
      (!qs || `${i.name} ${i.title} ${i.organization} ${i.tags} ${i.notes} ${i.phone}`.toLowerCase().includes(qs)));
    $("#ct-grid").innerHTML = shown.map((c) => {
      const links = (c.links || "").split(/\s+/).filter((l) => /^https?:/.test(l));
      return `<div class="card contact">
        <div class="row"><span class="ct-av">${esc(c.name.trim()[0] || "?")}</span><div style="flex:1;min-width:0"><b class="ct-name">${esc(c.name)}</b>
          <small class="muted">${esc([c.title, c.organization].filter(Boolean).join(" · "))}</small></div>
          ${canEdit() && c.project_id === S.pid ? `<button class="icon-btn" data-ce="${c.id}">✏️</button><button class="icon-btn" data-cd="${c.id}">🗑</button>` : ""}</div>
        ${c.phone ? `<div class="ct-phone" dir="ltr">${esc(c.phone)}<button class="icon-btn" data-copy="${esc(c.phone)}" title="نسخ">📋</button></div>` : ""}
        <div class="ct-actions">
          ${c.phone ? `<a class="btn3d sm" href="tel:${esc(digits(c.phone))}">📞 اتصال</a>` : ""}
          ${c.whatsapp || c.phone ? `<a class="btn3d sm wa" target="_blank" rel="noopener" href="${waLink(c.whatsapp || c.phone)}">🟢 واتساب</a>` : ""}
          ${c.telegram ? `<a class="btn3d sm tg" target="_blank" rel="noopener" href="${esc(tgLink(c.telegram))}">✈️ تيليغرام</a>` : ""}
          ${c.email ? `<a class="btn3d sm" href="mailto:${esc(c.email)}">✉️ بريد</a>` : ""}
          ${links.map((l) => { const [, ic, lb] = socialOf(l); return `<a class="btn3d sm" target="_blank" rel="noopener" href="${esc(l)}" title="${esc(l)}">${ic} ${lb}</a>`; }).join("")}
        </div>
        ${c.tags ? `<div class="row">${c.tags.split(",").filter((t) => t.trim()).map((t) => `<span class="tag">#${esc(t.trim())}</span>`).join("")}</div>` : ""}
        ${c.notes ? `<div class="muted" style="font-size:13px;white-space:pre-wrap">${esc(c.notes)}</div>` : ""}
      </div>`;
    }).join("") || `<div class="empty">لا أشخاص بعد 📇</div>`;
    $$("[data-copy]").forEach((b) => (b.onclick = () => { navigator.clipboard.writeText(b.dataset.copy); toast("تم نسخ الرقم"); }));
    $$("[data-ce]").forEach((b) => (b.onclick = () => form(items.find((x) => x.id === b.dataset.ce))));
    $$("[data-cd]").forEach((b) => (b.onclick = async () => { if (confirmBox("حذف جهة الاتصال؟")) { must(await sb.from("contacts").delete().eq("id", b.dataset.cd)); render(); } }));
  };
  const form = (c = {}) => openModal(c.id ? "تعديل جهة اتصال" : "إضافة شخص إلى الدليل", `<form class="mform">
    <div class="grid2"><label>الاسم<input name="name" required value="${esc(c.name)}"></label><label>الصفة / الاختصاص<input name="title" value="${esc(c.title)}" placeholder="مهندس ميكاترونيك، خبير ذكاء اصطناعي…"></label></div>
    <div class="grid2"><label>الجهة / المؤسسة<input name="organization" value="${esc(c.organization)}"></label><label>رقم الهاتف<input name="phone" dir="ltr" value="${esc(c.phone)}" placeholder="+963 9xx xxx xxx"></label></div>
    <div class="grid3"><label>واتساب (إن اختلف)<input name="whatsapp" dir="ltr" value="${esc(c.whatsapp)}" placeholder="+9639…"></label><label>تيليغرام<input name="telegram" dir="ltr" value="${esc(c.telegram)}" placeholder="@username"></label>
      <label>البريد<input name="email" type="email" dir="ltr" value="${esc(c.email)}"></label></div>
    <label>روابط صفحاته (كل رابط بسطر: فيسبوك، إنستغرام، لينكدإن…)<textarea name="links" dir="ltr" placeholder="https://facebook.com/...">${esc(c.links)}</textarea></label>
    <div class="grid2"><label>وسوم (مفصولة بفواصل)<input name="tags" value="${esc(c.tags)}" placeholder="روبوتات, مورد قطع, جامعة دمشق"></label><label>ملاحظات<input name="notes" value="${esc(c.notes)}"></label></div>
    <div class="form-actions"><button class="btn" type="submit">حفظ</button></div></form>`, {
    onSubmit: async (d) => {
      if (c.id) must(await sb.from("contacts").update(d).eq("id", c.id));
      else { must(await sb.from("contacts").insert({ ...d, project_id: S.pid, user_id: S.me.id })); log("أضاف إلى دليل الأرقام", d.name); }
      closeModal(); toast("تم الحفظ"); render();
    },
  });
  draw();
  $("#ct-q").oninput = (e) => { qs = e.target.value.toLowerCase(); draw(); };
  $$("[data-tag]").forEach((b) => (b.onclick = () => { tag = b.dataset.tag; $$("[data-tag]").forEach((x) => x.classList.toggle("on", x === b)); draw(); }));
  $("#ct-all") && ($("#ct-all").onchange = (e) => { S.libAll = e.target.checked; render(); });
  $("#ct-add") && ($("#ct-add").onclick = () => form());
  $("#ct-vcf").onclick = () => {
    const vcf = shown.map((c) => ["BEGIN:VCARD", "VERSION:3.0", `FN:${c.name}`, c.organization ? `ORG:${c.organization}` : "", c.title ? `TITLE:${c.title}` : "",
      c.phone ? `TEL;TYPE=CELL:${digits(c.phone)}` : "", c.email ? `EMAIL:${c.email}` : "", ...(c.links || "").split(/\s+/).filter(Boolean).map((l) => `URL:${l}`),
      `NOTE:${[c.tags, c.notes].filter(Boolean).join(" — ")}`, "END:VCARD"].filter(Boolean).join("\r\n")).join("\r\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([vcf], { type: "text/vcard" })), download: "sanabel-contacts.vcf" });
    a.click(); URL.revokeObjectURL(a.href);
  };
};

// ---------------------------------------------------------------- 🎬 فيديو شرح عن المنصة
const MEDIA_BUCKET = "platform-media";
const ytIdOf = (u) => (String(u || "").match(/(?:youtu\.be\/|[?&]v=|shorts\/|embed\/|live\/)([\w-]{11})/) || [])[1];
const driveIdOf = (u) => (String(u || "").match(/\/(?:file\/d|folders)\/([\w-]{20,})/) || String(u || "").match(/[?&]id=([\w-]{20,})/) || [])[1];
const KIND_LABEL = { youtube: "▶️ يوتيوب", drive: "📁 Google Drive", file: "💾 من الجهاز", link: "🔗 رابط" };
async function videoSrc(v) {
  if (v.kind === "file" && v.file_path) {
    const { data } = await sb.storage.from(MEDIA_BUCKET).createSignedUrls([v.file_path], 3600 * 6);
    return data?.[0]?.signedUrl || "";
  }
  return v.url || "";
}
async function playerHTML(v) {
  if (v.kind === "youtube") { const id = ytIdOf(v.url); return id ? `<iframe src="https://www.youtube.com/embed/${id}?rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>` : ""; }
  if (v.kind === "drive") { const id = driveIdOf(v.url); return id ? `<iframe src="https://drive.google.com/file/d/${id}/preview" allow="autoplay; fullscreen" allowfullscreen></iframe>` : ""; }
  const src = await videoSrc(v);
  if (v.kind === "file" || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src)) return `<video src="${esc(src)}" controls playsinline preload="metadata"></video>`;
  return `<div class="vid-link"><span>🔗</span><a class="btn gold" href="${esc(src)}" target="_blank" rel="noopener">فتح الفيديو في نافذة جديدة</a></div>`;
}
const vThumb = (v) => v.kind === "youtube" && ytIdOf(v.url) ? `style="background-image:url(https://i.ytimg.com/vi/${ytIdOf(v.url)}/hqdefault.jpg)"` : "";
VIEWS.videos = async (main) => {
  const r = await sb.from("platform_videos").select("*").order("sort").order("created_at", { ascending: false });
  if (r.error) {
    main.innerHTML = head("🎬 فيديو شرح عن المنصة") + `<div class="card empty">${isAdmin() ? `⚙️ قسم الفيديو يحتاج تجهيزاً بسيطاً: شغّل ملف <b dir="ltr">supabase/videos.sql</b> مرة واحدة في Supabase ← SQL Editor ثم حدّث الصفحة.<br><small class="muted" dir="ltr">${esc(r.error.message)}</small>` : "لا توجد فيديوهات بعد"}</div>`;
    return;
  }
  const vids = r.data || [];
  const cur = vids.find((v) => v.id === S.vidSel) || vids[0];
  const isNew = (v) => Date.now() - new Date(v.created_at) < 7 * 86400000;
  main.innerHTML = head("🎬 فيديو شرح عن المنصة", isAdmin() ? "أضف فيديوهات تشرح للأعضاء طريقة استخدام المنصة — تظهر للجميع" : "فيديوهات من المشرف تشرح طريقة استخدام المنصة",
    isAdmin() ? `<button class="btn gold pulse" id="vid-add">＋ إضافة فيديو</button>` : "") + (vids.length ? `
    <div class="vid-layout">
      <section class="vid-main card">
        <div class="vid-player" id="vid-player"><div class="empty">⏳</div></div>
        <div class="vid-info"><div class="row"><h3 style="margin:0">${esc(cur.title)}</h3>${isNew(cur) ? `<span class="tag red">جديد</span>` : ""}<span class="tag gold">${KIND_LABEL[cur.kind] || ""}</span>
          <div class="spacer"></div><small class="muted">${fmtDate(cur.created_at)}</small></div>
          ${cur.description ? `<p style="white-space:pre-wrap;margin:8px 0 0">${esc(cur.description)}</p>` : ""}
          ${cur.kind === "drive" ? `<p class="muted" style="font-size:12.5px;margin:6px 0 0">💡 إن لم يظهر الفيديو: تأكد أن ملف Drive مشارك بخيار «أي شخص لديه الرابط».</p>` : ""}</div>
      </section>
      <aside class="vid-list">${vids.map((v, i) => `
        <div class="vid-item ${v.id === cur.id ? "on" : ""}" data-vid="${v.id}">
          <div class="vid-thumb ${v.kind}" ${vThumb(v)}><span>${v.id === cur.id ? "▶" : i + 1}</span></div>
          <div class="vid-meta"><b>${esc(v.title)}</b><small>${KIND_LABEL[v.kind] || ""}${isNew(v) ? ` · <span style="color:#d9534f">جديد</span>` : ""}</small>
            ${isAdmin() ? `<div class="vid-adm"><button class="icon-btn" data-vup="${v.id}" title="للأعلى" ${i ? "" : "disabled"}>▲</button><button class="icon-btn" data-vdown="${v.id}" title="للأسفل" ${i < vids.length - 1 ? "" : "disabled"}>▼</button>
              <button class="icon-btn" data-vedit="${v.id}" title="تعديل">✏️</button><button class="icon-btn" data-vdel="${v.id}" title="حذف">🗑</button></div>` : ""}</div>
        </div>`).join("")}</aside>
    </div>` : `<div class="card empty" style="padding:60px 10px"><div style="font-size:54px">🎬</div><h3>${isAdmin() ? "لم تُضف أي فيديو بعد" : "لم يُضف المشرف فيديو شرح بعد"}</h3>${isAdmin() ? `<p>أضف رابط يوتيوب أو Google Drive، أو ارفع فيديو من جهازك (حتى 50MB)</p>` : ""}</div>`);
  if (cur) $("#vid-player").innerHTML = await playerHTML(cur) || `<div class="empty">⚠️ رابط الفيديو غير صالح</div>`;
  $$("[data-vid]").forEach((el) => (el.onclick = (e) => { if (e.target.closest(".vid-adm")) return; S.vidSel = el.dataset.vid; render(); }));
  if (!isAdmin()) return;
  $("#vid-add").onclick = () => videoForm();
  $$("[data-vedit]").forEach((b) => (b.onclick = () => videoForm(vids.find((v) => v.id === b.dataset.vedit))));
  $$("[data-vdel]").forEach((b) => (b.onclick = async () => {
    const v = vids.find((x) => x.id === b.dataset.vdel); if (!confirmBox(`حذف الفيديو «${v.title}»؟`)) return;
    try { if (v.file_path) await sb.storage.from(MEDIA_BUCKET).remove([v.file_path]); must(await sb.from("platform_videos").delete().eq("id", v.id)); toast("🗑 حُذف الفيديو"); render(); } catch (e) { fail(e); }
  }));
  const move = async (id, dir) => {
    const i = vids.findIndex((v) => v.id === id), j = i + dir; if (j < 0 || j >= vids.length) return;
    const order = vids.map((v) => v.id); [order[i], order[j]] = [order[j], order[i]];
    try { for (let k = 0; k < order.length; k++) must(await sb.from("platform_videos").update({ sort: k }).eq("id", order[k])); render(); } catch (e) { fail(e); }
  };
  $$("[data-vup]").forEach((b) => (b.onclick = () => move(b.dataset.vup, -1)));
  $$("[data-vdown]").forEach((b) => (b.onclick = () => move(b.dataset.vdown, 1)));
};
function videoForm(v = {}) {
  const kind0 = v.kind || "youtube";
  openModal(v.id ? "✏️ تعديل الفيديو" : "🎬 إضافة فيديو شرح", `<form class="mform">
    <label>عنوان الفيديو<input name="title" required value="${esc(v.title)}" placeholder="مثال: كيف ترفع عملك على المهمة"></label>
    <label>شرح مختصر (اختياري)<textarea name="description" style="min-height:70px">${esc(v.description)}</textarea></label>
    <label>مصدر الفيديو</label>
    <div class="vid-kinds">${[["youtube", "▶️ يوتيوب"], ["drive", "📁 Google Drive"], ["file", "💾 رفع من جهازي"]].map(([k, l]) => `<label class="vk"><input type="radio" name="kind" value="${k}" ${kind0 === k ? "checked" : ""}><span>${l}</span></label>`).join("")}</div>
    <label id="vf-url">الرابط<input name="url" dir="ltr" value="${esc(v.url)}" placeholder="https://"></label>
    <label id="vf-file" class="hidden">ملف الفيديو (MP4 أو WEBM، حتى 50MB)<input type="file" name="file" accept="video/*">${v.file_path ? `<small class="muted">اتركه فارغاً للإبقاء على الفيديو الحالي</small>` : ""}</label>
    <p class="muted" id="vf-hint" style="font-size:13px"></p>
    ${v.id ? "" : `<label class="row" style="color:var(--ink);gap:8px"><input type="checkbox" name="announce" checked style="width:auto"> إرسال تعميم للأعضاء بأن فيديو جديداً أُضيف</label>`}
    <div class="form-actions"><span id="vf-busy" class="muted"></span><div class="spacer"></div><button class="btn" type="submit">حفظ</button></div></form>`, {
    onOpen: (box) => {
      const hint = { youtube: "الصق رابط الفيديو من يوتيوب (يمكن أن يكون «غير مُدرج Unlisted» حتى لا يراه غير الفريق).", drive: "ارفع الفيديو إلى Google Drive ← مشاركة ← «أي شخص لديه الرابط» ← انسخ الرابط والصقه هنا.", file: "الحد الأقصى 50MB. للفيديوهات الأطول استخدم يوتيوب أو Drive." };
      const sync = () => { const k = box.querySelector("input[name=kind]:checked").value; $("#vf-url").classList.toggle("hidden", k === "file"); $("#vf-file").classList.toggle("hidden", k !== "file"); $("#vf-hint").textContent = hint[k]; };
      $$("input[name=kind]", box).forEach((r) => (r.onchange = sync)); sync();
    },
    onSubmit: async (d, form) => {
      const row = { title: d.title.trim(), description: d.description || null, kind: d.kind, url: null };
      if (d.kind === "youtube") { if (!ytIdOf(d.url)) throw new Error("رابط يوتيوب غير صالح"); row.url = d.url.trim(); row.file_path = null; }
      if (d.kind === "drive") { if (!driveIdOf(d.url)) throw new Error("رابط Google Drive غير صالح — يجب أن يحتوي على /file/d/"); row.url = d.url.trim(); row.file_path = null; }
      if (d.kind === "file") {
        const f = form.querySelector("input[name=file]").files[0];
        if (f) {
          if (!f.type.startsWith("video/")) throw new Error("الملف ليس فيديو");
          if (f.size > 50 * 1024 * 1024) throw new Error(`حجم الفيديو ${(f.size / 1048576).toFixed(0)}MB — الحد 50MB. ارفعه على يوتيوب أو Drive وضع الرابط`);
          $("#vf-busy").textContent = `⏳ جارِ رفع ${(f.size / 1048576).toFixed(1)}MB…`;
          const path = `videos/${Date.now()}_${safeName(f.name)}`;
          must(await sb.storage.from(MEDIA_BUCKET).upload(path, f, { contentType: f.type }));
          if (v.file_path) await sb.storage.from(MEDIA_BUCKET).remove([v.file_path]);
          row.file_path = path;
        } else if (!v.file_path) throw new Error("اختر ملف الفيديو");
      } else if (v.file_path) await sb.storage.from(MEDIA_BUCKET).remove([v.file_path]);
      if (v.id) must(await sb.from("platform_videos").update(row).eq("id", v.id));
      else {
        const top = must(await sb.from("platform_videos").select("sort").order("sort").limit(1));
        const saved = must(await sb.from("platform_videos").insert({ ...row, sort: (top[0]?.sort ?? 1) - 1, created_by: S.me.id }).select().single());
        S.vidSel = saved.id;
        if (d.announce) await sb.from("messages").insert({ kind: "announcement", sender: S.me.id, subject: "🎬 فيديو شرح جديد", body: `أُضيف فيديو جديد: «${row.title}»\nتجده في تبويب «🎬 فيديو شرح عن المنصة».`, project_id: null });
      }
      closeModal(); toast("✅ تم حفظ الفيديو"); render();
    },
  });
}

boot();
