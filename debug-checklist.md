# LearnFlow Right-Click Menu Debug Checklist

## Problem: Context menus don't appear on right-click

## Most Likely Causes

### 1. Extension Not Reloaded ⚠️
**Fix:** After code changes, you MUST reload the extension
- Go to `chrome://extensions/`
- Find "LearnFlow – AI Research Assistant"
- Click the **reload icon** 🔄 (circular arrow)
- Wait for it to say "Service worker started"

### 2. Background Script Errors
**Check:** Open Chrome DevTools for the extension
- Go to `chrome://extensions/`
- Find LearnFlow
- Click "Inspect views: Service worker" (or "Inspect background page")
- Look at the Console tab
- You should see:
  - "LearnFlow Background Service Worker v4.1 loaded"
  - "LearnFlow: Extension installed/updated, creating menus..."
  - "LearnFlow: Context menus created successfully"

If you see errors, report them.

### 3. Wrong Right-Click Location
**Test:** Make sure you're right-clicking in the right place:
- **For page menus:** Right-click on empty space (not on a link or image)
- **For selection menus:** First select text, then right-click ON the selected text

### 4. Chrome Context Menu Limitations
Some pages block context menus:
- Chrome internal pages (`chrome://`, `chrome-extension://`)
- PDF viewer
- Some web apps override right-click

**Test on:** A simple page like `example.com` or `google.com`

### 5. Manifest Permission Issue
The manifest has `"contextMenus"` permission ✅ - this is correct.

## Step-by-Step Test

1. **Reload extension** at `chrome://extensions/`
2. **Open a test page** like `https://example.com`
3. **Right-click on empty space** (not on links)
4. **Look for:**
   - "LearnFlow: 📸 Screenshot & Explain"
   - "LearnFlow: 📚 Extract & Explain Course Content"
   - "LearnFlow: Summarize this page"
   - "LearnFlow: Deep analyze this page"

5. **Select some text**, right-click on it
6. **Look for:**
   - "LearnFlow: Explain selection"
   - "LearnFlow: Summarize selection"
   - "LearnFlow: Deep research this topic"
   - "LearnFlow: 📸 Screenshot & Explain"

## If Still Not Working

### Check Service Worker Console
```
chrome://extensions/ → LearnFlow → "Inspect views: Service worker"
```
Look for:
- Any red errors
- "Context menus created successfully" message
- Menu click logs when you right-click

### Check Popup Console
```
chrome://extensions/ → LearnFlow → Click extension icon → Right-click popup → Inspect
```

### Check Content Script Console
On the page you're testing:
```
Right-click page → Inspect → Console tab
```
Look for:
- "LearnFlow v5 content script loaded"

## Quick Fix Commands

If menus still don't show, try:

1. **Disable and re-enable** the extension
2. **Restart Chrome** completely
3. **Re-load the extension** after restart

## Known Issues

- Menus take 1-2 seconds to appear after reload
- Some corporate/managed Chrome installations block extensions
- Incognito mode requires "Allow in incognito" to be enabled
