import type { StoredProof } from '../src/types/storage';
import { PROOFS_PREFIX, STORAGE_NOT_CONFIGURED_ERROR, makeBlobPath, parseRequestBody, readJsonBlob, sendJson, writeJsonBlob } from './_blobStore.js';

export const runtime = 'nodejs';

function validateProof(payload: Partial<StoredProof>) {
  if (!payload.userId?.trim()) {
    throw new Error('userId is required.');
  }

  if (!payload.name?.trim()) {
    throw new Error('name is required.');
  }

  if (typeof payload.tokens !== 'number' || Number.isNaN(payload.tokens) || payload.tokens < 0) {
    throw new Error('tokens must be a non-negative number.');
  }
}

export default async function handler(request: any, response: any) {
  try {
    if (request.method === 'GET') {
      const userId = typeof request.query?.userId === 'string' ? request.query.userId.trim() : '';

      if (!userId) {
        return sendJson(response, { error: 'userId is required.' }, 400);
      }

      const record = await readJsonBlob<StoredProof>(makeBlobPath(PROOFS_PREFIX, userId));
      return sendJson(response, record);
    }

    if (request.method === 'PUT') {
      const payload = parseRequestBody<StoredProof>(request.body);
      validateProof(payload);

      const record: StoredProof = {
        userId: payload.userId.trim(),
        name: payload.name.trim(),
        tokens: payload.tokens,
        photoURL: payload.photoURL || null,
        updatedAt: new Date().toISOString(),
      };

      await writeJsonBlob(makeBlobPath(PROOFS_PREFIX, record.userId), record);
      return sendJson(response, record);
    }

    return sendJson(response, { error: 'Method not allowed.' }, 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to persist proof.';
    const status = message === STORAGE_NOT_CONFIGURED_ERROR ? 503 : 400;
    return sendJson(response, { error: message }, status);
  }
}
