// LearnFlow Content Script v3 — Rich Page Analysis + Deep Think Mode
(function () {
  if (window.__learnflowLoaded) return;
  window.__learnflowLoaded = true;

  /* ═══════════════════════════════════════════════
     PAGE ANALYZER — much richer than before
  ═══════════════════════════════════════════════ */
  const Extractor = {
    detectPageType() {
      const url = location.href.toLowerCase();
      if (url.endsWith(".pdf") || document.contentType === "application/pdf") return "pdf";
      if (url.includes("youtube.com/watch") || url.includes("youtu.be")) return "youtube";
      if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
      if (url.includes("reddit.com")) return "reddit";
      if (url.includes("github.com")) return "github";
      if (url.includes("wikipedia.org") || document.querySelector("#mw-content-text")) return "wikipedia";
      if (document.querySelector(".hljs, pre code")) return "code";
      if (document.querySelector("article, .post-content, .entry-content")) return "article";
      if (document.querySelector("form input, form select")) return "form";
      if (document.querySelector("table")) return "data";
      return "page";
    },

    extractMeta() {
      const lines = [
        `Title: ${document.title}`,
        `URL: ${location.href}`,
        `Domain: ${location.hostname}`,
        `Path: ${location.pathname}`,
      ];
      document.querySelectorAll('meta[property^="og:"], meta[name]').forEach((m) => {
        const key = m.getAttribute("property") || m.getAttribute("name");
        const val = m.getAttribute("content");
        if (val && ["description","keywords","author","og:title","og:description","og:type","og:site_name","article:published_time","article:author"].includes(key)) {
          lines.push(`${key}: ${val}`);
        }
      });
      // canonical link
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) lines.push(`canonical: ${canonical.href}`);
      // lang
      if (document.documentElement.lang) lines.push(`lang: ${document.documentElement.lang}`);
      return lines.join("\n");
    },

    // NEW: Rich page statistics
    analyzePageStats() {
      const bodyText = document.body?.innerText || "";
      const words = bodyText.trim().split(/\s+/).filter(Boolean);
      const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const readingMinutes = Math.ceil(words.length / 200);

      // Links
      const allLinks = [...document.querySelectorAll("a[href]")];
      const internalLinks = allLinks.filter(a => a.hostname === location.hostname);
      const externalLinks = allLinks.filter(a => a.hostname && a.hostname !== location.hostname);

      // Images
      const images = [...document.querySelectorAll("img[src]")];
      const imagesWithAlt = images.filter(img => img.alt?.trim());

      // Headings structure
      const headings = [...document.querySelectorAll("h1,h2,h3,h4")].map(h => ({
        level: h.tagName, text: h.innerText?.trim().slice(0, 80)
      })).filter(h => h.text).slice(0, 20);

      // Videos / embeds
      const videos = document.querySelectorAll("video, iframe[src*='youtube'], iframe[src*='vimeo']").length;

      // Page load timing (if available)
      const timing = performance?.timing;
      const loadTime = timing ? Math.round(timing.loadEventEnd - timing.navigationStart) : null;

      // Detect if page is behind a paywall / login wall
      const paywallHints = document.querySelector(".paywall, .subscription-wall, [class*='paywall'], [id*='paywall']");

      const stats = [
        `=== PAGE ANALYSIS ===`,
        `Words: ${words.length} (~${readingMinutes} min read)`,
        `Sentences: ${sentences.length}`,
        `Internal links: ${internalLinks.length} | External links: ${externalLinks.length}`,
        `Images: ${images.length} (${imagesWithAlt.length} with alt text)`,
        `Videos/embeds: ${videos}`,
        loadTime ? `Page load time: ${loadTime}ms` : null,
        paywallHints ? `⚠ Possible paywall detected` : null,
      ].filter(Boolean).join("\n");

      const headingOutline = headings.length
        ? `\n\nDOCUMENT OUTLINE:\n` + headings.map(h => `  ${h.level}: ${h.text}`).join("\n")
        : "";

      const topExternal = externalLinks.slice(0, 8).map(a => `  - ${a.innerText?.trim().slice(0,40) || a.href} → ${a.hostname}`).join("\n");
      const linksSection = topExternal ? `\nKEY EXTERNAL LINKS:\n${topExternal}` : "";

      return stats + headingOutline + linksSection;
    },

    extractArticle() {
      const selectors = [
        "article", "main", '[role="main"]', ".article-body", ".post-content",
        ".entry-content", "#article", "#main-content", '[itemprop="articleBody"]',
        ".story-body", ".content-body", ".article__body", ".post__body",
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const t = (el.innerText || "").trim();
          if (t.length > 200) return t;
        }
      }
      let best = null, bestScore = 0;
      document.querySelectorAll("div, section, main").forEach((el) => {
        const text = el.innerText || "";
        const len = text.trim().length;
        const links = el.querySelectorAll("a").length;
        const score = len - links * 30;
        if (score > bestScore && len > 400) { bestScore = score; best = el; }
      });
      return best ? (best.innerText || "").trim() : "";
    },

    extractYouTube() {
      const title = document.querySelector("h1.ytd-video-primary-info-renderer, h1.title")?.innerText?.trim();
      const channel = document.querySelector("#channel-name a, #owner-name a")?.innerText?.trim();
      const desc = document.querySelector("#description-inline-expander, #description, #meta-contents #description")?.innerText?.trim();
      const views = document.querySelector(".view-count, #info span")?.innerText?.trim();
      const likes = document.querySelector("#segmented-like-button yt-formatted-string, #like-button yt-formatted-string")?.innerText?.trim();
      const uploadDate = document.querySelector("#info-strings yt-formatted-string, #upload-info")?.innerText?.trim();
      const comments = [...document.querySelectorAll("ytd-comment-thread-renderer #content-text")]
        .slice(0, 15).map((c) => c.innerText?.trim()).filter(Boolean).join("\n");
      return [
        title && `Video Title: ${title}`,
        channel && `Channel: ${channel}`,
        views && `Views: ${views}`,
        likes && `Likes: ${likes}`,
        uploadDate && `Uploaded: ${uploadDate}`,
        desc && `Description:\n${desc.slice(0, 3000)}`,
        comments && `Top Comments:\n${comments}`,
      ].filter(Boolean).join("\n\n");
    },

    extractTwitter() {
      const tweets = [...document.querySelectorAll('[data-testid="tweetText"]')]
        .slice(0, 25).map((t) => t.innerText?.trim()).filter(Boolean);
      const author = document.querySelector('[data-testid="User-Name"]')?.innerText?.trim();
      return [
        author && `Account: ${author}`,
        tweets.length && `Tweets/Posts:\n${tweets.join("\n---\n")}`,
      ].filter(Boolean).join("\n\n");
    },

    extractReddit() {
      const title = document.querySelector('h1[slot="title"], h1')?.innerText?.trim();
      const postBody = document.querySelector('[data-testid="post-container"] [data-click-id="text"]')?.innerText?.trim();
      const comments = [...document.querySelectorAll('[data-testid="comment"]')]
        .slice(0, 15).map(c => c.innerText?.trim().slice(0, 300)).filter(Boolean).join("\n---\n");
      return [
        title && `Post Title: ${title}`,
        postBody && `Post Content:\n${postBody}`,
        comments && `Top Comments:\n${comments}`,
      ].filter(Boolean).join("\n\n");
    },

    extractGitHub() {
      const repoName = document.querySelector('[itemprop="name"]')?.innerText?.trim();
      const repoDesc = document.querySelector('[itemprop="about"]')?.innerText?.trim();
      const readme = document.querySelector("#readme article, .markdown-body")?.innerText?.trim();
      const stars = document.querySelector('[id*="repo-stars-counter"], .Counter')?.innerText?.trim();
      const language = document.querySelector('[itemprop="programmingLanguage"]')?.innerText?.trim();
      return [
        repoName && `Repository: ${repoName}`,
        repoDesc && `Description: ${repoDesc}`,
        stars && `Stars: ${stars}`,
        language && `Language: ${language}`,
        readme && `README:\n${readme?.slice(0, 4000)}`,
      ].filter(Boolean).join("\n\n");
    },

    extractTables() {
      const results = [];
      document.querySelectorAll("table").forEach((table, i) => {
        const rows = [];
        table.querySelectorAll("tr").forEach((tr) => {
          const cells = [...tr.querySelectorAll("th,td")].map((c) => (c.innerText || "").trim());
          if (cells.some(Boolean)) rows.push(cells.join(" | "));
        });
        if (rows.length > 1) results.push(`[Table ${i + 1}]\n${rows.join("\n")}`);
      });
      return results.join("\n\n").slice(0, 3000);
    },

    extractCode() {
      const blocks = [];
      document.querySelectorAll("pre code, pre").forEach((el) => {
        const text = (el.innerText || "").trim();
        if (text.length > 20) blocks.push(`\`\`\`\n${text.slice(0, 800)}\n\`\`\``);
      });
      return blocks.slice(0, 8).join("\n\n");
    },

    async smartExtract(limit = 14000) {
      const type = this.detectPageType();
      const parts = [this.extractMeta(), this.analyzePageStats()];

      if (type === "youtube") {
        parts.push(this.extractYouTube());
      } else if (type === "twitter") {
        parts.push(this.extractTwitter());
      } else if (type === "reddit") {
        parts.push(this.extractReddit());
      } else if (type === "github") {
        parts.push(this.extractGitHub());
      } else {
        const article = this.extractArticle();
        if (article) parts.push("=== CONTENT ===\n" + article);
        const tables = this.extractTables();
        if (tables) parts.push("=== TABLES ===\n" + tables);
        const code = this.extractCode();
        if (code) parts.push("=== CODE ===\n" + code);
      }

      return parts.filter(Boolean).join("\n\n").slice(0, limit);
    },
  };

  /* ═══════════════════════════════════════════════
     SIDEBAR STATE
  ═══════════════════════════════════════════════ */
  let sidebarOpen = false;
  let currentPageContent = "";
  let conversationHistory = [];
  let currentTheme = "dark";
  let deepThinkMode = false;

  /* ═══════════════════════════════════════════════
     BUILD SIDEBAR
  ═══════════════════════════════════════════════ */
  function buildSidebar() {
    const sidebar = document.createElement("div");
    sidebar.id = "learnflow-sidebar";
    sidebar.setAttribute("data-theme", currentTheme);
    sidebar.innerHTML = `
      <div id="bh-header">
        <div id="bh-logo">[/]</div>
        <div id="bh-title">LearnFlow</div>
        <div id="bh-page-type">${Extractor.detectPageType()}</div>
        <div id="bh-header-btns">
          <button class="bh-icon-btn" id="bh-deep-btn" title="Toggle Deep Think mode">🧠</button>
          <button class="bh-icon-btn" id="bh-theme-btn" title="Toggle theme">☀</button>
          <button class="bh-icon-btn" id="bh-clear-btn" title="Clear chat">↺</button>
          <button class="bh-icon-btn" id="bh-close-btn" title="Close">✕</button>
        </div>
      </div>

      <div id="bh-mode-bar" style="display:none;">
        <span id="bh-mode-icon">🧠</span>
        <span id="bh-mode-text">Deep Think active — extended reasoning enabled</span>
      </div>

      <div id="bh-ctx-bar" data-state="extracting">
        <span id="bh-ctx-icon">◌</span>
        <span id="bh-ctx-text">Analyzing page…</span>
      </div>

      <div id="bh-messages"></div>

      <div id="bh-quick-actions">
        <button class="bh-qa-btn" data-prompt="Summarize this page comprehensively — cover the main thesis, key points, and conclusions.">📋 Summarize</button>
        <button class="bh-qa-btn" data-prompt="List the 7 most important key points from this page with brief explanations.">🎯 Key Points</button>
        <button class="bh-qa-btn" data-prompt="Explain the main ideas of this page in simple, plain language anyone can understand.">💡 Simplify</button>
        <button class="bh-qa-btn" data-prompt="Critically analyze this content: main arguments, evidence quality, potential bias, what's missing, and credibility.">🔍 Deep Critique</button>
        <button class="bh-qa-btn" data-prompt="What are the most important facts, statistics, and data points mentioned on this page?">📊 Facts & Data</button>
        <button class="bh-qa-btn" data-prompt="Translate the main content to English. If already in English, translate to French.">🌐 Translate</button>
      </div>

      <div id="bh-input-area">
        <div id="bh-input-row">
          <textarea id="bh-input" placeholder="Ask anything about this page…" rows="1"></textarea>
          <button id="bh-send">
            <svg viewBox="0 0 24 24"><path d="M2 21L23 12 2 3v7l15 2-15 2z"/></svg>
          </button>
        </div>
        <div id="bh-hint">Alt+S to toggle • Esc to close • 🧠 for deep thinking</div>
      </div>
    `;

    document.body.appendChild(sidebar);
    initSidebarEvents(sidebar);
    extractPageContent();
    return sidebar;
  }

  function initSidebarEvents(sidebar) {
    sidebar.querySelector("#bh-close-btn").onclick = () => toggleSidebar(false);
    sidebar.querySelector("#bh-clear-btn").onclick = () => {
      conversationHistory = [];
      document.getElementById("bh-messages").innerHTML = "";
    };
    sidebar.querySelector("#bh-theme-btn").onclick = () => {
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      sidebar.setAttribute("data-theme", currentTheme);
      sidebar.querySelector("#bh-theme-btn").textContent = currentTheme === "dark" ? "☀" : "☾";
    };
    sidebar.querySelector("#bh-deep-btn").onclick = () => {
      deepThinkMode = !deepThinkMode;
      const btn = sidebar.querySelector("#bh-deep-btn");
      const modeBar = sidebar.querySelector("#bh-mode-bar");
      btn.style.borderColor = deepThinkMode ? "#a371f7" : "";
      btn.style.color = deepThinkMode ? "#a371f7" : "";
      modeBar.style.display = deepThinkMode ? "flex" : "none";
    };

    const sendBtn = sidebar.querySelector("#bh-send");
    const input = sidebar.querySelector("#bh-input");
    sendBtn.onclick = () => sendMessage(input.value.trim());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input.value.trim()); }
    });
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 110) + "px";
    });

    sidebar.querySelectorAll(".bh-qa-btn").forEach((btn) => {
      btn.onclick = () => sendMessage(btn.dataset.prompt);
    });
  }

  async function extractPageContent() {
    const bar = document.getElementById("bh-ctx-bar");
    const txt = document.getElementById("bh-ctx-text");
    if (!bar) return;
    try {
      bar.setAttribute("data-state", "extracting");
      txt.textContent = "Analyzing page…";
      currentPageContent = await Extractor.smartExtract(14000);
      const type = Extractor.detectPageType();
      const chars = currentPageContent.length;
      const words = Math.round(chars / 5);
      bar.setAttribute("data-state", "ready");
      document.getElementById("bh-ctx-icon").textContent = "●";
      txt.textContent = `${type} · ${(chars / 1000).toFixed(1)}k chars · ~${words} words`;
    } catch (err) {
      bar.setAttribute("data-state", "error");
      txt.textContent = "Extraction failed";
    }
  }

  /* ═══════════════════════════════════════════════
     MESSAGING
  ═══════════════════════════════════════════════ */
  async function sendMessage(text) {
    if (!text) return;
    const input = document.getElementById("bh-input");
    if (input) { input.value = ""; input.style.height = "auto"; }

    appendMessage("user", text);
    conversationHistory.push({ role: "user", content: text });
    const thinking = showThinking(deepThinkMode);

    try {
      const answer = await callAI();
      thinking.remove();
      conversationHistory.push({ role: "assistant", content: answer });
      appendMessage("assistant", answer);
    } catch (err) {
      thinking.remove();
      appendMessage("assistant", friendlyError(err));
    }
  }

  async function callAI() {
    const stored = await chrome.storage.local.get(["settings"]);
    const settings = stored.settings || {};
    const provider = settings.activeProvider;
    const model = settings.activeModel;
    const key = settings.keys?.[provider];

    if (!provider) throw new Error("No provider set — open the popup and go to Settings.");
    if (!key) throw new Error("No API key — open the popup Settings and add your key.");

    const ctx = currentPageContent || await Extractor.smartExtract(14000);
    const type = Extractor.detectPageType();
    const pageStats = Extractor.analyzePageStats();

    const system = buildSystemPrompt(ctx, type, pageStats);

    // Route to provider
    if (provider === "gemini")   return callGemini(key, model, system);
    if (provider === "groq")     return callOpenAICompat("https://api.groq.com/openai/v1/chat/completions", key, model, system);
    if (provider === "openrouter") return callOpenAICompat("https://openrouter.ai/api/v1/chat/completions", key, model, system, {"HTTP-Referer":"https://learnflow.ext","X-Title":"LearnFlow"});
    if (provider === "huggingface") return callOpenAICompat(`https://api-inference.huggingface.co/models/${model}/v1/chat/completions`, key, model, system);

    throw new Error("Unknown provider: " + provider);
  }

  function buildSystemPrompt(ctx, type, pageStats) {
    const deepNote = deepThinkMode
      ? "\n\nDEEP THINK MODE IS ACTIVE: Reason carefully and thoroughly. Think step by step. Provide comprehensive, well-structured, detailed analysis. Do not cut corners. Explain your reasoning."
      : "";

    return `You are LearnFlow v3, an expert AI research assistant embedded in a Chrome extension. You have deep knowledge of the current webpage.

PAGE METADATA:
- Type: ${type}
- URL: ${location.href}
- Title: ${document.title}
- Domain: ${location.hostname}
${deepNote}

INSTRUCTIONS:
- Be precise, thorough, and well-structured.
- Use markdown: **bold**, bullet points, headers (##, ###), code blocks, tables.
- Ground your answers in the actual page content provided below.
- If the user asks about something not in the page, say so clearly but still help from your general knowledge.
- For facts and claims, cite where in the page you found them when possible.
- Be analytical, not just descriptive.

=== EXTRACTED PAGE CONTENT (${ctx.length} chars) ===
${ctx}
=== END OF PAGE CONTENT ===`;
  }

  /* ── Provider implementations ── */

  async function callGemini(key, model, system) {
    const actualModel = model || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${key}`;
    
    // Enhanced Gemini call with generation config
    const contents = conversationHistory.slice(-16).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    
    const body = {
      contents,
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: {
        temperature: deepThinkMode ? 0.7 : 0.5,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: deepThinkMode ? 8192 : 4096,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    };
    
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    if (!resp.ok) {
      const errorText = await resp.text().catch(() => "");
      let errorData = {};
      try { errorData = JSON.parse(errorText); } catch {}
      
      if (resp.status === 429) {
        throw new Error("Gemini rate limit exceeded — free tier allows 15 requests/minute. Wait a moment or upgrade your API tier.");
      }
      if (resp.status === 403) {
        throw new Error("Gemini API key invalid or expired — get a fresh key from aistudio.google.com");
      }
      if (resp.status === 400) {
        throw new Error("Gemini invalid request: " + (errorData.error?.details?.[0]?.reason || errorText));
      }
      throw new Error(errorData.error?.message || "Gemini HTTP " + resp.status);
    }
    
    const d = await resp.json();
    
    if (!d.candidates || d.candidates.length === 0) {
      if (d.promptFeedback?.blockReason) {
        throw new Error("Gemini blocked this content: " + d.promptFeedback.blockReason);
      }
      throw new Error("No response from Gemini");
    }
    
    const candidate = d.candidates[0];
    if (candidate.finishReason === "SAFETY") {
      throw new Error("Gemini response blocked by safety filters");
    }
    
    return candidate.content?.parts?.[0]?.text || "";
  }

  async function callOpenAICompat(url, key, model, system, extraHeaders = {}) {
    const msgs = [{ role: "system", content: system }, ...conversationHistory.slice(-16)];
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key, ...extraHeaders },
      body: JSON.stringify({ model, max_tokens: 3000, messages: msgs }),
    });
    if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error?.message || "HTTP " + resp.status); }
    const d = await resp.json();
    return d.choices?.[0]?.message?.content || "";
  }

  /* ═══════════════════════════════════════════════
     RENDERING
  ═══════════════════════════════════════════════ */
  function appendMessage(role, text) {
    const msgs = document.getElementById("bh-messages");
    if (!msgs) return;
    const div = document.createElement("div");
    div.className = `bh-msg ${role}`;
    div.innerHTML =
      role === "assistant"
        ? `<div class="bh-msg-label">${deepThinkMode ? "// 🧠 DEEP THINK" : "// LEARNFLOW"}</div>${renderMd(text)}`
        : escHtml(text).replace(/\n/g, "<br>");
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showThinking(isDeep) {
    const msgs = document.getElementById("bh-messages");
    const div = document.createElement("div");
    div.className = "bh-thinking";
    div.innerHTML = isDeep
      ? `🧠 Deep thinking <div class="bh-dots"><span></span><span></span><span></span></div>`
      : `Analyzing <div class="bh-dots"><span></span><span></span><span></span></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function escHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function friendlyError(err) {
    const msg = (err.message || "").toLowerCase();
    
    // Gemini-specific errors first
    if (msg.includes("gemini") || msg.includes("generativelanguage")) {
      if (msg.includes("rate limit") || msg.includes("quota") || msg.includes("429"))
        return "❌ **Gemini Rate Limit** — you've hit the API quota.\n\n💡 Free tier: 15 requests/minute. Wait ~1 minute or upgrade at aistudio.google.com\n\n🔄 Or switch to Groq/OpenRouter for unlimited free requests.";
      if (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("403"))
        return "❌ **Invalid Gemini API Key** — the key was rejected.\n\n💡 Get a fresh key: https://aistudio.google.com/app/apikey\n\n📝 Keys start with `AIza…`";
      if (msg.includes("blocked") || msg.includes("safety"))
        return "⚠️ **Content Filtered** — Gemini blocked this request due to safety policies.\n\n💡 Try rephrasing your question or use a different provider.";
      if (msg.includes("invalid request") || msg.includes("400"))
        return "❌ **Invalid Request** — Gemini rejected the request format.\n\n💡 Try a simpler question or switch models.";
    }
    
    // Generic errors
    if (msg.includes("insufficient balance") || msg.includes("insufficient_balance") || msg.includes("out of credits"))
      return "❌ Insufficient balance — your API key has run out of credits.\n\n💡 Top up at the provider's billing page, or switch to a free provider like **Groq** or **OpenRouter** in Settings.";
    if (msg.includes("invalid api key") || msg.includes("incorrect api key") || msg.includes("unauthorized") || msg.includes("authentication"))
      return "❌ Invalid API key — the key was rejected by the provider.\n\n💡 Open the popup → Settings → re-enter your key.";
    if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("429"))
      return "❌ Rate limit hit — you've sent too many requests.\n\n💡 Wait a moment and try again, or switch to a different provider.";
    if (msg.includes("quota") || msg.includes("limit exceeded"))
      return "❌ Quota exceeded — you've hit your plan's usage limit.\n\n💡 Check your usage dashboard or switch to a free provider like Groq or OpenRouter.";
    if (msg.includes("model not found") || msg.includes("no such model"))
      return "❌ Model not found — the selected model may be unavailable.\n\n💡 Go to Settings and choose a different model.";
    if (msg.includes("context length") || msg.includes("token") && msg.includes("exceed"))
      return "❌ Page too large — the content exceeds the model's context limit.\n\n💡 Try a simpler question, or use a model with a larger context window.";
    if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("load failed"))
      return "❌ Network error — couldn't reach the API.\n\n💡 Check your internet connection and try again.";
    return "❌ Error: " + err.message;
  }

  function renderMd(text) {
    return escHtml(text)
      .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
        `<pre class="bh-code-block"><code>${code.trim()}</code></pre>`)
      .replace(/`([^`\n]+)`/g, `<code class="bh-inline-code">$1</code>`)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^### (.+)$/gm, "<h4 class='bh-h'>$1</h4>")
      .replace(/^## (.+)$/gm, "<h3 class='bh-h'>$1</h3>")
      .replace(/^# (.+)$/gm, "<h2 class='bh-h'>$1</h2>")
      .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
      .replace(/^(\d+)\. (.+)$/gm, "<li><b>$1.</b> $2</li>")
      .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");
  }

  /* ═══════════════════════════════════════════════
     TOGGLE
  ═══════════════════════════════════════════════ */
  function toggleSidebar(force) {
    let sidebar = document.getElementById("learnflow-sidebar");
    if (!sidebar) sidebar = buildSidebar();
    sidebarOpen = force !== undefined ? force : !sidebarOpen;
    sidebar.classList.toggle("open", sidebarOpen);
    document.documentElement.style.transition = "margin-right 0.3s cubic-bezier(0.4,0,0.2,1)";
    document.documentElement.style.marginRight = sidebarOpen ? "400px" : "";
  }

  /* ═══════════════════════════════════════════════
     SELECTION TOOLTIP
  ═══════════════════════════════════════════════ */
  let tooltip = null, hideTimeout;

  function buildTooltip() {
    const t = document.createElement("div");
    t.id = "bh-selection-tooltip";
    t.innerHTML = `
      <button class="bh-sel-btn" data-action="explain">Explain</button>
      <button class="bh-sel-btn" data-action="summarize">Summarize</button>
      <button class="bh-sel-btn" data-action="solve">✏️ Solve</button>
      <button class="bh-sel-btn" data-action="define">Define</button>
      <button class="bh-sel-btn" data-action="translate">Translate</button>
      <button class="bh-sel-btn" data-action="deep">🧠 Deep</button>
    `;
    document.body.appendChild(t);
    return t;
  }

  document.addEventListener("mouseup", () => {
    clearTimeout(hideTimeout);
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (!text || text.length < 5) { hideTooltip(); return; }
      if (!tooltip) tooltip = buildTooltip();
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      tooltip.style.left = Math.max(0, Math.min(rect.left, window.innerWidth - 320)) + "px";
      tooltip.style.top = rect.top + window.scrollY - 46 + "px";
      tooltip.classList.add("visible");
      tooltip.querySelectorAll(".bh-sel-btn").forEach((btn) => {
        btn.onclick = () => {
          const prompts = {
            explain: `Explain this in depth with context, examples, and significance: "${text}"`,
            summarize: `Summarize this in 2-3 sentences, capturing the key idea: "${text}"`,
            solve: `Solve this problem methodically. Restate what's being asked, identify given information, show step-by-step reasoning, provide a clear final answer, and verify the result: "${text}"`,
            define: `Define all key terms, concepts, and jargon in: "${text}"`,
            translate: `Translate to English (or French if already English): "${text}"`,
            deep: `Perform a comprehensive deep analysis of this text — meaning, context, implications, related concepts, what it reveals: "${text}"`,
          };
          const wasDeep = btn.dataset.action === "deep";
          hideTooltip();
          if (!sidebarOpen) toggleSidebar(true);
          if (wasDeep) deepThinkMode = true;
          setTimeout(() => sendMessage(prompts[btn.dataset.action]), 400);
        };
      });
    }, 80);
  });

  document.addEventListener("mousedown", (e) => {
    if (!tooltip?.contains(e.target)) hideTimeout = setTimeout(hideTooltip, 150);
  });

  function hideTooltip() { tooltip?.classList.remove("visible"); }

  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "s") toggleSidebar();
    if (e.key === "Escape" && sidebarOpen) toggleSidebar(false);
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "toggleSidebar") toggleSidebar();
    if (msg.action === "sendPrompt" && msg.prompt) {
      if (!sidebarOpen) toggleSidebar(true);
      setTimeout(() => sendMessage(msg.prompt), 500);
    }
  });
})();
