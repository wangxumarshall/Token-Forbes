import { STORAGE_NOT_CONFIGURED_ERROR, loadLeaderboardSnapshot, sendJson } from './_storage.js';

export const runtime = 'nodejs';

export default async function handler(request: any, response: any) {
  if (request.method !== 'GET') {
    return sendJson(response, { error: 'Method not allowed.' }, 405);
  }

  try {
    const snapshot = await loadLeaderboardSnapshot();
    return sendJson(response, snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load leaderboard data.';
    return sendJson(response, { error: message || STORAGE_NOT_CONFIGURED_ERROR }, 503);
  }
}
