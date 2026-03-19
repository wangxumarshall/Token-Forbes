import { get, list, put } from '@vercel/blob';

export const runtime = 'nodejs';

export const PROOFS_PREFIX = 'proofs/';
export const GITHUB_RANKINGS_PREFIX = 'github-rankings/';
export const STORAGE_NOT_CONFIGURED_ERROR =
  'Persistent leaderboard storage is not configured. Falling back to local browser storage.';

export function sendJson(response: any, body: unknown, status = 200, cacheControl = 'no-store') {
  response.statusCode = status;
  response.setHeader('Cache-Control', cacheControl);
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

export function parseRequestBody<T>(body: unknown) {
  if (typeof body === 'string') {
    return JSON.parse(body) as T;
  }

  return (body || {}) as T;
}

export function isBlobStoreConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function ensureBlobStoreConfigured() {
  if (!isBlobStoreConfigured()) {
    throw new Error(STORAGE_NOT_CONFIGURED_ERROR);
  }
}

export function makeBlobPath(prefix: string, id: string) {
  return `${prefix}${encodeURIComponent(id)}.json`;
}

export async function readJsonBlob<T>(pathname: string) {
  ensureBlobStoreConfigured();
  const result = await get(pathname, { access: 'public' });

  if (!result || result.statusCode === 304 || !result.stream) {
    return null;
  }

  const raw = await new Response(result.stream).text();
  return JSON.parse(raw) as T;
}

export async function writeJsonBlob(pathname: string, value: unknown) {
  ensureBlobStoreConfigured();

  await put(pathname, JSON.stringify(value), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: 'application/json; charset=utf-8',
  });
}

async function listAllBlobUrls(prefix: string) {
  ensureBlobStoreConfigured();

  const urls: string[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({ cursor, prefix });
    urls.push(...result.blobs.map((blob) => blob.url));
    cursor = result.cursor;
    if (!result.hasMore) {
      break;
    }
  } while (cursor);

  return urls;
}

export async function listJsonBlobs<T>(prefix: string) {
  const urls = await listAllBlobUrls(prefix);
  const records = await Promise.all(
    urls.map(async (url) => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        return null;
      }
      return response.json() as Promise<T>;
    }),
  );

  return records.filter((record) => record !== null) as T[];
}
