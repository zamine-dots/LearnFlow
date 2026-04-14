// LearnFlow Background Service Worker v3

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "bh-explain",
    title: "LearnFlow: Explain selection",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "bh-summarize-sel",
    title: "LearnFlow: Summarize selection",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "bh-research",
    title: "LearnFlow: Deep research this topic",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "bh-summarize-page",
    title: "LearnFlow: Summarize this page",
    contexts: ["page"],
  });
  chrome.contextMenus.create({
    id: "bh-deep-analyze",
    title: "LearnFlow: Deep analyze this page",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const sel = info.selectionText || "";
  const prompts = {
    "bh-explain": `Explain this in depth with examples and context: "${sel}"`,
    "bh-summarize-sel": `Summarize this concisely: "${sel}"`,
    "bh-research": `Research and explain everything important about: "${sel}". Include background, key facts, significance, and related concepts.`,
    "bh-summarize-page": "Give me a comprehensive summary of this page including main thesis, key points, evidence, and conclusions.",
    "bh-deep-analyze": "Perform a deep analysis of this page: main arguments, evidence quality, bias, credibility, key insights, and what's missing.",
  };
  const prompt = prompts[info.menuItemId];
  if (!prompt) return;

  chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" });
  setTimeout(() => {
    chrome.tabs.sendMessage(tab.id, { action: "sendPrompt", prompt });
  }, 600);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getSettings") {
    chrome.storage.local.get(["settings"], (data) => {
      sendResponse(data.settings || {});
    });
    return true;
  }
});
