# Progress

## 2026-03-19 Session
- Reviewed planning skill instructions and initialized planning files in the project root.
- Confirmed the current code still has legacy auth, leaderboard metric naming, and GitHub ranking limits that do not match the new requirements.
- Read the auth, leaderboard, persistence, and GitHub ranking codepaths end-to-end to identify where old token semantics are still embedded.
- Probed live GitHub REST endpoints to validate response shape and rate limits for repository search, contributors, and contributor statistics.
- Implemented canonical host redirect logic, added GitHub auth provider wiring, and exposed Google/GitHub login choices in the main UI.
- Replaced the old yearly-token semantics with shared AI-coding-era math across mock data, proofs, repo intake, hero ticker, and leaderboard rendering.
- Added a new global GitHub ranking API route and rewrote the ranking service to search recent active repositories, blend in benchmark repos, and aggregate up to 500 contributors.
- Verified `npm run lint`, `npm run build`, and `vercel build` after the refactor.
- Verified the built serverless output loads under Node and can successfully evaluate `vercel/next.js`, producing month-burn numbers in the multi-billion range and cumulative totals since January 2025.
- Verified the full global snapshot path completes after adding per-repo fallback; without `GITHUB_TOKEN` it now degrades gracefully to a smaller snapshot instead of failing outright.
- Added `GITHUB_TOKEN` to the Vercel project environments (Production, Preview, Development) and triggered a new production deployment.
- Confirmed the deployment reached `Ready` and was re-aliased to `https://token-forbes.vercel.app`.
- Replaced the client-side Gemini SDK path with a server-side OpenRouter proxy route at `api/ai`, keeping the API key out of the browser bundle.
- Configured `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, and `OPENROUTER_MODEL` in Vercel and redeployed production.
- Verified direct OpenRouter chat-completions calls succeed with `stepfun/step-3.5-flash:free`; after increasing token budget for the reasoning model, the API returns normal assistant text instead of empty content.
