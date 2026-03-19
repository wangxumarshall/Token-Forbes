import type { StoredGitHubRanking, StoredProof } from '../src/types/storage';
import { GITHUB_RANKINGS_PREFIX, PROOFS_PREFIX, STORAGE_NOT_CONFIGURED_ERROR, listJsonBlobs, sendJson } from './_blobStore.js';

export const runtime = 'nodejs';

export default async function handler(request: any, response: any) {
  if (request.method !== 'GET') {
    return sendJson(response, { error: 'Method not allowed.' }, 405);
  }

  try {
    const [proofs, githubRankings] = await Promise.all([
      listJsonBlobs<StoredProof>(PROOFS_PREFIX),
      listJsonBlobs<StoredGitHubRanking>(GITHUB_RANKINGS_PREFIX),
    ]);

    return sendJson(response, { proofs, githubRankings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load leaderboard data.';
    return sendJson(response, { error: message || STORAGE_NOT_CONFIGURED_ERROR }, 503);
  }
}
