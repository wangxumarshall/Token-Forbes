# Findings

## 2026-03-19
- `src/contexts/AuthContext.tsx` still exposes a single `login()` path backed only by `GoogleAuthProvider`.
- `src/firebase.ts` exports only Google auth provider today; GitHub auth is not wired.
- `src/components/Leaderboard.tsx` still labels the primary rate column as `Daily Burn`.
- `src/App.tsx`, `src/data/mockData.ts`, `src/components/HeroTicker.tsx`, and `src/services/githubRankingService.ts` still treat `tokensPerDay` as a day-based metric from older yearly math.
- `src/services/githubRankingService.ts` currently evaluates one repo at a time with contributor cap `12`; no global GitHub Search API ingestion exists yet.
- GitHub Search API unauthenticated rate limit is `10` requests per minute, so the new dynamic global ranking route should prefer `GITHUB_TOKEN` when present and use server-side caching.
- `GET /repos/{owner}/{repo}/stats/contributors` returns weekly contribution buckets and can be sliced to the last 4 weeks to model “recent 1 month” activity instead of using lifetime totals.
- The current public repo search query can surface non-code or asset-heavy repos, so the dynamic ranking pipeline needs heuristic filtering before contributor aggregation.
- Added a shared `tokenMath` utility so the app now treats `totalTokens` as cumulative since January 2025 and `tokensPerMonth` as average monthly burn; old seed data is upscaled through that same helper instead of hand-maintained constants.
- Added a new server-side `api/github-global-ranking.ts` route that builds a cached global snapshot from GitHub Search API results plus benchmark repositories, with a 500-user cap on aggregated individuals.
- Added canonical host enforcement for `token-forbes-vercel.vercel.app`, so auth attempts are redirected to `token-forbes.vercel.app/#rankings` before Firebase popup auth starts.
- Verified that Vercel’s built serverless output for `api/github-global-ranking` loads correctly only after all runtime imports in the API dependency graph use `.js` extensions.
- Real GitHub smoke tests confirmed the new math produces frontier-scale numbers; for `vercel/next.js`, the built evaluator returned 25 contributors with the top contributor at `4.325B` average monthly tokens and the enterprise aggregate at `79.287B` average monthly tokens.
- The global snapshot path works end-to-end, but unauthenticated GitHub API calls still hit rate limits quickly. The code now degrades gracefully and downsizes the crawl when `GITHUB_TOKEN` is absent; configuring `GITHUB_TOKEN` remains important for reaching the intended 500-user coverage in production.
- The Vercel project now has `GITHUB_TOKEN` configured across Production, Preview, and Development. A fresh production deployment is live and aliased to `token-forbes.vercel.app`.
- AI features no longer need `GEMINI_API_KEY`. The frontend now calls a server-side `api/ai` route, and OpenRouter credentials stay in Vercel environment variables.
- `stepfun/step-3.5-flash:free` is a reasoning-first model on OpenRouter. Short output budgets can lead to `content: null` even on successful responses, so the chat proxy now allocates a larger `max_tokens` budget for user-visible answers.
