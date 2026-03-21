import type { GlobalGitHubSnapshot } from '../src/types/storage';
import { buildGlobalGitHubRankingSnapshot } from '../src/services/githubRankingService.js';
import { readCachedGlobalGitHubSnapshot, sendJson, writeCachedGlobalGitHubSnapshot } from './_storage.js';

export const runtime = 'nodejs';
const SNAPSHOT_TTL_SECONDS = 60 * 60;

export default async function handler(request: any, response: any) {
  if (request.method !== 'GET') {
    return sendJson(response, { error: 'Method not allowed.' }, 405);
  }

  try {
    try {
      const cached = await readCachedGlobalGitHubSnapshot();
      if (cached.snapshot) {
        return sendJson(
          response,
          cached.snapshot,
          200,
          'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Global ranking cache read skipped: ${message}`);
    }

    const snapshot: GlobalGitHubSnapshot = await buildGlobalGitHubRankingSnapshot({
      token: process.env.GITHUB_TOKEN,
    });
    try {
      await writeCachedGlobalGitHubSnapshot(snapshot, SNAPSHOT_TTL_SECONDS);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Global ranking cache write skipped: ${message}`);
    }

    return sendJson(
      response,
      snapshot,
      200,
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build global GitHub ranking.';
    return sendJson(response, { error: message }, 503);
  }
}
