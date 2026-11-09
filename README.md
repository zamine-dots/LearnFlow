# LearnFlow — Browser Research Assistant

A browser-extension prototype for asking questions about webpages, summarizing selected text, and keeping a research conversation beside the page. Built with plain JavaScript, HTML, and CSS.

## Features in the source

- Popup and in-page sidebar for questions, summaries, key points, simplification, and critique.
- Context-menu actions for selected text and the current page.
- Configurable Groq, Gemini, and OpenRouter providers, using your own API keys.
- Conversation history, theme preferences, and text-response downloads.
- Screenshot-related flows that depend on a vision-capable provider.

## Try it locally

The current Manifest V3 uses **`background.scripts`**, which is the Firefox-style background configuration. Start with a current Firefox development profile:

1. Clone the repository.
2. Open `about:debugging#/runtime/this-firefox`.
3. Choose **Load Temporary Add-on** and select `manifest.json`.
4. Open the extension popup, choose a provider, and enter your own API key in Settings.
5. Test a summary on a public, non-sensitive webpage.

There is no npm installation or build step. Temporary add-ons are removed when Firefox closes. This is not a store release, and browser compatibility has not been comprehensively tested. Chromium requires adapting the MV3 background configuration and validating the corresponding APIs before it should be advertised as supported.

## Data and configuration

Provider keys, settings, and conversation history are kept in the browser's extension-local storage. This is local storage, not an encrypted credential vault. Requests send prompts and extracted page context to the selected provider; screenshot flows can also send image data. The manifest requests access to all webpages so that its sidebar can run across sites.

Provider models, availability, and pricing can change. The model identifiers in the source are defaults, not a guarantee of current API access. No keys are included in this repository, and no paid API is required simply to inspect the interface code.

## Code map

| File | Responsibility |
| --- | --- |
| `manifest.json` | Extension entry points and permissions |
| `background/background.js` | Context menus, messaging, and capture coordination |
| `popup/popup.html`, `popup/popup.js` | Popup, settings, conversation UI, and provider requests |
| `content/content.js` | Page extraction, sidebar, and selection actions |
| `content/sidebar.css` | Sidebar styling |

For a quick syntax check with Node.js:

```bash
node --check background/background.js
node --check popup/popup.js
node --check content/content.js
```

These checks only validate JavaScript syntax. Extension loading, browser permissions, page extraction, and live provider requests require separate browser testing. No AI-provider calls were made as part of the documentation review.
