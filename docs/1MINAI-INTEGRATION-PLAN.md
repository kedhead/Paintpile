# 1min.ai Integration Plan for PaintPile

**Created:** January 14, 2026
**Status:** In Progress
**Goal:** Use 1min.ai as primary AI provider with Anthropic/Replicate as fallbacks

---

## Overview

We want to set up 1min.ai API key as the **main/primary** API for all AI operations in PaintPile. When 1min.ai runs out of tokens, the system should automatically fall back to:
- **Anthropic API** for Claude/text/vision operations
- **Replicate API** for image processing operations

---

## Current AI Usage in PaintPile

### Anthropic (Claude) - `lib/ai/anthropic-client.ts`
| Operation | Method | Model | Purpose |
|-----------|--------|-------|---------|
| Color Analysis | `analyzePaintColors()` | Claude Sonnet 4.5 | Detect colors in miniature photos |
| Recipe Generation | `generateRecipeFromPhoto()` | Claude Sonnet 4.5 | Generate paint recipes from photos |
| Paint Set Expansion | `expandPaintSet()` | Claude Sonnet 4.5 | Identify paints in described sets |
| Generic API | `callAPI()` | Various | Direct API access for scrapers |

### Replicate - `lib/ai/replicate-client.ts`
| Operation | Method | Model | Purpose |
|-----------|--------|-------|---------|
| Image Enhancement | `enhanceImage()` | google/nano-banana | Improve image clarity |
| Background Removal | `aiCleanup()` | cjwbw/rembg | Remove backgrounds |
| Image Recoloring | `recolorImage()` | google/nano-banana | Edit images with prompts |
| Image Upscaling | `upscaleImage()` | nightmareai/real-esrgan | 2x/4x upscaling |
| Text Generation | `generateText()` | meta/meta-llama-3-70b | Text gen (for paint sets) |

---

## 1min.ai API Details

### Base URL
```
https://api.1min.ai/api/
```

### Authentication
```
Header: API-KEY: your_api_key
```

### Endpoints
- `POST /features` - Main endpoint for AI operations
- `POST /assets` - File/image uploads
- `POST /conversations` - Conversation management
- `GET /features?isStreaming=true` - Streaming responses

### Supported Operation Types (via /features)
```json
{
  "type": "CHAT_WITH_AI",      // Text conversations
  "model": "claude-sonnet-4-5",
  "promptObject": {
    "prompt": "Your prompt here"
  }
}
```

```json
{
  "type": "CHAT_WITH_IMAGE",   // Vision/image analysis
  "model": "claude-sonnet-4-5",
  "promptObject": {
    "prompt": "Describe this image",
    "imageList": ["data:image/jpeg;base64,..."]
  }
}
```

```json
{
  "type": "IMAGE_GENERATOR",   // Image generation
  "model": "midjourney",
  "promptObject": {
    "prompt": "A beautiful sunset",
    "num_outputs": 1,
    "aspect_ratio": "1:1"
  }
}
```

### Model Name Mapping (Anthropic -> 1min.ai)
| Anthropic Model | 1min.ai Model |
|-----------------|---------------|
| claude-sonnet-4-5-20250929 | claude-sonnet-4-5 |
| claude-sonnet-4-20250514 | claude-sonnet-4 |
| claude-3-5-sonnet-20241022 | claude-3-5-sonnet |
| claude-3-5-haiku-20241022 | claude-3-5-haiku |

### Response Format
```json
{
  "aiRecord": {
    "aiRecordDetail": {
      "resultObject": "The AI response text here"
    }
  }
}
```

---

## What 1min.ai Does NOT Support via API

The following features are available in the 1min.ai web app but **NOT exposed via API**:
- Image Upscaling
- Background Removal
- Image Enhancement/Editing

These must continue using Replicate.

---

## Changes Already Made

### 1. Created `lib/ai/onemin-client.ts` (NEW FILE)
A dedicated client for 1min.ai's native API format:
- `chat()` - Text conversations
- `chatWithImage()` - Vision/image analysis
- Model name mapping from Anthropic format
- Proper error handling

### 2. Updated `lib/ai/anthropic-client.ts`
Modified `callAPIWithFailover()` to:
1. Try 1min.ai API first when `USE_1MINAI_KEYS=true`
2. Fall back to Anthropic API if 1min.ai fails
3. Convert Anthropic message format to 1min.ai format
4. Handle both text and image requests

---

## Still TODO

### High Priority
1. **Test the Anthropic client changes** - Verify 1min.ai calls work correctly
2. **Update Replicate client** - For operations 1min.ai DOES support (text generation via Llama), add failover logic
3. **Update .env.example** - Better documentation of the setup

### Medium Priority
4. **Add error detection for "out of tokens"** - Detect when 1min.ai returns quota errors specifically
5. **Add logging/monitoring** - Track which API is being used

### Low Priority (If 1min.ai adds these APIs later)
6. **Image upscaling via 1min.ai** - Currently not supported
7. **Background removal via 1min.ai** - Currently not supported

---

## Environment Variables

```env
# Feature Flag: Enable 1min.ai as primary
USE_1MINAI_KEYS=true

# 1min.ai API Key (PRIMARY when flag is true)
MIN_API_KEY=your_1min_api_key

# Anthropic API Key (FALLBACK for Claude operations)
ANTHROPIC_API_KEY=sk-ant-xxx

# Replicate API Key (FALLBACK for image processing, always used for upscale/bg removal)
REPLICATE_API_KEY=r8_xxx
```

---

## Architecture Diagram

```
User Request
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                    PaintPile App                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │ Claude Operations│      │ Image Processing │         │
│  │ (text, vision)   │      │ (enhance, bg rm) │         │
│  └────────┬─────────┘      └────────┬─────────┘         │
│           │                         │                    │
│           ▼                         ▼                    │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │ AnthropicClient  │      │ ReplicateClient  │         │
│  │ callAPIWithFail- │      │ runWithFailover()│         │
│  │ over()           │      │                  │         │
│  └────────┬─────────┘      └────────┬─────────┘         │
│           │                         │                    │
└───────────┼─────────────────────────┼────────────────────┘
            │                         │
            ▼                         ▼
    ┌───────────────┐         ┌───────────────┐
    │   1min.ai     │         │   1min.ai     │
    │   (PRIMARY)   │         │ (if supported)│
    └───────┬───────┘         └───────┬───────┘
            │                         │
            │ fails?                  │ fails/not supported?
            ▼                         ▼
    ┌───────────────┐         ┌───────────────┐
    │   Anthropic   │         │   Replicate   │
    │   (FALLBACK)  │         │   (FALLBACK)  │
    └───────────────┘         └───────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/ai/onemin-client.ts` | 1min.ai native API client (NEW) |
| `lib/ai/anthropic-client.ts` | Claude client with 1min.ai failover (UPDATED) |
| `lib/ai/replicate-client.ts` | Replicate client (NEEDS UPDATE for partial 1min.ai support) |
| `.env.example` | Environment variable documentation |
| `docs/1MINAI-INTEGRATION-PLAN.md` | This document |

---

## Testing Checklist

- [ ] Set `USE_1MINAI_KEYS=true` in .env
- [ ] Add valid `MIN_API_KEY` from 1min.ai dashboard
- [ ] Test color analysis (should use 1min.ai)
- [ ] Test recipe generation (should use 1min.ai)
- [ ] Test image enhancement (should use Replicate - 1min.ai doesn't support)
- [ ] Test background removal (should use Replicate)
- [ ] Exhaust 1min.ai tokens and verify fallback to Anthropic works
- [ ] Check console logs show correct API being used

---

## Resources

- 1min.ai API Docs: https://docs.1min.ai/
- 1min.ai API Reference: https://docs.1min.ai/docs/api/intro
- 1min-relay (community OpenAI adapter): https://github.com/kokofixcomputers/1min-relay
- Postman Collection: https://github.com/robopanda209/1min-ai-postman-collection

---

## Notes

- 1min.ai uses different model names than Anthropic (e.g., `claude-sonnet-4-5` vs `claude-sonnet-4-5-20250929`)
- 1min.ai auth header is `API-KEY` not `Authorization: Bearer`
- Response format is nested: `response.aiRecord.aiRecordDetail.resultObject`
- The web app has more features than the API exposes
