# Token Forbes
Token Forbes is a Vite + React app that ranks people and organizations by inferred AI token consumption.

Production:
- [https://token-forbes.vercel.app](https://token-forbes.vercel.app)

## What It Does

- Shows an AI token-consumption leaderboard for individuals and enterprises
- Uses cumulative totals since January 2025 plus average monthly burn
- Supports proof-of-compute submissions and GitHub repo intake
- Builds a dynamic GitHub global ranking from:
  - GitHub Search API
  - recent contributor activity
  - benchmark repos such as `microsoft/vscode`, `vercel/next.js`, `langchain-ai/langchain`, and `huggingface/transformers`
- Builds a modeled global enterprise ranking using the same proxy methodology plus public-code calibration
- Stores leaderboard submissions in SQLite by default, with Vercel Blob as a fallback
- Uses OpenRouter for chat and data-engine AI features
- Supports Google and GitHub sign-in via Firebase Auth

## Stack

- Frontend: React 19, Vite, Tailwind CSS, Motion
- APIs: Vercel serverless functions
- Persistence: SQLite by default, Vercel Blob fallback, browser `localStorage` fallback on the client
- Auth: Firebase Authentication
- AI: OpenRouter, default model `stepfun/step-3.5-flash:free`

## Local Development

Prerequisites:
- Node.js 22.5+
- npm

Install and run:

```bash
npm install
npm run dev
```

Default dev URL:

```text
http://localhost:3000
```

## Environment Variables

Create local env values as needed. For production, configure them in Vercel.

### Required for AI

```bash
OPENROUTER_API_KEY=...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=stepfun/step-3.5-flash:free
```

### Recommended for GitHub Ranking

```bash
GITHUB_TOKEN=...
```

Without `GITHUB_TOKEN`, the global GitHub ranking route works in a degraded mode and can hit GitHub rate limits sooner.

### Default / Optional Persistent Storage

SQLite is the default server storage path.

```bash
TOKEN_FORBES_STORAGE_PROVIDER=sqlite
SQLITE_DB_PATH=.data/token-forbes.sqlite
```

### Optional Blob Fallback

```bash
BLOB_READ_WRITE_TOKEN=...
```

If `TOKEN_FORBES_STORAGE_PROVIDER` is omitted, the server tries SQLite first and falls back to Blob when SQLite is unavailable.

### Optional Firebase Override

The app currently supports overriding the built-in Firebase project through Vite env vars:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=token-forbes.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=token-forbes
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

If all six values are present, the app uses that Firebase project instead of the fallback one baked into the repo.

## Firebase Notes

For Google/GitHub sign-in to work, the active Firebase project must:

- enable Google Sign-In
- enable GitHub Sign-In
- include these domains in `Authentication -> Settings -> Authorized domains`
  - `token-forbes.vercel.app`
  - `token-forbes-vercel.vercel.app`

## Vercel Deployment

This repo is configured for Vercel.

Deploy:

```bash
vercel --prod
```

Important deployment details:

- `token-forbes-vercel.vercel.app` is redirected to `https://token-forbes.vercel.app/#rankings`
- AI requests go through server-side `api/ai`, so the OpenRouter key stays on the server
- GitHub ranking APIs run on the server and use `GITHUB_TOKEN` when available
- On Vercel, SQLite defaults to `/tmp/token-forbes.sqlite`, which is cheap and functional for low traffic but not durable across cold starts; use Blob or a persistent volume if you need durable production storage

## Main API Routes

- `/api/leaderboard`
- `/api/proof`
- `/api/github-ranking`
- `/api/github-global-ranking`
- `/api/ai`

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Recent Product Changes

- Switched AI features from client-side Gemini to server-side OpenRouter
- Added GitHub login alongside Google login
- Changed leaderboard semantics to:
  - `Total Tokens`: cumulative total since January 2025
  - `Avg Monthly Burn`: average monthly token consumption since January 2025
- Added dynamic global GitHub ranking with up to 500 contributors
- Added a dedicated global enterprise token-consumption ranking derived from project proxy methodology
- Replaced Firestore-era persistence with SQLite-first storage and Blob fallback

## Repository

- Remote: [https://github.com/wangxumarshall/Token-Forbes.git](https://github.com/wangxumarshall/Token-Forbes.git)
