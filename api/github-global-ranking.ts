import type { GlobalGitHubSnapshot } from '../src/types/storage';
import { buildGlobalGitHubRankingSnapshot } from '../src/services/githubRankingService.js';
import { sendJson } from './_blobStore.js';

export const runtime = 'nodejs';

export default async function handler(request: any, response: any) {
  if (request.method !== 'GET') {
    return sendJson(response, { error: 'Method not allowed.' }, 405);
  }

  try {
    const snapshot: GlobalGitHubSnapshot = await buildGlobalGitHubRankingSnapshot({
      token: process.env.GITHUB_TOKEN,
    });

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
