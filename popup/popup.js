// LearnFlow Popup v3 — Free Providers Only (Groq, Gemini, OpenRouter, HuggingFace)

/* ── Provider configs ─────────────────────────────────── */
const PROVIDERS = {
  gemini: {
    name: "Google Gemini", emoji: "🔵",
    keyUrl: "https://aistudio.google.com/app/apikey",
    freeNote: "Free tier available — aistudio.google.com",
    placeholder: "AIza…",
    keyLabel: "Google AI Studio API Key",
    // Enhanced model metadata with context windows and capabilities
    models: [
      { id: "gemini-2.0-flash",    label: "Gemini 2.0 Flash ✦ (recommended)", contextWindow: "1M tokens", speed: "fastest", multimodal: true },
      { id: "gemini-1.5-flash",    label: "Gemini 1.5 Flash (fast)", contextWindow: "1M tokens", speed: "very fast", multimodal: true },
      { id: "gemini-1.5-flash-8b", label: "Gemini 1.5 Flash-8B (lightest)", contextWindow: "1M tokens", speed: "fastest", multimodal: true },
      { id: "gemini-1.5-pro",      label: "Gemini 1.5 Pro (powerful)", contextWindow: "2M tokens", speed: "moderate", multimodal: true },
    ],
  },
  groq: {
    name: "Groq", emoji: "⚡",
    keyUrl: "https://console.groq.com/keys",
    freeNote: "Free — console.groq.com",
    placeholder: "gsk_…",
    keyLabel: "Groq API Key",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (recommended)" },
      { id: "llama-3.1-8b-instant",    label: "Llama 3.1 8B (fastest)" },
      { id: "mixtral-8x7b-32768",      label: "Mixtral 8x7B" },
      { id: "gemma2-9b-it",            label: "Gemma 2 9B" },
    ],
  },
  openrouter: {
    name: "OpenRouter", emoji: "🔀",
    keyUrl: "https://openrouter.ai/keys",
    freeNote: "Free models — openrouter.ai",
    placeholder: "sk-or-…",
    keyLabel: "OpenRouter API Key",
    models: [
      { id: "meta-llama/llama-3.3-70b-instruct:free",  label: "Llama 3.3 70B (free)" },
      { id: "deepseek/deepseek-r1:free",               label: "DeepSeek R1 🧠 (free)" },
      { id: "deepseek/deepseek-chat-v3-0324:free",     label: "DeepSeek V3 (free)" },
      { id: "mistralai/mistral-7b-instruct:free",      label: "Mistral 7B (free)" },
      { id: "google/gemma-3-27b-it:free",              label: "Gemma 3 27B (free)" },
      { id: "qwen/qwen3-30b-a3b:free",                 label: "Qwen3 30B (free)" },
      { id: "microsoft/phi-4-reasoning:free",          label: "Phi-4 Reasoning (free)" },
    ],
  },
  huggingface: {
    name: "HuggingFace", emoji: "🤗",
    keyUrl: "https://huggingface.co/settings/tokens",
    freeNote: "Free Inference API — huggingface.co",
    placeholder: "hf_…",
    keyLabel: "HuggingFace Token",
    models: [
      { id: "meta-llama/Llama-3.2-11B-Vision-Instruct", label: "Llama 3.2 11B" },
      { id: "mistralai/Mistral-7B-Instruct-v0.3",       label: "Mistral 7B Instruct" },
      { id: "Qwen/Qwen2.5-72B-Instruct",                label: "Qwen 2.5 72B" },
      { id: "microsoft/Phi-3.5-mini-instruct",          label: "Phi-3.5 Mini" },
    ],
  },
};

const VALID_PROVIDERS = Object.keys(PROVIDERS);

const QUICK_ACTIONS = {
  summarize: "Summarize this page comprehensively — main thesis, key points, evidence, and conclusions.",
  keypoints: "List the 7 most important key points from this page with brief explanations for each.",
  simplify:  "Explain the main content of this page in simple, plain language that anyone can understand.",
  critique:  "Critically analyze this content: main arguments, evidence quality, logical consistency, potential bias, credibility, and what's missing.",
  data:      "What are the most important facts, statistics, numbers, and data points mentioned on this page?",
  translate: "Translate the main content to English. If already in English, translate to French.",
};

const FORMAT_ICONS = { txt:"📄",md:"📝",html:"🌐",csv:"📊",json:"📋",js:"⚙️",py:"🐍",xml:"🏷",yaml:"📐",sql:"🗄",css:"🎨",zip:"🗜" };
const MIME = { txt:"text/plain",md:"text/markdown",html:"text/html",csv:"text/csv",json:"application/json",js:"text/javascript",py:"text/x-python",xml:"application/xml",yaml:"text/yaml",sql:"text/plain",css:"text/css",zip:"application/zip" };

/* ── State ────────────────────────────────────────────── */
let settings = { activeProvider:"", activeModel:"", keys:{}, includeContext:true, selectionSidebar:true, autoSummarize:false, deepThink:false };
let history = [], currentResponse = "", currentTheme = "dark", selectedFormat = "txt", generatedFiles = [];

/* ── Init ─────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  await load();
  applyTheme(currentTheme);
  renderHistory();
  renderGenFiles();
  updateStatus();
  updateProviderBadge();
  restoreProviderUI();
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

  if (settings.activeProvider && !PROVIDERS[settings.activeProvider]) {
    settings.activeProvider = "";
    settings.activeModel = "";
  }
  if (settings.activeProvider && settings.activeModel) {
    const validIds = PROVIDERS[settings.activeProvider].models.map(m => m.id);
    if (!validIds.includes(settings.activeModel))
      settings.activeModel = PROVIDERS[settings.activeProvider].models[0].id;
  }
  if (settings.keys) {
    for (const k of Object.keys(settings.keys))
      if (!VALID_PROVIDERS.includes(k)) delete settings.keys[k];
  }

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

  document.querySelectorAll(".provider-card").forEach(card => {
    card.addEventListener("click", () => selectProvider(card.dataset.provider));
  });

  document.getElementById("sharedKeySaveBtn").addEventListener("click", saveKey);
  document.getElementById("sharedKeyInput").addEventListener("keydown", e => { if (e.key === "Enter") saveKey(); });

  document.getElementById("modelSelect").addEventListener("change", e => {
    settings.activeModel = e.target.value;
    save();
    updateProviderBadge();
  });

  document.querySelectorAll(".format-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".format-chip").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
      selectedFormat = chip.dataset.fmt;
    });
  });

  document.getElementById("generateBtn").addEventListener("click", handleGenerate);
  document.getElementById("filePrompt").addEventListener("keydown", e => { if (e.key === "Enter") handleGenerate(); });
}

/* ── Provider UI ──────────────────────────────────────── */
function selectProvider(p) {
  if (!PROVIDERS[p]) return;
  const already = settings.activeProvider === p;
  settings.activeProvider = already ? "" : p;
  settings.activeModel    = already ? "" : PROVIDERS[p].models[0].id;
  restoreProviderUI();
  updateStatus();
  updateProviderBadge();
  save();
}

function saveKey() {
  const p = settings.activeProvider;
  if (!p || !PROVIDERS[p]) return;
  const key = document.getElementById("sharedKeyInput").value.trim();
  if (!key) return;
  settings.keys[p] = key;
  save();
  const status = document.getElementById("sharedKeyStatus");
  status.textContent = "✓ Key saved · " + PROVIDERS[p].freeNote;
  status.className = "key-status ok";
  document.querySelector(".provider-card[data-provider='" + p + "']")?.classList.add("has-key");
  updateStatus();
  updateProviderBadge();
}

function restoreProviderUI() {
  const p = settings.activeProvider;
  document.querySelectorAll(".provider-card").forEach(card => {
    const cp = card.dataset.provider;
    card.classList.toggle("selected", cp === p);
    card.classList.toggle("has-key", !!(settings.keys && settings.keys[cp]));
  });
  const keyArea = document.getElementById("providerKeyArea");
  if (p && PROVIDERS[p]) {
    const prov = PROVIDERS[p];
    keyArea.classList.add("visible");
    document.getElementById("keyAreaEmoji").textContent = prov.emoji;
    document.getElementById("keyAreaTitle").textContent = prov.keyLabel;
    document.getElementById("keyAreaSub").innerHTML =
      '<a href="' + prov.keyUrl + '" target="_blank" style="color:var(--accent);text-decoration:none;">🔑 Get key →</a>';
    const inp = document.getElementById("sharedKeyInput");
    inp.placeholder = prov.placeholder;
    inp.value = (settings.keys && settings.keys[p]) || "";
    const status = document.getElementById("sharedKeyStatus");
    if (settings.keys && settings.keys[p]) {
      status.textContent = "✓ Key saved · " + prov.freeNote;
      status.className = "key-status ok";
    } else {
      status.textContent = prov.freeNote;
      status.className = "key-status";
    }

    // Show deep think badge on provider card if it supports it
    const deepBadge = document.getElementById("deepThinkProviderNote");
    if (deepBadge) {
      deepBadge.style.display = prov.supportsDeepThink ? "block" : "none";
      if (prov.supportsDeepThink) {
        deepBadge.textContent = `🧠 Deep Think uses ${prov.deepThinkModel}`;
      }
    }
  } else {
    keyArea.classList.remove("visible");
  }
  updateModelDropdown();
}

function updateModelDropdown() {
  const sel = document.getElementById("modelSelect");
  if (!sel) return;
  const p = settings.activeProvider;
  if (!p || !PROVIDERS[p]) {
    sel.innerHTML = '<option value="">— select provider first —</option>';
    return;
  }
  const models = PROVIDERS[p].models;
  sel.innerHTML = models.map(m =>
    '<option value="' + m.id + '"' + (settings.activeModel === m.id ? " selected" : "") + ">" + m.label + "</option>"
  ).join("");
  if (!settings.activeModel) { settings.activeModel = models[0].id; sel.value = models[0].id; }
}

function updateProviderBadge() {
  const emoji = document.getElementById("badgeEmoji");
  const text  = document.getElementById("badgeText");
  if (!emoji || !text) return;
  const p    = settings.activeProvider;
  const prov = PROVIDERS[p] || null;
  if (!prov) { emoji.textContent = "⚙"; text.textContent = "Set up provider →"; return; }
  const hasKey = !!(settings.keys && settings.keys[p]);
  emoji.textContent = prov.emoji;
  text.textContent  = hasKey
    ? prov.name + " · " + (settings.activeModel || "").split("/").pop()
    : prov.name + " — add API key →";
}

function updateStatus() {
  const dot = document.getElementById("statusDot");
  const txt = document.getElementById("statusText");
  if (!dot || !txt) return;
  const p    = settings.activeProvider;
  const prov = PROVIDERS[p] || null;
  const hasKey = prov && !!(settings.keys && settings.keys[p]);
  if (hasKey)    { dot.classList.add("on"); txt.textContent = prov.name + (settings.deepThink ? " · 🧠 Deep Think" : " · ready"); }
  else if (prov) { dot.classList.remove("on"); txt.textContent = prov.name + " — no key"; }
  else           { dot.classList.remove("on"); txt.textContent = "No provider set"; }
}

/* ── AI Call ──────────────────────────────────────────── */
async function callProvider(messages, systemPrompt, isDeepThink = false) {
  const p   = settings.activeProvider;
  const key = settings.keys && settings.keys[p];
  if (!p || !PROVIDERS[p]) throw new Error("No provider selected — go to Settings.");
  if (!key) throw new Error("No API key for " + PROVIDERS[p].name + " — go to Settings.");
  const model = settings.activeModel || PROVIDERS[p].models[0].id;

  if (p === "gemini") {
    const actualModel = model || "gemini-2.0-flash";
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + actualModel + ":generateContent?key=" + key;
    
    // Enhanced Gemini API call with better parameters
    const contents = messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const body = {
      contents,
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      generationConfig: {
        temperature: isDeepThink ? 0.7 : 0.5,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: isDeepThink ? 8192 : 4096,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    };
    
    const resp = await fetch(url, { 
      method:"POST", 
      headers:{"Content-Type":"application/json"}, 
      body:JSON.stringify(body) 
    });
    
    // Enhanced error handling for Gemini-specific errors
    if (!resp.ok) {
      const errorText = await resp.text().catch(() => "");
      let errorData = {};
      try { errorData = JSON.parse(errorText); } catch {}
      
      const errorMsg = errorData.error?.message || errorText || "Gemini HTTP " + resp.status;
      
      // Gemini-specific error messages
      if (resp.status === 429) {
        throw new Error("Rate limit exceeded — Gemini API quota reached. Wait a moment or upgrade your API tier.");
      }
      if (resp.status === 403) {
        throw new Error("API key invalid or expired — get a fresh key from aistudio.google.com");
      }
      if (resp.status === 400) {
        throw new Error("Invalid request: " + (errorData.error?.details?.[0]?.reason || errorMsg));
      }
      throw new Error(errorMsg);
    }
    
    const d = await resp.json();
    
    // Handle Gemini response with better safety checks
    if (!d.candidates || d.candidates.length === 0) {
      if (d.promptFeedback?.blockReason) {
        throw new Error("Content blocked by safety filters: " + d.promptFeedback.blockReason);
      }
      throw new Error("No response from Gemini");
    }
    
    const candidate = d.candidates[0];
    if (candidate.finishReason === "SAFETY") {
      throw new Error("Response blocked by safety filters");
    }
    
    return candidate.content?.parts?.[0]?.text || "";
  }

  if (p === "groq") {
    const msgs = systemPrompt ? [{ role:"system", content:systemPrompt }, ...messages] : messages;
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer " + key},
      body:JSON.stringify({ model, max_tokens:2048, messages:msgs })
    });
    if (!resp.ok) { const e = await resp.json().catch(()=>({})); throw new Error(e.error?.message || "HTTP " + resp.status); }
    return (await resp.json()).choices?.[0]?.message?.content || "";
  }

  if (p === "openrouter") {
    const msgs = systemPrompt ? [{ role:"system", content:systemPrompt }, ...messages] : messages;
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer " + key,"HTTP-Referer":"https://learnflow.ext","X-Title":"LearnFlow"},
      body:JSON.stringify({ model, max_tokens:2048, messages:msgs })
    });
    if (!resp.ok) { const e = await resp.json().catch(()=>({})); throw new Error(e.error?.message || "HTTP " + resp.status); }
    return (await resp.json()).choices?.[0]?.message?.content || "";
  }

  if (p === "huggingface") {
    const msgs = systemPrompt ? [{ role:"system", content:systemPrompt }, ...messages] : messages;
    const resp = await fetch("https://api-inference.huggingface.co/models/" + model + "/v1/chat/completions", {
      method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer " + key},
      body:JSON.stringify({ model, max_tokens:2048, messages:msgs })
    });
    if (!resp.ok) { const e = await resp.json().catch(()=>({})); throw new Error(e.error || "HTTP " + resp.status); }
    return (await resp.json()).choices?.[0]?.message?.content || "";
  }

  throw new Error("Unknown provider: " + p);
}

/* ── Error Helper ─────────────────────────────────────── */
function friendlyError(err) {
  const msg = (err.message || "").toLowerCase();
  
  // Gemini-specific errors
  if (msg.includes("gemini") || msg.includes("generativelanguage")) {
    if (msg.includes("rate limit") || msg.includes("quota") || msg.includes("429"))
      return "❌ **Gemini Rate Limit** — you've hit the API quota.\n\n💡 Free tier: 15 requests/minute. Wait ~1 minute or upgrade at aistudio.google.com\n\n🔄 Or switch to Groq/OpenRouter for unlimited free requests.";
    if (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("403"))
      return "❌ **Invalid Gemini API Key** — the key was rejected.\n\n💡 Get a fresh key: https://aistudio.google.com/app/apikey\n\n📝 Keys start with `AIza…`";
    if (msg.includes("blocked") || msg.includes("safety"))
      return "⚠️ **Content Filtered** — Gemini blocked this request due to safety policies.\n\n💡 Try rephrasing your question or use a different provider.";
    if (msg.includes("invalid request") || msg.includes("400"))
      return "❌ **Invalid Request** — Gemini rejected the request format.\n\n💡 Try a simpler question or switch models in Settings.";
  }
  
  // Generic provider errors
  if (msg.includes("insufficient balance") || msg.includes("insufficient_balance") || msg.includes("out of credits"))
    return "❌ Insufficient balance — your API key has run out of credits.\n\n💡 Top up at the provider's billing page, or switch to a free provider like Groq or OpenRouter in Settings.";
  if (msg.includes("invalid api key") || msg.includes("incorrect api key") || msg.includes("unauthorized") || msg.includes("authentication"))
    return "❌ Invalid API key — the key was rejected.\n\n💡 Go to Settings and re-enter your API key.";
  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("429"))
    return "❌ Rate limit — too many requests sent.\n\n💡 Wait a moment and try again, or switch providers.";
  if (msg.includes("quota") || msg.includes("limit exceeded"))
    return "❌ Quota exceeded — you've hit your plan's usage cap.\n\n💡 Check your billing dashboard or switch to Groq / OpenRouter (free).";
  if (msg.includes("model not found") || msg.includes("no such model"))
    return "❌ Model not found — this model may be unavailable.\n\n💡 Go to Settings and select a different model.";
  if (msg.includes("context length") || (msg.includes("token") && msg.includes("exceed")))
    return "❌ Page too large — content exceeds the model's limit.\n\n💡 Ask a more specific question or pick a larger-context model.";
  if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("load failed"))
    return "❌ Network error — can't reach the API.\n\n💡 Check your internet connection and try again.";
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
          // Rich extraction matching content.js
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
  const system = "You are LearnFlow v3, a precise AI research assistant in a Chrome extension. Be thorough, analytical, and well-structured. Use markdown." + (pageContext ? "\n\nCurrent page:\n" + pageContext : "");
  try {
    const answer = await callProvider([{ role:"user", content:q }], system, isDeep);
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
    const raw = await callProvider(
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
