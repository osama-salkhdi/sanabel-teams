// =====================================================================
//  مساحة ملفات المشروع: مستكشف + لوحة (Trello) + مخطط شجري (D3) + نشاط
//  محرر أكواد منزلق، رفع مجلدات/ZIP، حضور لحظي، تصدير المخطط PNG/HTML
// =====================================================================
export function createFilesView(X) {
  const { sb, S, $, $$, esc, toast, fail, must, openModal, closeModal, confirmBox, canEdit, pname, project, log, fmtTime, head, BUCKET, loadMonaco } = X;

  const F = { pid: null, files: [], cwd: "", view: "explorer", treeOpen: new Set(), presence: {}, online: [], channel: null, panel: null, poll: null, main: null, sig: "" };
  const JUNK = /(^|\/)(\.git|node_modules|__pycache__|\.venv|venv|\.idea|\.vscode|__MACOSX|\.pio|\.gradle)(\/|$)|(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$/i;
  const MAX_TEXT = 2 * 1024 * 1024, MAX_BIN = 25 * 1024 * 1024;
  const LMAP = {
    py: "python", ino: "cpp", cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", h: "cpp", c: "c", java: "java", js: "javascript", mjs: "javascript", jsx: "javascript",
    ts: "typescript", tsx: "typescript", cs: "csharp", html: "html", htm: "html", css: "css", scss: "scss", json: "json", md: "markdown", sh: "shell", bash: "shell",
    bat: "bat", ps1: "powershell", sql: "sql", yml: "yaml", yaml: "yaml", xml: "xml", svg: "xml", launch: "xml", urdf: "xml", xacro: "xml", ini: "ini", cfg: "ini", toml: "ini",
    go: "go", rs: "rust", kt: "kotlin", php: "php", rb: "ruby", lua: "lua", r: "r", m: "plaintext", txt: "plaintext", csv: "plaintext", log: "plaintext", cmake: "plaintext",
  };
  const TEXT_EXT = new Set([...Object.keys(LMAP), "env", "gitignore", "gitattributes", "properties", "gradle", "rst", "tex", "mk", "makefile", "dockerfile", "conf", "lock", "tsv", "dat", "pde"]);
  const LM = {
    python: ["Python", "#3776ab", "🐍"], cpp: ["C++", "#00599c", "⚙️"], c: ["C", "#5c6bc0", "🔧"], java: ["Java", "#b07219", "☕"], javascript: ["JavaScript", "#e8c400", "📜"],
    typescript: ["TypeScript", "#3178c6", "📘"], csharp: ["C#", "#68217a", "🎯"], html: ["HTML", "#e34c26", "🌐"], css: ["CSS", "#663399", "🎨"], scss: ["SCSS", "#c6538c", "🎨"],
    json: ["JSON", "#6d6d6d", "🧾"], markdown: ["Markdown", "#083fa1", "📝"], shell: ["Shell", "#4eaa25", "💲"], bat: ["Batch", "#4eaa25", "💲"], powershell: ["PowerShell", "#012456", "💲"],
    sql: ["SQL", "#e38c00", "🗄️"], yaml: ["YAML", "#cb171e", "📋"], xml: ["XML", "#0060ac", "🏷️"], ini: ["Config", "#7d7d7d", "⚙️"], go: ["Go", "#00add8", "🐹"],
    rust: ["Rust", "#b7410e", "🦀"], kotlin: ["Kotlin", "#a97bff", "🟣"], php: ["PHP", "#4f5d95", "🐘"], ruby: ["Ruby", "#cc342d", "💎"], lua: ["Lua", "#000080", "🌙"], r: ["R", "#198ce7", "📊"],
    plaintext: ["نص", "#8a8a8a", "📄"], image: ["صورة", "#c39a5c", "🖼️"], pdf: ["PDF", "#d32f2f", "📕"], model: ["نموذج 3D", "#2a9d8f", "🧊"], archive: ["أرشيف", "#795548", "📦"], binary: ["ملف", "#607d8b", "📦"],
  };
  const extOf = (p) => { const n = p.split("/").pop().toLowerCase(); return n.includes(".") ? n.split(".").pop() : n; };
  const langOf = (p) => LMAP[extOf(p)] || "plaintext";
  const kindOf = (f) => {
    if (!f.storage_path) return f.language || langOf(f.path);
    const e = extOf(f.path);
    if (/^(png|jpe?g|gif|webp|bmp|svg)$/.test(e)) return "image";
    if (e === "pdf") return "pdf";
    if (/^(glb|gltf|stl|obj|step|stp|fbx)$/.test(e)) return "model";
    if (/^(zip|rar|7z|tar|gz)$/.test(e)) return "archive";
    return "binary";
  };
  const meta = (f) => LM[kindOf(f)] || LM.plaintext;
  const baseName = (p) => p.split("/").pop();
  const dirOf = (p) => p.split("/").slice(0, -1).join("/");
  const join = (...a) => a.filter(Boolean).join("/").replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
  const fmtSize = (b) => (b == null ? "—" : b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB");
  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
  const ago = (ts) => { if (!ts) return "—"; const s = (Date.now() - new Date(ts)) / 1000;
    if (s < 45) return "الآن"; if (s < 3600) return rtf.format(-Math.round(s / 60), "minute"); if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
    if (s < 86400 * 30) return rtf.format(-Math.round(s / 86400), "day"); return fmtTime(ts); };
  const hue = (str) => [...String(str || "")].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 17);
  const av = (uid, sz = 26, extra = "") => uid ? `<span class="av" title="${esc(pname(uid))}" style="--h:${hue(uid)};width:${sz}px;height:${sz}px;font-size:${Math.round(sz * 0.45)}px" ${extra}>${esc((pname(uid) || "?").trim()[0])}</span>` : "";
  const dirColor = (p) => `hsl(${hue(p)} 45% 42%)`;
  const validPath = (p) => p && !p.split("/").some((s) => !s || s === "." || s === "..") && !/[\\:*?"<>|]/.test(p);
  const legacy = () => !!S.filesLegacy;
  const strip = (row) => { if (legacy()) { delete row.size; delete row.storage_path; delete row.mime; } return row; };

  // ------------------------------------------------------------------ البيانات
  async function loadAll(cols) {
    const out = [];
    for (let from = 0; ; from += 1000) {
      const r = await sb.from("files").select(cols).eq("project_id", S.pid).order("path").range(from, from + 999);
      if (r.error) return r;
      out.push(...r.data); if (r.data.length < 1000) break;
    }
    return { data: out, error: null };
  }
  async function loadFiles() {
    let r = await loadAll("id,path,language,size,storage_path,mime,updated_at,updated_by,created_at");
    if (r.error && /column|size|storage_path|mime/i.test(r.error.message || "")) { S.filesLegacy = true; r = await loadAll("id,path,language,updated_at,updated_by,created_at"); }
    F.files = must(r);
    F.sig = F.files.length + "|" + F.files.reduce((m, f) => (f.updated_at > m ? f.updated_at : m), "");
  }
  function buildTree() {
    const mk = (name, path) => ({ name, path, dirs: new Map(), files: [], count: 0, size: 0, last: null, people: new Set(), langs: {} });
    const root = mk(project()?.name || "المشروع", "");
    for (const f of F.files) {
      const parts = f.path.split("/"); let node = root; const chain = [root];
      for (let i = 0; i < parts.length - 1; i++) { const p = parts[i]; if (!node.dirs.has(p)) node.dirs.set(p, mk(p, join(node.path, p))); node = node.dirs.get(p); chain.push(node); }
      if (parts.at(-1) === ".keep") continue;
      node.files.push(f);
      const k = kindOf(f);
      chain.forEach((n) => { n.count++; n.size += f.size || 0; n.langs[k] = (n.langs[k] || 0) + (f.size || 1);
        if (!n.last || f.updated_at > n.last.updated_at) n.last = f; if (f.updated_by) n.people.add(f.updated_by); });
    }
    return root;
  }
  const nodeAt = (root, path) => { let n = root; for (const p of path.split("/").filter(Boolean)) { n = n.dirs.get(p); if (!n) return null; } return n; };
  const sortDirs = (n) => [...n.dirs.values()].sort((a, b) => a.name.localeCompare(b.name));
  const sortFiles = (n) => n.files.slice().sort((a, b) => baseName(a.path).localeCompare(baseName(b.path)));

  // ------------------------------------------------------------------ الواجهة الرئيسية
  async function view(main) {
    F.main = main;
    if (F.pid !== S.pid) { F.pid = S.pid; F.cwd = ""; F.treeOpen = new Set(); F.presence = {}; F.online = []; }
    await loadFiles();
    const ed = canEdit();
    main.innerHTML = head("🗂️ ملفات المشروع", `مساحة عمل مشتركة — كل إضافة أو تعديل تظهر للجميع لحظياً باسم صاحبها`,
      `<div class="online-strip" id="fx-online"></div>
       ${ed ? `<button class="btn gold pulse" id="fx-new">＋ جديد ▾</button><button class="btn" id="fx-up">⬆️ رفع ▾</button>` : ""}
       <button class="btn ghost" id="fx-down">⬇️ تنزيل ▾</button>`) + `
      <div class="fx-root" id="fx-root">
        <div class="fx-bar"><div class="crumbs" id="fx-crumbs"></div><div class="spacer"></div>
          <div class="seg" id="fx-views">${[["explorer", "🗂️ مستكشف"], ["board", "📋 لوحة"], ["tree", "🌳 مخطط شجري"], ["activity", "🕓 النشاط"]]
            .map(([k, l]) => `<button data-v="${k}" class="${F.view === k ? "on" : ""}">${l}</button>`).join("")}</div></div>
        <div id="fx-body"></div>
        <div class="fx-drop hidden" id="fx-drop"><div>📥<b>أفلت الملفات أو المجلدات أو ملف ZIP هنا</b><span id="fx-drop-to"></span><small>يحافظ الرفع على ترتيب المجلدات كما هو</small></div></div>
      </div>`;
    $$("#fx-views button").forEach((b) => (b.onclick = () => { F.view = b.dataset.v; $$("#fx-views button").forEach((x) => x.classList.toggle("on", x === b)); renderBody(); }));
    if (ed) {
      $("#fx-new").onclick = (e) => menu(e.currentTarget, [["📄", "ملف جديد هنا", () => newFile(F.cwd)], ["📁", "مجلد جديد هنا", () => newFolder(F.cwd)]]);
      $("#fx-up").onclick = (e) => menu(e.currentTarget, [
        ["📄", "رفع ملفات", () => pick({ multiple: true }, (fs) => importFiles([...fs].map((f) => ({ path: join(F.cwd, f.name), file: f })), "ملفات"))],
        ["📁", "رفع مجلد كامل (بترتيبه)", () => pick({ dir: true }, (fs) => importFiles([...fs].map((f) => ({ path: join(F.cwd, f.webkitRelativePath || f.name), file: f })), "مجلد"))],
        ["📦", "رفع ZIP وفك ضغطه", () => pick({ accept: ".zip" }, (fs) => fs[0] && importZip(fs[0]))],
        ["💡", "لرفع عدة مجلدات معاً: اسحبها وأفلتها هنا", null],
      ]);
    }
    $("#fx-down").onclick = (e) => menu(e.currentTarget, [
      ["📦", "المشروع كاملاً ZIP", () => downloadZip("")],
      ...(F.cwd ? [["📂", `المجلد الحالي (${baseName(F.cwd)}) ZIP`, () => downloadZip(F.cwd)]] : []),
      ["🖼️", "صورة المخطط الشجري PNG", () => exportPNG()],
      ["🌐", "مخطط تفاعلي HTML", () => exportHTML()],
    ]);
    setupDrop();
    setupRealtime();
    renderBody();
  }

  function renderBody() {
    const body = $("#fx-body"); if (!body) return;
    const root = buildTree();
    if (!nodeAt(root, F.cwd)) F.cwd = "";
    renderCrumbs();
    ({ explorer: renderExplorer, board: renderBoard, tree: renderTree, activity: renderActivity })[F.view](body, root);
    renderOnline();
  }
  function renderCrumbs() {
    const parts = F.cwd.split("/").filter(Boolean);
    $("#fx-crumbs").innerHTML = `<button class="crumb home ${F.cwd ? "" : "on"}" data-cd="" data-drop-dir="">🏠 المشروع كاملاً</button>` +
      parts.map((p, i) => `<span class="sep">‹</span><button class="crumb ${i === parts.length - 1 ? "on" : ""}" data-cd="${esc(parts.slice(0, i + 1).join("/"))}" data-drop-dir="${esc(parts.slice(0, i + 1).join("/"))}" dir="ltr">📁 ${esc(p)}</button>`).join("");
    $$("#fx-crumbs [data-cd]").forEach((b) => { b.onclick = () => cd(b.dataset.cd); dropTarget(b); });
  }
  function cd(path) { F.cwd = path; const b = $("#fx-body"); b.classList.remove("fx-anim"); void b.offsetWidth; b.classList.add("fx-anim"); renderBody(); track(); }

  // ------------------------------------------------------------------ المستكشف
  function langBar(n) {
    const tot = Object.values(n.langs).reduce((a, b) => a + b, 0) || 1;
    const items = Object.entries(n.langs).sort((a, b) => b[1] - a[1]);
    return `<div class="langbar">${items.map(([k, v]) => `<i style="width:${(v / tot) * 100}%;background:${(LM[k] || LM.plaintext)[1]}" title="${(LM[k] || LM.plaintext)[0]} ${Math.round((v / tot) * 100)}%"></i>`).join("")}</div>
      <div class="langkeys">${items.slice(0, 7).map(([k, v]) => `<span><i style="background:${(LM[k] || LM.plaintext)[1]}"></i>${(LM[k] || LM.plaintext)[0]} <small>${Math.round((v / tot) * 100)}%</small></span>`).join("")}</div>`;
  }
  function miniTree(root) {
    const rec = (n, d) => sortDirs(n).map((c) => {
      const open = F.treeOpen.has(c.path) || F.cwd === c.path || F.cwd.startsWith(c.path + "/");
      return `<div class="mt-row ${F.cwd === c.path ? "on" : ""}" style="padding-inline-start:${8 + d * 14}px" data-cd="${esc(c.path)}" data-drop-dir="${esc(c.path)}">
        <span class="mt-car ${c.dirs.size ? "" : "leaf"}" data-tog="${esc(c.path)}">${c.dirs.size ? (open ? "▾" : "▸") : "•"}</span>
        <span class="mt-ico" style="color:${dirColor(c.path)}">${open ? "📂" : "📁"}</span><span class="mt-name" dir="ltr">${esc(c.name)}</span><small>${c.count}</small></div>${open ? rec(c, d + 1) : ""}`;
    }).join("");
    return `<div class="mt-row root ${F.cwd ? "" : "on"}" data-cd="" data-drop-dir=""><span class="mt-ico">🏠</span><span class="mt-name">${esc(root.name)}</span><small>${root.count}</small></div>${rec(root, 0)}`;
  }
  async function renderExplorer(body, root) {
    const node = nodeAt(root, F.cwd), dirs = sortDirs(node), files = sortFiles(node), ed = canEdit();
    const imgs = files.filter((f) => kindOf(f) === "image").map((f) => f.storage_path);
    const url = imgs.length ? await X.signed(imgs) : () => "";
    body.innerHTML = `<div class="fx-split">
      <aside class="minitree" id="fx-mt">${miniTree(root)}</aside>
      <section class="fx-main">
        <div class="dir-banner ${F.cwd ? "" : "rootb"}">
          <div class="db-ico" style="--dc:${F.cwd ? dirColor(F.cwd) : "var(--gold)"}">${F.cwd ? "📂" : "🌳"}</div>
          <div class="db-txt"><h3 dir="${F.cwd ? "ltr" : "rtl"}">${esc(F.cwd ? node.name : `المشروع كاملاً — ${root.name}`)}</h3>
            <div class="db-stats"><span>📄 ${node.count} ملف</span><span>📁 ${countDirs(node)} مجلد</span><span>💾 ${fmtSize(node.size)}</span>
              ${node.last ? `<span>✏️ آخر تعديل: <b>${esc(pname(node.last.updated_by))}</b> ${ago(node.last.updated_at)}</span>` : ""}</div>
            ${node.count ? langBar(node) : ""}</div>
          <div class="db-people">${[...node.people].slice(0, 6).map((u) => av(u, 32)).join("")}</div>
          ${ed ? `<div class="db-act"><button class="btn3d sm" id="db-nf">📄＋ ملف</button><button class="btn3d sm" id="db-nd">📁＋ مجلد</button></div>` : ""}
        </div>
        ${dirs.length ? `<h4 class="fx-h">📁 المجلدات <small>${dirs.length}</small></h4><div class="fgrid">${dirs.map(folderCard).join("")}</div>` : ""}
        ${files.length ? `<h4 class="fx-h">📄 الملفات <small>${files.length}</small></h4><div class="fgrid">${files.map((f) => fileCard(f, url)).join("")}</div>` : ""}
        ${!dirs.length && !files.length ? `<div class="fx-empty">📭<b>هذا المجلد فارغ</b><span>${ed ? "اسحب ملفات أو مجلدات أو ZIP وأفلتها هنا، أو أنشئ ملفاً جديداً" : "لا ملفات بعد"}</span></div>` : ""}
      </section></div>`;
    $$("#fx-mt [data-cd]").forEach((r) => { r.onclick = (e) => { if (e.target.dataset.tog !== undefined && e.target.dataset.tog) { const p = e.target.dataset.tog; F.treeOpen.has(p) ? F.treeOpen.delete(p) : F.treeOpen.add(p); renderBody(); return; } cd(r.dataset.cd); }; dropTarget(r); });
    if (ed) { $("#db-nf").onclick = () => newFile(F.cwd); $("#db-nd").onclick = () => newFolder(F.cwd); }
    bindCards(body);
  }
  const countDirs = (n) => [...n.dirs.values()].reduce((a, d) => a + 1 + countDirs(d), 0);
  function folderCard(d) {
    return `<div class="fcard folder" data-dir="${esc(d.path)}" data-drop-dir="${esc(d.path)}" style="--dc:${dirColor(d.path)}" tabindex="0">
      <div class="fc-top"><span class="fc-folder">📁</span><button class="fc-more" data-dmenu="${esc(d.path)}" title="خيارات">⋯</button></div>
      <div class="fc-name" dir="ltr">${esc(d.name)}</div>
      <div class="fc-meta">${d.count} ملف${d.dirs.size ? ` · ${d.dirs.size} مجلد` : ""} · ${fmtSize(d.size)}</div>
      <div class="fc-foot"><div class="av-stack">${[...d.people].slice(0, 4).map((u) => av(u, 22)).join("")}</div><small>${d.last ? ago(d.last.updated_at) : "فارغ"}</small></div>
    </div>`;
  }
  function fileCard(f, url = () => "") {
    const [ln, lc, li] = meta(f), k = kindOf(f), watchers = (F.presence[f.path] || []).filter((u) => u !== S.me.id);
    return `<div class="fcard file" data-fid="${f.id}" draggable="${canEdit()}" style="--lc:${lc}" tabindex="0">
      <div class="fc-top"><span class="lang-badge">${ln}</span><button class="fc-more" data-fmenu="${f.id}" title="خيارات">⋯</button></div>
      ${k === "image" && url(f.storage_path) ? `<div class="fc-thumb" style="background-image:url('${url(f.storage_path)}')"></div>` : `<div class="fc-ico">${li}</div>`}
      <div class="fc-name" dir="ltr" title="${esc(f.path)}">${esc(baseName(f.path))}</div>
      <div class="fc-meta">${fmtSize(f.size)} · ${ago(f.updated_at)}</div>
      <div class="fc-foot">${av(f.updated_by, 22)}<small>${esc(pname(f.updated_by))}</small>${watchers.length ? `<span class="live-dot" title="يشاهده الآن: ${esc(watchers.map(pname).join("، "))}">👀 ${watchers.length}</span>` : ""}</div>
    </div>`;
  }
  function bindCards(scope) {
    $$("[data-dir]", scope).forEach((c) => { c.onclick = (e) => { if (e.target.closest(".fc-more")) return; cd(c.dataset.dir); }; dropTarget(c);
      c.oncontextmenu = (e) => { e.preventDefault(); dirMenu(c, c.dataset.dir); }; tilt(c); });
    $$("[data-fid]", scope).forEach((c) => { c.onclick = (e) => { if (e.target.closest(".fc-more")) return; openFile(c.dataset.fid); };
      c.oncontextmenu = (e) => { e.preventDefault(); fileMenu(c, c.dataset.fid); };
      c.ondragstart = (e) => { e.dataTransfer.setData("application/x-sanabel-file", c.dataset.fid); e.dataTransfer.effectAllowed = "move"; c.classList.add("dragging"); };
      c.ondragend = () => c.classList.remove("dragging"); tilt(c); });
    $$("[data-dmenu]", scope).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); dirMenu(b, b.dataset.dmenu); }));
    $$("[data-fmenu]", scope).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); fileMenu(b, b.dataset.fmenu); }));
  }
  function tilt(el) {
    el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-3px)`; });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  }
  // سحب ملف إلى مجلد لنقله
  function dropTarget(el) {
    if (!canEdit()) return;
    el.addEventListener("dragover", (e) => { if (e.dataTransfer.types.includes("application/x-sanabel-file")) { e.preventDefault(); e.stopPropagation(); el.classList.add("drop-on"); } });
    el.addEventListener("dragleave", () => el.classList.remove("drop-on"));
    el.addEventListener("drop", (e) => { const id = e.dataTransfer.getData("application/x-sanabel-file"); el.classList.remove("drop-on"); if (!id) return; e.preventDefault(); e.stopPropagation();
      const f = F.files.find((x) => x.id === id); if (f) moveFile(f, join(el.dataset.dropDir, baseName(f.path))); });
  }

  // ------------------------------------------------------------------ اللوحة (Trello)
  function renderBoard(body, root) {
    const node = nodeAt(root, F.cwd), ed = canEdit();
    const col = (title, dirPath, n, isHere) => `
      <div class="bcol" data-drop-dir="${esc(dirPath)}" style="--dc:${isHere ? "var(--gold)" : dirColor(dirPath)}">
        <div class="bcol-h"><span class="bcol-ico">${isHere ? "📄" : "📁"}</span><b dir="${isHere ? "rtl" : "ltr"}" ${isHere ? "" : `data-cd="${esc(dirPath)}" class="link"`}>${esc(title)}</b>
          <span class="tag">${isHere ? n.files.length : n.count}</span><div class="spacer"></div>
          ${ed ? `<button class="icon-btn" data-addin="${esc(dirPath)}" title="ملف جديد هنا">＋</button>` : ""}${isHere ? "" : `<button class="icon-btn" data-dmenu="${esc(dirPath)}">⋯</button>`}</div>
        <div class="bcol-b">
          ${isHere ? "" : sortDirs(n).map((s) => `<button class="sub-chip" data-cd="${esc(s.path)}" data-drop-dir="${esc(s.path)}" dir="ltr">📁 ${esc(s.name)} <small>${s.count}</small></button>`).join("")}
          ${sortFiles(n).map((f) => { const [ln, lc, li] = meta(f); return `<div class="bcard" data-fid="${f.id}" draggable="${ed}" style="--lc:${lc}">
            <div class="row"><span>${li}</span><b dir="ltr">${esc(baseName(f.path))}</b></div>
            <div class="row bmeta"><span class="lang-badge">${ln}</span><small>${fmtSize(f.size)}</small><div class="spacer"></div>${av(f.updated_by, 20)}<small>${ago(f.updated_at)}</small></div></div>`; }).join("")}
          ${!n.files.length && (isHere || !n.dirs.size) ? `<div class="bempty">اسحب بطاقة ملف إلى هنا</div>` : ""}
        </div></div>`;
    body.innerHTML = `<div class="board">${col(F.cwd ? `ملفات «${node.name}»` : "ملفات الجذر", F.cwd, node, true)}${sortDirs(node).map((d) => col(d.name, d.path, d, false)).join("")}
      ${ed ? `<button class="bcol add" id="b-add">＋ مجلد جديد</button>` : ""}</div>`;
    $$(".bcol", body).forEach(dropTarget);
    $$("[data-cd]", body).forEach((b) => { b.onclick = () => cd(b.dataset.cd); if (b.classList.contains("sub-chip")) dropTarget(b); });
    $$("[data-addin]", body).forEach((b) => (b.onclick = () => newFile(b.dataset.addin)));
    $("#b-add") && ($("#b-add").onclick = () => newFolder(F.cwd));
    $$(".bcard", body).forEach((c) => { c.onclick = () => openFile(c.dataset.fid); c.oncontextmenu = (e) => { e.preventDefault(); fileMenu(c, c.dataset.fid); };
      c.ondragstart = (e) => { e.dataTransfer.setData("application/x-sanabel-file", c.dataset.fid); c.classList.add("dragging"); }; c.ondragend = () => c.classList.remove("dragging"); });
    $$("[data-dmenu]", body).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); dirMenu(b, b.dataset.dmenu); }));
  }

  // ------------------------------------------------------------------ المخطط الشجري (D3)
  function toHier(n) {
    return { name: n.name, path: n.path, type: "dir", count: n.count, node: n,
      children: [...sortDirs(n).map(toHier), ...sortFiles(n).map((f) => ({ name: baseName(f.path), path: f.path, type: "file", f }))] };
  }
  function renderTree(body, root) {
    if (!window.d3) { body.innerHTML = `<div class="fx-empty">تعذّر تحميل مكتبة المخطط</div>`; return; }
    const d3 = window.d3, start = nodeAt(root, F.cwd) || root;
    body.innerHTML = `<div class="tree-wrap"><div class="tree-hud">
        <button class="btn3d sm" id="t-exp">⊕ توسيع الكل</button><button class="btn3d sm" id="t-col">⊖ طي الكل</button><button class="btn3d sm" id="t-fit">🎯 توسيط</button>
        <button class="btn3d sm" id="t-png">🖼️ تنزيل PNG</button><button class="btn3d sm" id="t-html">🌐 تنزيل HTML تفاعلي</button>
        <span class="muted">${F.cwd ? `يعرض: <b dir="ltr">${esc(F.cwd)}</b> — ` : ""}انقر على مجلد لفتحه/طيّه وعلى ملف لتحريره · اسحب للتحريك · العجلة للتكبير</span></div>
      <div class="tree-box" id="tree-box"></div></div>`;
    const box = $("#tree-box"), W = box.clientWidth, H = box.clientHeight;
    const hroot = d3.hierarchy(toHier(start));
    hroot.descendants().forEach((d) => { d.id = d.data.path || "/"; if (d.children && d.depth > 0 && !F.treeOpen.has("T:" + d.id)) { d._children = d.children; d.children = null; } });
    hroot.x0 = 0; hroot.y0 = 0;
    const svg = d3.select(box).append("svg").attr("width", "100%").attr("height", "100%").attr("dir", "ltr").style("direction", "ltr");
    const g = svg.append("g");
    const zoom = d3.zoom().scaleExtent([0.3, 2.5]).on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom).on("dblclick.zoom", null);
    const tree = d3.tree().nodeSize([30, 250]);
    const link = d3.linkHorizontal().x((d) => d.y).y((d) => d.x);
    const gL = g.append("g").attr("class", "t-links"), gN = g.append("g");
    const tip = document.getElementById("tip");
    const color = (d) => d.data.type === "file" ? meta(d.data.f)[1] : d.depth === 0 ? "#c39a5c" : dirColor(d.data.path);
    function update(src) {
      tree(hroot);
      const nodes = hroot.descendants(), links = hroot.links(), t = svg.transition().duration(380);
      const nd = gN.selectAll("g.nd").data(nodes, (d) => d.id);
      const en = nd.enter().append("g").attr("class", (d) => `nd ${d.data.type}${d.depth === 0 ? " root" : ""}`)
        .attr("transform", `translate(${src.y0},${src.x0})`).attr("opacity", 0).style("cursor", "pointer")
        .on("click", (e, d) => { if (d.data.type === "file") return openFile(d.data.f.id); if (d.depth === 0) return; toggle(d); update(d); })
        .on("mousemove", (e, d) => { tip.innerHTML = d.data.type === "file" ? `<b dir="ltr">${esc(d.data.path)}</b><br>${meta(d.data.f)[0]} · ${fmtSize(d.data.f.size)}<br>✏️ ${esc(pname(d.data.f.updated_by))} · ${ago(d.data.f.updated_at)}<br><small>انقر للتحرير</small>`
            : `<b>📁 ${esc(d.data.name)}</b><br>${d.data.count} ملف<br><small>${d.depth ? "انقر للفتح/الطي" : ""}</small>`;
          tip.style.left = e.clientX + 14 + "px"; tip.style.top = e.clientY + 14 + "px"; tip.classList.remove("hidden"); })
        .on("mouseleave", () => tip.classList.add("hidden"));
      en.append("rect").attr("class", "pill").attr("rx", 13).attr("y", -13).attr("height", 26).attr("x", -14);
      en.append("circle").attr("r", (d) => (d.data.type === "file" ? 6 : 9)).attr("stroke-width", 2.5);
      en.append("text").attr("x", 14).attr("dy", "0.32em").text((d) => (d.data.type === "file" ? `${meta(d.data.f)[2]} ${d.data.name}` : `${d.depth ? "📁" : "🌳"} ${d.data.name}`));
      en.append("text").attr("class", "cnt").attr("dy", "0.32em");
      const all = en.merge(nd);
      all.select("circle").attr("fill", (d) => (d._children ? color(d) : "#fff")).attr("stroke", color);
      all.select("text.cnt").text((d) => (d.data.type === "dir" && d.depth ? (d._children ? ` +${d.data.count}` : "") : "")).attr("x", function () { const tx = this.parentNode.querySelector("text"); return 18 + tx.getComputedTextLength(); });
      all.each(function () { const tx = this.querySelector("text"), c = this.querySelector("text.cnt"); const w = tx.getComputedTextLength() + (c.textContent ? c.getComputedTextLength() + 8 : 0) + 34; this.querySelector("rect").setAttribute("width", w); });
      all.transition(t).attr("transform", (d) => `translate(${d.y},${d.x})`).attr("opacity", 1);
      nd.exit().transition(t).attr("transform", `translate(${src.y},${src.x})`).attr("opacity", 0).remove();
      const lk = gL.selectAll("path").data(links, (d) => d.target.id);
      lk.enter().append("path").attr("d", () => { const o = { x: src.x0, y: src.y0 }; return link({ source: o, target: o }); })
        .attr("stroke", (d) => color(d.target)).merge(lk).transition(t).attr("d", link);
      lk.exit().transition(t).attr("d", () => { const o = { x: src.x, y: src.y }; return link({ source: o, target: o }); }).remove();
      nodes.forEach((d) => { d.x0 = d.x; d.y0 = d.y; });
    }
    function toggle(d) { if (d.children) { d._children = d.children; d.children = null; F.treeOpen.delete("T:" + d.id); } else { d.children = d._children; d._children = null; F.treeOpen.add("T:" + d.id); } }
    const fit = () => { const b = g.node().getBBox(), s = Math.max(0.3, Math.min(1.4, Math.min((W - 60) / (b.width || 1), (H - 60) / (b.height || 1))));
      svg.transition().duration(450).call(zoom.transform, d3.zoomIdentity.translate(W / 2 - s * (b.x + b.width / 2), H / 2 - s * (b.y + b.height / 2)).scale(s)); };
    update(hroot);
    svg.call(zoom.transform, d3.zoomIdentity.translate(90, H / 2));
    setTimeout(fit, 420);
    $("#t-exp").onclick = () => { hroot.descendants().forEach((d) => { if (d._children) { d.children = d._children; d._children = null; F.treeOpen.add("T:" + d.id); } }); update(hroot); setTimeout(fit, 420); };
    $("#t-col").onclick = () => { hroot.descendants().forEach((d) => { if (d.depth > 0 && d.children) { d._children = d.children; d.children = null; F.treeOpen.delete("T:" + d.id); } }); update(hroot); setTimeout(fit, 420); };
    $("#t-fit").onclick = fit;
    $("#t-png").onclick = () => exportPNG(); $("#t-html").onclick = () => exportHTML();
  }

  // ------------------------------------------------------------------ النشاط
  async function renderActivity(body) {
    body.innerHTML = `<div class="empty">⏳ جارِ تحميل سجل التعديلات…</div>`;
    const vs = must(await sb.from("file_versions").select("*").eq("project_id", S.pid).order("created_at", { ascending: false }).limit(250));
    const who = F.actWho || "";
    const AL = { create: ["🟢", "أنشأ", "#16a34a"], update: ["🟡", "عدّل", "#d97706"], rename: ["🔵", "نقل/أعاد تسمية", "#2563eb"], restore: ["🟣", "استرجع نسخة من", "#7c3aed"], delete: ["🔴", "حذف", "#dc2626"] };
    const prevOf = (v, i) => vs.slice(i + 1).find((x) => x.file_id && x.file_id === v.file_id && x.action !== "rename");
    const stat = (a, b) => { if (a == null || b == null) return null; const A = String(a).split("\n"), B = String(b).split("\n"), m = new Map();
      A.forEach((l) => m.set(l, (m.get(l) || 0) + 1)); let add = 0; B.forEach((l) => { if (m.get(l)) m.set(l, m.get(l) - 1); else add++; });
      const rem = [...m.values()].reduce((x, y) => x + y, 0); return [add, rem]; };
    const people = {};
    vs.forEach((v) => { const p = (people[v.user_id] ||= { create: 0, update: 0, delete: 0, total: 0 }); p.total++; if (p[v.action] != null) p[v.action]++; else p.update++; });
    const max = Math.max(1, ...Object.values(people).map((p) => p.total));
    const list = vs.map((v, i) => ({ v, i })).filter(({ v }) => !who || v.user_id === who);
    let lastDay = "";
    body.innerHTML = `<div class="act-split">
      <aside class="card leaders"><h3>🏆 المساهمون في الملفات</h3>
        ${Object.entries(people).sort((a, b) => b[1].total - a[1].total).map(([u, p]) => `<div class="ld ${who === u ? "on" : ""}" data-who="${u}">${av(u, 34)}
          <div style="flex:1"><b>${esc(pname(u))}</b><div class="ld-bar"><i style="width:${(p.create / max) * 100}%;background:#16a34a"></i><i style="width:${(p.update / max) * 100}%;background:#f59e0b"></i><i style="width:${(p.delete / max) * 100}%;background:#dc2626"></i></div>
          <small>🟢 ${p.create} إنشاء · 🟡 ${p.update} تعديل · 🔴 ${p.delete} حذف</small></div></div>`).join("") || `<p class="muted">لا نشاط بعد</p>`}
        ${who ? `<button class="btn ghost sm" data-who="">عرض الجميع</button>` : ""}</aside>
      <section class="act-feed">${list.map(({ v, i }) => {
        const day = new Date(v.created_at).toDateString(), [ic, verb, col] = AL[v.action] || AL.update, pv = prevOf(v, i), st = v.action === "update" || v.action === "restore" ? stat(pv?.content, v.content) : null;
        const sep = day !== lastDay ? `<div class="act-day">${new Date(v.created_at).toLocaleDateString("ar-SY-u-nu-latn", { weekday: "long", day: "numeric", month: "long" })}</div>` : ""; lastDay = day;
        const alive = v.file_id && F.files.some((f) => f.id === v.file_id);
        return `${sep}<div class="act-item" style="--ac:${col}">${av(v.user_id, 34)}<div class="act-txt">
          <div><b>${esc(pname(v.user_id))}</b> ${verb} <code dir="ltr">${esc(v.action === "rename" ? v.content || v.path : v.path)}</code></div>
          <div class="row">${st ? `<span class="chip-add">+${st[0]}</span><span class="chip-rem">−${st[1]}</span>` : ""}<small class="muted">${ic} ${ago(v.created_at)} · ${fmtTime(v.created_at)}</small></div></div>
          <div class="act-btns">${alive ? `<button class="btn3d sm" data-open="${v.file_id}">👁 فتح</button>` : ""}${v.content != null && v.action !== "rename" ? `<button class="btn3d sm" data-diff="${v.id}">⇆ مقارنة</button>` : ""}</div></div>`;
      }).join("") || `<div class="empty">لا تعديلات بعد</div>`}</section></div>`;
    $$("[data-who]", body).forEach((b) => (b.onclick = () => { F.actWho = b.dataset.who; renderActivity(body); }));
    $$("[data-open]", body).forEach((b) => (b.onclick = () => openFile(b.dataset.open)));
    $$("[data-diff]", body).forEach((b) => (b.onclick = () => { const i = vs.findIndex((x) => String(x.id) === b.dataset.diff), v = vs[i], pv = prevOf(v, i);
      showDiff(`${v.path}`, pv?.content ?? "", v.content ?? "", `قبل (${pv ? fmtTime(pv.created_at) : "فارغ"})`, `بعد — ${pname(v.user_id)} (${fmtTime(v.created_at)})`, langOf(v.path)); }));
  }
  async function showDiff(path, a, b, la, lb, lang) {
    const monaco = await loadMonaco();
    openModal(`⇆ ${path}`, `<div class="diff-lbl"><span>⬅️ ${esc(la)}</span><span>${esc(lb)} ➡️</span></div><div id="diffbox" dir="ltr" style="height:65vh"></div>`, {
      wide: true, onOpen: () => {
        const de = monaco.editor.createDiffEditor($("#diffbox"), { theme: "vs-dark", automaticLayout: true, readOnly: true, renderSideBySide: innerWidth > 800 });
        const m1 = monaco.editor.createModel(a, lang), m2 = monaco.editor.createModel(b, lang); de.setModel({ original: m1, modified: m2 });
        const obs = new MutationObserver(() => { if ($("#modal").classList.contains("hidden")) { de.dispose(); m1.dispose(); m2.dispose(); obs.disconnect(); } });
        obs.observe($("#modal"), { attributes: true });
      } });
  }

  // ------------------------------------------------------------------ المحرر المنزلق
  function panelEl() {
    let p = $("#fpanel"); if (p) return p;
    p = document.createElement("div"); p.id = "fpanel"; p.className = "fpanel hidden"; document.body.appendChild(p);
    p.addEventListener("mousedown", (e) => { if (e.target === p) closePanel(); });
    return p;
  }
  async function openFile(id) {
    if (F.panel && !(await closePanel())) return;
    const r = await sb.from("files").select("*").eq("id", id).single();
    if (r.error) return fail(r.error);
    const f = r.data, ed = canEdit(), k = kindOf(f), [ln, lc, li] = meta(f), p = panelEl();
    p.innerHTML = `<div class="fp-box" style="--lc:${lc}">
      <div class="fp-head"><span class="fp-ico">${li}</span>
        <div class="fp-path" dir="ltr">${f.path.split("/").map((s, i, a) => `<span class="${i === a.length - 1 ? "last" : ""}">${esc(s)}</span>`).join("<i>/</i>")}</div>
        <span class="tag red hidden" id="fp-dirty">غير محفوظ</span><span id="fp-watch"></span><div class="spacer"></div>
        ${!f.storage_path ? `<select id="fp-lang" ${ed ? "" : "disabled"}>${Object.entries(LM).filter(([k2]) => !["image", "pdf", "model", "archive", "binary"].includes(k2)).map(([k2, v]) => `<option value="${k2}" ${k2 === (f.language || langOf(f.path)) ? "selected" : ""}>${v[0]}</option>`).join("")}</select>` : ""}
        ${ed && !f.storage_path ? `<button class="btn gold" id="fp-save" title="Ctrl+S">💾 حفظ</button>` : ""}
        <button class="btn3d sm" id="fp-hist">🕓 السجل</button><button class="btn3d sm" id="fp-dl">⬇️</button>
        ${ed ? `<button class="btn3d sm" id="fp-mv">✏️ نقل/تسمية</button><button class="btn3d sm" id="fp-del">🗑</button>` : ""}
        <button class="icon-btn fp-x" id="fp-x" title="إغلاق (Esc)">✕</button></div>
      <div class="fp-banner hidden" id="fp-banner"></div>
      <div class="fp-main"><div class="fp-editor" id="fp-editor" dir="ltr"></div><aside class="fp-hist hidden" id="fp-histbox"></aside></div>
      <div class="fp-foot"><span>${av(f.updated_by, 20)} آخر تعديل: <b>${esc(pname(f.updated_by))}</b> · ${fmtTime(f.updated_at)}</span><span id="fp-pos"></span><span>${ln} · ${fmtSize(f.size ?? (f.content || "").length)}</span>${ed ? "" : `<span class="tag gray">👁️ قراءة فقط</span>`}</div>
    </div>`;
    p.classList.remove("hidden"); document.body.classList.add("noscroll");
    const P = (F.panel = { f, editor: null, saved: f.content || "", model: null });
    track();
    if (f.storage_path) {
      const url = (await X.signed([f.storage_path]))(f.storage_path);
      $("#fp-editor").innerHTML = `<div class="fp-preview">${k === "image" ? `<img src="${url}">` : k === "pdf" ? `<iframe src="${url}"></iframe>`
        : k === "model" && /gl(b|tf)$/i.test(f.path) ? `<model-viewer src="${url}" camera-controls auto-rotate shadow-intensity="1" style="width:100%;height:100%"></model-viewer>`
        : `<div class="fx-empty">${li}<b dir="ltr">${esc(baseName(f.path))}</b><span>${fmtSize(f.size)} — لا يمكن معاينة هذا النوع</span><a class="btn gold" href="${url}" target="_blank" rel="noopener">⬇️ تنزيل الملف</a></div>`}</div>`;
    } else {
      const monaco = await loadMonaco();
      if (F.panel !== P) return;
      P.model = monaco.editor.createModel(P.saved, f.language || langOf(f.path));
      P.editor = monaco.editor.create($("#fp-editor"), { model: P.model, theme: "vs-dark", automaticLayout: true, readOnly: !ed, fontSize: 14, minimap: { enabled: innerWidth > 900 }, smoothScrolling: true, cursorSmoothCaretAnimation: "on" });
      P.editor.onDidChangeModelContent(() => $("#fp-dirty")?.classList.toggle("hidden", !dirty()));
      P.editor.onDidChangeCursorPosition((e) => { const s = $("#fp-pos"); if (s) s.textContent = `سطر ${e.position.lineNumber} · عمود ${e.position.column} · ${P.model.getLineCount()} سطر`; });
      if (ed) P.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => save().catch(fail));
      $("#fp-lang").onchange = () => monaco.editor.setModelLanguage(P.model, $("#fp-lang").value);
      P.editor.focus();
    }
    $("#fp-x").onclick = () => closePanel();
    $("#fp-save") && ($("#fp-save").onclick = () => save().catch(fail));
    $("#fp-hist").onclick = () => toggleHistory();
    $("#fp-dl").onclick = () => downloadFile(f);
    $("#fp-mv") && ($("#fp-mv").onclick = async () => { const np = await ask({ title: "نقل / إعادة تسمية", label: "المسار الكامل الجديد", value: f.path, ltr: true }); if (np && np !== f.path) { await moveFile(f, np); closePanel(true); } });
    $("#fp-del") && ($("#fp-del").onclick = async () => { if (await deleteFiles([f], `حذف ${f.path}؟`)) closePanel(true); });
    renderWatchers();
  }
  const dirty = () => F.panel?.editor && F.panel.editor.getValue() !== F.panel.saved;
  async function closePanel(force) {
    if (!F.panel) return true;
    if (!force && dirty() && !confirmBox("هناك تعديلات غير محفوظة — إغلاق دون حفظ؟")) return false;
    const P = F.panel; F.panel = null;
    try { P.editor?.dispose(); P.model?.dispose(); } catch {}
    const p = $("#fpanel"); if (p) { p.classList.add("hidden"); p.innerHTML = ""; }
    document.body.classList.remove("noscroll"); $("#tip")?.classList.add("hidden");
    track();
    return true;
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && F.panel && $("#modal").classList.contains("hidden")) closePanel(); });
  async function save() {
    const P = F.panel; if (!P?.editor || !canEdit()) return;
    const content = P.editor.getValue(), language = $("#fp-lang").value;
    if (content === P.saved && language === P.f.language) return toast("لا تغييرات");
    const at = new Date().toISOString();
    must(await sb.from("files").update(strip({ content, language, size: new Blob([content]).size, updated_by: S.me.id, updated_at: at })).eq("id", P.f.id));
    must(await sb.from("file_versions").insert({ project_id: S.pid, file_id: P.f.id, path: P.f.path, action: "update", content, user_id: S.me.id }));
    log("عدّل الملف", P.f.path);
    P.saved = content; P.f.language = language; P.f.updated_at = at; P.f.updated_by = S.me.id;
    $("#fp-dirty").classList.add("hidden"); $("#fp-banner").classList.add("hidden");
    toast("💾 تم الحفظ — ظهر التعديل لكل الفريق");
    await refresh(true);
  }
  async function toggleHistory() {
    const box = $("#fp-histbox"), P = F.panel;
    if (!box.classList.contains("hidden")) return box.classList.add("hidden");
    const vs = must(await sb.from("file_versions").select("*").eq("file_id", P.f.id).order("created_at", { ascending: false }));
    const AL = { create: "🟢 إنشاء", update: "🟡 تعديل", rename: "🔵 نقل", restore: "🟣 استرجاع", delete: "🔴 حذف" };
    box.innerHTML = `<h4>🕓 سجل الملف (${vs.length})</h4>` + vs.map((v) => `<div class="hv">${av(v.user_id, 26)}<div style="flex:1;min-width:0"><b>${AL[v.action] || v.action}</b> — ${esc(pname(v.user_id))}<br><small class="muted">${fmtTime(v.created_at)}</small></div>
      ${v.action !== "rename" && v.content != null ? `<button class="icon-btn" data-hd="${v.id}" title="مقارنة بالحالي">⇆</button>${canEdit() && P.editor ? `<button class="icon-btn" data-hr="${v.id}" title="استرجاع">↩︎</button>` : ""}` : ""}</div>`).join("");
    box.classList.remove("hidden");
    $$("[data-hd]", box).forEach((b) => (b.onclick = () => { const v = vs.find((x) => String(x.id) === b.dataset.hd);
      showDiff(P.f.path, v.content || "", P.editor ? P.editor.getValue() : "", `نسخة ${pname(v.user_id)} — ${fmtTime(v.created_at)}`, "الحالي", P.f.language || langOf(P.f.path)); }));
    $$("[data-hr]", box).forEach((b) => (b.onclick = async () => { const v = vs.find((x) => String(x.id) === b.dataset.hr);
      if (!confirmBox("استرجاع هذه النسخة؟ (تُحفظ كتعديل جديد)")) return;
      P.editor.setValue(v.content || "");
      must(await sb.from("files").update(strip({ content: v.content, size: new Blob([v.content || ""]).size, updated_by: S.me.id, updated_at: new Date().toISOString() })).eq("id", P.f.id));
      must(await sb.from("file_versions").insert({ project_id: S.pid, file_id: P.f.id, path: P.f.path, action: "restore", content: v.content, user_id: S.me.id }));
      P.saved = v.content || ""; $("#fp-dirty").classList.add("hidden"); log("استرجع نسخة سابقة من", P.f.path); toast("تم الاسترجاع"); box.classList.add("hidden"); refresh(true); }));
  }

  // ------------------------------------------------------------------ عمليات الملفات والمجلدات
  function ask({ title, label, value = "", hint = "", ltr = false, extra = "" }) {
    return new Promise((res) => {
      openModal(title, `<form class="mform"><label>${label}<input name="v" value="${esc(value)}" ${ltr ? 'dir="ltr"' : ""} required autofocus></label>${extra}
        ${hint ? `<p class="muted" style="margin-top:-4px">${hint}</p>` : ""}<div class="form-actions"><button class="btn" type="submit">موافق</button></div></form>`, {
        onSubmit: async (d) => { closeModal(); res(Object.keys(d).length > 1 ? d : String(d.v).trim().replace(/^\/+|\/+$/g, "")); },
        onOpen: (b) => { const i = b.querySelector("input"); i.focus(); const dot = i.value.lastIndexOf("."), sl = i.value.lastIndexOf("/") + 1; i.setSelectionRange(sl, dot > sl ? dot : i.value.length); },
      });
    });
  }
  async function newFile(dir) {
    const d = await ask({ title: "📄 ملف جديد", label: `اسم الملف ${dir ? `(داخل <b dir="ltr">${esc(dir)}/</b>)` : "(في جذر المشروع)"}`, value: "main.py", ltr: true,
      hint: "يمكنك كتابة مسار فرعي مثل <code dir='ltr'>utils/helpers.py</code> وستُنشأ المجلدات تلقائياً",
      extra: `<label>محتوى أولي<select name="tpl"><option value="">فارغ</option><option value="hdr">ترويسة باسم المشروع والكاتب</option></select></label>` });
    if (!d) return;
    const path = join(dir, d.v.trim());
    if (!validPath(path)) return toast("اسم غير صالح", "err");
    if (F.files.some((f) => f.path === path)) return toast("يوجد ملف بنفس المسار", "err");
    const lang = langOf(path), date = new Date().toISOString().slice(0, 10), who = pname(S.me.id), title = `${project().name} — ${baseName(path)}`;
    const CM = { python: "#", shell: "#", yaml: "#", r: "#", ruby: "#", powershell: "#", ini: ";", sql: "--", lua: "--", bat: "REM" };
    let content = "";
    if (d.tpl === "hdr") {
      if (lang === "markdown") content = `# ${title}\n\n> ${who} · ${date}\n\n`;
      else if (["html", "xml"].includes(lang)) content = `<!-- ${title}\n     ${who} · ${date} -->\n\n`;
      else if (["css", "scss"].includes(lang)) content = `/* ${title}\n   ${who} · ${date} */\n\n`;
      else if (CM[lang]) content = `${CM[lang]} ${title}\n${CM[lang]} ${who} · ${date}\n\n`;
      else if (!["json", "plaintext"].includes(lang)) content = `// ${title}\n// ${who} · ${date}\n\n`;
    }
    const row = must(await sb.from("files").insert(strip({ project_id: S.pid, path, content, language: lang, size: new Blob([content]).size, updated_by: S.me.id })).select("id").single());
    await sb.from("file_versions").insert({ project_id: S.pid, file_id: row.id, path, action: "create", content, user_id: S.me.id });
    log("أنشأ الملف", path); toast("✅ أُنشئ " + baseName(path));
    F.cwd = dirOf(path); await refresh(true); openFile(row.id);
  }
  async function newFolder(dir) {
    const name = await ask({ title: "📁 مجلد جديد", label: `اسم المجلد ${dir ? `(داخل <b dir="ltr">${esc(dir)}/</b>)` : ""}`, value: "", ltr: true, hint: "يمكن إنشاء مجلدات متداخلة دفعة واحدة: <code dir='ltr'>docs/images</code>" });
    if (!name) return;
    const path = join(dir, name);
    if (!validPath(path)) return toast("اسم غير صالح", "err");
    if (F.files.some((f) => f.path.startsWith(path + "/"))) return toast("المجلد موجود", "err");
    must(await sb.from("files").insert(strip({ project_id: S.pid, path: path + "/.keep", content: "", language: "plaintext", size: 0, updated_by: S.me.id })));
    log("أنشأ المجلد", path + "/"); toast("📁 أُنشئ المجلد"); F.cwd = path; await refresh(true);
  }
  async function moveFile(f, newPath) {
    newPath = newPath.replace(/^\/+/, "");
    if (!validPath(newPath)) return toast("مسار غير صالح", "err");
    if (newPath === f.path) return;
    if (F.files.some((x) => x.path === newPath)) return toast("يوجد ملف بنفس الاسم في الوجهة", "err");
    must(await sb.from("files").update({ path: newPath, updated_by: S.me.id, updated_at: new Date().toISOString() }).eq("id", f.id));
    await sb.from("file_versions").insert({ project_id: S.pid, file_id: f.id, path: newPath, action: "rename", content: `${f.path} → ${newPath}`, user_id: S.me.id });
    log("نقل الملف", `${f.path} → ${newPath}`); toast(`↪︎ نُقل إلى ${dirOf(newPath) || "الجذر"}`); await refresh(true);
  }
  async function renameDir(path) {
    const np = await ask({ title: "✏️ نقل / إعادة تسمية مجلد", label: "المسار الجديد للمجلد", value: path, ltr: true });
    if (!np || np === path) return;
    if (!validPath(np) || np.startsWith(path + "/")) return toast("مسار غير صالح", "err");
    const list = F.files.filter((f) => f.path.startsWith(path + "/"));
    if (F.files.some((f) => f.path.startsWith(np + "/"))) return toast("يوجد مجلد بهذا الاسم", "err");
    const prog = progress(`نقل ${list.length} ملف…`);
    for (let i = 0; i < list.length; i++) { const f = list[i], to = np + f.path.slice(path.length);
      must(await sb.from("files").update({ path: to, updated_by: S.me.id, updated_at: new Date().toISOString() }).eq("id", f.id)); prog(i + 1, list.length, to); }
    await batchInsert("file_versions", list.filter((f) => baseName(f.path) !== ".keep").map((f) => ({ project_id: S.pid, file_id: f.id, path: np + f.path.slice(path.length), action: "rename", content: `${f.path} → ${np + f.path.slice(path.length)}`, user_id: S.me.id })));
    prog(); log("نقل المجلد", `${path}/ → ${np}/`); if (F.cwd === path || F.cwd.startsWith(path + "/")) F.cwd = np + F.cwd.slice(path.length);
    toast("✅ تم"); await refresh(true);
  }
  async function deleteFiles(list, msg) {
    if (!list.length || !confirmBox(msg)) return false;
    await batchInsert("file_versions", list.filter((f) => baseName(f.path) !== ".keep").map((f) => ({ project_id: S.pid, file_id: null, path: f.path, action: "delete", content: f.content ?? null, user_id: S.me.id })));
    for (let i = 0; i < list.length; i += 100) must(await sb.from("files").delete().in("id", list.slice(i, i + 100).map((f) => f.id)));
    const blobs = list.map((f) => f.storage_path).filter(Boolean); if (blobs.length) await sb.storage.from(BUCKET).remove(blobs);
    log(list.length === 1 ? "حذف الملف" : `حذف ${list.length} ملف`, list.length === 1 ? list[0].path : dirOf(list[0].path) + "/");
    toast("🗑 تم الحذف"); await refresh(true); return true;
  }
  async function deleteDir(path) {
    const ids = F.files.filter((f) => f.path.startsWith(path + "/")).map((f) => f.id);
    const full = [];
    for (let i = 0; i < ids.length; i += 200) full.push(...must(await sb.from("files").select("id,path,content,storage_path").in("id", ids.slice(i, i + 200))));
    if (await deleteFiles(full, `حذف المجلد «${path}» وكل ما فيه (${full.filter((f) => baseName(f.path) !== ".keep").length} ملف)؟ تبقى نسخها في سجل النشاط.`) && (F.cwd === path || F.cwd.startsWith(path + "/"))) { F.cwd = dirOf(path); renderBody(); }
  }
  function dirMenu(anchor, path) {
    const ed = canEdit();
    menu(anchor, [["📂", "فتح", () => cd(path)], ["🌳", "عرضه كمخطط شجري", () => { F.cwd = path; F.view = "tree"; $$("#fx-views button").forEach((x) => x.classList.toggle("on", x.dataset.v === "tree")); renderBody(); }],
      ...(ed ? [["📄", "ملف جديد داخله", () => newFile(path)], ["📁", "مجلد فرعي جديد", () => newFolder(path)], ["✏️", "نقل / إعادة تسمية", () => renameDir(path)]] : []),
      ["⬇️", "تنزيل ZIP", () => downloadZip(path)], ...(ed ? [["🗑", "حذف المجلد", () => deleteDir(path), true]] : [])]);
  }
  function fileMenu(anchor, id) {
    const f = F.files.find((x) => x.id === id), ed = canEdit(); if (!f) return;
    menu(anchor, [["✏️", ed && !f.storage_path ? "فتح للتحرير" : "فتح", () => openFile(id)],
      ...(ed ? [["↪︎", "نقل / إعادة تسمية", async () => { const np = await ask({ title: "نقل / إعادة تسمية", label: "المسار الكامل الجديد", value: f.path, ltr: true }); if (np) moveFile(f, np); }]] : []),
      ["⬇️", "تنزيل", () => downloadFile(f)], ["📋", "نسخ المسار", () => { navigator.clipboard.writeText(f.path); toast("نُسخ المسار"); }],
      ...(ed ? [["🗑", "حذف", async () => { const full = must(await sb.from("files").select("id,path,content,storage_path").eq("id", id).single()); deleteFiles([full], `حذف ${f.path}؟`); }, true]] : [])]);
  }
  function menu(anchor, items) {
    $$(".ctx-menu").forEach((m) => m.remove());
    const m = document.createElement("div"); m.className = "ctx-menu";
    m.innerHTML = items.map(([ic, l, fn, danger], i) => fn ? `<button data-i="${i}" class="${danger ? "danger" : ""}"><span>${ic}</span>${esc(l)}</button>` : `<div class="hint">${ic} ${esc(l)}</div>`).join("");
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
    m.style.top = Math.min(innerHeight - mh - 8, r.bottom + 6) + "px";
    m.style.left = Math.max(8, Math.min(innerWidth - mw - 8, r.right - mw)) + "px";
    $$("button", m).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); m.remove(); Promise.resolve(items[b.dataset.i][2]()).catch(fail); }));
    setTimeout(() => document.addEventListener("click", function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener("click", off); } }), 0);
  }
  function pick({ multiple, dir, accept }, cb) {
    const i = Object.assign(document.createElement("input"), { type: "file", multiple: !!multiple || !!dir, accept: accept || "" });
    if (dir) i.webkitdirectory = true;
    i.onchange = () => cb(i.files); i.click();
  }
  function progress(title) {
    let el = $("#fx-prog"); if (!el) { el = document.createElement("div"); el.id = "fx-prog"; el.className = "fx-prog"; document.body.appendChild(el); }
    el.innerHTML = `<b>${esc(title)}</b><div class="pbar"><i style="width:0"></i></div><small></small>`; el.classList.remove("hidden");
    return (i, n, label) => { if (i == null) { el.classList.add("hidden"); return; } el.querySelector("i").style.width = (i / n) * 100 + "%"; el.querySelector("small").textContent = `${i}/${n} — ${label || ""}`; };
  }
  async function batchInsert(table, rows, size = 50) { for (let i = 0; i < rows.length; i += size) must(await sb.from(table).insert(rows.slice(i, i + size))); }

  // ------------------------------------------------------------------ الرفع (ملفات / مجلدات / ZIP / سحب وإفلات)
  async function classify(blob, name) {
    const ext = extOf(name);
    if (TEXT_EXT.has(ext) && blob.size <= MAX_TEXT) return "text";
    if (blob.size > MAX_TEXT) return "bin";
    const head = new Uint8Array(await blob.slice(0, 8000).arrayBuffer());
    return head.includes(0) ? "bin" : "text";
  }
  async function importFiles(items, label) {
    items = items.map((it) => ({ ...it, path: it.path.replace(/\\/g, "/").replace(/^\/+/, "") })).filter((it) => it.path && !JUNK.test(it.path) && validPath(it.path));
    if (!items.length) return toast("لا ملفات صالحة للرفع", "err");
    const existing = new Map(F.files.map((f) => [f.path, f]));
    const clash = items.filter((it) => existing.has(it.path));
    if (clash.length && !confirmBox(`يوجد ${clash.length} ملف بنفس المسار (مثل ${clash[0].path}).\nاستبدالها بالنسخ الجديدة؟ (تبقى القديمة في السجل)`)) items = items.filter((it) => !existing.has(it.path));
    const prog = progress(`⬆️ رفع ${items.length} ملف…`);
    const fresh = [], skipped = [];
    let done = 0;
    for (const it of items) {
      const type = await classify(it.file, it.path);
      const row = { project_id: S.pid, path: it.path, language: langOf(it.path), updated_by: S.me.id, updated_at: new Date().toISOString() };
      if (type === "text") { row.content = await it.file.text(); row.size = new Blob([row.content]).size; row.storage_path = null; }
      else {
        if (legacy()) { skipped.push(it.path + " (شغّل schema.sql المحدّث لرفع الملفات الثنائية)"); prog(++done, items.length, it.path); continue; }
        if (it.file.size > MAX_BIN) { skipped.push(it.path + " (أكبر من 25MB)"); prog(++done, items.length, it.path); continue; }
        const sp = `${S.pid}/code/${Date.now()}_${done}_${X.safeName(baseName(it.path))}`;
        must(await sb.storage.from(BUCKET).upload(sp, it.file, { contentType: it.file.type || "application/octet-stream" }));
        Object.assign(row, { content: null, storage_path: sp, size: it.file.size, mime: it.file.type || null, language: "plaintext" });
      }
      const ex = existing.get(it.path);
      if (ex) {
        must(await sb.from("files").update(strip({ ...row })).eq("id", ex.id));
        if (ex.storage_path && ex.storage_path !== row.storage_path) await sb.storage.from(BUCKET).remove([ex.storage_path]);
        await sb.from("file_versions").insert({ project_id: S.pid, file_id: ex.id, path: it.path, action: "update", content: row.content, user_id: S.me.id });
      } else fresh.push(strip(row));
      prog(++done, items.length, it.path);
    }
    for (let i = 0; i < fresh.length; i += 40) {
      const ins = must(await sb.from("files").insert(fresh.slice(i, i + 40)).select("id,path,content"));
      await batchInsert("file_versions", ins.map((r) => ({ project_id: S.pid, file_id: r.id, path: r.path, action: "create", content: r.content ?? null, user_id: S.me.id })));
    }
    prog();
    const n = items.length - skipped.length;
    log(`رفع ${n} ملف (${label})`, F.cwd ? F.cwd + "/" : "الجذر");
    toast(`✅ رُفع ${n} ملف${skipped.length ? ` · تُخطّي ${skipped.length}` : ""}`);
    if (skipped.length) setTimeout(() => toast("تُخطّي: " + skipped.slice(0, 3).join("، ") + (skipped.length > 3 ? "…" : ""), "err"), 600);
    await refresh(true);
  }
  async function importZip(file) {
    if (!window.JSZip) return toast("مكتبة ZIP غير محمّلة", "err");
    const prog = progress("📦 فك ضغط " + file.name + "…"); prog(0, 1, "");
    let zip; try { zip = await JSZip.loadAsync(file); } catch { prog(); return toast("الملف ليس ZIP صالحاً", "err"); }
    const entries = Object.values(zip.files).filter((e) => !e.dir && !JUNK.test(e.name));
    const items = [];
    for (let i = 0; i < entries.length; i++) { const e = entries[i]; items.push({ path: join(F.cwd, e.name), file: new File([await e.async("blob")], baseName(e.name)) }); prog(i + 1, entries.length, e.name); }
    prog();
    const dirs = new Set([...Object.values(zip.files)].filter((e) => e.dir && !JUNK.test(e.name)).map((e) => join(F.cwd, e.name)));
    items.forEach((it) => { let d = dirOf(it.path); while (d) { dirs.delete(d); d = dirOf(d); } });
    if (!items.length && !dirs.size) return toast("الأرشيف فارغ", "err");
    if (!confirmBox(`فك ضغط «${file.name}»: ${items.length} ملف${dirs.size ? ` و${dirs.size} مجلد فارغ` : ""}\nإلى: ${F.cwd || "جذر المشروع"} — مع الحفاظ على ترتيب المجلدات. متابعة؟`)) return;
    for (const d of dirs) if (!F.files.some((f) => f.path.startsWith(d + "/"))) await sb.from("files").insert(strip({ project_id: S.pid, path: d + "/.keep", content: "", language: "plaintext", size: 0, updated_by: S.me.id }));
    if (items.length) await importFiles(items, "ZIP: " + file.name); else refresh(true);
  }
  function readEntry(entry, prefix) {
    return new Promise((res) => {
      if (entry.isFile) entry.file((f) => res([{ path: prefix + entry.name, file: f }]), () => res([]));
      else if (entry.isDirectory) {
        const rd = entry.createReader(), all = [];
        const more = () => rd.readEntries(async (ents) => {
          if (!ents.length) { const sub = await Promise.all(all.map((e) => readEntry(e, prefix + entry.name + "/"))); const flat = sub.flat(); res(flat.length ? flat : [{ path: prefix + entry.name + "/.keep", file: new File([""], ".keep"), keep: true }]); }
          else { all.push(...ents); more(); }
        }, () => res([]));
        more();
      } else res([]);
    });
  }
  function setupDrop() {
    const root = $("#fx-root"), ov = $("#fx-drop"); if (!root || !canEdit()) return;
    let depth = 0;
    const isExt = (e) => e.dataTransfer && [...e.dataTransfer.types].includes("Files") && ![...e.dataTransfer.types].includes("application/x-sanabel-file");
    root.addEventListener("dragenter", (e) => { if (!isExt(e)) return; e.preventDefault(); depth++; $("#fx-drop-to").textContent = "إلى: " + (F.cwd || "جذر المشروع"); ov.classList.remove("hidden"); });
    root.addEventListener("dragover", (e) => { if (isExt(e)) e.preventDefault(); });
    root.addEventListener("dragleave", (e) => { if (!isExt(e)) return; if (--depth <= 0) { depth = 0; ov.classList.add("hidden"); } });
    root.addEventListener("drop", async (e) => {
      if (!isExt(e)) return; e.preventDefault(); depth = 0; ov.classList.add("hidden");
      const entries = [...e.dataTransfer.items].map((i) => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
      let list = entries.length ? (await Promise.all(entries.map((en) => readEntry(en, "")))).flat() : [...e.dataTransfer.files].map((f) => ({ path: f.name, file: f }));
      const zips = list.filter((x) => /\.zip$/i.test(x.path) && !x.path.includes("/"));
      if (zips.length === 1 && list.length === 1 && confirmBox(`فك ضغط «${zips[0].path}» داخل المشروع؟\n(إلغاء = رفعه كملف ZIP كما هو)`)) return importZip(zips[0].file);
      const keeps = list.filter((x) => x.keep); list = list.filter((x) => !x.keep);
      for (const k of keeps) { const p = join(F.cwd, k.path); if (!F.files.some((f) => f.path.startsWith(dirOf(p) + "/"))) await sb.from("files").insert(strip({ project_id: S.pid, path: p, content: "", language: "plaintext", size: 0, updated_by: S.me.id })); }
      const folders = entries.filter((en) => en.isDirectory).length;
      if (list.length) importFiles(list.map((x) => ({ path: join(F.cwd, x.path), file: x.file })), folders ? `${folders} مجلد بالسحب` : "سحب وإفلات"); else refresh(true);
    });
  }

  // ------------------------------------------------------------------ التنزيل والتصدير
  async function fileBlob(f) {
    if (f.storage_path) { const u = (await X.signed([f.storage_path]))(f.storage_path); return await (await fetch(u)).blob(); }
    const c = f.content ?? must(await sb.from("files").select("content").eq("id", f.id).single()).content;
    return new Blob([c || ""], { type: "text/plain;charset=utf-8" });
  }
  const dlName = (n) => { const a = String(n || "").normalize("NFKD").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 60); return a || "project"; };
  const saveBlob = (blob, name) => { const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
  async function downloadFile(f) { try { saveBlob(await fileBlob(f), baseName(f.path)); } catch (e) { fail(e); } }
  async function downloadZip(prefix) {
    const list = F.files.filter((f) => !prefix || f.path.startsWith(prefix + "/"));
    if (!list.length) return toast("لا ملفات", "err");
    const prog = progress("📦 تجهيز ZIP…"), zip = new JSZip();
    for (let i = 0; i < list.length; i += 200) {
      const chunk = must(await sb.from("files").select(legacy() ? "id,path,content" : "id,path,content,storage_path").in("id", list.slice(i, i + 200).map((f) => f.id)));
      for (const f of chunk) { const rel = prefix ? baseName(prefix) + f.path.slice(prefix.length) : f.path;
        if (baseName(f.path) === ".keep") zip.folder(dirOf(rel)); else zip.file(rel, f.storage_path ? await fileBlob(f) : f.content || "");
        prog(Math.min(list.length, zip.file(/.*/).length), list.length, f.path); }
    }
    prog();
    saveBlob(await zip.generateAsync({ type: "blob" }), `sanabel_${dlName(prefix ? baseName(prefix) : project().name)}_${new Date().toISOString().slice(0, 10)}.zip`);
  }
  let logoData;
  async function logo() { if (logoData) return logoData; try { const b = await (await fetch("assets/logo.png")).blob(); logoData = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); } catch { logoData = ""; } return logoData; }
  async function staticSVG() {
    const d3 = window.d3, root = buildTree(), start = nodeAt(root, F.cwd) || root;
    const h = d3.hierarchy(toHier(start)); d3.tree().nodeSize([30, 300])(h);
    const nodes = h.descendants(), xs = nodes.map((d) => d.x), ys = nodes.map((d) => d.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), maxY = Math.max(...ys);
    const HEAD = 150, M = 50, W = Math.max(1200, maxY + 560), H = HEAD + (maxX - minX) + 2 * M + 90;
    const ox = M + 30, oy = HEAD + M - minX;
    const link = d3.linkHorizontal().x((d) => d.y + ox).y((d) => d.x + oy);
    const col = (d) => d.data.type === "file" ? meta(d.data.f)[1] : d.depth === 0 ? "#c39a5c" : dirColor(d.data.path);
    const used = {}; nodes.forEach((d) => { if (d.data.type === "file") { const k = kindOf(d.data.f); used[k] = (used[k] || 0) + 1; } });
    const lg = await logo(), p = project(), date = new Date().toLocaleDateString("ar-SY-u-nu-latn", { year: "numeric", month: "long", day: "numeric" });
    const font = "Tajawal, 'Segoe UI', Tahoma, Arial, sans-serif";
    const cv = document.createElement("canvas").getContext("2d");
    const tw = (t, size = 13, weight = 500) => { cv.font = `${weight} ${size}px ${font}`; return cv.measureText(t).width; };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${font}">
      <defs><pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#e3d6c3"/></pattern>
        <linearGradient id="hg" x1="0" x2="1"><stop offset="0" stop-color="#16372a"/><stop offset="1" stop-color="#2a6049"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="#fffaf5"/><rect y="${HEAD}" width="100%" height="${H - HEAD}" fill="url(#dots)"/>
      <rect width="100%" height="${HEAD - 20}" fill="url(#hg)"/><rect y="${HEAD - 24}" width="100%" height="4" fill="#c39a5c"/>
      ${lg ? `<image href="${lg}" xlink:href="${lg}" x="${W - 140}" y="8" width="112" height="112"/>` : ""}
      <text x="${W - 160}" y="58" text-anchor="end" fill="#fff" font-size="30" font-weight="800" direction="ltr" unicode-bidi="plaintext">مخطط ملفات المشروع: ${esc(p.name)}${F.cwd ? ` — ${esc(F.cwd)}` : ""}</text>
      <text x="${W - 160}" y="94" text-anchor="end" fill="#d8b57f" font-size="18" direction="ltr" unicode-bidi="plaintext">أكاديمية سنابل التقنية · ${date} · ${start.count} ملف · ${countDirs(start)} مجلد · ${fmtSize(start.size)}</text>
      <g fill="none" stroke-width="2" stroke-opacity=".75">${h.links().map((l) => `<path d="${link(l)}" stroke="${col(l.target)}"/>`).join("")}</g>
      ${nodes.map((d) => { const x = d.y + ox, y = d.x + oy, lbl = d.data.type === "file" ? `${meta(d.data.f)[2]} ${d.data.name}` : `${d.depth ? "📁" : "🌳"} ${d.data.name}${d.data.type === "dir" && d.depth ? `  (${d.data.count})` : ""}`;
        const w = Math.ceil(tw(lbl, d.depth === 0 ? 15 : 13, d.data.type === "dir" ? 700 : 500)) + 26;
        return `<g transform="translate(${x},${y})"><rect x="-12" y="-12" rx="12" width="${w + 18}" height="24" fill="${d.data.type === "file" ? "#fff" : "#f4ede4"}" stroke="${col(d)}" stroke-opacity=".35"/>
          <circle r="${d.data.type === "file" ? 5.5 : 8}" fill="${d.data.type === "file" ? col(d) : "#fff"}" stroke="${col(d)}" stroke-width="2.5"/>
          <text x="13" dy="0.34em" font-size="${d.depth === 0 ? 15 : 13}" font-weight="${d.data.type === "dir" ? 700 : 500}" fill="#1d2a24" direction="ltr" unicode-bidi="plaintext">${esc(lbl)}</text>
          ${d.data.type === "file" && d.data.f.updated_by ? `<text x="${w + 14}" dy="0.34em" font-size="11" fill="#8a7d6b" direction="ltr" text-anchor="start" unicode-bidi="plaintext">✏️ ${esc(pname(d.data.f.updated_by))}</text>` : ""}</g>`; }).join("")}
      <g transform="translate(${M},${H - 50})">${Object.entries(used).sort((a, b) => b[1] - a[1]).map(([k, n], i) => `<g transform="translate(${i * 150},0)"><circle r="7" fill="${(LM[k] || LM.plaintext)[1]}"/><text x="14" dy="0.35em" font-size="14" fill="#1d2a24" direction="ltr" unicode-bidi="plaintext">${(LM[k] || LM.plaintext)[0]} (${n})</text></g>`).join("")}</g>
    </svg>`;
    return { svg, W, H, name: dlName(p.name) };
  }
  async function exportPNG() {
    if (!window.d3) return toast("مكتبة المخطط غير محمّلة", "err");
    toast("🖼️ جارِ تجهيز الصورة…");
    const { svg, W, H, name } = await staticSVG();
    const img = new Image();
    img.onload = () => {
      const scale = Math.max(0.5, Math.min(2, 16000 / W, 16000 / H, Math.sqrt(220e6 / (W * H))));
      const c = Object.assign(document.createElement("canvas"), { width: Math.round(W * scale), height: Math.round(H * scale) });
      const g = c.getContext("2d"); g.scale(scale, scale); g.drawImage(img, 0, 0);
      c.toBlob((b) => (b ? saveBlob(b, `sanabel-tree_${name}_${new Date().toISOString().slice(0, 10)}.png`) : toast("المخطط كبير جداً للصورة — استخدم HTML", "err")), "image/png");
    };
    img.onerror = () => toast("تعذّر إنشاء الصورة", "err");
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  async function exportHTML() {
    if (!window.d3) return toast("مكتبة المخطط غير محمّلة", "err");
    const { svg, name } = await staticSVG(), root = buildTree(), start = nodeAt(root, F.cwd) || root, lg = await logo(), p = project();
    const li = (n) => `<details ${n.path.split("/").length < 2 ? "open" : ""}><summary><b>📁 ${esc(n.name)}</b> <small>${n.count} ملف · ${fmtSize(n.size)}</small></summary><ul>
      ${sortDirs(n).map((d) => `<li>${li(d)}</li>`).join("")}${sortFiles(n).map((f) => `<li class="f" data-q="${esc(f.path.toLowerCase())}"><span style="color:${meta(f)[1]}">●</span> ${meta(f)[2]} <span dir="ltr">${esc(baseName(f.path))}</span> <small>${meta(f)[0]} · ${fmtSize(f.size)} · ✏️ ${esc(pname(f.updated_by))} · ${fmtTime(f.updated_at)}</small></li>`).join("")}</ul></details>`;
    const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>مخطط ملفات — ${esc(p.name)}</title>
<style>body{margin:0;font-family:Tajawal,'Segoe UI',Tahoma,sans-serif;background:#f5ece5;color:#1d2a24}header{display:flex;gap:16px;align-items:center;background:linear-gradient(90deg,#16372a,#2a6049);color:#fff;padding:14px 22px;border-bottom:4px solid #c39a5c}
header img{width:70px}h1{margin:0;font-size:22px}header p{margin:4px 0 0;color:#d8b57f}.tabs{display:flex;gap:8px;padding:12px 22px}.tabs button{font:inherit;font-weight:700;border:0;border-radius:10px;padding:8px 16px;cursor:pointer;background:#fff;color:#1e4a38;box-shadow:0 3px 0 #e2d6c7}
.tabs button.on{background:#c39a5c;color:#fff;box-shadow:0 3px 0 #8a6430}#vp{height:calc(100vh - 170px);margin:0 22px 22px;background:#fff;border-radius:16px;overflow:hidden;cursor:grab;border:1px solid #e6dccf;position:relative}
#vp svg{transform-origin:0 0;position:absolute}#vp .hint{position:absolute;bottom:10px;right:12px;background:rgba(22,55,42,.85);color:#fff;padding:5px 10px;border-radius:8px;font-size:12px;z-index:2}
#list{margin:0 22px 22px;background:#fff;border-radius:16px;padding:16px;border:1px solid #e6dccf}#q{font:inherit;width:100%;max-width:420px;padding:9px 12px;border-radius:10px;border:1px solid #e6dccf;margin-bottom:10px}
ul{list-style:none;padding-inline-start:22px;margin:4px 0;border-inline-start:2px dashed #e3d6c3}summary{cursor:pointer;padding:4px 6px;border-radius:8px}summary:hover{background:#f4ede4}li.f{padding:3px 6px;border-radius:6px}li.f:hover{background:#fbf6f0}small{color:#8a7d6b}.hide{display:none}
.btns{display:flex;gap:6px;margin-bottom:8px}.btns button{font:inherit;border:1px solid #e6dccf;background:#fff;border-radius:8px;padding:4px 10px;cursor:pointer}</style></head><body>
<header>${lg ? `<img src="${lg}">` : ""}<div><h1>مخطط ملفات المشروع: ${esc(p.name)}${F.cwd ? ` — <span dir="ltr">${esc(F.cwd)}</span>` : ""}</h1><p>أكاديمية سنابل التقنية · ${start.count} ملف · ${fmtSize(start.size)} · ${new Date().toLocaleString("ar-SY-u-nu-latn")}</p></div></header>
<div class="tabs"><button class="on" data-t="vp">🌳 المخطط الشجري</button><button data-t="list">📂 القائمة التفاعلية</button></div>
<div id="vp"><div class="hint">🖱️ اسحب للتحريك · العجلة للتكبير · نقرتان لإعادة الضبط</div>${svg}</div>
<div id="list" hidden><input id="q" placeholder="🔍 ابحث عن ملف…"><div class="btns"><button id="ea">⊕ فتح الكل</button><button id="ca">⊖ طي الكل</button></div>${li(start)}</div>
<script>
const vp=document.getElementById('vp'),s=vp.querySelector('svg');let k=1,x=0,y=0,drag=null;const ap=()=>s.style.transform='translate('+x+'px,'+y+'px) scale('+k+')';
const fit=()=>{const w=s.width.baseVal.value,h=s.height.baseVal.value;k=Math.min(1,vp.clientWidth/w,vp.clientHeight/h);x=(vp.clientWidth-w*k)/2;y=10;ap()};fit();
vp.onwheel=e=>{e.preventDefault();const r=vp.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,nk=Math.max(.15,Math.min(4,k*(e.deltaY<0?1.12:.89)));x=mx-(mx-x)*nk/k;y=my-(my-y)*nk/k;k=nk;ap()};
vp.onpointerdown=e=>{drag=[e.clientX-x,e.clientY-y];vp.style.cursor='grabbing'};onpointerup=()=>{drag=null;vp.style.cursor='grab'};onpointermove=e=>{if(drag){x=e.clientX-drag[0];y=e.clientY-drag[1];ap()}};vp.ondblclick=fit;
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(z=>z.classList.toggle('on',z===b));vp.hidden=b.dataset.t!=='vp';document.getElementById('list').hidden=b.dataset.t!=='list'});
q.oninput=()=>{const v=q.value.toLowerCase();document.querySelectorAll('li.f').forEach(l=>l.classList.toggle('hide',v&&!l.dataset.q.includes(v)));if(v)document.querySelectorAll('details').forEach(d=>d.open=true)};
ea.onclick=()=>document.querySelectorAll('details').forEach(d=>d.open=true);ca.onclick=()=>document.querySelectorAll('details').forEach((d,i)=>d.open=i===0);
<\/script></body></html>`;
    saveBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `sanabel-tree_${name}_${new Date().toISOString().slice(0, 10)}.html`);
  }

  // ------------------------------------------------------------------ اللحظية: تغييرات الآخرين + الحضور
  function setupRealtime() {
    if (F.channel) { sb.removeChannel(F.channel); F.channel = null; }
    clearInterval(F.poll);
    const ch = sb.channel("files-" + S.pid, { config: { presence: { key: S.me.id } } });
    ch.on("postgres_changes", { event: "*", schema: "public", table: "files", filter: `project_id=eq.${S.pid}` }, (pl) => remote(pl.new && pl.new.id ? pl.new : null, pl.eventType));
    ch.on?.("presence", { event: "sync" }, () => {
      const st = ch.presenceState ? ch.presenceState() : {}; F.presence = {}; F.online = [];
      Object.values(st).flat().forEach((m) => { if (!F.online.includes(m.uid)) F.online.push(m.uid); if (m.file) (F.presence[m.file] ||= []).push(m.uid); });
      renderOnline(); renderWatchers();
      $$(".fcard.file").forEach((c) => { const f = F.files.find((x) => x.id === c.dataset.fid); if (!f) return; const w = (F.presence[f.path] || []).filter((u) => u !== S.me.id); c.classList.toggle("watched", !!w.length); });
    });
    ch.subscribe((status) => { if (status === "SUBSCRIBED") track(); });
    F.channel = ch;
    F.poll = setInterval(async () => { if (S.view !== "files" || document.hidden) return; const before = F.sig; await loadFiles(); if (F.sig !== before) renderBody(); }, 30000);
    S.cleanup.push(() => { if (F.channel) sb.removeChannel(F.channel); F.channel = null; clearInterval(F.poll); closePanel(true); $$(".ctx-menu").forEach((m) => m.remove()); });
  }
  function track() { try { F.channel?.track?.({ uid: S.me.id, file: F.panel?.f.path || null, dir: F.cwd, at: Date.now() }); } catch {} }
  function renderOnline() {
    const el = $("#fx-online"); if (!el) return;
    const others = F.online.filter((u) => u !== S.me.id);
    el.innerHTML = others.length ? `<span class="on-dot"></span><small>متصل الآن:</small>${others.slice(0, 5).map((u) => av(u, 28)).join("")}` : "";
  }
  function renderWatchers() {
    const el = $("#fp-watch"); if (!el || !F.panel) return;
    const w = (F.presence[F.panel.f.path] || []).filter((u) => u !== S.me.id);
    el.innerHTML = w.length ? `<span class="watching">👀 يفتحه الآن: ${w.map((u) => av(u, 22) + " " + esc(pname(u))).join("، ")}</span>` : "";
  }
  let rT;
  async function remote(row, type) {
    if (row && row.updated_by && row.updated_by !== S.me.id) {
      const verb = type === "INSERT" ? "أضاف" : "عدّل";
      if (baseName(row.path || "") !== ".keep") toast(`✏️ ${pname(row.updated_by)} ${verb} ${row.path}`);
      const P = F.panel;
      if (P && P.f.id === row.id && P.editor && row.updated_at !== P.f.updated_at) {
        const b = $("#fp-banner");
        b.innerHTML = `✏️ <b>${esc(pname(row.updated_by))}</b> عدّل هذا الملف الآن. <button class="btn sm" id="fb-load">⬇️ تحميل نسخته</button><button class="btn ghost sm" id="fb-diff">⇆ مقارنة</button>`;
        b.classList.remove("hidden");
        const fresh = async () => must(await sb.from("files").select("*").eq("id", row.id).single());
        $("#fb-load").onclick = async () => { if (dirty() && !confirmBox("ستفقد تعديلاتك غير المحفوظة. متابعة؟")) return; const f = await fresh(); P.saved = f.content || ""; P.f = f; P.editor.setValue(P.saved); b.classList.add("hidden"); };
        $("#fb-diff").onclick = async () => { const f = await fresh(); showDiff(f.path, P.editor.getValue(), f.content || "", "نسختك الحالية", `نسخة ${pname(f.updated_by)}`, f.language || langOf(f.path)); };
        if (!dirty()) { const f = await fresh(); P.saved = f.content || ""; P.f = f; P.editor.setValue(P.saved); b.innerHTML = `🔄 حُدّث الملف تلقائياً بتعديلات <b>${esc(pname(row.updated_by))}</b>`; setTimeout(() => b.classList.add("hidden"), 5000); }
      }
    }
    clearTimeout(rT); rT = setTimeout(() => refresh(), 700);
  }
  async function refresh(force) {
    if (S.view !== "files") return;
    const before = F.sig; await loadFiles();
    if (force || F.sig !== before) renderBody();
  }

  return { view, openFile };
}
