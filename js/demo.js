// =====================================================================
//  وضع تجريبي: يعمل بدون Supabase وبيانات تجريبية محفوظة في المتصفح
//  يُفعَّل تلقائياً ما دام js/config.js لم يُعبَّأ، أو بإضافة ?demo للرابط
// =====================================================================
const KEY = "sanabel-demo-db";
const VERSION = 2;
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const DEFAULTS = {
  profiles: { role: "member" },
  tasks: { status: "todo", priority: "med", type: "research", progress: 0, score: null, feedback: null, completed_at: null, goal_id: null, assignee: null },
  notes: { resolved: false, kind: "note" },
  parts: { qty: 1, status: "needed" },
  library: { kind: "link" },
  files: { language: "plaintext", content: "" },
  project_members: { role: "editor" },
  goals: { period: "month" },
};
const NUMERIC_ID = ["activity", "file_versions", "messages"];

function seed() {
  const A = uid(), M1 = uid(), M2 = uid(), M3 = uid(), P1 = uid(), P2 = uid(), G1 = uid(), G2 = uid(), G3 = uid();
  const T = (o) => ({ id: uid(), project_id: P1, created_at: now(), updated_at: now(), ...DEFAULTS.tasks, ...o });
  const tasks = [
    T({ title: "دراسة أنواع حساسات المسافة", type: "research", status: "done", progress: 100, assignee: M1, start_date: day(-20), due_date: day(-12), completed_at: day(-13) + "T10:00:00Z", score: 9, feedback: "بحث ممتاز ومنظم", goal_id: G1 }),
    T({ title: "تصميم الهيكل الميكانيكي ثلاثي الأبعاد", type: "design", status: "review", progress: 90, assignee: M2, start_date: day(-14), due_date: day(-2), goal_id: G1 }),
    T({ title: "برمجة خوارزمية تجنب العوائق", type: "code", status: "doing", progress: 55, assignee: M3, start_date: day(-8), due_date: day(5), priority: "high", goal_id: G2 }),
    T({ title: "معايرة المحركات والـ PID", type: "code", status: "doing", progress: 30, assignee: M1, start_date: day(-3), due_date: day(9), goal_id: G2 }),
    T({ title: "تجميع النموذج الأولي", type: "build", status: "todo", assignee: M2, start_date: day(6), due_date: day(20), goal_id: G2 }),
    T({ title: "كتابة التقرير الفني للمسابقة", type: "research", status: "todo", assignee: M3, start_date: day(25), due_date: day(45), goal_id: G3 }),
    T({ title: "تصوير فيديو العرض", type: "other", status: "todo", priority: "low", assignee: M1, start_date: day(40), due_date: day(55), goal_id: G3 }),
    T({ project_id: P2, title: "تحليل أسئلة السنوات السابقة", type: "research", status: "doing", progress: 40, assignee: M3, start_date: day(-5), due_date: day(10) }),
  ];
  const F = (path, language, content, by) => ({ id: uid(), project_id: P1, path, language, content, updated_by: by, created_at: now(), updated_at: now() });
  const files = [
    F("src/main.py", "python", `# الملف الرئيسي للروبوت\nfrom sensors import read_distance\nfrom motors import drive\n\nSAFE_DISTANCE = 25  # cm\n\ndef loop():\n    d = read_distance()\n    if d < SAFE_DISTANCE:\n        drive(left=-0.4, right=0.4)   # دوران\n    else:\n        drive(left=0.6, right=0.6)    # تقدم\n\nwhile True:\n    loop()\n`, M3),
    F("src/sensors.py", "python", `import random\n\ndef read_distance():\n    """قراءة حساس الأمواج فوق الصوتية (محاكاة)"""\n    return random.uniform(5, 120)\n`, M1),
    F("firmware/motor_pid.ino", "cpp", `// متحكم PID للمحركات\nfloat Kp = 1.2, Ki = 0.05, Kd = 0.3;\nfloat integral = 0, prevErr = 0;\n\nfloat pid(float target, float measured, float dt) {\n  float e = target - measured;\n  integral += e * dt;\n  float d = (e - prevErr) / dt;\n  prevErr = e;\n  return Kp * e + Ki * integral + Kd * d;\n}\n\nvoid setup() { Serial.begin(115200); }\nvoid loop() {}\n`, M1),
    F("README.md", "markdown", "# روبوت الإنقاذ الذكي\n\nمشروع الفريق لمسابقة العلوم.\n", A),
  ];
  return {
    _auth: { [`admin`]: { pw: "admin", id: A }, ahmad: { pw: "1234", id: M1 }, sara: { pw: "1234", id: M2 }, omar: { pw: "1234", id: M3 } },
    _v: VERSION, _session: null, _seq: 100,
    profiles: [
      { id: A, username: "admin", full_name: "م. أسامة الصلخدي", role: "admin", specialty: "المشرف", created_at: now() },
      { id: M1, username: "ahmad", full_name: "أحمد", role: "member", specialty: "برمجة وتحكم", created_at: now() },
      { id: M2, username: "sara", full_name: "سارة", role: "member", specialty: "تصميم ميكانيكي", created_at: now() },
      { id: M3, username: "omar", full_name: "عمر", role: "member", specialty: "بحث وذكاء اصطناعي", created_at: now() },
    ],
    projects: [
      { id: P1, name: "روبوت الإنقاذ الذكي", competition: "مسابقة العلوم والابتكار", description: "روبوت يتجنب العوائق ويبحث عن ناجين في المباني المنهارة", start_date: day(-25), end_date: day(60), color: "#c39a5c", created_at: now() },
      { id: P2, name: "تحضير الأولمبياد العلمي", competition: "الأولمبياد العلمي السوري", description: "خطة تدريب الفريق على مسائل الفيزياء والبرمجة", start_date: day(-10), end_date: day(120), color: "#3f8f63", created_at: now() },
    ],
    project_members: [
      { project_id: P1, user_id: M1, role: "editor" }, { project_id: P1, user_id: M2, role: "editor" }, { project_id: P1, user_id: M3, role: "manager" },
      { project_id: P2, user_id: M3, role: "editor" }, { project_id: P2, user_id: M1, role: "viewer" },
    ],
    goals: [
      { id: G1, project_id: P1, title: "إنهاء الدراسة والتصميم", period: "month", start_date: day(-25), end_date: day(0), created_at: now() },
      { id: G2, project_id: P1, title: "نموذج أولي يعمل", period: "quarter", start_date: day(-10), end_date: day(25), created_at: now() },
      { id: G3, project_id: P1, title: "الجاهزية الكاملة للمسابقة", period: "half", start_date: day(20), end_date: day(60), created_at: now() },
    ],
    tasks,
    submissions: [
      { id: uid(), project_id: P1, task_id: tasks[0].id, user_id: M1, kind: "link", title: "مقارنة بين حساسات Ultrasonic و LiDAR", content: "https://en.wikipedia.org/wiki/Lidar", created_at: now() },
      { id: uid(), project_id: P1, task_id: tasks[2].id, user_id: M3, kind: "code", title: "النسخة الأولى من الخوارزمية", language: "python", content: files[0].content, created_at: now() },
    ],
    files,
    file_versions: files.map((f, i) => ({ id: i + 1, project_id: P1, file_id: f.id, path: f.path, action: "create", content: f.content, user_id: f.updated_by, created_at: now() })),
    activity: [
      { id: 1, project_id: P1, user_id: M1, action: "أنهى المهمة", details: "دراسة أنواع حساسات المسافة", created_at: day(-13) + "T10:00:00Z" },
      { id: 2, project_id: P1, user_id: M3, action: "أنشأ الملف", details: "src/main.py", created_at: day(-6) + "T15:30:00Z" },
      { id: 3, project_id: P1, user_id: M2, action: "نقل المهمة إلى «للمراجعة»", details: "تصميم الهيكل الميكانيكي ثلاثي الأبعاد", created_at: day(-1) + "T18:10:00Z" },
    ],
    notes: [
      { id: uid(), project_id: P1, kind: "announcement", title: "اجتماع الفريق يوم الخميس الساعة 6 مساءً", body: "يرجى تجهيز ما أنجزه كل واحد", resolved: false, user_id: A, created_at: now() },
      { id: uid(), project_id: P1, kind: "issue", title: "الحساس يعطي قراءات خاطئة تحت 5 سم", body: "نحتاج تصفية القراءات (median filter)", resolved: false, user_id: M1, created_at: now() },
      { id: uid(), project_id: P1, kind: "note", title: "استخدموا بطارية 7.4V وليس 9V", body: "", resolved: false, user_id: M2, created_at: now() },
    ],
    library: [
      { id: uid(), project_id: P1, section: "research", kind: "link", title: "شرح متحكم PID بالفيديو", url: "https://www.youtube.com/watch?v=wkfEZmsQqiA", tags: "تحكم, PID", notes: "شرح ممتاز للأساسيات", user_id: M1, created_at: now() },
      { id: uid(), project_id: P1, section: "research", kind: "link", title: "ورقة: Obstacle avoidance for mobile robots", url: "https://arxiv.org/", tags: "روبوت, ذكاء اصطناعي", notes: "", user_id: M3, created_at: now() },
      { id: uid(), project_id: P1, section: "books", kind: "link", title: "كتاب Modern Robotics (رابط درايف)", url: "https://drive.google.com/", tags: "مرجع", notes: "الفصول 3–6 مهمة", user_id: M3, created_at: now() },
      { id: uid(), project_id: P1, section: "misc", kind: "link", title: "فكرة تصميم من إنستغرام", url: "https://www.instagram.com/", tags: "تصميم", notes: "", user_id: M2, created_at: now() },
    ],
    messages: [
      { id: 1, kind: "announcement", sender: A, recipient: null, project_id: null, subject: "أهلاً بكم في منصة الفرق 🌾", body: "من اليوم كل المهام والملفات والتواصل هنا.\nأي سؤال راسلوني مباشرة من صندوق الوارد.", created_at: day(-3) + "T09:00:00Z" },
      { id: 2, kind: "announcement", sender: A, recipient: null, project_id: P1, subject: "موعد تسليم النموذج الأولي", body: "يجب أن يكون النموذج الأولي جاهزاً قبل نهاية الشهر. عمر مسؤول عن توزيع المهام.", created_at: day(-1) + "T17:30:00Z" },
      { id: 3, kind: "chat", sender: M1, recipient: A, project_id: null, body: "أستاذ، رفعت كود PID. هل القيم مناسبة كبداية؟", created_at: day(-1) + "T19:02:00Z" },
      { id: 4, kind: "chat", sender: A, recipient: M1, project_id: null, body: "ممتاز يا أحمد 👌 جرّب تقليل Kd قليلاً وارفع النتائج.", created_at: day(-1) + "T19:20:00Z" },
      { id: 5, kind: "chat", sender: M2, recipient: A, project_id: null, body: "انتهيت من التصميم، أرسلته للمراجعة.", created_at: day(0) + "T08:15:00Z" },
      { id: 6, kind: "chat", sender: M3, recipient: M1, project_id: null, body: "أحمد، متى تجهز معايرة المحركات؟", created_at: day(0) + "T10:40:00Z" },
    ],
    message_reads: [{ message_id: 4, user_id: M1 }],
    contacts: [
      { id: uid(), project_id: P1, name: "م. خالد العلي", title: "مهندس ميكاترونيك", organization: "جامعة دمشق", phone: "+963 944 123 456", whatsapp: "", telegram: "@khaled_mech", email: "", links: "https://www.linkedin.com/", tags: "روبوتات, خبير", notes: "مستعد لمراجعة التصميم الميكانيكي", user_id: A, created_at: now() },
      { id: uid(), project_id: P1, name: "متجر القطع الإلكترونية", title: "مورد قطع", organization: "دمشق - البحصة", phone: "+963 11 222 3344", whatsapp: "+963 933 222 334", telegram: "", email: "", links: "https://www.facebook.com/", tags: "مورد قطع", notes: "خصم للطلاب", user_id: M1, created_at: now() },
      { id: uid(), project_id: P1, name: "د. ريم حسن", title: "باحثة ذكاء اصطناعي", organization: "", phone: "", whatsapp: "", telegram: "@reem_ai", email: "reem@example.com", links: "https://scholar.google.com/ https://www.youtube.com/", tags: "ذكاء اصطناعي, أكاديمي", notes: "", user_id: M3, created_at: now() },
    ],
    parts: [
      { id: uid(), project_id: P1, name: "Arduino Mega 2560", url: "https://store.arduino.cc/", qty: 1, price: 40, status: "received", notes: "", user_id: M1, created_at: now() },
      { id: uid(), project_id: P1, name: "حساس HC-SR04", url: "https://www.aliexpress.com/", qty: 4, price: 2, status: "ordered", notes: "", user_id: M1, created_at: now() },
      { id: uid(), project_id: P1, name: "محرك DC مع Encoder", url: "", qty: 2, price: 15, status: "needed", notes: "12V", user_id: M2, created_at: now() },
    ],
  };
}

let db = (() => { try { const d = JSON.parse(localStorage.getItem(KEY)); return d && d._v === VERSION ? d : seed(); } catch { return seed(); } })();
const blobs = new Map();
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
persist();

function cascade(table, rows) {
  const ids = rows.map((r) => r.id);
  if (table === "projects") for (const t of Object.keys(db)) if (Array.isArray(db[t]) && t !== "projects") db[t] = db[t].filter((r) => !ids.includes(r.project_id));
  if (table === "tasks") db.submissions = db.submissions.filter((r) => !ids.includes(r.task_id));
  if (table === "profiles") db.project_members = db.project_members.filter((r) => !ids.includes(r.user_id));
}

class Query {
  constructor(t) { this.t = t; this.op = "select"; this.f = []; this.ret = false; }
  select() { if (this.op === "select") this.op = "select"; else this.ret = true; return this; }
  insert(v) { this.op = "insert"; this.v = Array.isArray(v) ? v : [v]; return this; }
  update(v) { this.op = "update"; this.v = v; return this; }
  delete() { this.op = "delete"; return this; }
  upsert(v, { onConflict = "id" } = {}) { this.op = "upsert"; this.v = Array.isArray(v) ? v : [v]; this.keys = onConflict.split(","); return this; }
  eq(k, v) { this.f.push((r) => r[k] === v); return this; }
  order(k, { ascending = true } = {}) { this.o = [k, ascending]; return this; }
  limit(n) { this.n = n; return this; }
  single() { this.one = "single"; return this; }
  maybeSingle() { this.one = "maybe"; return this; }
  run() {
    db[this.t] ||= [];
    const T = db[this.t], match = (r) => this.f.every((fn) => fn(r));
    let out;
    if (this.op === "insert") {
      out = this.v.map((r) => ({ ...(DEFAULTS[this.t] || {}), id: NUMERIC_ID.includes(this.t) ? ++db._seq : uid(), created_at: now(), ...r }));
      T.push(...out);
    } else if (this.op === "upsert") {
      out = [];
      this.v.forEach((r) => { if (!T.some((x) => this.keys.every((k) => x[k] === r[k]))) { T.push(r); out.push(r); } });
    } else if (this.op === "update") {
      out = T.filter(match); out.forEach((r) => Object.assign(r, this.v));
    } else if (this.op === "delete") {
      out = T.filter(match); db[this.t] = T.filter((r) => !match(r)); cascade(this.t, out);
    } else {
      out = T.filter(match);
      if (this.o) { const [k, asc] = this.o; out = [...out].sort((a, b) => String(a[k] ?? "").localeCompare(String(b[k] ?? "")) * (asc ? 1 : -1)); }
      if (this.n) out = out.slice(0, this.n);
    }
    if (this.op !== "select") persist();
    out = JSON.parse(JSON.stringify(out));
    if (this.one) {
      if (!out.length) return this.one === "maybe" ? { data: null, error: null } : { data: null, error: { message: "غير موجود" } };
      return { data: out[0], error: null };
    }
    return { data: this.op === "select" || this.ret ? out : null, error: null };
  }
  then(res, rej) { return new Promise((r) => setTimeout(r, 40)).then(() => this.run()).then(res, rej); }
}

export function createDemoClient() {
  return {
    from: (t) => new Query(t),
    auth: {
      getSession: async () => ({ data: { session: db._session } }),
      getUser: async () => ({ data: { user: db._session ? { id: db._session.uid } : null } }),
      signInWithPassword: async ({ email, password }) => {
        const a = db._auth[email.split("@")[0]];
        if (!a || a.pw !== password) return { error: { message: "bad" } };
        db._session = { uid: a.id }; persist(); return { error: null };
      },
      signOut: async () => { db._session = null; persist(); },
    },
    storage: {
      from: () => ({
        upload: async (path, file) => {
          let url = URL.createObjectURL(file);
          if (file.size < 600000) url = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); });
          blobs.set(path, url); if (url.startsWith("data:")) { db._files ||= {}; db._files[path] = url; persist(); }
          return { data: { path }, error: null };
        },
        createSignedUrls: async (paths) => ({ data: paths.map((p) => ({ path: p, signedUrl: blobs.get(p) || db._files?.[p] || "" })), error: null }),
        remove: async (paths) => { paths.forEach((p) => { blobs.delete(p); if (db._files) delete db._files[p]; }); persist(); return { error: null }; },
      }),
    },
    functions: {
      invoke: async (_name, { body }) => {
        if (body.action === "create") {
          if (db._auth[body.username]) return { error: { message: "اسم المستخدم موجود", context: { json: async () => ({ error: "اسم المستخدم موجود مسبقاً" }) } } };
          const id = uid();
          db._auth[body.username] = { pw: body.password, id };
          db.profiles.push({ id, username: body.username, full_name: body.full_name, specialty: body.specialty || null, role: "member", created_at: now() });
          persist(); return { data: { id }, error: null };
        }
        if (body.action === "set_password") { const k = Object.keys(db._auth).find((u) => db._auth[u].id === body.user_id); if (k) db._auth[k].pw = body.password; persist(); return { data: { ok: true }, error: null }; }
        if (body.action === "delete") {
          const k = Object.keys(db._auth).find((u) => db._auth[u].id === body.user_id); if (k) delete db._auth[k];
          const gone = db.profiles.filter((p) => p.id === body.user_id); db.profiles = db.profiles.filter((p) => p.id !== body.user_id); cascade("profiles", gone);
          persist(); return { data: { ok: true }, error: null };
        }
      },
    },
    channel: () => { const ch = { on: () => ch, subscribe: () => ch }; return ch; },
    removeChannel: () => {},
  };
}
export const resetDemo = () => { localStorage.removeItem(KEY); location.reload(); };
