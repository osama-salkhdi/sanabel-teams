// =====================================================================
//  💬 المحادثات — واجهة بنمط تيليغرام
//  محادثات خاصة + مجموعات (ينشئها المشرف) + صور + رسائل صوتية + ملفات
//  رد / تعديل / حذف / نسخ + مؤشر «يكتب…» + متصل الآن + ✓✓ القراءة
// =====================================================================
const P = {
  send: "M2.01 21 23 12 2.01 3 2 10l15 2-15 2z",
  mic: "M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z",
  clip: "M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z",
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  more: "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  check: "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  check2: "M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41 6 19l1.41-1.41L1.83 12 .41 13.41z",
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  reply: "M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z",
  copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  image: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  file: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  group: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  search: "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  down: "M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z",
  clock: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  dl: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
  music: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
  eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
  chat: "M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z",
};
const ic = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const PALETTE = ["#e17076", "#7bc862", "#65aadd", "#a695e7", "#ee7aae", "#6ec9cb", "#faa774", "#d4a84f"];
const NAMECOL = ["#c0504d", "#3f9a3a", "#2f7dbd", "#7d63c9", "#c4467f", "#2b9a9c", "#d27a2c", "#a07b1e"];
const EMOJIS = ["👥", "🤖", "🚀", "🔬", "🛠️", "💡", "🏆", "📚", "🌾", "⚙️", "🧪", "🎯"];
const COLORS = ["#1e4a38", "#2f7dbd", "#7d63c9", "#c0504d", "#d27a2c", "#2b9a9c", "#a07b1e", "#c4467f"];
const MAX_MB = 25;

export function createChat(X) {
  const { sb, S, $, $$, esc, toast, fail, must, openModal, closeModal, isAdmin, prof, pname, markRead, chatPeople, isUnread, DEMO } = X;
  const BUCKET = "chat-media";
  const ME = () => S.me.id;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const narrow = () => innerWidth <= 900;
  const NATIVE = !!window.Capacitor?.isNativePlatform?.();
  const T = { sel: null, filter: "all", q: "", reply: null, edit: null, drafts: {}, urls: new Map(), online: new Set(), typing: new Map(), root: null, pending: [], atBottom: true, newBelow: 0, sepId: null, lastMenu: 0 };
  const player = { a: new Audio(), id: null };
  const REC = { cur: null, timer: null };
  let presence = null, lastTyping = 0;

  // ------------------------------------------------------------ أدوات
  const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  const colorOf = (id) => PALETTE[Math.abs(hash(id)) % PALETTE.length];
  const nameColor = (id) => NAMECOL[Math.abs(hash(id)) % NAMECOL.length];
  const initials = (n) => String(n || "?").trim().split(/\s+/).filter((w) => !/^(م|د|أ|م\.|د\.|أ\.)$/.test(w)).slice(0, 2).map((w) => w[0]).join("") || "?";
  const hm = (d) => new Date(d).toLocaleTimeString("ar-SY-u-nu-latn", { hour: "2-digit", minute: "2-digit" });
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  const dayLabel = (d) => {
    const x = new Date(d), t = new Date(), y = new Date(); y.setDate(t.getDate() - 1);
    if (sameDay(x, t)) return "اليوم";
    if (sameDay(x, y)) return "أمس";
    return x.toLocaleDateString("ar-SY-u-nu-latn", { weekday: "long", day: "numeric", month: "long", ...(x.getFullYear() !== t.getFullYear() ? { year: "numeric" } : {}) });
  };
  const listTime = (d) => {
    const x = new Date(d), t = new Date();
    if (sameDay(x, t)) return hm(d);
    if ((t - x) < 6 * 864e5) return x.toLocaleDateString("ar-SY-u-nu-latn", { weekday: "short" });
    return x.toLocaleDateString("ar-SY-u-nu-latn", { day: "numeric", month: "numeric", year: "2-digit" });
  };
  const dur = (s) => { s = Math.max(0, Math.round(+s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const size = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
  const linkify = (h) => h.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" dir="ltr">$1</a>').replace(/\n/g, "<br>");
  const groupOf = (id) => (S.groups || []).find((g) => g.id === id);
  const membersOf = (gid) => (S.groupMembers || []).filter((x) => x.group_id === gid).map((x) => x.user_id);
  const inGroup = (gid) => membersOf(gid).includes(ME());
  const myGroups = () => (S.groups || []).filter((g) => isAdmin() || inGroup(g.id));
  const keyOf = (m) => (m.kind !== "chat" ? null : m.group_id ? "g:" + m.group_id : m.sender === ME() ? "u:" + m.recipient : m.recipient === ME() ? "u:" + m.sender : null);
  const byTime = (a, b) => String(a.created_at).localeCompare(String(b.created_at));
  const msgsOf = (key) => S.msgs.filter((m) => keyOf(m) === key).concat(T.pending.filter((p) => p.key === key)).sort(byTime);
  const findMsg = (id) => S.msgs.find((m) => String(m.id) === String(id)) || T.pending.find((m) => m.id === id);
  const readBy = (m) => (S.allReads || []).filter((r) => r.message_id === m.id && r.user_id !== m.sender);
  const firstName = (id) => (pname(id) || "").split(/\s+/).filter((w) => !/^(م|د|أ)\.?$/.test(w))[0] || pname(id);
  const preview = (m) => {
    const t = m.media_type === "image" ? "🖼 صورة" : m.media_type === "audio" ? `🎤 رسالة صوتية ${dur(m.meta?.duration)}` : m.media_type === "file" ? `📎 ${m.meta?.name || "ملف"}` : "";
    return (t && m.body ? t + " · " : t) + (m.body || "");
  };
  const v2 = () => S.chatV2 !== false;

  function avatar(key, cls = "") {
    if (key.startsWith("g:")) { const g = groupOf(key.slice(2)) || {}; return `<span class="tg-av ${cls}" style="background:linear-gradient(160deg,${g.color || "#1e4a38"}cc,${g.color || "#1e4a38"})">${esc(g.emoji || "👥")}</span>`; }
    const id = key.slice(2), p = prof(id) || {};
    const bg = p.role === "admin" ? "linear-gradient(160deg,#e3c18a,#a07636)" : `linear-gradient(160deg,${colorOf(id)}bb,${colorOf(id)})`;
    return `<span class="tg-av ${cls}" style="background:${bg}">${esc(initials(p.full_name || p.username))}${T.online.has(id) && id !== ME() ? '<i class="tg-dot"></i>' : ""}</span>`;
  }
  function typingOf(key) {
    const t = T.typing.get(key); if (!t || t.until < Date.now()) return "";
    return key.startsWith("g:") ? `${firstName(t.from)} يكتب…` : "يكتب…";
  }
  function info(key) {
    if (key.startsWith("g:")) {
      const g = groupOf(key.slice(2)) || {}; const mem = membersOf(g.id); const on = mem.filter((u) => T.online.has(u) && u !== ME()).length;
      return { name: g.name || "مجموعة", sub: typingOf(key) || `${mem.length} عضو${on ? ` · ${on} متصل` : ""}`, hot: !!typingOf(key) };
    }
    const p = prof(key.slice(2)) || {}, on = T.online.has(p.id);
    return { name: p.full_name || p.username || "—", sub: typingOf(key) || (on ? "متصل الآن" : p.role === "admin" ? "المشرف · آخر ظهور مؤخراً" : "آخر ظهور مؤخراً"), hot: on || !!typingOf(key) };
  }

  // ------------------------------------------------------------ المحادثات
  function convs() {
    const map = new Map();
    for (const m of S.msgs) { const k = keyOf(m); if (!k) continue; (map.get(k) || map.set(k, []).get(k)).push(m); }
    const out = [], row = (key, extra, msgs = []) => ({ key, ...extra, last: msgs.at(-1), un: msgs.filter(isUnread).length, at: msgs.at(-1)?.created_at || extra.at0 || "" });
    for (const g of myGroups()) { out.push(row("g:" + g.id, { g, name: g.name, at0: g.created_at }, map.get("g:" + g.id))); map.delete("g:" + g.id); }
    const people = chatPeople();
    for (const [k, msgs] of map) if (k.startsWith("u:") && prof(k.slice(2))) { const p = prof(k.slice(2)); out.push(row(k, { p, name: p.full_name || p.username }, msgs)); }
    for (const pm of T.pending) if (!out.some((c) => c.key === pm.key) && pm.key.startsWith("u:")) { const p = prof(pm.key.slice(2)); if (p) out.push(row(pm.key, { p, name: p.full_name }, [pm])); }
    out.forEach((c) => { const pend = T.pending.filter((p) => p.key === c.key); if (pend.length) { c.last = pend.at(-1); c.at = c.last.created_at; } });
    out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    const contacts = people.filter((p) => !out.some((c) => c.key === "u:" + p.id)).sort((a, b) => (b.role === "admin") - (a.role === "admin") || String(a.full_name).localeCompare(String(b.full_name), "ar"));
    return { out, contacts };
  }

  function renderList() {
    const el = $("#tg-list"); if (!el) return;
    const { out, contacts } = convs();
    const q = T.q.trim().toLowerCase();
    const unreadChats = out.filter((c) => c.un).length;
    $("#tg-chips").innerHTML = [["all", "الكل"], ["unread", "غير مقروءة", unreadChats], ["groups", "المجموعات"], ["dm", "الخاصة"]]
      .map(([v, l, n]) => `<button class="${T.filter === v ? "on" : ""}" data-f="${v}">${l}${n ? `<i>${n}</i>` : ""}</button>`).join("");
    $$("#tg-chips button").forEach((b) => (b.onclick = () => { T.filter = b.dataset.f; renderList(); }));
    let rows = out.filter((c) => T.filter === "all" || (T.filter === "unread" && c.un) || (T.filter === "groups" && c.g) || (T.filter === "dm" && c.p));
    if (q) rows = rows.filter((c) => c.name.toLowerCase().includes(q) || (c.last && preview(c.last).toLowerCase().includes(q)));
    const cs = ["all", "dm"].includes(T.filter) ? contacts.filter((p) => !q || String(p.full_name || p.username).toLowerCase().includes(q)) : [];
    const item = (c) => {
      const typing = typingOf(c.key), l = c.last, mine = l && l.sender === ME();
      const who = l ? (mine ? "أنت: " : c.g ? firstName(l.sender) + ": " : "") : "";
      const tick = mine ? (l._pending ? ic("clock", "tk") : readBy(l).length ? ic("check2", "tk read") : ic("check", "tk")) : "";
      return `<div class="tg-item ${T.sel === c.key ? "on" : ""}" data-k="${c.key}">${avatar(c.key)}
        <div class="tg-ib-body"><div class="tg-l1"><b>${c.g ? ic("group", "gi") : ""}<span>${esc(c.name)}</span>${c.p?.role === "admin" ? '<em class="tg-adm">المشرف</em>' : ""}</b><span class="tg-time">${tick}${l ? listTime(l.created_at) : ""}</span></div>
        <div class="tg-l2">${typing ? `<span class="typing">${esc(typing)}</span>` : `<span>${l ? `<em>${esc(who)}</em>${esc(preview(l))}` : c.g ? `<em>${membersOf(c.g.id).length} عضو</em>` : ""}</span>`}${c.un ? `<i class="tg-un">${c.un > 99 ? "99+" : c.un}</i>` : ""}</div></div></div>`;
    };
    const contact = (p) => `<div class="tg-item" data-k="u:${p.id}">${avatar("u:" + p.id)}<div class="tg-ib-body"><div class="tg-l1"><b><span>${esc(p.full_name || p.username)}</span>${p.role === "admin" ? '<em class="tg-adm">المشرف</em>' : ""}</b></div>
      <div class="tg-l2"><span>${T.online.has(p.id) ? '<em class="on">متصل الآن</em>' : esc(p.specialty || "ابدأ محادثة")}</span></div></div></div>`;
    el.innerHTML = rows.map(item).join("") + (cs.length ? `<div class="tg-sec">جهات الاتصال</div>` + cs.map(contact).join("") : "")
      || `<div class="tg-list-empty">${ic("chat")}<b>${q ? "لا نتائج" : T.filter === "unread" ? "لا رسائل غير مقروءة 🎉" : T.filter === "groups" ? "لا مجموعات بعد" : "لا محادثات بعد"}</b>${T.filter === "groups" && isAdmin() ? `<button class="tg-btn" id="tg-new-g">${ic("group")} إنشاء مجموعة</button>` : ""}</div>`;
    $$(".tg-item", el).forEach((it) => (it.onclick = () => openChat(it.dataset.k)));
    $("#tg-new-g") && ($("#tg-new-g").onclick = () => groupForm());
  }

  // ------------------------------------------------------------ فتح محادثة
  function renderEmpty() {
    const m = $("#tg-main"); if (!m) return;
    m.innerHTML = `<div class="tg-empty"><span>${ic("chat")} اختر محادثة لبدء المراسلة</span></div>`;
  }
  function openChat(key, silent) {
    saveDraft(); stopPlayer();
    if (REC.cur) stopRec(false);
    const wasOpen = !!T.sel;
    T.sel = key; T.reply = T.edit = null; T.newBelow = 0;
    T.sepId = msgsOf(key).find(isUnread)?.id ?? null;
    T.root.classList.add("has-chat");
    if (narrow() && !wasOpen && !silent) history.pushState({ tg: 1 }, "");
    $("#tg-main").innerHTML = `
      <header class="tg-head" id="tg-head"></header>
      <div class="tg-msgs" id="tg-msgs"></div>
      <button class="tg-down hidden" id="tg-down" title="إلى آخر رسالة">${ic("down")}<i id="tg-down-n" class="hidden"></i></button>
      <div class="tg-foot">
        <div class="tg-bar hidden" id="tg-bar"></div>
        <div class="tg-compose" id="tg-compose">
          <div class="tg-input"><button class="tg-ib" id="tg-attach" title="إرفاق صورة أو ملف">${ic("clip")}</button>
            <textarea id="tg-ta" rows="1" placeholder="رسالة" dir="auto" enterkeyhint="enter"></textarea></div>
          <button class="tg-act" id="tg-act" title="تسجيل رسالة صوتية">${ic("mic")}</button>
        </div>
        <div class="tg-rec hidden" id="tg-rec"></div>
      </div>
      <input type="file" id="tg-file" hidden>`;
    renderHead(); renderMsgs(true); bindCompose(); bindMsgs(); renderList(); fitViewport();
    if (!coarse) $("#tg-ta").focus();
  }
  function closeChat(fromPop) {
    if (!T.sel) return;
    if (!fromPop && narrow() && history.state?.tg) { history.back(); return; }
    saveDraft(); stopPlayer(); if (REC.cur) stopRec(false);
    T.sel = null; T.reply = T.edit = null;
    T.root?.classList.remove("has-chat");
    renderEmpty(); renderList();
  }
  function renderHead() {
    const h = $("#tg-head"); if (!h || !T.sel) return;
    const i = info(T.sel);
    h.innerHTML = `<button class="tg-ib tg-back" id="tg-back" title="رجوع">${ic("back", "flip")}</button>
      <div class="tg-hwho" id="tg-hwho">${avatar(T.sel, "md")}<div class="tg-hinfo"><b>${esc(i.name)}</b><small class="${i.hot ? "hot" : ""}">${esc(i.sub)}</small></div></div>
      <button class="tg-ib" id="tg-more" title="المزيد">${ic("more")}</button>`;
    $("#tg-back").onclick = () => closeChat();
    $("#tg-hwho").onclick = () => showInfo(T.sel);
    $("#tg-more").onclick = (e) => {
      const items = [{ icon: "info", label: T.sel.startsWith("g:") ? "معلومات المجموعة" : "معلومات العضو", run: () => showInfo(T.sel) }];
      if (T.sel.startsWith("g:") && isAdmin()) {
        const g = groupOf(T.sel.slice(2));
        items.push({ icon: "edit", label: "تعديل المجموعة", run: () => groupForm(g) }, { icon: "trash", label: "حذف المجموعة", danger: true, run: () => deleteGroup(g) });
      }
      const r = e.currentTarget.getBoundingClientRect(); popMenu(items, r.left, r.bottom + 4);
    };
  }

  // ------------------------------------------------------------ الرسائل
  const nearBottom = (b) => b.scrollHeight - b.scrollTop - b.clientHeight < 80;
  function renderMsgs(initial) {
    const box = $("#tg-msgs"); if (!box) return;
    const list = msgsOf(T.sel);
    const prevTop = box.scrollTop, wasBottom = initial || nearBottom(box);
    const isG = T.sel.startsWith("g:");
    const same = (a, b) => a && b && a.sender === b.sender && Math.abs(new Date(b.created_at) - new Date(a.created_at)) < 5 * 60e3 && sameDay(a.created_at, b.created_at);
    let html = "", prev = null;
    list.forEach((m, i) => {
      if (!prev || !sameDay(prev.created_at, m.created_at)) { html += `<div class="tg-day"><span>${dayLabel(m.created_at)}</span></div>`; prev = null; }
      if (T.sepId != null && m.id === T.sepId) html += `<div class="tg-unsep" id="tg-unsep"><span>رسائل غير مقروءة</span></div>`;
      html += bubble(m, !same(prev, m), !same(m, list[i + 1]), isG);
      prev = m;
    });
    box.innerHTML = html ? `<div class="tg-col">${html}</div>` :
      `<div class="tg-nomsg"><div>${avatar(T.sel, "xl")}<b>لا رسائل بعد</b><small>اكتب أول رسالة، أو أرسل صورة أو رسالة صوتية 👋</small></div></div>`;
    hydrate(box);
    if (initial && $("#tg-unsep")) $("#tg-unsep").scrollIntoView({ block: "center" });
    else if (wasBottom) box.scrollTop = box.scrollHeight; else box.scrollTop = prevTop;
    T.atBottom = nearBottom(box); downBtn();
    if (player.id) syncPlayerUI();
    markSeen();
  }
  function bubble(m, first, last, isG) {
    const mine = m.sender === ME();
    const rep = m.reply_to != null ? findMsg(m.reply_to) : null;
    const replyHtml = m.reply_to != null ? `<div class="tg-quote" data-jump="${rep ? rep.id : ""}" style="--qc:${rep ? nameColor(rep.sender) : "#999"}"><b>${rep ? esc(rep.sender === ME() ? "أنت" : pname(rep.sender)) : "رسالة محذوفة"}</b><span>${rep ? esc(preview(rep).slice(0, 90)) : "…"}</span></div>` : "";
    let media = "";
    if (m.media_type === "image") {
      const w = m.meta?.w || 4, h = m.meta?.h || 3;
      media = `<div class="tg-img" data-open="${m.id}" style="aspect-ratio:${w}/${h};width:min(${Math.max(140, Math.min(330, w))}px,100%)"><img ${m._local ? `src="${m._local}"` : `data-path="${esc(m.media_path || "")}"`} alt="">${m._pending ? '<span class="tg-spin"></span>' : ""}</div>`;
    } else if (m.media_type === "audio") media = voiceHtml(m);
    else if (m.media_type === "file") media = `<div class="tg-file" data-dl="${m.id}"><span class="tg-fic">${m._pending ? '<span class="tg-spin sm"></span>' : ic("dl")}</span><div><b dir="auto">${esc(m.meta?.name || "ملف")}</b><small>${size(m.meta?.size || 0)}</small></div></div>`;
    const text = m.body ? `<div class="tg-text" dir="auto">${linkify(esc(m.body))}</div>` : "";
    const tick = mine ? (m._pending ? ic("clock", "tk") : readBy(m).length ? ic("check2", "tk read") : ic("check", "tk")) : "";
    const onlyImg = m.media_type === "image" && !m.body && !replyHtml;
    const meta = `<span class="tg-meta">${m.edited_at ? "معدّلة " : ""}${hm(m.created_at)}${tick}</span>`;
    const from = isG && !mine && first ? `<div class="tg-from" style="color:${nameColor(m.sender)}">${esc(pname(m.sender))}${prof(m.sender)?.role === "admin" ? ' <em class="tg-adm">المشرف</em>' : ""}</div>` : "";
    const av = isG && !mine ? (last ? `<span class="tg-mav">${avatar("u:" + m.sender, "sm")}</span>` : `<span class="tg-mav"></span>`) : "";
    return `<div class="tg-row ${mine ? "tg-out" : "tg-in"} ${first ? "tg-first" : ""} ${last ? "tg-last" : ""} ${m._pending ? "pending" : ""}" data-id="${m.id}">${av}
      <div class="tg-bub ${onlyImg ? "only-img" : ""} ${m.media_type ? "has-" + m.media_type : ""}">${from}${replyHtml}${media}${text}${meta}</div></div>`;
  }
  function voiceHtml(m) {
    const n = 40, src = m.meta?.wave?.length ? m.meta.wave : null;
    const wave = Array.from({ length: n }, (_, i) => src ? src[Math.floor((i * src.length) / n)] : 4 + (Math.abs(hash(m.id + ":" + i)) % 22));
    return `<div class="tg-voice" data-voice="${m.id}"><button class="tg-play" data-play="${m.id}" title="تشغيل">${m._pending ? '<span class="tg-spin sm w"></span>' : ic("play")}</button>
      <div class="tg-vbody"><div class="tg-wave" data-seek="${m.id}" dir="ltr">${wave.map((v) => `<i style="height:${Math.round(12 + Math.min(31, v) * 2.8)}%"></i>`).join("")}</div>
      <small class="tg-dur" data-dur="${m.id}">${dur(m.meta?.duration)}</small></div></div>`;
  }
  async function signUrls(paths) {
    paths = [...new Set(paths.filter(Boolean))];
    const need = paths.filter((p) => !(T.urls.get(p)?.exp > Date.now()));
    if (need.length) {
      const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(need, 3600);
      if (!error) (data || []).forEach((d) => d.signedUrl && T.urls.set(d.path, { url: d.signedUrl, exp: Date.now() + 3000e3 }));
    }
    return Object.fromEntries(paths.map((p) => [p, T.urls.get(p)?.url]));
  }
  async function hydrate(root) {
    const imgs = $$("img[data-path]", root).filter((i) => i.dataset.path);
    if (!imgs.length) return;
    const map = await signUrls(imgs.map((i) => i.dataset.path)).catch(() => ({}));
    imgs.forEach((im) => {
      const u = map[im.dataset.path]; if (!u) return;
      im.onload = () => { const b = $("#tg-msgs"); if (b && T.atBottom) b.scrollTop = b.scrollHeight; };
      im.src = u;
    });
  }
  function downBtn() {
    const b = $("#tg-down"); if (!b) return;
    const box = $("#tg-msgs"); const far = box && box.scrollHeight - box.scrollTop - box.clientHeight > 260;
    b.classList.toggle("hidden", !far && !T.newBelow);
    const n = $("#tg-down-n"); n.textContent = T.newBelow; n.classList.toggle("hidden", !T.newBelow);
  }
  function markSeen() {
    if (!T.sel || document.visibilityState !== "visible" || !$("#tg-msgs")) return;
    const un = msgsOf(T.sel).filter(isUnread); if (un.length) markRead(un);
  }

  // ------------------------------------------------------------ تفاعل الرسائل
  function bindMsgs() {
    const box = $("#tg-msgs");
    box.onscroll = () => { T.atBottom = nearBottom(box); if (T.atBottom) T.newBelow = 0; downBtn(); };
    $("#tg-down").onclick = () => { box.scrollTo({ top: box.scrollHeight, behavior: "smooth" }); T.newBelow = 0; downBtn(); };
    box.onclick = (e) => {
      const q = e.target.closest("[data-jump]"); if (q) return jumpTo(q.dataset.jump);
      const p = e.target.closest("[data-play]"); if (p) return togglePlay(p.dataset.play);
      const s = e.target.closest("[data-seek]"); if (s) return seek(s.dataset.seek, e);
      const im = e.target.closest("[data-open]"); if (im) return lightbox(findMsg(im.dataset.open));
      const f = e.target.closest("[data-dl]"); if (f) return download(findMsg(f.dataset.dl));
      if (e.target.closest("a")) return;
      if (coarse) { const row = e.target.closest(".tg-row"); if (row && !row.classList.contains("pending")) msgMenu(row, e.clientX, e.clientY); }
    };
    box.oncontextmenu = (e) => {
      const row = e.target.closest(".tg-row"); if (!row || row.classList.contains("pending")) return;
      e.preventDefault(); if (Date.now() - T.lastMenu < 700) return; msgMenu(row, e.clientX, e.clientY);
    };
    // السحب لليمين/اليسار = رد (مثل تيليغرام)
    let sw = null;
    box.addEventListener("touchstart", (e) => { const row = e.target.closest(".tg-row"); if (!row || row.classList.contains("pending")) return; const t = e.touches[0]; sw = { row, x: t.clientX, y: t.clientY, dx: 0, lock: null }; }, { passive: true });
    box.addEventListener("touchmove", (e) => {
      if (!sw) return; const t = e.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
      if (sw.lock == null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) sw.lock = Math.abs(dx) > Math.abs(dy) * 1.4 ? "x" : "y";
      if (sw.lock !== "x") return;
      sw.dx = Math.max(-90, Math.min(90, dx));
      const b = sw.row.querySelector(".tg-bub"); b.style.transition = "none"; b.style.transform = `translateX(${sw.dx}px)`;
      sw.row.classList.toggle("swipe-ok", Math.abs(sw.dx) > 60);
    }, { passive: true });
    box.addEventListener("touchend", () => {
      if (!sw) return; const b = sw.row.querySelector(".tg-bub"); b.style.transition = ""; b.style.transform = "";
      if (sw.lock === "x" && Math.abs(sw.dx) > 60) { setReply(findMsg(sw.row.dataset.id)); navigator.vibrate?.(15); }
      sw.row.classList.remove("swipe-ok"); sw = null;
    });
  }
  function jumpTo(id) {
    if (!id) return toast("الرسالة الأصلية محذوفة");
    const row = $(`.tg-row[data-id="${CSS.escape(String(id))}"]`); if (!row) return;
    row.scrollIntoView({ block: "center", behavior: "smooth" });
    row.classList.remove("flash"); void row.offsetWidth; row.classList.add("flash");
  }
  function msgMenu(row, x, y) {
    const m = findMsg(row.dataset.id); if (!m) return;
    T.lastMenu = Date.now(); navigator.vibrate?.(10);
    const mine = m.sender === ME();
    const items = [{ icon: "reply", label: "رد", run: () => setReply(m) }];
    if (m.body) items.push({ icon: "copy", label: "نسخ النص", run: () => copy(m.body) });
    if (m.media_type === "image" || m.media_type === "file" || m.media_type === "audio") items.push({ icon: "dl", label: "حفظ / تنزيل", run: () => download(m) });
    if (mine && v2() && (m.body || m.media_type)) items.push({ icon: "edit", label: m.media_type ? (m.body ? "تعديل التعليق" : "إضافة تعليق") : "تعديل", run: () => setEdit(m) });
    if (mine && T.sel.startsWith("g:")) items.push({ icon: "eye", label: `قرأها (${readBy(m).length})`, run: () => showReaders(m) });
    if (mine || isAdmin()) items.push({ icon: "trash", label: "حذف", danger: true, run: () => del(m) });
    row.classList.add("sel");
    popMenu(items, x, y, () => row.classList.remove("sel"));
  }
  async function copy(t) {
    try { await navigator.clipboard.writeText(t); }
    catch { const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove(); }
    toast("📋 تم نسخ النص");
  }
  function showReaders(m) {
    const rs = readBy(m);
    sheet(`<h3>👁 قرأها ${rs.length} من ${membersOf(m.group_id).length - 1}</h3><div class="tg-people">${rs.map((r) => `<div class="tg-person">${avatar("u:" + r.user_id, "sm")}<b>${esc(pname(r.user_id))}</b><small>${r.read_at ? hm(r.read_at) : ""}</small></div>`).join("") || `<p class="tg-muted">لم يقرأها أحد بعد</p>`}</div>`);
  }

  // ------------------------------------------------------------ الكتابة والإرسال
  function saveDraft() { const ta = $("#tg-ta"); if (ta && T.sel && !T.edit) T.drafts[T.sel] = ta.value; }
  function autosize() { const ta = $("#tg-ta"); if (!ta) return; ta.style.height = "auto"; ta.style.height = Math.min(150, ta.scrollHeight) + "px"; }
  function updateAct() {
    const ta = $("#tg-ta"), b = $("#tg-act"); if (!ta || !b) return;
    const has = ta.value.trim().length > 0 || !!T.edit;
    b.innerHTML = T.edit ? ic("check") : has ? ic("send", "flip") : ic("mic");
    b.classList.toggle("send", has); b.title = T.edit ? "حفظ التعديل" : has ? "إرسال" : "تسجيل رسالة صوتية";
  }
  function bindCompose() {
    const ta = $("#tg-ta");
    ta.value = T.drafts[T.sel] || ""; autosize(); updateAct();
    ta.oninput = () => { autosize(); updateAct(); sendTyping(); };
    ta.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey && !coarse && !e.isComposing) { e.preventDefault(); submit(); }
      if (e.key === "Escape" && (T.reply || T.edit)) { e.preventDefault(); cancelBar(); }
      if (e.key === "ArrowUp" && !ta.value && !T.edit) { const last = msgsOf(T.sel).filter((m) => m.sender === ME() && !m._pending && m.body).at(-1); if (last) { e.preventDefault(); setEdit(last); } }
    };
    ta.onfocus = () => setTimeout(() => { const b = $("#tg-msgs"); if (b && T.atBottom) b.scrollTop = b.scrollHeight; }, 300);
    ta.onpaste = (e) => { const f = [...(e.clipboardData?.files || [])].filter((x) => x.type.startsWith("image/")); if (f.length) { e.preventDefault(); previewImages(f); } };
    $("#tg-act").onclick = () => (ta.value.trim() || T.edit ? submit() : startRec());
    $("#tg-attach").onclick = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      popMenu([
        { icon: "image", label: "صورة", run: () => pick("image/*", true) },
        { icon: "file", label: "ملف", run: () => pick("", true) },
        { icon: "music", label: "ملف صوتي", run: () => pick("audio/*", false) },
      ], r.left, r.top - 8, null, "up");
    };
    const main = $("#tg-main");
    main.ondragover = (e) => { e.preventDefault(); main.classList.add("drag"); };
    main.ondragleave = (e) => { if (e.target === main || !main.contains(e.relatedTarget)) main.classList.remove("drag"); };
    main.ondrop = (e) => { e.preventDefault(); main.classList.remove("drag"); const f = [...(e.dataTransfer?.files || [])]; if (f.length) routeFiles(f); };
    renderBar();
  }
  function routeFiles(files) {
    const imgs = files.filter((f) => /^image\/(jpeg|png|webp|gif|bmp)$/.test(f.type));
    const rest = files.filter((f) => !imgs.includes(f));
    if (imgs.length) previewImages(imgs);
    rest.forEach((f) => sendFile(f));
  }
  function pick(accept, multiple) {
    const inp = $("#tg-file"); inp.value = ""; inp.accept = accept; inp.multiple = multiple;
    inp.onchange = () => {
      const files = [...inp.files]; if (!files.length) return;
      if (accept === "image/*") previewImages(files);
      else if (accept === "audio/*") files.forEach(sendAudioFile);
      else routeFiles(files);
    };
    inp.click();
  }
  function setReply(m) { if (!m) return; if (T.edit) cancelBar(); T.reply = m; renderBar(); $("#tg-ta")?.focus(); }
  function setEdit(m) {
    if (!m) return; saveDraft(); T.reply = null; T.edit = m;
    const ta = $("#tg-ta"); ta.value = m.body || ""; autosize(); updateAct(); renderBar(); ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }
  function cancelBar() {
    const wasEdit = !!T.edit; T.reply = T.edit = null; renderBar();
    if (wasEdit) { const ta = $("#tg-ta"); ta.value = T.drafts[T.sel] || ""; autosize(); updateAct(); }
  }
  function renderBar() {
    const bar = $("#tg-bar"); if (!bar) return;
    const m = T.edit || T.reply;
    bar.classList.toggle("hidden", !m);
    if (!m) return (bar.innerHTML = "");
    bar.innerHTML = `<span class="tg-bar-ic">${ic(T.edit ? "edit" : "reply")}</span>
      <div class="tg-bar-q"><b>${T.edit ? "تعديل الرسالة" : `الرد على ${esc(m.sender === ME() ? "نفسك" : pname(m.sender))}`}</b><span>${esc(preview(m).slice(0, 120))}</span></div>
      <button class="tg-ib" id="tg-bar-x" title="إلغاء">${ic("close")}</button>`;
    $("#tg-bar-x").onclick = cancelBar;
    updateAct();
  }
  function sendTyping() {
    if (!presence || !T.sel || Date.now() - lastTyping < 2500) return;
    lastTyping = Date.now();
    try { presence.send({ type: "broadcast", event: "typing", payload: { from: ME(), to: T.sel } }); } catch {}
  }
  async function submit() {
    const ta = $("#tg-ta"); const text = ta.value.replace(/\s+$/, "").replace(/^\n+/, "");
    if (T.edit) {
      const m = T.edit;
      if (!text.trim() && !m.media_type) return toast("لا يمكن ترك الرسالة فارغة — استخدم «حذف» بدلاً من ذلك", "err");
      if (text === (m.body || "")) return cancelBar();
      try {
        const up = must(await sb.from("messages").update({ body: text, edited_at: new Date().toISOString() }).eq("id", m.id).select().single());
        const loc = S.msgs.find((x) => x.id === m.id); if (loc) Object.assign(loc, up || { body: text, edited_at: new Date().toISOString() });
        cancelBar(); refresh();
      } catch (e) { fail(e); }
      return;
    }
    if (!text.trim()) return;
    ta.value = ""; T.drafts[T.sel] = ""; autosize(); updateAct();
    if (coarse) ta.focus();
    for (let i = 0; i < text.length; i += 4000) await sendMsg({ body: text.slice(i, i + 4000), restore: text });
  }
  async function sendMsg({ body = "", media = null, restore = "" }) {
    const key = T.sel; if (!key) return;
    if ((media || T.reply) && !v2()) { toast("ميزة الصور والصوت والرد تحتاج تشغيل ملف chat.sql في Supabase (من المشرف)", "err"); if (!body) return; }
    const reply = v2() ? T.reply : null; T.reply = null; renderBar();
    const tmp = { id: "tmp" + Date.now() + Math.random().toString(36).slice(2, 6), key, kind: "chat", sender: ME(), body, created_at: new Date().toISOString(), _pending: true, reply_to: reply?.id ?? null,
      ...(media ? { media_type: media.type, meta: media.meta, _local: media.local } : {}) };
    T.pending.push(tmp); T.atBottom = true; refresh();
    try {
      const row = { kind: "chat", sender: ME(), body };
      if (key.startsWith("g:")) { row.group_id = key.slice(2); if (!inGroup(row.group_id) && isAdmin()) await joinGroup(row.group_id); }
      else row.recipient = key.slice(2);
      if (reply) row.reply_to = reply.id;
      if (media) {
        const path = `${ME()}/${key.replace(":", "_")}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${media.ext}`;
        const up = await sb.storage.from(BUCKET).upload(path, media.blob, { contentType: media.mime, upsert: false });
        if (up.error) throw up.error;
        Object.assign(row, { media_path: path, media_type: media.type, meta: media.meta });
        if (media.local) T.urls.set(path, { url: media.local, exp: Date.now() + 3000e3 });
      }
      const m = must(await sb.from("messages").insert(row).select().single());
      if (!S.msgs.some((x) => x.id === m.id)) S.msgs.push(m);
    } catch (e) {
      fail(e);
      if (restore && T.sel === key) { const ta = $("#tg-ta"); if (ta && !ta.value) { ta.value = restore; autosize(); updateAct(); } }
    } finally { T.pending = T.pending.filter((p) => p !== tmp); refresh(); }
  }
  async function joinGroup(gid) {
    must(await sb.from("chat_group_members").upsert([{ group_id: gid, user_id: ME() }], { onConflict: "group_id,user_id", ignoreDuplicates: true }));
    if (!inGroup(gid)) S.groupMembers.push({ group_id: gid, user_id: ME() });
  }

  // ------------------------------------------------------------ الصور والملفات
  async function imageMeta(file) {
    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    return { img, url, w: img.naturalWidth, h: img.naturalHeight };
  }
  async function compress(file) {
    const { img, url, w, h } = await imageMeta(file);
    if (file.type === "image/gif" || (file.size < 350000 && Math.max(w, h) <= 1600)) return { blob: file, w, h, mime: file.type, ext: (file.name.split(".").pop() || "jpg").toLowerCase(), local: url };
    const k = Math.min(1, 1600 / Math.max(w, h)), cw = Math.round(w * k), ch = Math.round(h * k);
    const c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, cw, ch); x.drawImage(img, 0, 0, cw, ch);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
    URL.revokeObjectURL(url);
    return { blob, w: cw, h: ch, mime: "image/jpeg", ext: "jpg", local: URL.createObjectURL(blob) };
  }
  function previewImages(files) {
    files = files.filter((f) => f.type.startsWith("image/")).slice(0, 10);
    if (!files.length) return;
    const urls = files.map((f) => URL.createObjectURL(f));
    const el = sheet(`<h3>${ic("image")} إرسال ${files.length > 1 ? files.length + " صور" : "صورة"}</h3>
      <div class="tg-prev ${files.length > 1 ? "multi" : ""}">${urls.map((u) => `<img src="${u}" alt="">`).join("")}</div>
      <textarea class="tg-cap" placeholder="أضف تعليقاً…" dir="auto" rows="1"></textarea>
      <div class="tg-sheet-act"><button class="tg-btn ghost" data-x>إلغاء</button><button class="tg-btn" data-go>${ic("send", "flip")} إرسال</button></div>`, () => urls.forEach((u) => URL.revokeObjectURL(u)));
    const cap = el.querySelector(".tg-cap"); if (!coarse) cap.focus();
    cap.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey && !coarse) { e.preventDefault(); el.querySelector("[data-go]").click(); } };
    el.querySelector("[data-go]").onclick = async () => {
      const caption = cap.value.trim(); closeSheet();
      for (let i = 0; i < files.length; i++) {
        try {
          const c = await compress(files[i]);
          if (c.blob.size > MAX_MB * 1048576) { toast(`الصورة أكبر من ${MAX_MB}MB`, "err"); continue; }
          await sendMsg({ body: i === 0 ? caption : "", media: { type: "image", blob: c.blob, mime: c.mime, ext: c.ext, local: c.local, meta: { w: c.w, h: c.h, size: c.blob.size } } });
        } catch (e) { fail(e); }
      }
    };
  }
  async function sendFile(f) {
    if (f.size > MAX_MB * 1048576) return toast(`الملف «${f.name}» أكبر من ${MAX_MB}MB`, "err");
    if (f.type.startsWith("audio/")) return sendAudioFile(f);
    const ext = (f.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
    await sendMsg({ media: { type: "file", blob: f, mime: f.type || "application/octet-stream", ext, meta: { name: f.name, size: f.size, mime: f.type } } });
  }
  async function sendAudioFile(f) {
    if (f.size > MAX_MB * 1048576) return toast(`الملف أكبر من ${MAX_MB}MB`, "err");
    const local = URL.createObjectURL(f);
    const d = await new Promise((r) => { const a = new Audio(); a.preload = "metadata"; a.onloadedmetadata = () => r(isFinite(a.duration) ? a.duration : 0); a.onerror = () => r(0); a.src = local; setTimeout(() => r(0), 4000); });
    const ext = (f.name.split(".").pop() || "m4a").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) || "m4a";
    await sendMsg({ media: { type: "audio", blob: f, mime: f.type || "audio/mpeg", ext, local, meta: { duration: Math.round(d * 10) / 10, name: f.name, size: f.size } } });
  }
  async function blobOf(m) {
    if (m._local) return (await fetch(m._local)).blob();
    const u = (await signUrls([m.media_path]))[m.media_path]; if (!u) throw new Error("تعذّر الوصول إلى الملف");
    return (await fetch(u)).blob();
  }
  async function download(m) {
    if (!m?.media_path && !m?._local) return;
    try {
      toast("⏳ جارِ التنزيل…");
      const b = await blobOf(m);
      const ext = (m.media_path || "").split(".").pop() || "bin";
      const name = m.meta?.name || `sanabel_${m.media_type}_${new Date(m.created_at).toISOString().slice(0, 10)}.${ext}`;
      const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    } catch (e) { fail(e); }
  }
  function lightbox(m) {
    if (!m) return;
    const src = $(`.tg-row[data-id="${CSS.escape(String(m.id))}"] img`)?.src; if (!src) return;
    closeLb();
    const el = document.createElement("div"); el.className = "tg-lb";
    el.innerHTML = `<header><div><b>${esc(m.sender === ME() ? "أنت" : pname(m.sender))}</b><small>${dayLabel(m.created_at)} · ${hm(m.created_at)}</small></div>
      <button class="tg-ib" data-dl title="حفظ">${ic("dl")}</button><button class="tg-ib" data-x title="إغلاق">${ic("close")}</button></header>
      <div class="tg-lb-img"><img src="${src}" alt=""></div>${m.body ? `<footer dir="auto">${linkify(esc(m.body))}</footer>` : ""}`;
    document.body.appendChild(el);
    el.onclick = (e) => { if (e.target.closest("[data-dl]")) return download(m); if (e.target.closest("[data-x]") || e.target.classList.contains("tg-lb-img")) closeLb(); };
  }
  const closeLb = () => $(".tg-lb")?.remove();

  // ------------------------------------------------------------ الرسائل الصوتية
  function stopPlayer() { try { player.a.pause(); } catch {} player.id = null; $$(".tg-voice.playing").forEach((v) => resetVoice(v)); }
  function resetVoice(v) {
    v.classList.remove("playing"); const id = v.dataset.voice; const m = findMsg(id);
    const b = v.querySelector(".tg-play"); if (b) b.innerHTML = ic("play");
    v.querySelectorAll(".tg-wave i").forEach((i) => i.classList.remove("on"));
    const d = v.querySelector(".tg-dur"); if (d && m) d.textContent = dur(m.meta?.duration);
  }
  function syncPlayerUI() {
    const v = $(`.tg-voice[data-voice="${CSS.escape(String(player.id))}"]`); if (!v) return;
    const m = findMsg(player.id), a = player.a;
    const total = isFinite(a.duration) && a.duration > 0 ? a.duration : m?.meta?.duration || 0;
    const frac = total ? Math.min(1, a.currentTime / total) : 0;
    v.classList.toggle("playing", !a.paused);
    v.querySelector(".tg-play").innerHTML = ic(a.paused ? "play" : "pause");
    const bars = v.querySelectorAll(".tg-wave i"); bars.forEach((b, i) => b.classList.toggle("on", i / bars.length < frac));
    v.querySelector(".tg-dur").textContent = dur(a.paused && !a.currentTime ? total : a.currentTime);
  }
  player.a.ontimeupdate = syncPlayerUI; player.a.onpause = syncPlayerUI; player.a.onplay = syncPlayerUI;
  player.a.onended = () => { const id = player.id; player.id = null; const v = $(`.tg-voice[data-voice="${CSS.escape(String(id))}"]`); if (v) resetVoice(v); };
  async function togglePlay(id, at = null) {
    const m = findMsg(id); if (!m || m._pending && !m._local) return;
    if (player.id === id) { if (at != null) { const t = isFinite(player.a.duration) ? player.a.duration : m.meta?.duration || 0; player.a.currentTime = at * t; } if (player.a.paused) player.a.play(); else if (at == null) player.a.pause(); return; }
    stopPlayer();
    try {
      const url = m._local || (await signUrls([m.media_path]))[m.media_path];
      if (!url) throw new Error("تعذّر تشغيل الرسالة الصوتية");
      player.id = id; player.a.src = url;
      if (at != null) player.a.addEventListener("loadedmetadata", () => { const t = isFinite(player.a.duration) ? player.a.duration : m.meta?.duration || 0; player.a.currentTime = at * t; }, { once: true });
      await player.a.play();
    } catch (e) { player.id = null; fail(e); }
  }
  function seek(id, e) {
    const w = e.target.closest(".tg-wave").getBoundingClientRect();
    togglePlay(id, Math.max(0, Math.min(1, (e.clientX - w.left) / w.width)));
  }
  async function startRec() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { toast("التسجيل غير مدعوم هنا — اختر ملفاً صوتياً"); return pick("audio/*", false); }
    if (!v2()) return toast("الرسائل الصوتية تحتاج تشغيل ملف chat.sql في Supabase (من المشرف)", "err");
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch {
      toast(NATIVE ? "🎤 الميكروفون غير مفعّل في نسخة التطبيق هذه — اختر تسجيلاً صوتياً من الهاتف" : "🎤 اسمح للمتصفح باستخدام الميكروفون لتسجيل رسالة صوتية", "err");
      return NATIVE ? pick("audio/*", false) : null;
    }
    const mime = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"].find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks = []; rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    let ac, an, buf;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); an = ac.createAnalyser(); an.fftSize = 512; ac.createMediaStreamSource(stream).connect(an); buf = new Uint8Array(an.fftSize); } catch {}
    const peaks = [], t0 = Date.now();
    REC.cur = { rec, stream, ac, chunks, peaks, t0, mime: rec.mimeType || mime || "audio/webm" };
    rec.start(250);
    $("#tg-compose").classList.add("hidden");
    const el = $("#tg-rec"); el.classList.remove("hidden");
    el.innerHTML = `<button class="tg-ib danger" data-x title="إلغاء">${ic("trash")}</button>
      <div class="tg-rec-mid"><span class="tg-rec-dot"></span><b id="tg-rec-t">0:00</b><div class="tg-rec-wave" id="tg-rec-w" dir="ltr"></div></div>
      <button class="tg-act send" data-go title="إرسال">${ic("send", "flip")}</button>`;
    el.querySelector("[data-x]").onclick = () => stopRec(false);
    el.querySelector("[data-go]").onclick = () => stopRec(true);
    navigator.vibrate?.(20);
    REC.timer = setInterval(() => {
      let pk = 0;
      if (an) { an.getByteTimeDomainData(buf); for (const v of buf) pk = Math.max(pk, Math.abs(v - 128)); }
      peaks.push(pk);
      const s = (Date.now() - t0) / 1000; const tt = $("#tg-rec-t"); if (tt) tt.textContent = dur(s);
      const w = $("#tg-rec-w"); if (w) w.innerHTML = peaks.slice(-46).map((v) => `<i style="height:${Math.round(10 + Math.min(1, v / 64) * 90)}%"></i>`).join("");
      if (s > 15 * 60) stopRec(true);
    }, 100);
  }
  async function stopRec(send) {
    const c = REC.cur; if (!c) return; REC.cur = null; clearInterval(REC.timer);
    const stopped = new Promise((r) => { c.rec.onstop = r; setTimeout(r, 1500); });
    try { c.rec.stop(); } catch {}
    await stopped;
    c.stream.getTracks().forEach((t) => t.stop()); c.ac?.close?.().catch(() => {});
    $("#tg-rec")?.classList.add("hidden"); $("#tg-compose")?.classList.remove("hidden");
    const d = (Date.now() - c.t0) / 1000;
    if (!send) return;
    if (d < 0.8) return toast("اضغط 🎤 للتسجيل ثم ➤ للإرسال — التسجيل قصير جداً");
    const type = c.mime.split(";")[0] || "audio/webm";
    const blob = new Blob(c.chunks, { type });
    const n = 48, mx = Math.max(8, ...c.peaks);
    const wave = Array.from({ length: n }, (_, i) => { const a = Math.floor((i * c.peaks.length) / n), b = Math.max(a + 1, Math.floor(((i + 1) * c.peaks.length) / n)); return Math.round((Math.max(0, ...c.peaks.slice(a, b)) / mx) * 31); });
    const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
    await sendMsg({ media: { type: "audio", blob, mime: type, ext, local: URL.createObjectURL(blob), meta: { duration: Math.round(d * 10) / 10, wave, size: blob.size } } });
  }

  // ------------------------------------------------------------ الحذف
  async function del(m) {
    if (!(await ask("حذف الرسالة؟", "ستُحذف هذه الرسالة لدى جميع المشاركين في المحادثة.", "حذف"))) return;
    try {
      if (m.media_path) await sb.storage.from(BUCKET).remove([m.media_path]).catch(() => {});
      must(await sb.from("messages").delete().eq("id", m.id));
      S.msgs = S.msgs.filter((x) => x.id !== m.id);
      if (T.reply?.id === m.id || T.edit?.id === m.id) cancelBar();
      refresh();
    } catch (e) { fail(e); }
  }

  // ------------------------------------------------------------ المجموعات (المشرف)
  function newChat() {
    const people = chatPeople();
    const items = [];
    if (isAdmin()) items.push({ icon: "group", label: "مجموعة جديدة", run: () => groupForm() });
    items.push({ icon: "chat", label: "محادثة خاصة جديدة", run: () => {
      const el = sheet(`<h3>${ic("chat")} محادثة جديدة</h3><label class="tg-search in">${ic("search")}<input placeholder="بحث عن عضو"></label>
        <div class="tg-people pick">${people.map((p) => `<div class="tg-person" data-u="${p.id}">${avatar("u:" + p.id, "sm")}<b>${esc(p.full_name || p.username)}</b><small>${T.online.has(p.id) ? "متصل الآن" : esc(p.role === "admin" ? "المشرف" : p.specialty || "")}</small></div>`).join("") || `<p class="tg-muted">لا يوجد أعضاء متاحون للمراسلة</p>`}</div>`);
      const inp = el.querySelector("input"); inp.oninput = () => el.querySelectorAll("[data-u]").forEach((x) => (x.style.display = x.textContent.toLowerCase().includes(inp.value.toLowerCase()) ? "" : "none"));
      el.querySelectorAll("[data-u]").forEach((x) => (x.onclick = () => { closeSheet(); openChat("u:" + x.dataset.u); }));
    } });
    const r = $("#tg-fab").getBoundingClientRect();
    popMenu(items, r.left, r.top - 8, null, "up");
  }
  function groupForm(g = null) {
    if (!isAdmin()) return;
    if (!v2()) return toast("شغّل ملف supabase/chat.sql في Supabase أولاً لتفعيل المجموعات", "err");
    const cur = g ? membersOf(g.id) : [];
    const ppl = S.profiles.filter((p) => p.id !== ME());
    openModal(g ? "✏️ تعديل المجموعة" : "👥 مجموعة جديدة", `<form class="mform tg-gform">
      <div class="tg-gtop"><span class="tg-av xl" id="gf-av" style="background:${g?.color || COLORS[0]}">${esc(g?.emoji || EMOJIS[0])}</span>
        <div style="flex:1"><label>اسم المجموعة<input name="name" required maxlength="60" value="${esc(g?.name || "")}" placeholder="مثال: فريق روبوت الإنقاذ"></label>
        <label>الوصف (اختياري)<input name="description" maxlength="200" value="${esc(g?.description || "")}" placeholder="هدف المجموعة"></label></div></div>
      <div class="tg-pick-row"><span>الرمز:</span>${EMOJIS.map((e) => `<button type="button" class="tg-emo ${e === (g?.emoji || EMOJIS[0]) ? "on" : ""}" data-e="${e}">${e}</button>`).join("")}</div>
      <div class="tg-pick-row"><span>اللون:</span>${COLORS.map((c) => `<button type="button" class="tg-swatch ${c === (g?.color || COLORS[0]) ? "on" : ""}" data-c="${c}" style="background:${c}"></button>`).join("")}</div>
      <input type="hidden" name="emoji" value="${esc(g?.emoji || EMOJIS[0])}"><input type="hidden" name="color" value="${esc(g?.color || COLORS[0])}">
      <div class="tg-gm-head"><b>الأعضاء <span id="gf-n">0</span></b><span class="spacer"></span>
        ${S.projects.map((p) => `<button type="button" class="tg-chip" data-proj="${p.id}">＋ فريق ${esc(p.name)}</button>`).join("")}
        <button type="button" class="tg-chip" data-all>الكل</button><button type="button" class="tg-chip" data-none>لا أحد</button></div>
      <div class="tg-gm">${ppl.map((p) => `<label class="tg-gm-i"><input type="checkbox" name="m" value="${p.id}" ${cur.includes(p.id) ? "checked" : ""}>${avatar("u:" + p.id, "sm")}<span><b>${esc(p.full_name || p.username)}</b><small>${esc(p.specialty || "")}</small></span></label>`).join("")}</div>
      <p class="tg-muted">أنت (المشرف) عضو تلقائياً في كل مجموعة تنشئها.</p>
      <div class="form-actions"><button class="btn gold" type="submit">${g ? "💾 حفظ" : "✅ إنشاء المجموعة"}</button></div></form>`, {
      onOpen: (root) => {
        const f = root.querySelector("form");
        const cnt = () => (root.querySelector("#gf-n").textContent = f.querySelectorAll("[name=m]:checked").length + 1);
        root.querySelectorAll("[data-e]").forEach((b) => (b.onclick = () => { root.querySelectorAll("[data-e]").forEach((x) => x.classList.remove("on")); b.classList.add("on"); f.emoji.value = b.dataset.e; root.querySelector("#gf-av").textContent = b.dataset.e; }));
        root.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { root.querySelectorAll("[data-c]").forEach((x) => x.classList.remove("on")); b.classList.add("on"); f.color.value = b.dataset.c; root.querySelector("#gf-av").style.background = b.dataset.c; }));
        root.querySelectorAll("[data-proj]").forEach((b) => (b.onclick = () => { const ids = S.memberships.filter((m) => m.project_id === b.dataset.proj).map((m) => m.user_id); f.querySelectorAll("[name=m]").forEach((c) => { if (ids.includes(c.value)) c.checked = true; }); cnt(); }));
        root.querySelector("[data-all]").onclick = () => { f.querySelectorAll("[name=m]").forEach((c) => (c.checked = true)); cnt(); };
        root.querySelector("[data-none]").onclick = () => { f.querySelectorAll("[name=m]").forEach((c) => (c.checked = false)); cnt(); };
        f.addEventListener("change", cnt); cnt();
      },
      onSubmit: async (d) => {
        const ids = [...new Set([].concat(d.m || []).filter(Boolean))];
        const row = { name: d.name.trim(), description: d.description?.trim() || null, emoji: d.emoji, color: d.color };
        let gid = g?.id;
        if (g) must(await sb.from("chat_groups").update(row).eq("id", g.id));
        else gid = must(await sb.from("chat_groups").insert({ ...row, created_by: ME() }).select().single()).id;
        const want = new Set([...ids, ME()]);
        const have = new Set(g ? cur : []);
        const add = [...want].filter((u) => !have.has(u)), rem = [...have].filter((u) => !want.has(u));
        if (add.length) must(await sb.from("chat_group_members").upsert(add.map((u) => ({ group_id: gid, user_id: u })), { onConflict: "group_id,user_id", ignoreDuplicates: true }));
        for (const u of rem) must(await sb.from("chat_group_members").delete().eq("group_id", gid).eq("user_id", u));
        closeModal(); toast(g ? "✅ تم تحديث المجموعة" : "✅ تم إنشاء المجموعة");
        await X.reloadMessages();
        if (!g) { await sb.from("messages").insert({ kind: "chat", sender: ME(), group_id: gid, body: `👋 أهلاً بكم في مجموعة «${row.name}»` }).select().single().then((r) => { if (r.data && !S.msgs.some((x) => x.id === r.data.id)) S.msgs.push(r.data); }); }
        if (T.root?.isConnected) { refresh(); openChat("g:" + gid); }
      },
    });
  }
  async function deleteGroup(g) {
    if (!g || !(await ask("حذف المجموعة؟", `ستُحذف مجموعة «${g.name}» وكل رسائلها نهائياً.`, "حذف المجموعة"))) return;
    try {
      const paths = S.msgs.filter((m) => m.group_id === g.id && m.media_path).map((m) => m.media_path);
      if (paths.length) await sb.storage.from(BUCKET).remove(paths).catch(() => {});
      must(await sb.from("chat_groups").delete().eq("id", g.id));
      S.groups = S.groups.filter((x) => x.id !== g.id); S.groupMembers = S.groupMembers.filter((x) => x.group_id !== g.id);
      S.msgs = S.msgs.filter((m) => m.group_id !== g.id);
      toast("🗑 تم حذف المجموعة"); closeChat(); refresh();
    } catch (e) { fail(e); }
  }
  function showInfo(key) {
    if (key.startsWith("g:")) {
      const g = groupOf(key.slice(2)); if (!g) return;
      const mem = membersOf(g.id).map(prof).filter(Boolean).sort((a, b) => (b.role === "admin") - (a.role === "admin") || T.online.has(b.id) - T.online.has(a.id));
      const el = sheet(`<div class="tg-info-top">${avatar(key, "xl")}<h3>${esc(g.name)}</h3><small>${mem.length} عضو</small>${g.description ? `<p dir="auto">${esc(g.description)}</p>` : ""}</div>
        ${isAdmin() ? `<div class="tg-sheet-act"><button class="tg-btn ghost" data-ed>${ic("edit")} تعديل</button><button class="tg-btn danger" data-del>${ic("trash")} حذف</button></div>` : ""}
        <div class="tg-people">${mem.map((p) => `<div class="tg-person" data-u="${p.id}">${avatar("u:" + p.id, "sm")}<b>${esc(p.full_name || p.username)}${p.id === ME() ? " (أنت)" : ""}</b><small class="${T.online.has(p.id) ? "on" : ""}">${p.role === "admin" ? "المشرف" : T.online.has(p.id) ? "متصل الآن" : esc(p.specialty || "")}</small></div>`).join("")}</div>`);
      el.querySelector("[data-ed]") && (el.querySelector("[data-ed]").onclick = () => { closeSheet(); groupForm(g); });
      el.querySelector("[data-del]") && (el.querySelector("[data-del]").onclick = () => { closeSheet(); deleteGroup(g); });
      const ok = new Set(chatPeople().map((p) => p.id));
      el.querySelectorAll("[data-u]").forEach((x) => { if (ok.has(x.dataset.u)) { x.classList.add("click"); x.onclick = () => { closeSheet(); openChat("u:" + x.dataset.u); }; } });
      return;
    }
    const p = prof(key.slice(2)); if (!p) return;
    const projs = S.memberships.filter((m) => m.user_id === p.id).map((m) => S.projects.find((x) => x.id === m.project_id)?.name).filter(Boolean);
    const common = myGroups().filter((g) => membersOf(g.id).includes(p.id));
    sheet(`<div class="tg-info-top">${avatar(key, "xl")}<h3>${esc(p.full_name || p.username)}</h3><small class="${T.online.has(p.id) ? "on" : ""}">${T.online.has(p.id) ? "متصل الآن" : "آخر ظهور مؤخراً"}</small></div>
      <div class="tg-kv"><span>اسم المستخدم</span><b dir="ltr">@${esc(p.username || "")}</b></div>
      <div class="tg-kv"><span>الصفة</span><b>${p.role === "admin" ? "المشرف — مدير المنصة" : esc(p.specialty || "عضو فريق")}</b></div>
      ${projs.length ? `<div class="tg-kv"><span>المشاريع</span><b>${projs.map(esc).join("، ")}</b></div>` : ""}
      ${common.length ? `<div class="tg-kv"><span>مجموعات مشتركة</span><b>${common.map((g) => esc(g.emoji + " " + g.name)).join("، ")}</b></div>` : ""}`);
  }

  // ------------------------------------------------------------ قوائم ونوافذ صغيرة
  function popMenu(items, x, y, onClose, dir) {
    closeMenu();
    const bd = document.createElement("div"); bd.className = "tg-menu-bd";
    const el = document.createElement("div"); el.className = "tg-menu";
    el.innerHTML = items.map((it, i) => `<button data-i="${i}" class="${it.danger ? "danger" : ""}">${ic(it.icon)}<span>${esc(it.label)}</span></button>`).join("");
    document.body.append(bd, el);
    const r = el.getBoundingClientRect();
    let left = Math.min(Math.max(8, x - r.width / 2), innerWidth - r.width - 8);
    let top = dir === "up" ? y - r.height : y;
    if (top + r.height > innerHeight - 8) top = Math.max(8, y - r.height);
    if (top < 8) top = 8;
    el.style.left = left + "px"; el.style.top = top + "px";
    el._close = onClose;
    el.querySelectorAll("button").forEach((b) => (b.onclick = () => { closeMenu(); items[+b.dataset.i].run(); }));
    bd.onclick = closeMenu; bd.oncontextmenu = (e) => { e.preventDefault(); closeMenu(); };
  }
  function closeMenu() { const m = $(".tg-menu"); if (m) { m._close?.(); m.remove(); } $(".tg-menu-bd")?.remove(); }
  function sheet(html, onClose) {
    closeSheet();
    const el = document.createElement("div"); el.className = "tg-sheet-bd";
    el.innerHTML = `<div class="tg-sheet"><button class="tg-ib tg-sheet-x" data-x>${ic("close")}</button>${html}</div>`;
    document.body.appendChild(el);
    el._close = onClose;
    el.addEventListener("mousedown", (e) => { if (e.target === el) closeSheet(); });
    el.querySelectorAll("[data-x]").forEach((b) => (b.onclick = closeSheet));
    return el.querySelector(".tg-sheet");
  }
  function closeSheet() { const s = $(".tg-sheet-bd"); if (s) { s._close?.(); s.remove(); } }
  function ask(title, text, okLabel) {
    return new Promise((res) => {
      const el = sheet(`<h3>${esc(title)}</h3><p class="tg-muted">${esc(text)}</p><div class="tg-sheet-act"><button class="tg-btn ghost" data-no>إلغاء</button><button class="tg-btn danger" data-ok>${esc(okLabel)}</button></div>`, () => res(false));
      el.parentElement._close = () => res(false);
      el.querySelector("[data-no]").onclick = () => closeSheet();
      el.querySelector("[data-ok]").onclick = () => { el.parentElement._close = null; closeSheet(); res(true); };
    });
  }

  // ------------------------------------------------------------ الحضور و«يكتب…»
  function initPresence() {
    if (presence || !S.me) return;
    try {
      presence = sb.channel("tg-presence", { config: { presence: { key: ME() }, broadcast: { self: false } } });
      presence
        .on("presence", { event: "sync" }, () => { T.online = new Set(Object.keys(presence.presenceState?.() || {})); light(); })
        .on("broadcast", { event: "typing" }, ({ payload: p } = {}) => {
          if (!p || p.from === ME()) return;
          const key = p.to === "u:" + ME() ? "u:" + p.from : p.to?.startsWith("g:") && myGroups().some((g) => "g:" + g.id === p.to) ? p.to : null;
          if (!key) return;
          T.typing.set(key, { from: p.from, until: Date.now() + 4500 }); light();
          setTimeout(light, 4700);
        })
        .subscribe((st) => { if (st === "SUBSCRIBED") Promise.resolve(presence.track({ at: Date.now() })).catch(() => {}); });
    } catch {}
  }
  function light() { if (!T.root?.isConnected) return; renderHead(); renderList(); }

  // ------------------------------------------------------------ الشاشة على الموبايل (لوحة المفاتيح)
  function fitViewport() {
    const m = $("#tg-main"), vv = window.visualViewport;
    if (!m) return;
    if (!vv || !narrow() || !T.sel) { m.style.height = ""; m.style.top = ""; return; }
    m.style.height = vv.height + "px"; m.style.top = vv.offsetTop + "px";
  }

  // ------------------------------------------------------------ واجهة عامة
  function refresh() {
    if (!T.root?.isConnected) return;
    renderList();
    if (T.sel) {
      if (T.sel.startsWith("g:") && !groupOf(T.sel.slice(2))) { closeChat(true); return; }
      renderHead(); renderMsgs();
      if (T.edit && !findMsg(T.edit.id)) cancelBar();
    }
  }
  function onIncoming(m) {
    if (T.root?.isConnected && T.sel && keyOf(m) === T.sel && m.sender !== ME()) {
      const box = $("#tg-msgs"); if (box && !nearBottom(box)) T.newBelow++;
      T.typing.delete(T.sel);
    }
  }
  const isOpen = (m) => !!(T.root?.isConnected && T.sel && keyOf(m) === T.sel && document.visibilityState === "visible");
  function back() {
    if ($(".tg-lb")) { closeLb(); return true; }
    if ($(".tg-menu")) { closeMenu(); return true; }
    if ($(".tg-sheet-bd")) { closeSheet(); return true; }
    if (REC.cur) { stopRec(false); return true; }
    if (T.reply || T.edit) { cancelBar(); return true; }
    if (T.sel && narrow()) { closeChat(); return true; }
    return false;
  }
  const onPop = () => { if (T.sel && narrow()) closeChat(true); };
  const onVis = () => markSeen();
  const onKey = (e) => { if (e.key === "Escape") { if ($(".tg-lb") || $(".tg-menu") || $(".tg-sheet-bd")) { e.preventDefault(); back(); } } };

  function mount(main, openKey) {
    initPresence();
    main.classList.add("tg-host");
    main.innerHTML = `<div class="tg" id="tg">
      <aside class="tg-side">
        <div class="tg-side-head"><label class="tg-search">${ic("search")}<input id="tg-q" placeholder="بحث في المحادثات" value="${esc(T.q)}"></label></div>
        <div class="tg-chips" id="tg-chips"></div>
        ${!v2() && isAdmin() ? `<div class="tg-warn">⚠️ لتفعيل المجموعات والصور والصوت والتعديل: شغّل ملف <b>supabase/chat.sql</b> في SQL Editor مرة واحدة.</div>` : ""}
        <div class="tg-list" id="tg-list"></div>
        <button class="tg-fab" id="tg-fab" title="${isAdmin() ? "محادثة أو مجموعة جديدة" : "محادثة جديدة"}">${ic("edit")}</button>
      </aside>
      <section class="tg-main" id="tg-main"></section>
    </div>`;
    T.root = $("#tg");
    $("#tg-q").oninput = (e) => { T.q = e.target.value; renderList(); };
    $("#tg-fab").onclick = newChat;
    const key = openKey || (T.sel && (narrow() ? null : T.sel));
    T.sel = null;
    renderList();
    if (key) openChat(key, true); else renderEmpty();
    window.__chatBack = back;
    addEventListener("popstate", onPop); document.addEventListener("visibilitychange", onVis); document.addEventListener("keydown", onKey);
    window.visualViewport?.addEventListener("resize", fitViewport); window.visualViewport?.addEventListener("scroll", fitViewport);
    const tick = setInterval(() => { if (T.typing.size) light(); }, 5000);
    return () => {
      saveDraft(); stopPlayer(); if (REC.cur) stopRec(false);
      closeMenu(); closeSheet(); closeLb(); clearInterval(tick);
      main.classList.remove("tg-host"); T.root = null;
      if (window.__chatBack === back) window.__chatBack = null;
      removeEventListener("popstate", onPop); document.removeEventListener("visibilitychange", onVis); document.removeEventListener("keydown", onKey);
      window.visualViewport?.removeEventListener("resize", fitViewport); window.visualViewport?.removeEventListener("scroll", fitViewport);
    };
  }

  injectCss();
  return { mount, refresh, onIncoming, isOpen, initPresence, keyOf, openKey: (k) => { T.sel = k; } };
}

// =====================================================================
function injectCss() {
  if (document.getElementById("tg-css")) return;
  const wall = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="#1e4a38" stroke-opacity=".07" stroke-width="1.6" stroke-linecap="round"><path d="M18 30c6-10 14-10 20 0M24 26v-8m0 0c-3-3-6-3-8 0m8 0c3-3 6-3 8 0"/><ellipse cx="86" cy="22" rx="6" ry="9" transform="rotate(35 86 22)"/><path d="M80 30l-6 8"/><circle cx="60" cy="64" r="4"/><path d="M98 70l6 6m0-6l-6 6M14 84c4 4 10 4 14 0M70 100l8-8 8 8M40 104h12M104 104c0-6 6-6 6 0"/><path d="M36 58l-6 10h12z"/></svg>')}")`;
  const css = `
main.tg-host{padding:0!important;overflow:hidden}
.tg{display:grid;grid-template-columns:minmax(300px,360px) 1fr;height:calc(100dvh - 64px);background:#fff;font-size:15px;--tg-g:#1e4a38;--tg-acc:#2f8f5b;--tg-out:#e7f6d9;--tg-tick:#4fae4e}
.tg .ic{width:24px;height:24px;fill:currentColor;flex-shrink:0}.tg .ic.flip,.tg-menu .ic.flip,.tg-sheet .ic.flip{transform:scaleX(-1)}
.tg-side{position:relative;display:flex;flex-direction:column;min-height:0;border-inline-end:1px solid #e7e7e7;background:#fff}
.tg-side-head{padding:10px 12px 6px}
.tg-search{display:flex;align-items:center;gap:8px;background:#f1f3f4;border-radius:22px;padding:0 14px;height:42px;color:#8a949b;transition:.15s;border:2px solid transparent}
.tg-search:focus-within{background:#fff;border-color:var(--tg-acc,#2f8f5b);color:var(--tg-acc,#2f8f5b)}
.tg-search input{border:0!important;background:transparent!important;outline:0;box-shadow:none!important;padding:0!important;height:100%;flex:1;font:inherit;color:#1d2a24;min-width:0}
.tg-search .ic{width:20px;height:20px}
.tg-search.in{margin:6px 0 10px}
.tg-chips{display:flex;gap:6px;padding:4px 12px 8px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid #eee}.tg-chips::-webkit-scrollbar{display:none}
.tg-chips button{border:0;background:transparent;color:#707579;font:inherit;font-weight:700;font-size:14px;padding:6px 12px;border-radius:18px;cursor:pointer;white-space:nowrap;display:flex;gap:6px;align-items:center}
.tg-chips button.on{background:var(--tg-g);color:#fff}.tg-chips button:not(.on):hover{background:#f1f3f4}
.tg-chips i{font-style:normal;background:#c39a5c;color:#fff;border-radius:10px;font-size:11px;min-width:18px;height:18px;display:grid;place-items:center;padding:0 5px}
.tg-chips button.on i{background:#fff;color:var(--tg-g)}
.tg-warn{margin:8px 12px 0;background:#fff7e6;border:1px solid #f0d49a;color:#7a5a17;border-radius:10px;padding:8px 10px;font-size:13px}
.tg-list{flex:1;overflow-y:auto;padding:6px 6px 90px;overscroll-behavior:contain}
.tg-item{display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:12px;cursor:pointer;transition:background .12s;user-select:none}
.tg-item:hover{background:#f4f4f5}.tg-item.on{background:var(--tg-g);color:#fff}
.tg-item.on .tg-l2,.tg-item.on .tg-time,.tg-item.on .tg-l2 em{color:rgba(255,255,255,.85)!important}.tg-item.on .tk{fill:#fff!important}
.tg-ib-body{flex:1;min-width:0}
.tg-l1,.tg-l2{display:flex;align-items:center;gap:8px}
.tg-l1 b{flex:1;min-width:0;display:flex;align-items:center;gap:4px;font-size:15.5px;font-weight:700}
.tg-l1 b span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tg-l1 .gi{width:17px;height:17px;opacity:.75}
.tg-time{font-size:12.5px;color:#8a949b;display:flex;align-items:center;gap:2px;white-space:nowrap}
.tg-l2{margin-top:2px;color:#707579;font-size:14.5px}
.tg-l2>span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tg-l2 em{font-style:normal;color:#1d2a24}.tg-l2 em.on{color:var(--tg-acc)}
.tg-l2 .typing{color:var(--tg-acc);font-weight:600}.tg-item.on .typing{color:#fff}
.tg-un{font-style:normal;background:var(--tg-acc);color:#fff;border-radius:12px;min-width:22px;height:22px;display:grid;place-items:center;font-size:12.5px;font-weight:800;padding:0 7px}
.tg-item.on .tg-un{background:#fff;color:var(--tg-g)}
.tg-adm{font-style:normal;font-size:10.5px;font-weight:800;background:#f4e8d6;color:#8a6430;border-radius:6px;padding:1px 6px;flex-shrink:0}
.tg-item.on .tg-adm{background:rgba(255,255,255,.2);color:#fff}
.tg-sec{padding:14px 12px 6px;color:#8a949b;font-weight:700;font-size:13px}
.tg-list-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:50px 20px;color:#8a949b;text-align:center}.tg-list-empty .ic{width:56px;height:56px;opacity:.35}
.tg-av{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;font-size:19px;flex-shrink:0;position:relative;text-shadow:0 1px 1px rgba(0,0,0,.12);letter-spacing:-.5px}
.tg-av.md{width:42px;height:42px;font-size:16px}.tg-av.sm{width:36px;height:36px;font-size:14px}.tg-av.xl{width:96px;height:96px;font-size:38px}
.tg-dot{position:absolute;bottom:1px;inset-inline-start:1px;width:14px;height:14px;border-radius:50%;background:#2fbf5b;border:2.5px solid #fff}
.tg-av.sm .tg-dot{width:11px;height:11px;border-width:2px}
.tg-item.on .tg-dot{border-color:var(--tg-g)}
.tg-fab{position:absolute;bottom:20px;inset-inline-end:20px;width:58px;height:58px;border-radius:50%;border:0;background:linear-gradient(160deg,#2f6b52,#1e4a38);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 6px 16px rgba(30,74,56,.4);transition:transform .15s}
.tg-fab:hover{transform:scale(1.06)}.tg-fab:active{transform:scale(.95)}
.tg-main{position:relative;display:flex;flex-direction:column;min-width:0;min-height:0;background:#d9e3cb ${wall};background-size:auto,240px}
.tg-main::before{content:"";position:absolute;inset:0;background:linear-gradient(160deg,rgba(229,238,207,.75),rgba(205,222,190,.5) 45%,rgba(236,226,196,.75));pointer-events:none}
.tg-main>*{position:relative}
.tg-main.drag::after{content:"أفلت الملفات هنا للإرسال";position:absolute;inset:12px;border:3px dashed var(--tg-acc);border-radius:18px;background:rgba(255,255,255,.85);display:grid;place-items:center;font-weight:800;font-size:20px;color:var(--tg-g);z-index:5}
.tg-empty{flex:1;display:grid;place-items:center}.tg-empty span{background:rgba(30,74,56,.45);color:#fff;padding:6px 16px;border-radius:16px;font-weight:600;display:flex;align-items:center;gap:8px;backdrop-filter:blur(6px)}.tg-empty .ic{width:18px;height:18px}
.tg-head{display:flex;align-items:center;gap:6px;padding:6px 10px;min-height:58px;background:#fff;border-bottom:1px solid #e7e7e7;z-index:3}
.tg-hwho{flex:1;display:flex;align-items:center;gap:10px;cursor:pointer;min-width:0;padding:2px 6px;border-radius:10px}
.tg-hinfo{min-width:0}.tg-hinfo b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tg-hinfo small{color:#8a949b;font-size:13.5px}.tg-hinfo small.hot{color:var(--tg-acc)}
.tg-ib{width:42px;height:42px;border-radius:50%;border:0;background:transparent;color:#707579;display:grid;place-items:center;cursor:pointer;flex-shrink:0;transition:background .12s}
.tg-ib:hover{background:rgba(0,0,0,.06)}.tg-ib.danger{color:#e53935}
.tg-back{display:none}
.tg-msgs{display:block;flex:1;overflow-y:auto;overflow-x:hidden;padding:8px 0 10px;overscroll-behavior:contain}
.tg-col{width:100%;box-sizing:border-box;max-width:780px;margin:0 auto;padding:0 14px;display:flex;flex-direction:column}
.tg-day{position:sticky;top:6px;z-index:2;display:flex;justify-content:center;margin:10px 0 6px;pointer-events:none}
.tg-day span{background:rgba(30,74,56,.5);color:#fff;font-size:13px;font-weight:600;padding:3px 12px;border-radius:14px;backdrop-filter:blur(6px)}
.tg-unsep{margin:10px -14px;background:rgba(255,255,255,.75);text-align:center;color:#5d6d65;font-size:13.5px;font-weight:600;padding:4px}
.tg-row{display:flex;align-items:flex-end;gap:6px;margin-top:2px;transition:background .3s}
.tg-row.tg-first{margin-top:8px}
.tg-row.tg-out{justify-content:flex-start}
.tg-row.tg-in{flex-direction:row-reverse;justify-content:flex-start}
.tg-row.sel .tg-bub,.tg-row.flash .tg-bub{animation:tgflash 1.2s}
@keyframes tgflash{0%,60%{filter:brightness(.82)}100%{filter:none}}
.tg-mav{width:36px;flex-shrink:0;align-self:flex-end}
.tg-bub{position:relative;max-width:min(520px,78%);min-width:64px;padding:6px 10px 5px;border-radius:16px;background:#fff;box-shadow:0 1px 1.5px rgba(0,0,0,.13);line-height:1.5;word-wrap:break-word;overflow-wrap:anywhere;transition:transform .2s}
.tg-row.tg-out .tg-bub{background:var(--tg-out)}
.tg-row.tg-out.tg-last .tg-bub{border-bottom-right-radius:5px}.tg-row.tg-in.tg-last .tg-bub{border-bottom-left-radius:5px}
.tg-row.tg-out.tg-last .tg-bub::after,.tg-row.tg-in.tg-last .tg-bub::after{content:"";position:absolute;bottom:0;width:9px;height:14px;background:inherit}
.tg-row.tg-out.tg-last .tg-bub::after{right:-7px;clip-path:path("M0 0 C0 8 3 12 9 14 L0 14 Z")}
.tg-row.tg-in.tg-last .tg-bub::after{left:-7px;clip-path:path("M9 0 C9 8 6 12 0 14 L9 14 Z")}
.tg-row.swipe-ok .tg-bub{filter:brightness(.95)}
.tg-row.pending{opacity:.8}
.tg-from{font-weight:700;font-size:14px;margin-bottom:1px}
.tg-text{white-space:normal;font-size:15.5px;color:#111b16}
.tg-text a{color:#2a7bc0;text-decoration:underline;word-break:break-all}
.tg-meta{display:flex;justify-content:flex-end;align-items:center;gap:2px;font-size:11.5px;color:#8a9a90;margin-top:1px;white-space:nowrap;user-select:none}
.tg-row.tg-out .tg-meta{color:#5ea35a}
.tg-meta .tk,.tg-time .tk{width:17px;height:17px;fill:var(--tg-tick)}.tg-time .tk{width:16px;height:16px}
.tg-meta .tk.read{fill:var(--tg-tick)}
.tg-quote{border-inline-start:3px solid var(--qc);background:color-mix(in srgb,var(--qc) 12%,transparent);border-radius:6px;padding:3px 8px;margin:2px 0 4px;cursor:pointer;font-size:13.5px;line-height:1.35;max-width:100%}
.tg-quote b{display:block;color:var(--qc);font-size:13.5px}.tg-quote span{display:block;color:#3b4a43;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tg-img{position:relative;border-radius:12px;overflow:hidden;cursor:zoom-in;background:#cfd8cc;margin:2px -6px 4px;max-height:420px}
.tg-img img{width:100%;height:100%;object-fit:cover;display:block}
.tg-bub.only-img{padding:3px;background:transparent!important;box-shadow:none}.tg-bub.only-img::after{display:none}
.tg-bub.only-img .tg-img{margin:0;border-radius:14px;box-shadow:0 1px 2px rgba(0,0,0,.2)}
.tg-bub.only-img .tg-meta{position:absolute;bottom:9px;left:9px;background:rgba(0,0,0,.45);color:#fff!important;padding:1px 7px;border-radius:10px}
.tg-bub.only-img .tg-meta .tk{fill:#fff}
.tg-spin{position:absolute;inset:0;margin:auto;width:42px;height:42px;border-radius:50%;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;animation:tgspin .8s linear infinite;background:rgba(0,0,0,.3)}
.tg-spin.sm{position:static;width:22px;height:22px;border-width:2.5px;background:none;border-color:rgba(47,143,91,.3);border-top-color:var(--tg-acc)}.tg-spin.sm.w{border-color:rgba(255,255,255,.4);border-top-color:#fff}
@keyframes tgspin{to{transform:rotate(360deg)}}
.tg-voice{display:flex;align-items:center;gap:10px;min-width:230px;padding:2px 0}
.tg-play{width:46px;height:46px;border-radius:50%;border:0;background:var(--tg-acc);color:#fff;display:grid;place-items:center;cursor:pointer;flex-shrink:0}
.tg-row.tg-in .tg-play{background:#3d7fb8}
.tg-play .ic{width:26px;height:26px}
.tg-vbody{flex:1;min-width:0}
.tg-wave{display:flex;align-items:center;gap:2px;height:30px;cursor:pointer}
.tg-wave i{flex:1;max-width:4px;min-width:2px;border-radius:2px;background:rgba(47,143,91,.35);transition:background .1s}
.tg-wave i.on{background:var(--tg-acc)}
.tg-row.tg-in .tg-wave i{background:rgba(61,127,184,.3)}.tg-row.tg-in .tg-wave i.on{background:#3d7fb8}
.tg-dur{font-size:12.5px;color:#5ea35a}.tg-row.tg-in .tg-dur{color:#3d7fb8}
.tg-file{display:flex;align-items:center;gap:10px;min-width:210px;cursor:pointer;padding:2px 0}
.tg-fic{width:46px;height:46px;border-radius:50%;background:var(--tg-acc);color:#fff;display:grid;place-items:center;flex-shrink:0}.tg-row.tg-in .tg-fic{background:#3d7fb8}
.tg-file div{min-width:0}.tg-file b{display:block;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px}.tg-file small{color:#8a9a90}
.tg-nomsg{height:100%;display:grid;place-items:center}.tg-nomsg>div{background:rgba(255,255,255,.75);backdrop-filter:blur(6px);border-radius:20px;padding:22px 26px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;color:#5d6d65}
.tg-down{position:absolute;bottom:84px;inset-inline-end:18px;width:48px;height:48px;border-radius:50%;border:0;background:#fff;color:#707579;box-shadow:0 2px 8px rgba(0,0,0,.18);display:grid;place-items:center;cursor:pointer;z-index:4}
.tg-down i{position:absolute;top:-8px;font-style:normal;background:var(--tg-acc);color:#fff;border-radius:11px;min-width:22px;height:22px;font-size:12px;font-weight:800;display:grid;place-items:center;padding:0 6px}
.tg-foot{max-width:808px;width:100%;margin:0 auto;padding:6px 14px 12px;z-index:3}
.tg-bar{display:flex;align-items:center;gap:8px;background:#fff;border-radius:14px 14px 0 0;padding:6px 8px 4px 4px;margin-bottom:-8px;padding-bottom:12px;box-shadow:0 1px 2px rgba(0,0,0,.1)}
.tg-bar-ic{color:var(--tg-acc);display:grid;place-items:center;width:34px}
.tg-bar-q{flex:1;min-width:0;border-inline-start:3px solid var(--tg-acc);padding-inline-start:8px;line-height:1.35}
.tg-bar-q b{display:block;color:var(--tg-acc);font-size:14px}.tg-bar-q span{display:block;font-size:13.5px;color:#5d6d65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tg-compose{display:flex;align-items:flex-end;gap:8px;position:relative}
.tg-input{flex:1;display:flex;align-items:flex-end;background:#fff;border-radius:24px;box-shadow:0 1px 2px rgba(0,0,0,.12);padding:3px 4px;min-height:50px}
.tg-input textarea{flex:1;border:0!important;outline:0;resize:none;background:transparent!important;box-shadow:none!important;font:inherit;font-size:16px;line-height:1.45;padding:11px 6px 10px!important;max-height:150px;min-height:0!important;color:#111b16;border-radius:0!important}
.tg-input .tg-ib{width:44px;height:44px}
.tg-act{width:52px;height:52px;border-radius:50%;border:0;background:#fff;color:#707579;display:grid;place-items:center;cursor:pointer;flex-shrink:0;box-shadow:0 1px 2px rgba(0,0,0,.15);transition:background .15s,color .15s,transform .1s}
.tg-act.send{background:linear-gradient(160deg,#36a265,#2f8f5b);color:#fff}
.tg-act:active{transform:scale(.92)}
.tg-rec{display:flex;align-items:center;gap:8px;background:#fff;border-radius:26px;padding:4px 4px 4px 4px;box-shadow:0 1px 2px rgba(0,0,0,.12)}
.tg-rec-mid{flex:1;display:flex;align-items:center;gap:10px;min-width:0}
.tg-rec-dot{width:12px;height:12px;border-radius:50%;background:#e53935;animation:tgblink 1s infinite}
@keyframes tgblink{50%{opacity:.25}}
.tg-rec-mid b{font-variant-numeric:tabular-nums;min-width:42px}
.tg-rec-wave{flex:1;display:flex;align-items:center;gap:2px;height:30px;overflow:hidden;justify-content:flex-end}
.tg-rec-wave i{width:3px;border-radius:2px;background:#e57373;flex-shrink:0}
.tg-menu-bd{position:fixed;inset:0;z-index:95}
.tg-menu{position:fixed;z-index:96;background:rgba(255,255,255,.98);border-radius:14px;box-shadow:0 10px 32px rgba(0,0,0,.22);padding:6px;min-width:210px;animation:tgpop .14s ease-out;backdrop-filter:blur(10px)}
@keyframes tgpop{from{opacity:0;transform:scale(.92)}}
.tg-menu button{display:flex;align-items:center;gap:14px;width:100%;border:0;background:transparent;font:inherit;font-size:15px;padding:10px 12px;border-radius:8px;cursor:pointer;color:#1d2a24;text-align:start}
.tg-menu button:hover{background:#f1f3f4}.tg-menu .ic{width:22px;height:22px;fill:#707579}
.tg-menu button.danger{color:#e53935}.tg-menu button.danger .ic{fill:#e53935}
.tg-sheet-bd{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.4);display:grid;place-items:center;padding:16px;animation:tgfade .15s}
@keyframes tgfade{from{opacity:0}}
.tg-sheet{position:relative;background:#fff;border-radius:18px;width:min(440px,100%);max-height:88vh;overflow:auto;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,.3);animation:tgpop .16s}
.tg-sheet h3{margin:0 0 10px;font-size:18px;display:flex;align-items:center;gap:8px}.tg-sheet h3 .ic{width:22px;height:22px;fill:var(--tg-acc,#2f8f5b)}
.tg-sheet-x{position:absolute;top:10px;inset-inline-end:10px}
.tg-sheet .ic{width:22px;height:22px;fill:currentColor}
.tg-sheet-act{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}
.tg-btn{border:0;border-radius:12px;padding:10px 18px;font:inherit;font-weight:700;cursor:pointer;background:#2f8f5b;color:#fff;display:inline-flex;align-items:center;gap:8px}
.tg-btn.ghost{background:#f1f3f4;color:#1d2a24}.tg-btn.danger{background:#e53935}
.tg-btn .ic{width:20px;height:20px;fill:currentColor}
.tg-muted{color:#8a949b;font-size:14px}
.tg-prev{display:grid;gap:4px;border-radius:12px;overflow:hidden;margin-bottom:10px}.tg-prev.multi{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}
.tg-prev img{width:100%;max-height:52vh;object-fit:contain;background:#f1f3f4;display:block}.tg-prev.multi img{height:120px;object-fit:cover}
.tg-cap{width:100%;border:0;border-bottom:2px solid #2f8f5b;border-radius:0;padding:8px 2px;font:inherit;font-size:16px;resize:none;outline:0;background:transparent}
.tg-people{display:flex;flex-direction:column;gap:2px;margin-top:8px}
.tg-person{display:flex;align-items:center;gap:12px;padding:8px;border-radius:10px}
.tg-person b{flex:1}.tg-person small{color:#8a949b}.tg-person small.on{color:#2f8f5b}
.tg-person.click,.tg-people.pick .tg-person{cursor:pointer}.tg-person.click:hover,.tg-people.pick .tg-person:hover{background:#f4f4f5}
.tg-info-top{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;padding:6px 0 12px;border-bottom:1px solid #eee;margin-bottom:8px}
.tg-info-top h3{margin:6px 0 0;justify-content:center}.tg-info-top small{color:#8a949b}.tg-info-top small.on{color:#2f8f5b}.tg-info-top p{margin:6px 0 0;color:#3b4a43}
.tg-kv{display:flex;justify-content:space-between;gap:12px;padding:10px 4px;border-bottom:1px solid #f1f1f1}.tg-kv span{color:#8a949b}
.tg-lb{position:fixed;inset:0;z-index:100;background:rgba(10,14,12,.94);display:flex;flex-direction:column;animation:tgfade .15s}
.tg-lb header{display:flex;align-items:center;gap:6px;padding:10px 14px;color:#fff}.tg-lb header div{flex:1}.tg-lb header small{display:block;opacity:.7}
.tg-lb .tg-ib{color:#fff}.tg-lb .ic{width:24px;height:24px;fill:#fff}
.tg-lb-img{flex:1;display:grid;place-items:center;min-height:0;padding:10px}.tg-lb-img img{max-width:100%;max-height:100%;object-fit:contain;border-radius:4px}
.tg-lb footer{color:#fff;text-align:center;padding:12px 16px 20px;font-size:15px}
.tg-gform .tg-gtop{display:flex;gap:16px;align-items:center}
.tg-pick-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0}.tg-pick-row>span{color:#6c7a72;font-weight:700;margin-inline-end:4px}
.tg-emo{width:38px;height:38px;border-radius:10px;border:2px solid transparent;background:#f4f1ec;font-size:20px;cursor:pointer}.tg-emo.on{border-color:#2f8f5b;background:#e7f6d9}
.tg-swatch{width:30px;height:30px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px #ddd;cursor:pointer}.tg-swatch.on{box-shadow:0 0 0 3px #1d2a24}
.tg-gm-head{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:12px 0 6px}
.tg-chip{border:1px solid #e0d6c8;background:#fff;border-radius:16px;padding:4px 10px;font:inherit;font-size:13px;cursor:pointer}.tg-chip:hover{background:#f4e8d6}
.tg-gm{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:4px;max-height:280px;overflow:auto;border:1px solid #eee;border-radius:12px;padding:6px}
.tg-gm-i{display:flex!important;align-items:center;gap:10px;padding:6px 8px;border-radius:10px;cursor:pointer;margin:0!important;font-weight:400!important}
.tg-gm-i:hover{background:#f6f3ee}.tg-gm-i input{width:18px!important;height:18px;margin:0!important;accent-color:#2f8f5b;flex-shrink:0}
.tg-gm-i span{min-width:0}.tg-gm-i b{display:block;font-size:14px}.tg-gm-i small{color:#8a949b;font-size:12px}
@media (hover:none){.tg-bub{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}}
@media (max-width:900px){
  .tg{grid-template-columns:1fr;height:calc(100dvh - 60px)}
  .tg-main{display:none}
  .tg.has-chat .tg-main{display:flex;position:fixed;top:0;left:0;right:0;height:100dvh;z-index:45}
  .tg-back{display:grid}
  .tg-head{padding:4px 4px;padding-top:max(4px,env(safe-area-inset-top))}
  .tg-hwho{padding:2px}
  .tg-col{padding:0 8px}.tg-unsep{margin:10px -8px}
  .tg-bub{max-width:84%}
  .tg-foot{padding:4px 6px 8px;padding-bottom:max(8px,env(safe-area-inset-bottom))}
  .tg-voice{min-width:200px}
  .tg-sheet-bd{align-items:end;padding:0}.tg-sheet{border-radius:18px 18px 0 0;width:100%;max-height:85vh;padding-bottom:max(20px,env(safe-area-inset-bottom))}
  .tg-down{bottom:78px;inset-inline-end:12px}
}`;
  const s = document.createElement("style"); s.id = "tg-css"; s.textContent = css; document.head.appendChild(s);
}
