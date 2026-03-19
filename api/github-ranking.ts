import type { StoredGitHubRanking } from '../src/types/storage';
import { GITHUB_RANKINGS_PREFIX, STORAGE_NOT_CONFIGURED_ERROR, makeBlobPath, parseRequestBody, sendJson, writeJsonBlob } from './_blobStore.js';

export const runtime = 'nodejs';

function validateGitHubRanking(payload: Partial<StoredGitHubRanking>) {
  if (!payload.docId?.trim()) {
    throw new Error('docId is required.');
  }

  if (!payload.repo || !payload.enterpriseEntity || !Array.isArray(payload.individualEntities) || !Array.isArray(payload.methodology)) {
    throw new Error('A complete GitHub ranking payload is required.');
  }
}

export default async function handler(request: any, response: any) {
  if (request.method !== 'PUT') {
    return sendJson(response, { error: 'Method not allowed.' }, 405);
  }

  try {
    const payload = parseRequestBody<StoredGitHubRanking>(request.body);
    validateGitHubRanking(payload);

    const record: StoredGitHubRanking = {
      ...payload,
      docId: payload.docId.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: payload.updatedBy
        ? {
            uid: payload.updatedBy.uid,
            displayName: payload.updatedBy.displayName || null,
            photoURL: payload.updatedBy.photoURL || null,
          }
        : undefined,
    };

    await writeJsonBlob(makeBlobPath(GITHUB_RANKINGS_PREFIX, record.docId), record);
    return sendJson(response, record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to persist GitHub ranking.';
    const status = message === STORAGE_NOT_CONFIGURED_ERROR ? 503 : 400;
    return sendJson(response, { error: message }, status);
  }
}
