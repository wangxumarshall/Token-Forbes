# Task Plan

## Goal
Fix production login, update token-burn math to reflect high-intensity AI coding since January 2025, and add dynamic GitHub-based active developer ingestion that can scale to 500 contributors.

## Phases
| Phase | Status | Notes |
|---|---|---|
| 1. Inspect current auth, ranking math, and GitHub ingestion flow | in_progress | Confirm actual code paths and blockers before editing. |
| 2. Implement auth fixes and canonical host redirect | pending | Add GitHub login and handle unauthorized-domain issues gracefully. |
| 3. Update token semantics and leaderboard presentation | pending | Move to total since Jan 2025 + average monthly burn. |
| 4. Implement dynamic global GitHub ranking ingestion | pending | Search API + benchmark repos + 500-user cap. |
| 5. Verify locally and prepare deployment notes | pending | Run lint/build and document required env/domain setup. |

## Decisions
- Use `https://token-forbes.vercel.app/#rankings` as the canonical public host unless code or config proves otherwise.
- Keep existing Blob-backed persistence unless the new requirements force a storage change.

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| None yet in this session | 0 | N/A |
