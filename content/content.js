// LearnFlow Content Script v5 — Complete Fix with Screenshot, Course Extract, Vision Support
(function () {
  if (window.__learnflowLoaded) return;
  window.__learnflowLoaded = true;

  /* ═══════════════════════════════════════════════
     PAGE ANALYZER — Enhanced for Course Pages
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
      
      // NEW: Course platform detection
      if (url.includes("coursera.org") || url.includes("udemy.com") || url.includes("edx.org") || 
          url.includes("khanacademy.org") || url.includes("skillshare.com") || url.includes("linkedin.com/learning") ||
          document.querySelector(".video-player, .lesson-content, .course-content, .module-content, .lesson-video")) {
        return "course";
      }
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
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) lines.push(`canonical: ${canonical.href}`);
      if (document.documentElement.lang) lines.push(`lang: ${document.documentElement.lang}`);
      return lines.join("\n");
    },

    analyzePageStats() {
      const bodyText = document.body?.innerText || "";
      const words = bodyText.trim().split(/\s+/).filter(Boolean);
      const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const readingMinutes = Math.ceil(words.length / 200);

      const allLinks = [...document.querySelectorAll("a[href]")];
      const internalLinks = allLinks.filter(a => a.hostname === location.hostname);
      const externalLinks = allLinks.filter(a => a.hostname && a.hostname !== location.hostname);

      const images = [...document.querySelectorAll("img[src]")];
      const imagesWithAlt = images.filter(img => img.alt?.trim());

      const headings = [...document.querySelectorAll("h1,h2,h3,h4")].map(h => ({
        level: h.tagName, text: h.innerText?.trim().slice(0, 80)
      })).filter(h => h.text).slice(0, 20);

      const videos = document.querySelectorAll("video, iframe[src*='youtube'], iframe[src*='vimeo']").length;

      const timing = performance?.timing;
      const loadTime = timing ? Math.round(timing.loadEventEnd - timing.navigationStart) : null;

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

    // NEW: Enhanced course content extraction
    extractCourseContent() {
      const url = location.href.toLowerCase();
      const parts = [];
      
      // Detect course platform
      let platform = "Unknown";
      if (url.includes("coursera")) platform = "Coursera";
      else if (url.includes("udemy")) platform = "Udemy";
      else if (url.includes("edx")) platform = "edX";
      else if (url.includes("khanacademy")) platform = "Khan Academy";
      else if (url.includes("skillshare")) platform = "Skillshare";
      else if (url.includes("linkedin.com/learning")) platform = "LinkedIn Learning";
      
      parts.push(`=== COURSE CONTENT (${platform}) ===`);
      
      // Extract video title/description
      const videoTitle = document.querySelector('h1, .video-title, .lesson-title, .section-title')?.innerText?.trim();
      if (videoTitle) parts.push(`\n**Video/Lesson Title:** ${videoTitle}`);
      
      // Extract instructor info
      const instructor = document.querySelector('.instructor-name, .teacher-name, [class*="instructor"], [class*="teacher"]')?.innerText?.trim();
      if (instructor) parts.push(`**Instructor:** ${instructor}`);
      
      // Extract video transcript/captions if available
      const transcript = document.querySelector('.transcript, .captions, [class*="transcript"]')?.innerText?.trim();
      if (transcript) parts.push(`\n**Transcript:**\n${transcript.slice(0, 3000)}`);
      
      // Extract lesson description
      const description = document.querySelector('.description, .lesson-description, .course-description, [itemprop="description"]')?.innerText?.trim();
      if (description) parts.push(`\n**Description:**\n${description.slice(0, 1500)}`);
      
      // Extract main content area
      const mainContent = document.querySelector('main, article, .content, .lesson-content, .course-content, .module-content')?.innerText?.trim();
      if (mainContent && mainContent.length > 200) {
        parts.push(`\n**Main Content:**\n${mainContent.slice(0, 5000)}`);
      }
      
      // Extract quiz questions if present
      const quizQuestions = [...document.querySelectorAll('.quiz-question, .question-text, [class*="question"]')].map(q => q.innerText?.trim()).filter(Boolean);
      if (quizQuestions.length > 0) {
        parts.push(`\n**Quiz Questions:**\n${quizQuestions.join('\n---\n').slice(0, 2000)}`);
      }
      
      // Extract code examples
      const codeBlocks = [...document.querySelectorAll('pre code, pre, code')].map(c => c.innerText?.trim()).filter(Boolean);
      if (codeBlocks.length > 0) {
        parts.push(`\n**Code Examples:**\n${codeBlocks.slice(0, 5).join('\n---\n').slice(0, 3000)}`);
      }
      
      // Extract slide/text content
      const slides = document.querySelector('.slide-content, .presentation-content, .lecture-content')?.innerText?.trim();
      if (slides) parts.push(`\n**Slide Content:**\n${slides.slice(0, 3000)}`);
      
      // Fallback: extract all readable text
      if (parts.length < 3) {
        const bodyText = document.body?.innerText?.trim();
        if (bodyText && bodyText.length > 500) {
          parts.push(`\n**Page Content:**\n${bodyText.slice(0, 6000)}`);
        }
      }
      
      return parts.filter(Boolean).join("\n\n");
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

      if (type === "course") {
        parts.push(this.extractCourseContent());
      } else if (type === "youtube") {
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
  let currentSettings = null;

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
      console.error("LearnFlow extraction error:", err);
    }
  }

  /* ═══════════════════════════════════════════════
     MESSAGING — FIXED with proper error handling
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
      console.error("LearnFlow AI error:", err);
      appendMessage("assistant", friendlyError(err));
    }
  }

  // NEW: Handle screenshot capture and explanation
  async function handleScreenshotExplain(imageData, selectionText) {
    const thinking = showThinking(true);
    try {
      const prompt = selectionText 
        ? `Explain what's shown in this screenshot. Also address this selected text: "${selectionText}"`
        : "Explain what's shown in this screenshot in detail.";
      
      conversationHistory.push({ role: "user", content: prompt, image: imageData });
      const answer = await callAIWithVision(imageData, prompt);
      thinking.remove();
      conversationHistory.push({ role: "assistant", content: answer });
      appendMessage("assistant", answer);
    } catch (err) {
      thinking.remove();
      console.error("LearnFlow screenshot error:", err);
      appendMessage("assistant", friendlyError(err));
    }
  }

  // NEW: Handle course content extraction and explanation
  async function handleCourseExplain() {
    const thinking = showThinking(true);
    try {
      const courseContent = Extractor.extractCourseContent();
      const prompt = `This is course content from ${location.hostname}. Explain the key concepts, learning objectives, and main takeaways. Structure your response with:\n\n**Course Topic:** (what is being taught)\n**Key Concepts:** (3-5 main ideas)\n**Learning Objectives:** (what you should learn)\n**Important Details:** (specific facts, steps, or information)\n**Summary:** (brief recap)\n\nHere's the extracted content:\n\n${courseContent}`;
      
      conversationHistory.push({ role: "user", content: prompt });
      const answer = await callAI();
      thinking.remove();
      conversationHistory.push({ role: "assistant", content: answer });
      appendMessage("assistant", answer);
    } catch (err) {
      thinking.remove();
      console.error("LearnFlow course extract error:", err);
      appendMessage("assistant", friendlyError(err));
    }
  }

  async function callAI() {
    // Load settings fresh each time
    const stored = await chrome.storage.local.get(["settings"]).catch(err => {
      console.error("Failed to load settings:", err);
      return { settings: null };
    });
    
    const settings = stored.settings || {};
    
    // FIXED: Proper API key validation
    const provider = settings.activeProvider || "groq";
    const model = settings.activeModel || "llama-3.3-70b-versatile";
    const keys = settings.keys || {};
    const key = keys[provider];
    
    // Better error messages for missing keys
    if (!provider) {
      throw new Error("No provider selected. Go to LearnFlow Settings and choose a provider (Groq recommended).");
    }
    
    if (!key || key.trim() === "") {
      const providerNames = { groq: "Groq", gemini: "Gemini", openrouter: "OpenRouter", huggingface: "Hugging Face" };
      throw new Error(`Missing API key for ${providerNames[provider] || provider}. Go to LearnFlow Settings → API Keys and add your ${provider} key.`);
    }

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

  // NEW: Vision-capable AI call (uses Gemini for screenshots)
  async function callAIWithVision(imageData, prompt) {
    const stored = await chrome.storage.local.get(["settings"]);
    const settings = stored.settings || {};
    const keys = settings.keys || {};
    
    // Always use Gemini for vision (Groq doesn't support images)
    const geminiKey = keys.gemini;
    if (!geminiKey) {
      throw new Error("Screenshot explanation requires a Gemini API key. Go to Settings and add your Gemini key (free at aistudio.google.com).");
    }
    
    const model = "gemini-2.0-flash"; // Vision-capable model
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
    
    const body = {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/png", data: imageData } }
        ]
      }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
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
        throw new Error("Gemini rate limit exceeded. Wait a moment or upgrade your API tier.");
      }
      if (resp.status === 403) {
        throw new Error("Gemini API key invalid. Get a fresh key from aistudio.google.com");
      }
      throw new Error(errorData.error?.message || "Gemini HTTP " + resp.status);
    }
    
    const d = await resp.json();
    
    if (!d.candidates || d.candidates.length === 0) {
      if (d.promptFeedback?.blockReason) {
        throw new Error("Gemini blocked: " + d.promptFeedback.blockReason);
      }
      throw new Error("No response from Gemini");
    }
    
    const candidate = d.candidates[0];
    if (candidate.finishReason === "SAFETY") {
      throw new Error("Gemini response blocked by safety filters");
    }
    
    return candidate.content?.parts?.[0]?.text || "";
  }

  // Industry-standard system prompt with best practices
  function buildSystemPrompt(ctx, type, pageStats) {
    const deepNote = deepThinkMode
      ? "\n\n**DEEP THINK MODE ACTIVE:** Use extended reasoning. Think step-by-step. Provide comprehensive, well-structured analysis. Explain your reasoning clearly. Do not skip steps."
      : "\n\n**MODE:** Standard — be concise but thorough.";

    return `You are LearnFlow v5, an expert AI research assistant embedded in a Chrome extension. You analyze webpages and provide clear, accurate, well-structured explanations.

## YOUR ROLE
- Ground all answers in the provided page content
- Cite specific sections when making claims
- Be analytical, not just descriptive
- Admit when information is not in the page
- Use general knowledge to supplement when appropriate

## RESPONSE FORMAT
- Use markdown: **bold** for emphasis, ## headers, bullet points, code blocks
- Structure responses logically with clear sections
- Keep explanations accessible but not simplistic
- Define technical terms when first used

## PAGE CONTEXT
- Type: ${type}
- URL: ${location.href}
- Title: ${document.title}
- Domain: ${location.hostname}
${deepNote}

## QUALITY STANDARDS
1. **Accuracy:** Only state what you can verify from the content
2. **Clarity:** Use plain language, short sentences, concrete examples
3. **Completeness:** Address all parts of the user's question
4. **Structure:** Organize with headers, lists, and logical flow
5. **Evidence:** Reference specific parts of the page when possible

=== EXTRACTED PAGE CONTENT (${ctx.length} chars) ===
${ctx}
=== END OF PAGE CONTENT ===

Remember: The user is viewing this page right now. Help them understand it deeply.`;
  }

  /* ── Provider implementations ── */

  async function callGemini(key, model, system) {
    const actualModel = model || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${key}`;
    
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
        throw new Error("Gemini rate limit exceeded — free tier allows 15 requests/minute. Wait a moment or upgrade.");
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
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": "Bearer " + key,
        ...extraHeaders 
      },
      body: JSON.stringify({ 
        model, 
        max_tokens: deepThinkMode ? 4096 : 2048, 
        temperature: deepThinkMode ? 0.7 : 0.5,
        messages: msgs 
      }),
    });
    
    if (!resp.ok) { 
      const e = await resp.json().catch(() => ({})); 
      const errorMsg = e.error?.message || "HTTP " + resp.status;
      
      if (resp.status === 401 || resp.status === 403) {
        throw new Error("Invalid API key — the key was rejected. Check your key in Settings.");
      }
      if (resp.status === 429) {
        throw new Error("Rate limit hit — API is busy. Wait a moment and try again.");
      }
      if (resp.status === 402) {
        throw new Error("Insufficient credits — your account has run out of credits.");
      }
      throw new Error(errorMsg); 
    }
    const d = await resp.json();
    return d.choices?.[0]?.message?.content || "";
  }

  /* ═══════════════════════════════════════════════
     ERROR HANDLING — Improved messages
  ═══════════════════════════════════════════════ */
  function friendlyError(err) {
    const msg = (err.message || "").toLowerCase();
    
    // API Key errors (most common issue)
    if (msg.includes("missing api key") || msg.includes("no api key")) {
      return "❌ **Missing API Key**\n\n" + err.message + "\n\n💡 **Fix:** Open LearnFlow popup → Settings → API Keys → Add your key\n\n📝 Groq keys: https://console.groq.com/keys (free)\n💎 Gemini keys: https://aistudio.google.com/app/apikey (free tier)";
    }
    
    if (msg.includes("invalid api key") || msg.includes("unauthorized") || msg.includes("401") || msg.includes("403")) {
      return "❌ **Invalid API Key**\n\nThe API key was rejected by the provider.\n\n💡 **Fix:**\n1. Go to LearnFlow Settings\n2. Re-enter your API key\n3. Make sure there are no spaces\n4. Save and try again\n\n📝 Get a new key if needed:\n• Groq: https://console.groq.com/keys\n• Gemini: https://aistudio.google.com/app/apikey";
    }
    
    // Rate limiting
    if (msg.includes("rate limit") || msg.includes("quota") || msg.includes("429") || msg.includes("too many requests")) {
      if (msg.includes("gemini")) {
        return "❌ **Gemini Rate Limit**\n\nFree tier: 15 requests/minute.\n\n💡 Wait ~60 seconds and try again\n💡 Or switch to Groq for unlimited free requests";
      }
      return "❌ **Rate Limit Hit**\n\nYou've sent too many requests too quickly.\n\n💡 Wait 30-60 seconds and try again\n💡 Consider upgrading your API plan";
    }
    
    // Credits/billing
    if (msg.includes("insufficient") || msg.includes("credits") || msg.includes("balance") || msg.includes("402")) {
      return "❌ **Out of Credits**\n\nYour API account has no credits left.\n\n💡 Top up at your provider's billing page\n💡 Or switch to Groq (free unlimited tier)";
    }
    
    // Safety/content filters
    if (msg.includes("blocked") || msg.includes("safety") || msg.includes("content policy")) {
      return "⚠️ **Content Filtered**\n\nThe AI provider blocked this request due to safety policies.\n\n💡 Try rephrasing your question\n💡 Use different wording";
    }
    
    // Network errors
    if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("load failed")) {
      return "❌ **Network Error**\n\nCouldn't reach the API.\n\n💡 Check your internet connection\n💡 Try again in a moment\n💡 Make sure you're not behind a firewall";
    }
    
    // Model errors
    if (msg.includes("model not found") || msg.includes("no such model") || msg.includes("invalid model")) {
      return "❌ **Model Not Found**\n\nThe selected model is unavailable.\n\n💡 Go to Settings and choose a different model\n💡 Groq's `llama-3.3-70b-versatile` is recommended";
    }
    
    // Context length
    if (msg.includes("context length") || (msg.includes("token") && msg.includes("exceed"))) {
      return "❌ **Content Too Large**\n\nThe page exceeds the model's context limit.\n\n💡 Try a more specific question\n💡 Use Deep Think mode for better handling";
    }
    
    // Default
    return "❌ **Error:** " + err.message + "\n\n💡 Try again or check your Settings";
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
     SELECTION TOOLTIP — FIXED with retry logic
  ═══════════════════════════════════════════════ */
  let tooltip = null, hideTimeout, lastRequestTime = 0;

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
      
      // Check if tooltip exists
      if (!tooltip) tooltip = buildTooltip();
      
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Position tooltip above selection
      tooltip.style.left = Math.max(10, Math.min(rect.left, window.innerWidth - 320)) + "px";
      tooltip.style.top = rect.top + window.scrollY - 46 + "px";
      tooltip.classList.add("visible");
      
      // Set up button handlers with retry logic
      tooltip.querySelectorAll(".bh-sel-btn").forEach((btn) => {
        btn.onclick = async () => {
          const prompts = {
            explain: `Explain this in depth with context, examples, and significance: "${text}"`,
            summarize: `Summarize this in 2-3 sentences, capturing the key idea: "${text}"`,
            solve: `Solve this problem methodically. Restate what's being asked, identify given information, show step-by-step reasoning, provide a clear final answer, and verify the result: "${text}"`,
            define: `Define all key terms, concepts, and jargon in: "${text}"`,
            translate: `Translate to English (or French if already English): "${text}"`,
            deep: `Perform a comprehensive deep analysis of this text — meaning, context, implications, related concepts, what it reveals: "${text}"`,
          };
          
          hideTooltip();
          
          const wasDeep = btn.dataset.action === "deep";
          if (!sidebarOpen) toggleSidebar(true);
          if (wasDeep) deepThinkMode = true;
          
          // Wait for sidebar to open
          await new Promise(resolve => setTimeout(resolve, 400));
          
          // FIXED: Add retry logic for failed requests
          const maxRetries = 2;
          let attempt = 0;
          let success = false;
          
          while (attempt <= maxRetries && !success) {
            try {
              await sendMessage(prompts[btn.dataset.action]);
              success = true;
              lastRequestTime = Date.now();
            } catch (err) {
              attempt++;
              if (attempt <= maxRetries) {
                console.log(`LearnFlow: Retrying request (attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
              } else {
                console.error("LearnFlow: All retry attempts failed");
              }
            }
          }
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

  /* ═══════════════════════════════════════════════
     MESSAGE LISTENER — NEW handlers for screenshot & course
  ═══════════════════════════════════════════════ */
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "toggleSidebar") {
      toggleSidebar();
      sendResponse({ ok: true });
      return true;
    }
    
    if (msg.action === "sendPrompt" && msg.prompt) {
      if (!sidebarOpen) toggleSidebar(true);
      setTimeout(() => sendMessage(msg.prompt), 500);
      sendResponse({ ok: true });
      return true;
    }
    
    // NEW: Handle screenshot capture request
    if (msg.action === "captureAndExplain") {
      captureScreenshot().then(imageData => {
        handleScreenshotExplain(imageData, msg.selection);
      }).catch(err => {
        console.error("Screenshot capture failed:", err);
        if (!sidebarOpen) toggleSidebar(true);
        setTimeout(() => {
          sendMessage("Screenshot capture failed: " + err.message + ". Try using 'Extract & Explain Course Content' instead for text-based extraction.");
        }, 500);
      });
      sendResponse({ ok: true });
      return true;
    }
    
    // NEW: Handle course extraction request
    if (msg.action === "extractAndExplainCourse") {
      if (!sidebarOpen) toggleSidebar(true);
      setTimeout(() => handleCourseExplain(), 500);
      sendResponse({ ok: true });
      return true;
    }
    
    // Handle screenshot data from background
    if (msg.action === "processScreenshot" && msg.imageData) {
      handleScreenshotExplain(msg.imageData, "");
      sendResponse({ ok: true });
      return true;
    }
    
    sendResponse({ ok: true });
    return true;
  });

  // NEW: Screenshot capture function
  async function captureScreenshot() {
    return new Promise((resolve, reject) => {
      try {
        // Use chrome.tabs.captureVisibleTab via background script
        chrome.runtime.sendMessage({ 
          action: "captureVisibleTab",
          format: "png"
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.error) {
            reject(new Error(response.error));
          } else if (response && response.dataUrl) {
            // Extract base64 data from data URL
            const base64Data = response.dataUrl.split(',')[1];
            resolve(base64Data);
          } else {
            reject(new Error("No screenshot data received"));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // Auto-initialize
  console.log("LearnFlow v5 content script loaded");
})();
