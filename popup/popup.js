// LearnFlow Popup v4 — Groq Only (Simplified)

/* ── Groq Provider Config ─────────────────────────────── */
const PROVIDER = {
  id: "groq",
  name: "Groq",
  emoji: "⚡",
  keyUrl: "https://console.groq.com/keys",
  placeholder: "gsk_…",
  keyLabel: "Groq API Key",
  // Best model automatically selected
  model: "llama-3.3-70b-versatile",
  modelLabel: "Llama 3.3 70B (fastest & smartest)",
};

const QUICK_ACTIONS = {
  summarize: "Summarize this page comprehensively — main thesis, key points, evidence, and conclusions.",
  keypoints: "List the 7 most important key points from this page with brief explanations for each.",
  simplify:  "Explain the main content of this page in simple, plain language that anyone can understand.",
  critique:  "Critically analyze this content: main arguments, evidence quality, logical consistency, potential bias, credibility, and what's missing.",
  data:      "What are the most important facts, statistics, numbers, and data points mentioned on this page?",
  translate: "Translate the main content to English. If already in English, translate to French.",
  solve:     "Solve this problem step-by-step. Show your reasoning clearly, explain each step, and provide the final answer with verification.",
};

const FORMAT_ICONS = { txt:"📄",md:"📝",html:"🌐",csv:"📊",json:"📋",js:"⚙️",py:"🐍",xml:"🏷",yaml:"📐",sql:"🗄",css:"🎨",zip:"🗜" };
const MIME = { txt:"text/plain",md:"text/markdown",html:"text/html",csv:"text/csv",json:"application/json",js:"text/javascript",py:"text/x-python",xml:"application/xml",yaml:"text/yaml",sql:"text/plain",css:"text/css",zip:"application/zip" };

/* ── State ────────────────────────────────────────────── */
let settings = { apiKey:"", includeContext:true, selectionSidebar:true, autoSummarize:false, deepThink:false };
let history = [], currentResponse = "", currentTheme = "dark", selectedFormat = "txt", generatedFiles = [];

/* ── Init ─────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  await load();
  applyTheme(currentTheme);
  renderHistory();
  renderGenFiles();
  updateStatus();
  setupListeners();
  updateDeepThinkUI();
});

/* ── Load / Save ──────────────────────────────────────── */
async function load() {
  const data = await chrome.storage.local.get(["settings","history","theme","genFiles"]);
  if (data.settings) settings = { ...settings, ...data.settings };
  if (data.history)  history  = data.history;
  if (data.theme)    currentTheme = data.theme;
  if (data.genFiles) generatedFiles = data.genFiles;

  setToggle("toggleContext",   settings.includeContext);
  setToggle("toggleSelection", settings.selectionSidebar);
  setToggle("toggleAutoSumm",  settings.autoSummarize);
  setToggle("toggleDeepThink", settings.deepThink || false);
}

async function save() {
  settings.includeContext   = getToggle("toggleContext");
  settings.selectionSidebar = getToggle("toggleSelection");
  settings.autoSummarize    = getToggle("toggleAutoSumm");
  settings.deepThink        = getToggle("toggleDeepThink");
  await chrome.storage.local.set({ settings });
}

/* ── Theme ────────────────────────────────────────────── */
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = t === "dark" ? "☀" : "☾";
}

/* ── Deep Think UI ────────────────────────────────────── */
function updateDeepThinkUI() {
  const isDeep = settings.deepThink;
  const btn = document.getElementById("deepThinkBtn");
  const badge = document.getElementById("deepThinkBadge");
  if (btn) {
    btn.classList.toggle("active", isDeep);
    btn.title = isDeep ? "Deep Think ON — click to disable" : "Enable Deep Think (slower, more detailed)";
  }
  if (badge) badge.style.display = isDeep ? "inline-flex" : "none";
}

/* ── Tabs ─────────────────────────────────────────────── */
function switchToSettings() {
  document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.querySelector(".tab[data-tab='settings']").classList.add("active");
  document.getElementById("panel-settings").classList.add("active");
}

/* ── Listeners ────────────────────────────────────────── */
function setupListeners() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
    });
  });

  document.getElementById("themeToggle").addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(currentTheme);
    chrome.storage.local.set({ theme: currentTheme });
  });

  // Deep Think toggle button
  document.getElementById("deepThinkBtn").addEventListener("click", () => {
    settings.deepThink = !settings.deepThink;
    setToggle("toggleDeepThink", settings.deepThink);
    updateDeepThinkUI();
    save();
  });

  document.getElementById("providerBadge").addEventListener("click", switchToSettings);
  document.getElementById("sendBtn").addEventListener("click", handleAsk);
  document.getElementById("questionInput").addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  });

  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const a = chip.dataset.action;
      if (a === "sidebar") { openSidebar(); return; }
      if (QUICK_ACTIONS[a]) { document.getElementById("questionInput").value = QUICK_ACTIONS[a]; handleAsk(); }
    });
  });

  document.getElementById("openSidebarBtn").addEventListener("click", openSidebar);

  document.getElementById("copyBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(currentResponse);
    document.getElementById("copyBtn").textContent = "✓";
    setTimeout(() => document.getElementById("copyBtn").textContent = "copy", 1500);
  });
  document.getElementById("saveRespBtn").addEventListener("click", () => {
    if (currentResponse) downloadText(currentResponse, "learnflow-response.txt", "text/plain");
  });

  ["toggleContext","toggleSelection","toggleAutoSumm","toggleDeepThink"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", () => {
      document.getElementById(id).classList.toggle("on");
      save();
      if (id === "toggleDeepThink") {
        settings.deepThink = getToggle("toggleDeepThink");
        updateDeepThinkUI();
      }
    });
  });

  // API Key save
  document.getElementById("apiKeySaveBtn").addEventListener("click", saveApiKey);
  document.getElementById("apiKeyInput").addEventListener("keydown", e => { if (e.key === "Enter") saveApiKey(); });
}

/* ── API Key Management ───────────────────────────────── */
function saveApiKey() {
  const key = document.getElementById("apiKeyInput").value.trim();
  if (!key) return;
  settings.apiKey = key;
  save();
  const status = document.getElementById("apiKeyStatus");
  status.textContent = "✓ Key saved and ready";
  status.className = "key-status ok";
  updateStatus();
}

function updateStatus() {
  const dot = document.getElementById("statusDot");
  const txt = document.getElementById("statusText");
  const badgeEmoji = document.getElementById("badgeEmoji");
  const badgeText = document.getElementById("badgeText");
  const hasKey = !!settings.apiKey;
  
  if (badgeEmoji) badgeEmoji.textContent = PROVIDER.emoji;
  if (badgeText) {
    badgeText.textContent = hasKey
      ? PROVIDER.name + " · " + PROVIDER.modelLabel
      : PROVIDER.name + " — add API key →";
  }
  
  if (dot && txt) {
    if (hasKey) {
      dot.classList.add("on");
      txt.textContent = PROVIDER.name + " · ready" + (settings.deepThink ? " · 🧠 Deep Think" : "");
    } else {
      dot.classList.remove("on");
      txt.textContent = PROVIDER.name + " — no key";
    }
  }
  
  // Pre-fill key input if exists
  const keyInput = document.getElementById("apiKeyInput");
  if (keyInput && settings.apiKey) keyInput.value = settings.apiKey;
}

/* ── Groq API Call ────────────────────────────────────── */
async function callGroq(messages, systemPrompt, isDeepThink = false) {
  const key = settings.apiKey;
  if (!key) throw new Error("No Groq API key — go to Settings and add your key.");
  
  const msgs = systemPrompt ? [{ role:"system", content:systemPrompt }, ...messages] : messages;
  const model = PROVIDER.model;
  
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":"Bearer " + key},
    body:JSON.stringify({
      model,
      max_tokens: isDeepThink ? 4096 : 2048,
      temperature: isDeepThink ? 0.7 : 0.5,
      messages: msgs
    })
  });
  
  if (!resp.ok) {
    const e = await resp.json().catch(()=>({}));
    const errorMsg = e.error?.message || "HTTP " + resp.status;
    
    if (resp.status === 401 || resp.status === 403) {
      throw new Error("Invalid Groq API key — please check your key in Settings.");
    }
    if (resp.status === 429) {
      throw new Error("Rate limit — Groq API is busy. Wait a moment and try again.");
    }
    if (resp.status === 402) {
      throw new Error("Insufficient credits — your Groq account has run out of credits.");
    }
    throw new Error(errorMsg);
  }
  
  return (await resp.json()).choices?.[0]?.message?.content || "";
}

/* ── Error Helper ─────────────────────────────────────── */
function friendlyError(err) {
  const msg = (err.message || "").toLowerCase();
  
  if (msg.includes("invalid api key") || msg.includes("unauthorized") || msg.includes("401") || msg.includes("403"))
    return "❌ **Invalid Groq API Key** — the key was rejected.\n\n💡 Get your key: https://console.groq.com/keys\n\n📝 Keys start with `gsk_…`\n\nGo to Settings and re-enter your key.";
  if (msg.includes("rate limit") || msg.includes("429"))
    return "❌ **Rate Limit** — Groq API is busy.\n\n💡 Wait ~30 seconds and try again.";
  if (msg.includes("insufficient") || msg.includes("credits") || msg.includes("402"))
    return "❌ **Out of Credits** — your Groq account has no credits left.\n\n💡 Top up at https://console.groq.com or check your billing.";
  if (msg.includes("network") || msg.includes("failed to fetch"))
    return "❌ **Network Error** — can't reach Groq API.\n\n💡 Check your internet connection.";
  return "❌ Error: " + err.message;
}

/* ── Ask ──────────────────────────────────────────────── */
async function handleAsk() {
  const q = document.getElementById("questionInput").value.trim();
  if (!q) return;
  const isDeep = settings.deepThink;
  showLoading(true, isDeep);
  document.getElementById("responseBox").classList.add("visible");
  let pageContext = "";
  if (settings.includeContext) {
    try {
      const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
      const res = await chrome.scripting.executeScript({
        target:{ tabId:tab.id },
        func:() => {
          const meta = [`Title: ${document.title}`, `URL: ${location.href}`, `Domain: ${location.hostname}`];
          document.querySelectorAll('meta[name="description"], meta[name="keywords"], meta[name="author"]').forEach(m => {
            if (m.content) meta.push(`${m.name}: ${m.content}`);
          });
          const bodyText = document.body?.innerText || "";
          const words = bodyText.trim().split(/\s+/).filter(Boolean).length;
          const links = document.querySelectorAll("a[href]").length;
          const images = document.querySelectorAll("img").length;
          meta.push(`Words: ${words} | Links: ${links} | Images: ${images}`);
          return meta.join("\n") + "\n\n" + bodyText.slice(0, 5000);
        }
      });
      if (res?.[0]?.result) pageContext = res[0].result;
    } catch {}
  }
  const system = "You are LearnFlow v4, a precise AI research assistant in a Chrome extension. Be thorough, analytical, and well-structured. Use markdown." + (pageContext ? "\n\nCurrent page:\n" + pageContext : "");
  try {
    const answer = await callGroq([{ role:"user", content:q }], system, isDeep);
    currentResponse = answer;
    showResponse(answer);
    addToHistory(q, answer);
  } catch (err) {
    showResponse(friendlyError(err));
  }
}

function showLoading(on, isDeep = false) {
  const indicator = document.getElementById("thinkingIndicator");
  indicator.style.display = on ? "flex" : "none";
  if (on && isDeep) indicator.innerHTML = '🧠 Deep thinking <div class="dots"><span></span><span></span><span></span></div>';
  else if (on)      indicator.innerHTML = 'Analyzing <div class="dots"><span></span><span></span><span></span></div>';
  document.getElementById("responseText").textContent = "";
  document.getElementById("copyBtn").style.display     = on ? "none" : "inline";
  document.getElementById("saveRespBtn").style.display = on ? "none" : "inline";
}
function showResponse(text) { showLoading(false); document.getElementById("responseText").textContent = text; }

/* ── File Generation ──────────────────────────────────── */
async function handleGenerate() {
  const prompt = document.getElementById("filePrompt").value.trim();
  if (!prompt) return;
  const btn = document.getElementById("generateBtn");
  btn.disabled = true;
  btn.innerHTML = '<span class="dots"><span></span><span></span><span></span></span> Generating…';
  const fmt   = selectedFormat;
  const isZip = fmt === "zip";
  const systemInstructions = {
    txt:"Output only plain text. No markdown.",
    md:"Output only valid Markdown. No preamble.",
    html:"Output only a complete valid HTML file with inline CSS. No explanations.",
    csv:"Output only raw CSV with a header row. No explanations.",
    json:"Output only valid pretty-printed JSON. No explanations.",
    js:"Output only valid JavaScript. Comments inside only.",
    py:"Output only valid Python. Docstrings inside only.",
    xml:"Output only valid XML. No explanations.",
    yaml:"Output only valid YAML. No explanations.",
    sql:"Output only valid SQL. Comments inside only.",
    css:"Output only valid CSS. Comments inside only.",
    zip:"Generate 3 related files. Format each:\n===FILE: filename.ext===\n[content]\n===END===\nNo other text."
  };
  try {
    const raw = await callGroq(
      [{ role:"user", content:"Generate the following: " + prompt + "\n\nFormat: " + fmt.toUpperCase() }],
      "You are a precise file generator. " + systemInstructions[fmt]
    );
    if (isZip) {
      await generateZip(raw, prompt);
    } else {
      const filename = slugify(prompt) + "." + fmt;
      const file = { name:filename, content:raw, fmt, size:raw.length, ts:Date.now() };
      generatedFiles.unshift(file);
      await chrome.storage.local.set({ genFiles:generatedFiles.slice(0,20) });
      renderGenFiles();
      downloadText(raw, filename, MIME[fmt] || "text/plain");
    }
  } catch (err) {
    alert("Generation failed: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = "<span>⚡</span> Generate & Download";
  }
}

async function generateZip(raw, prompt) {
  const fileRegex = /===FILE:\s*(.+?)===\n([\s\S]*?)===END===/g;
  const files = [];
  let match;
  while ((match = fileRegex.exec(raw)) !== null) files.push({ name:match[1].trim(), content:match[2].trim() });
  if (!files.length) files.push({ name:"output.txt", content:raw });
  const zipBytes = buildZip(files);
  const zipName  = slugify(prompt) + ".zip";
  const url = URL.createObjectURL(new Blob([zipBytes], { type:"application/zip" }));
  const a = document.createElement("a"); a.href = url; a.download = zipName; a.click();
  URL.revokeObjectURL(url);
  generatedFiles.unshift({ name:zipName, content:files.length+" files", fmt:"zip", size:zipBytes.length, ts:Date.now() });
  await chrome.storage.local.set({ genFiles:generatedFiles.slice(0,20) });
  renderGenFiles();
}

function buildZip(files) {
  const enc = new TextEncoder(), lh = [], cd = [];
  let off = 0;
  for (const f of files) {
    const nb = enc.encode(f.name), db = enc.encode(f.content), crc = crc32(db);
    const lo = new Uint8Array(30+nb.length+db.length), dv = new DataView(lo.buffer);
    dv.setUint32(0,0x04034b50,true); dv.setUint16(4,20,true);
    dv.setUint32(14,crc,true); dv.setUint32(18,db.length,true); dv.setUint32(22,db.length,true);
    dv.setUint16(26,nb.length,true); lo.set(nb,30); lo.set(db,30+nb.length);
    const ce = new Uint8Array(46+nb.length), cv = new DataView(ce.buffer);
    cv.setUint32(0,0x02014b50,true); cv.setUint16(4,20,true); cv.setUint16(6,20,true);
    cv.setUint32(16,crc,true); cv.setUint32(20,db.length,true); cv.setUint32(24,db.length,true);
    cv.setUint16(28,nb.length,true); cv.setUint32(42,off,true); ce.set(nb,46);
    lh.push(lo); cd.push(ce); off += lo.length;
  }
  const cds = cd.reduce((s,c)=>s+c.length,0), eo = new Uint8Array(22), ev = new DataView(eo.buffer);
  ev.setUint32(0,0x06054b50,true); ev.setUint16(8,files.length,true); ev.setUint16(10,files.length,true);
  ev.setUint32(12,cds,true); ev.setUint32(16,off,true);
  const parts = [...lh,...cd,eo], out = new Uint8Array(parts.reduce((s,p)=>s+p.length,0));
  let pos = 0; for (const p of parts) { out.set(p,pos); pos+=p.length; }
  return out;
}

function crc32(data) {
  const t = [];
  for (let i=0;i<256;i++) { let c=i; for (let j=0;j<8;j++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); t[i]=c; }
  let crc=0xFFFFFFFF;
  for (let i=0;i<data.length;i++) crc=t[(crc^data[i])&0xFF]^(crc>>>8);
  return (crc^0xFFFFFFFF)>>>0;
}

function downloadText(content,filename,mime) {
  const url=URL.createObjectURL(new Blob([content],{type:mime}));
  const a=document.createElement("a"); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

function renderGenFiles() {
  const list=document.getElementById("genFilesList"); if(!list)return;
  if(!generatedFiles.length){ list.innerHTML='<div class="empty-state" style="padding:16px 0;"><div class="empty-icon">📂</div>Generated files appear here</div>'; return; }
  list.innerHTML=generatedFiles.slice(0,15).map((f,i)=>
    '<div class="gen-file-item"><div class="gen-file-icon">'+(FORMAT_ICONS[f.fmt]||"📄")+'</div><div class="gen-file-info"><div class="gen-file-name">'+esc(f.name)+'</div><div class="gen-file-size">'+formatSize(f.size)+' · '+new Date(f.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})+'</div></div><button class="dl-btn" data-idx="'+i+'">↓</button></div>'
  ).join("");
  list.querySelectorAll(".dl-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{ const f=generatedFiles[+btn.dataset.idx]; if(f&&f.content&&f.fmt!=="zip") downloadText(f.content,f.name,MIME[f.fmt]||"text/plain"); });
  });
}

/* ── Sidebar ──────────────────────────────────────────── */
async function openSidebar() {
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  chrome.tabs.sendMessage(tab.id,{action:"toggleSidebar"});
  window.close();
}

/* ── History ──────────────────────────────────────────── */
async function addToHistory(q,a) {
  history.unshift({q,a,time:new Date().toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})});
  if(history.length>50)history.pop();
  await chrome.storage.local.set({history});
  renderHistory();
}

function renderHistory() {
  const list=document.getElementById("historyList"); if(!list)return;
  if(!history.length){ list.innerHTML='<div class="empty-state"><div class="empty-icon">📭</div>No history yet</div>'; return; }
  list.innerHTML='<button class="history-clear" id="clearHistoryBtn">clear all</button>'
    +history.slice(0,20).map((item,i)=>'<div class="history-item" data-index="'+i+'"><div class="history-q">'+esc(item.q)+'</div><div class="history-meta">'+item.time+'</div></div>').join("");
  document.getElementById("clearHistoryBtn")?.addEventListener("click",async()=>{ history=[];await chrome.storage.local.set({history});renderHistory(); });
  list.querySelectorAll(".history-item").forEach(el=>{
    el.addEventListener("click",()=>{
      const item=history[+el.dataset.index];
      document.getElementById("questionInput").value=item.q;
      currentResponse=item.a; showResponse(item.a);
      document.getElementById("responseBox").classList.add("visible");
      document.querySelector(".tab[data-tab='ask']").click();
    });
  });
}

/* ── Utils ────────────────────────────────────────────── */
function setToggle(id,v){ document.getElementById(id)?.classList.toggle("on",!!v); }
function getToggle(id)  { return document.getElementById(id)?.classList.contains("on")??false; }
function esc(s)         { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function slugify(s)     { return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||"learnflow-output"; }
function formatSize(b)  { if(!b||typeof b!=="number")return""; if(b<1024)return b+" B"; if(b<1048576)return(b/1024).toFixed(1)+" KB"; return(b/1048576).toFixed(1)+" MB"; }
