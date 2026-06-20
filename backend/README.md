# abu-prompt Backend

REST backend for improving user prompts. It creates three direct, ready-to-use prompt variants, analyzes them, and scores each result from 0 to 100.

The three variants use fixed improvement strategies:

- Variante A: Targeted Fix
- Variante B: Technique Injection
- Variante C: Self-Reflection Rubric

## Setup

```powershell
npm install
Copy-Item .env.example .env
```

The default `.env.example` is configured for an OpenAI-compatible local Claude endpoint:

```env
AI_BASE_URL=http://localhost:20128/v1
AI_MODEL=kr/claude-sonnet-4.5
AI_API_KEY=local
PORT=3000
```

Change these values only if your local model server uses a different URL, model, or API key.

## Development

```powershell
npm run dev
```

The API runs on `http://localhost:3000` by default.

## Endpoints

### `GET /health`

Returns:

```json
{ "ok": true }
```

### `POST /api/prompts/improve`

Request:

```json
{
  "prompt": "Write a prompt for a workout plan"
}
```

Response contains the original prompt, three improved variants, scores, keyword analysis, and the best variant id.

`variant.prompt` must be the final improved prompt text itself. It should not be a wrapper like "Improve this prompt..." or "Ueberarbeite diesen Prompt...".

Each variant contains enough data for the frontend card:

```json
{
  "name": "Variante A",
  "technique": "Targeted Fix",
  "isWinner": true,
  "baselineDelta": 0.2,
  "rating": "4.0/5.0",
  "score": 90,
  "rubric": {
    "empathy": { "label": "Empathy", "score": 80, "rating": "4.0/5.0" },
    "solutionOrientation": { "label": "Solution Orientation", "score": 86, "rating": "4.3/5.0" },
    "conciseness": { "label": "Conciseness", "score": 78, "rating": "3.9/5.0" },
    "complaintResolution": { "label": "Complaint Resolution", "score": 82, "rating": "4.1/5.0" }
  },
  "prompt": "Final improved prompt text for the card",
  "shareLabel": "SHARE FOR FEEDBACK"
}
```

If this endpoint returns `502`, the backend is reachable but the configured AI service is not. Check `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`, and whether the local Sonnet-compatible service is running.
