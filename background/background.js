// LearnFlow Background Service Worker v5.5 — Guaranteed Context Menu Registration

console.log("🦎 LearnFlow Background v5.5 loading...");

// Immediately create menus when service worker starts
createContextMenuItems();

// Also create on install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log("✅ LearnFlow: Extension installed/updated", details.reason);
  createContextMenuItems();
});

// Recreate on browser startup
chrome.runtime.onStartup.addListener(() => {
  console.log("✅ LearnFlow: Browser started, creating menus");
  createContextMenuItems();
});

// Function to create all context menu items
function createContextMenuItems() {
  console.log("📋 LearnFlow: Creating context menus...");
  
  // Remove all existing menus first (prevents duplicates and ensures clean state)
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.error("❌ LearnFlow: Failed to remove old menus:", chrome.runtime.lastError);
      return;
    }
    
    const menus = [
      // Selection context menus
      {
        id: "lf-explain",
        title: "LearnFlow: Explain selection",
        contexts: ["selection"],
      },
      {
        id: "lf-summarize-sel",
        title: "LearnFlow: Summarize selection",
        contexts: ["selection"],
      },
      {
        id: "lf-research",
        title: "LearnFlow: Deep research this topic",
        contexts: ["selection"],
      },
      // Page context menus
      {
        id: "lf-summarize-page",
        title: "LearnFlow: Summarize this page",
        contexts: ["page"],
      },
      {
        id: "lf-deep-analyze",
        title: "LearnFlow: Deep analyze this page",
        contexts: ["page"],
      },
      // NEW: Screenshot + Explain (both page and selection)
      {
        id: "lf-screenshot-explain",
        title: "LearnFlow: 📸 Screenshot & Explain",
        contexts: ["page", "selection"],
      },
      // NEW: Course Page DOM Extract & Explain
      {
        id: "lf-course-explain",
        title: "LearnFlow: 📚 Extract & Explain Course Content",
        contexts: ["page"],
      },
    ];

    // Create all menus
    let created = 0;
    menus.forEach(menu => {
      chrome.contextMenus.create(menu, (menuId) => {
        if (chrome.runtime.lastError) {
          console.error("❌ LearnFlow: Failed to create menu", menu.id, chrome.runtime.lastError);
        } else {
          console.log("✅ LearnFlow: Created menu", menuId, "-", menu.title);
          created++;
        }
      });
    });

    console.log(`📋 LearnFlow: Context menu creation complete (${created}/${menus.length} menus created)`);
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("LearnFlow: Menu clicked:", info.menuItemId, "on tab:", tab?.url);
  
  const sel = info.selectionText || "";
  
  const prompts = {
    "lf-explain": `Explain this in depth with examples, context, and significance: "${sel}"`,
    "lf-summarize-sel": `Summarize this concisely, capturing the key idea: "${sel}"`,
    "lf-research": `Research and explain everything important about: "${sel}". Include background, key facts, significance, and related concepts.`,
    "lf-summarize-page": "Give me a comprehensive summary of this page including main thesis, key points, evidence, and conclusions.",
    "lf-deep-analyze": "Perform a deep analysis of this page: main arguments, evidence quality, bias, credibility, key insights, and what's missing.",
  };

  // Handle new menu items
  if (info.menuItemId === "lf-screenshot-explain") {
    console.log("LearnFlow: Screenshot & Explain requested");
    // Send screenshot command to content script
    try {
      chrome.tabs.sendMessage(tab.id, { action: "captureAndExplain", selection: sel });
    } catch (err) {
      console.error("LearnFlow: Failed to send screenshot message:", err);
    }
    return;
  }

  if (info.menuItemId === "lf-course-explain") {
    console.log("LearnFlow: Course Extract & Explain requested");
    // Send course extraction command to content script
    try {
      chrome.tabs.sendMessage(tab.id, { action: "extractAndExplainCourse" });
    } catch (err) {
      console.error("LearnFlow: Failed to send course extract message:", err);
    }
    return;
  }

  const prompt = prompts[info.menuItemId];
  if (!prompt) {
    console.warn("LearnFlow: Unknown menu item:", info.menuItemId);
    return;
  }

  // Open sidebar and send prompt
  console.log("LearnFlow: Sending prompt to content script");
  try {
    chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" });
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { action: "sendPrompt", prompt });
    }, 600);
  } catch (err) {
    console.error("LearnFlow: Failed to send message to tab:", err);
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getSettings") {
    chrome.storage.local.get(["settings"], (data) => {
      sendResponse(data.settings || {});
    });
    return true;
  }
  
  // Handle screenshot capture request from content script
  if (msg.action === "captureVisibleTab") {
    console.log("LearnFlow: Capturing visible tab...");
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error("LearnFlow: Screenshot error:", chrome.runtime.lastError.message);
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        console.log("LearnFlow: Screenshot captured successfully");
        sendResponse({ dataUrl });
      }
    });
    return true; // Keep channel open for async response
  }
  
  // Handle screenshot data from content script
  if (msg.action === "screenshotCaptured") {
    // Forward to content script for processing
    chrome.tabs.sendMessage(sender.tab.id, { 
      action: "processScreenshot", 
      imageData: msg.imageData 
    });
    sendResponse({ received: true });
    return true;
  }
  
  // Health check
  if (msg.action === "ping") {
    sendResponse({ status: "ok", version: "4.2" });
    return true;
  }
});

// Log when service worker starts
console.log("LearnFlow Background Service Worker v4.2 loaded");
console.log("LearnFlow: Initializing context menus...");
