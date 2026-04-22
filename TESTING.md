# LearnFlow v5 - Testing Guide

## ⚠️ CRITICAL: Reload Extension After Every Code Change

Chrome extensions **DO NOT auto-reload** when you edit files. You MUST manually reload:

### Step 1: Reload Extension
1. Open `chrome://extensions/` in Chrome
2. Find "LearnFlow – AI Research Assistant"
3. Click the **reload icon** 🔄 (circular arrow button)
4. Wait for "Service worker started" message
5. **Keep this tab open** for debugging

### Step 2: Open Debug Consoles

**A. Background Service Worker Console** (MOST IMPORTANT):
1. At `chrome://extensions/`, find LearnFlow
2. Click "**Inspect views: Service worker**" (or "Inspect background page")
3. A DevTools window opens - keep it open
4. You should see:
   ```
   LearnFlow Background Service Worker v4.2 loaded
   LearnFlow: Initializing context menus...
   LearnFlow: Created menu lf-explain
   LearnFlow: Created menu lf-summarize-sel
   LearnFlow: Created menu lf-research
   LearnFlow: Created menu lf-summarize-page
   LearnFlow: Created menu lf-deep-analyze
   LearnFlow: Created menu lf-screenshot-explain
   LearnFlow: Created menu lf-course-explain
   LearnFlow: Context menu creation initiated
   ```

**B. Content Script Console** (on test page):
1. Open `https://example.com`
2. Right-click page → **Inspect**
3. Go to **Console** tab
4. You should see:
   ```
   LearnFlow v5 content script loaded
   ```

### Step 3: Test Right-Click Menus

**Test 1: Page Menu**
1. Go to `https://example.com` (simple test page)
2. Right-click on **empty space** (not on links or images)
3. Look in the context menu for:
   - ✅ "LearnFlow: 📸 Screenshot & Explain"
   - ✅ "LearnFlow: 📚 Extract & Explain Course Content"
   - ✅ "LearnFlow: Summarize this page"
   - ✅ "LearnFlow: Deep analyze this page"

**Test 2: Selection Menu**
1. On `https://example.com`, select the text "Example Domain"
2. Right-click **on the selected text**
3. Look for:
   - ✅ "LearnFlow: Explain selection"
   - ✅ "LearnFlow: Summarize selection"
   - ✅ "LearnFlow: Deep research this topic"
   - ✅ "LearnFlow: 📸 Screenshot & Explain"

### Step 4: Debug If Menus Don't Appear

**Check Background Console for errors:**
- Red errors? → Report them
- No "Created menu" logs? → Service worker didn't start
- Menus created but don't show? → Try Test 3

**Test 3: Force Menu Recreation**
In the background service worker console, type:
```javascript
createContextMenuItems();
```
Press Enter, then try right-clicking again.

**Test 4: Check Extension is Active**
In background console, type:
```javascript
chrome.runtime.id
```
Should return the extension ID. If not, extension isn't loaded.

### Step 5: Test Menu Clicks

Click any menu item and watch the background console:
```
LearnFlow: Menu clicked: lf-screenshot-explain on tab: https://example.com
LearnFlow: Screenshot & Explain requested
```

If you don't see this log, the click isn't being registered.

## Common Issues & Fixes

### Issue 1: "No menus created" in console
**Fix:** Extension didn't load properly
- Disable extension at `chrome://extensions/`
- Re-enable it
- Reload again

### Issue 2: Menus show in console but not on right-click
**Possible causes:**
- Right-clicking on special elements (links, images, inputs)
- On a Chrome internal page (`chrome://`, `chrome-extension://`)
- Corporate Chrome installation blocking extensions

**Fix:**
- Try `https://example.com`
- Right-click on empty space
- Check for enterprise policies: `chrome://management`

### Issue 3: "Cannot access tab" errors
**Cause:** Content script not loaded on that tab
**Fix:** Refresh the page after extension reload

### Issue 4: Menus appear but clicking does nothing
**Check:**
1. Content script loaded? (check page console)
2. Sidebar appears? (should slide in from right)
3. Any errors in page console?

## Quick Diagnostic Commands

Paste these in the **background service worker console**:

```javascript
// Check if menus exist
chrome.contextMenus.removeAll(() => console.log("Menus cleared"));

// Recreate menus
createContextMenuItems();

// Check extension status
console.log("Extension ID:", chrome.runtime.id);
console.log("Manifest version:", chrome.runtime.getManifest().version);

// Ping test
chrome.runtime.sendMessage(chrome.runtime.id, {action: "ping"}, (resp) => console.log("Ping response:", resp));
```

## Success Criteria

✅ Background console shows all 7 menus created
✅ Right-click on example.com shows LearnFlow menus
✅ Clicking menu logs "Menu clicked: [id]" in background console
✅ Sidebar opens when clicking text selection menus
✅ No red errors in any console

## If All Else Fails

1. **Complete reinstall:**
   - Remove extension from `chrome://extensions/`
   - Close Chrome completely
   - Reopen Chrome
   - Load extension again
   - Reload it

2. **Check Chrome version:**
   - Must be Chrome 88+ for Manifest V3
   - Check: `chrome://settings/help`

3. **Try different Chrome profile:**
   - Some extensions conflict with others
   - Test in a clean profile

## Report Format

If you need help, provide:
1. Background console output (all LearnFlow logs)
2. Page console output (from test page)
3. Chrome version
4. Exact steps you took
5. What you see when right-clicking (screenshot if possible)
