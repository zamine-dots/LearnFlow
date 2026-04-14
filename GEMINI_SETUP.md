# LearnFlow – Gemini API Setup Guide

## ✅ Google AI Studio API Key Configuration

LearnFlow is **already configured** to use Google AI Studio API keys for Gemini models. Here's how to get started and make the most of it.

---

## 🔑 Getting Your API Key

### Step 1: Visit Google AI Studio
Go to: **https://aistudio.google.com/app/apikey**

### Step 2: Create/Select a Project
- If prompted, create a new Google Cloud project or select an existing one
- Accept the terms of service

### Step 3: Generate API Key
- Click **"Create API Key"**
- Copy the key (starts with `AIza…`)
- **Important:** Save it securely – you can't view it again!

### Step 4: Add to LearnFlow
1. Open LearnFlow popup (click extension icon)
2. Go to **Settings** tab
3. Select **Google Gemini** provider
4. Paste your key in the input field
5. Click **Save**

---

## 📊 Gemini Models Available

| Model | Context Window | Speed | Best For |
|-------|---------------|-------|----------|
| **Gemini 2.0 Flash** ✦ | 1M tokens | Fastest | Recommended for most tasks |
| Gemini 1.5 Flash | 1M tokens | Very Fast | Quick responses, large docs |
| Gemini 1.5 Flash-8B | 1M tokens | Fastest | Lightweight tasks |
| Gemini 1.5 Pro | 2M tokens | Moderate | Complex reasoning, analysis |

---

## 🆓 Free Tier Limits

Google AI Studio provides a **generous free tier**:

- **15 requests per minute** (RPM)
- **1 million tokens per minute** (TPM)
- **1,500 requests per day**

When you hit the limit, you'll see a rate limit error. Wait ~1 minute or upgrade your quota.

### 💰 Paid Tiers
For higher limits, visit: https://aistudio.google.com/pricing

---

## 🚀 Recent Enhancements (v3.1)

### What's New for Gemini:

1. **Enhanced Generation Config**
   - Adaptive temperature (0.5 normal, 0.7 for Deep Think)
   - Optimized topP/topK for better quality
   - Dynamic maxOutputTokens (4K normal, 8K Deep Think)

2. **Better Error Handling**
   - Gemini-specific error messages
   - Clear rate limit guidance (15 RPM free tier)
   - Safety filter explanations
   - API key validation feedback

3. **Safety Settings**
   - Configurable harm category thresholds
   - Better handling of blocked content
   - Clear user feedback when content is filtered

4. **Improved Response Validation**
   - Checks for empty candidates
   - Handles promptFeedback blocks
   - Validates finishReason

5. **Deep Think Integration**
   - Automatically adjusts generation parameters
   - Uses higher token limits for complex tasks
   - Better reasoning mode support

---

## 🧠 Deep Think Mode

When **Deep Think** is enabled (🧠 badge):

- Temperature increases to 0.7 for more creative reasoning
- Max output tokens doubles to 8192
- Model takes more time for thorough analysis
- Best for: complex analysis, research, multi-step problems

---

## ⚠️ Common Issues & Solutions

### "Rate limit exceeded"
**Cause:** Free tier allows 15 requests/minute  
**Solution:** Wait ~60 seconds, or switch to Groq/OpenRouter for unlimited free requests

### "API key invalid"
**Cause:** Key expired or copied incorrectly  
**Solution:** Get a fresh key from aistudio.google.com – keys start with `AIza…`

### "Content blocked by safety filters"
**Cause:** Request triggered Gemini's safety policies  
**Solution:** Rephrase your question or try a different provider

### "Invalid request"
**Cause:** Malformed API call  
**Solution:** Try a simpler question or switch to a different Gemini model

---

## 🔄 Alternative Free Providers

If you need higher limits or different models:

| Provider | Models | Free Limit | Key URL |
|----------|--------|------------|---------|
| **Groq** | Llama 3.3, Mixtral | Unlimited* | console.groq.com/keys |
| **OpenRouter** | DeepSeek R1, Qwen, free models | Varies | openrouter.ai/keys |
| **HuggingFace** | Llama, Qwen, Phi | Free Inference API | huggingface.co/settings/tokens |

*Groq has rate limits but very generous free tier

---

## 📝 Best Practices

1. **Use Gemini 2.0 Flash** for most tasks – best balance of speed/quality
2. **Enable Deep Think** for complex analysis (but it uses more tokens)
3. **Keep page context on** – helps Gemini understand what you're reading
4. **Switch providers** if you hit rate limits frequently
5. **Monitor usage** at https://aistudio.google.com/usage

---

## 🔐 Security Notes

- API keys are stored **locally** in Chrome storage
- Keys never leave your browser except for API calls to Google
- Never share your API key publicly
- Rotate keys periodically for security

---

## 📞 Support

- Google AI Studio docs: https://ai.google.dev/docs
- Gemini API reference: https://ai.google.dev/api
- LearnFlow issues: Check the extension's GitHub repo

---

**Last updated:** April 2026  
**LearnFlow version:** 3.1+
