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
  summarize: "Provide a comprehensive yet concise summary of this content. Structure your response with:\n\n**Main Thesis** (1-2 sentences)\n**Key Points** (3-5 bullet points with brief explanations)\n**Evidence/Arguments** (what supports the main claims)\n**Conclusion** (what should the reader take away)\n\nBe precise, avoid fluff, and capture the essence.",
  keypoints: "Extract the 7 most important key points from this content. For each point:\n\n• **Point Title** (bold, 3-5 words)\n  - One sentence explanation of why this matters\n  - Include specific details, numbers, or quotes when relevant\n\nPrioritize substance over surface details. Focus on what would matter most to someone trying to understand this topic deeply.",
  simplify:  "Explain this content in simple, accessible language as if teaching a smart 14-year-old. Use:\n\n• Plain language (no jargon without explanation)\n• Concrete examples and analogies\n• Short sentences and clear structure\n• Define any technical terms immediately\n\nThe goal is clarity without dumbing down. Make complex ideas accessible, not simplistic.",
  critique:  "Provide a rigorous critical analysis of this content. Address:\n\n**Arguments** (what claims are being made)\n**Evidence Quality** (strong/weak, sources, recency, sample sizes)\n**Logical Consistency** (any fallacies or gaps in reasoning)\n**Potential Bias** (author perspective, funding, selection bias)\n**Credibility** (expertise, track record, peer review)\n**What's Missing** (counterarguments, alternative explanations, key context)\n\nBe fair but thorough. Point out both strengths and weaknesses.",
  data:      "Extract all significant facts, statistics, numbers, and data points from this content. Present as:\n\n• **Category/Topic** (group related data)\n  - Specific numbers with units\n  - Percentages, ratios, comparisons\n  - Dates, timeframes, trends\n  - Sample sizes, margins of error when mentioned\n\nInclude the actual numbers, not just descriptions. Quote precisely when possible.",
  translate: "Translate the main content to clear, natural English. If the content is already in English, translate to French instead.\n\n• Preserve the original meaning and tone\n• Adapt idioms and cultural references appropriately\n• Maintain technical accuracy\n• Keep the structure similar to the original\n\nDo not add commentary or explanations—just translate.",
  solve:     "Solve this problem methodically with clear, verifiable reasoning:\n\n**1. Understanding** (restate the problem, identify what's being asked, list constraints)\n**2. Given Information** (extract all known facts, data, assumptions from the content)\n**3. Approach** (explain your solution strategy, why this method works, any formulas or principles)\n**4. Step-by-Step Solution** (show all work with clear explanations for each step)\n**5. Final Answer** (clearly state the result, box or highlight it)\n**6. Verification** (check your answer makes sense, alternative method if applicable, sanity check)\n\nShow your reasoning at each step. Explain WHY, not just WHAT. If there are multiple valid approaches, mention them briefly.",
};

/* ── State ────────────────────────────────────────────── */
let settings = { apiKey:"", includeContext:true, selectionSidebar:true, autoSummarize:false, deepThink:false };
let currentResponse = "", currentTheme = "dark";

/* ── Init ─────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  await load();
  applyTheme(currentTheme);
  updateStatus();
  setupListeners();
  updateDeepThinkUI();
});

/* ── Load / Save ──────────────────────────────────────── */
async function load() {
  const data = await chrome.storage.local.get(["settings","theme"]);
  if (data.settings) settings = { ...settings, ...data.settings };
  if (data.theme)    currentTheme = data.theme;

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

  // Deep Think toggle button - fixed to toggle properly
  const deepThinkBtn = document.getElementById("deepThinkBtn");
  deepThinkBtn.addEventListener("click", () => {
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

/* ── Sidebar ──────────────────────────────────────────── */
async function openSidebar() {
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  chrome.tabs.sendMessage(tab.id,{action:"toggleSidebar"});
  window.close();
}

/* ── Utils ────────────────────────────────────────────── */
function setToggle(id,v){ document.getElementById(id)?.classList.toggle("on",!!v); }
function getToggle(id)  { return document.getElementById(id)?.classList.contains("on")??false; }
function esc(s)         { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function slugify(s)     { return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||"learnflow-output"; }
function formatSize(b)  { if(!b||typeof b!=="number")return""; if(b<1024)return b+" B"; if(b<1048576)return(b/1024).toFixed(1)+" KB"; return(b/1048576).toFixed(1)+" MB"; }
