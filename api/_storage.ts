import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type {
  GlobalGitHubSnapshot,
  ServerStorageProvider,
  StoredGitHubRanking,
  StoredProof,
} from '../src/types/storage.js';
import {
  GITHUB_RANKINGS_PREFIX,
  PROOFS_PREFIX,
  STORAGE_NOT_CONFIGURED_ERROR,
  isBlobStoreConfigured,
  listJsonBlobs,
  makeBlobPath,
  parseRequestBody,
  readJsonBlob,
  sendJson,
  writeJsonBlob,
} from './_blobStore.js';

export { GITHUB_RANKINGS_PREFIX, PROOFS_PREFIX, STORAGE_NOT_CONFIGURED_ERROR, parseRequestBody, sendJson };

const CACHE_PREFIX = 'cache/';
const GLOBAL_GITHUB_SNAPSHOT_CACHE_KEY = 'global-github-ranking';
const SQLITE_UNAVAILABLE_PREFIX = 'SQLite storage is unavailable';

type DatabaseLike = import('node:sqlite').DatabaseSync;

interface CacheEnvelope<T> {
  key: string;
  value: T;
  updatedAt: string;
  expiresAt: string;
}

interface SqliteState {
  db: DatabaseLike;
  path: string;
}

interface ServerStorageAdapter {
  provider: ServerStorageProvider;
  listProofs: () => Promise<StoredProof[]>;
  readProof: (userId: string) => Promise<StoredProof | null>;
  writeProof: (record: StoredProof) => Promise<void>;
  listGitHubRankings: () => Promise<StoredGitHubRanking[]>;
  writeGitHubRanking: (record: StoredGitHubRanking) => Promise<void>;
  readCache: <T>(key: string) => Promise<T | null>;
  writeCache: <T>(key: string, value: T, ttlSeconds: number) => Promise<void>;
}

let sqliteStatePromise: Promise<SqliteState> | null = null;

function parseJsonPayload<T>(payload: string): T | null {
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

function getStoragePreference(): ServerStorageProvider | 'auto' {
  const raw = (process.env.TOKEN_FORBES_STORAGE_PROVIDER || '').trim().toLowerCase();
  if (raw === 'sqlite' || raw === 'vercel-blob') {
    return raw;
  }
  return 'auto';
}

function getSqliteDbPath() {
  const explicit = (process.env.SQLITE_DB_PATH || process.env.TOKEN_FORBES_SQLITE_PATH || '').trim();
  if (explicit) {
    return explicit;
  }

  return process.env.VERCEL
    ? '/tmp/token-forbes.sqlite'
    : path.join(process.cwd(), '.data', 'token-forbes.sqlite');
}

async function prepareSqlitePath(dbPath: string) {
  if (!dbPath || dbPath === ':memory:') {
    return;
  }

  await mkdir(path.dirname(dbPath), { recursive: true });
}

function initializeSqliteSchema(db: DatabaseLike) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS proofs (
      user_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tokens INTEGER NOT NULL,
      photo_url TEXT,
      updated_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS github_rankings (
      doc_id TEXT PRIMARY KEY,
      updated_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cached_snapshots (
      cache_key TEXT PRIMARY KEY,
      updated_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_proofs_updated_at
      ON proofs(updated_at DESC);

    CREATE INDEX IF NOT EXISTS idx_github_rankings_updated_at
      ON github_rankings(updated_at DESC);

    CREATE INDEX IF NOT EXISTS idx_cached_snapshots_expires_at
      ON cached_snapshots(expires_at);
  `);
}

async function createSqliteState(): Promise<SqliteState> {
  try {
    const sqlite = await import('node:sqlite');
    const dbPath = getSqliteDbPath();
    await prepareSqlitePath(dbPath);

    const db = new sqlite.DatabaseSync(dbPath);
    db.exec('PRAGMA busy_timeout = 5000;');
    initializeSqliteSchema(db);

    return { db, path: dbPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${SQLITE_UNAVAILABLE_PREFIX}: ${message}`);
  }
}

async function getSqliteState() {
  if (!sqliteStatePromise) {
    sqliteStatePromise = createSqliteState();
  }

  try {
    return await sqliteStatePromise;
  } catch (error) {
    sqliteStatePromise = null;
    throw error;
  }
}

async function createSqliteAdapter(): Promise<ServerStorageAdapter> {
  const { db } = await getSqliteState();

  return {
    provider: 'sqlite',
    async listProofs() {
      const rows = db
        .prepare('SELECT payload FROM proofs ORDER BY updated_at DESC')
        .all() as Array<{ payload: string }>;

      return rows
        .map((row) => parseJsonPayload<StoredProof>(row.payload))
        .filter((row): row is StoredProof => row !== null);
    },
    async readProof(userId: string) {
      const row = db
        .prepare('SELECT payload FROM proofs WHERE user_id = ?')
        .get(userId) as { payload: string } | undefined;

      if (!row) {
        return null;
      }

      return parseJsonPayload<StoredProof>(row.payload);
    },
    async writeProof(record: StoredProof) {
      db.prepare(`
        INSERT INTO proofs (user_id, name, tokens, photo_url, updated_at, payload)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          name = excluded.name,
          tokens = excluded.tokens,
          photo_url = excluded.photo_url,
          updated_at = excluded.updated_at,
          payload = excluded.payload
      `).run(
        record.userId,
        record.name,
        record.tokens,
        record.photoURL || null,
        record.updatedAt,
        JSON.stringify(record),
      );
    },
    async listGitHubRankings() {
      const rows = db
        .prepare('SELECT payload FROM github_rankings ORDER BY updated_at DESC')
        .all() as Array<{ payload: string }>;

      return rows
        .map((row) => parseJsonPayload<StoredGitHubRanking>(row.payload))
        .filter((row): row is StoredGitHubRanking => row !== null);
    },
    async writeGitHubRanking(record: StoredGitHubRanking) {
      db.prepare(`
        INSERT INTO github_rankings (doc_id, updated_at, payload)
        VALUES (?, ?, ?)
        ON CONFLICT(doc_id) DO UPDATE SET
          updated_at = excluded.updated_at,
          payload = excluded.payload
      `).run(record.docId, record.updatedAt, JSON.stringify(record));
    },
    async readCache<T>(key: string) {
      const row = db
        .prepare('SELECT payload, expires_at FROM cached_snapshots WHERE cache_key = ?')
        .get(key) as { payload: string; expires_at: string } | undefined;

      if (!row) {
        return null;
      }

      if (new Date(row.expires_at).getTime() <= Date.now()) {
        db.prepare('DELETE FROM cached_snapshots WHERE cache_key = ?').run(key);
        return null;
      }

      return parseJsonPayload<T>(row.payload);
    },
    async writeCache<T>(key: string, value: T, ttlSeconds: number) {
      const now = new Date();
      const updatedAt = now.toISOString();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();

      db.prepare(`
        INSERT INTO cached_snapshots (cache_key, updated_at, expires_at, payload)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(cache_key) DO UPDATE SET
          updated_at = excluded.updated_at,
          expires_at = excluded.expires_at,
          payload = excluded.payload
      `).run(key, updatedAt, expiresAt, JSON.stringify(value));
    },
  };
}

async function createBlobAdapter(): Promise<ServerStorageAdapter> {
  if (!isBlobStoreConfigured()) {
    throw new Error(STORAGE_NOT_CONFIGURED_ERROR);
  }

  return {
    provider: 'vercel-blob',
    async listProofs() {
      return listJsonBlobs<StoredProof>(PROOFS_PREFIX);
    },
    async readProof(userId: string) {
      return readJsonBlob<StoredProof>(makeBlobPath(PROOFS_PREFIX, userId));
    },
    async writeProof(record: StoredProof) {
      await writeJsonBlob(makeBlobPath(PROOFS_PREFIX, record.userId), record);
    },
    async listGitHubRankings() {
      return listJsonBlobs<StoredGitHubRanking>(GITHUB_RANKINGS_PREFIX);
    },
    async writeGitHubRanking(record: StoredGitHubRanking) {
      await writeJsonBlob(makeBlobPath(GITHUB_RANKINGS_PREFIX, record.docId), record);
    },
    async readCache<T>(key: string) {
      const envelope = await readJsonBlob<CacheEnvelope<T>>(makeBlobPath(CACHE_PREFIX, key));
      if (!envelope) {
        return null;
      }

      if (new Date(envelope.expiresAt).getTime() <= Date.now()) {
        return null;
      }

      return envelope.value;
    },
    async writeCache<T>(key: string, value: T, ttlSeconds: number) {
      const now = new Date();
      const envelope: CacheEnvelope<T> = {
        key,
        value,
        updatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + ttlSeconds * 1000).toISOString(),
      };

      await writeJsonBlob(makeBlobPath(CACHE_PREFIX, key), envelope);
    },
  };
}

async function resolveServerStorage(): Promise<ServerStorageAdapter> {
  const preference = getStoragePreference();
  const factories =
    preference === 'vercel-blob'
      ? [createBlobAdapter, createSqliteAdapter]
      : [createSqliteAdapter, createBlobAdapter];

  let lastError: unknown = null;

  for (const factory of factories) {
    try {
      return await factory();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Server storage factory failed: ${message}`);
    }
  }

  const message =
    lastError instanceof Error && lastError.message.startsWith(SQLITE_UNAVAILABLE_PREFIX)
      ? STORAGE_NOT_CONFIGURED_ERROR
      : lastError instanceof Error
        ? lastError.message
        : STORAGE_NOT_CONFIGURED_ERROR;

  throw new Error(message || STORAGE_NOT_CONFIGURED_ERROR);
}

export async function loadLeaderboardSnapshot() {
  const storage = await resolveServerStorage();
  const [proofs, githubRankings] = await Promise.all([
    storage.listProofs(),
    storage.listGitHubRankings(),
  ]);

  return {
    proofs,
    githubRankings,
    provider: storage.provider,
  };
}

export async function readStoredProof(userId: string) {
  const storage = await resolveServerStorage();
  return {
    record: await storage.readProof(userId),
    provider: storage.provider,
  };
}

export async function writeStoredProof(record: StoredProof) {
  const storage = await resolveServerStorage();
  await storage.writeProof(record);

  return {
    record,
    provider: storage.provider,
  };
}

export async function writeStoredGitHubRanking(record: StoredGitHubRanking) {
  const storage = await resolveServerStorage();
  await storage.writeGitHubRanking(record);

  return {
    record,
    provider: storage.provider,
  };
}

export async function readCachedGlobalGitHubSnapshot() {
  const storage = await resolveServerStorage();
  return {
    snapshot: await storage.readCache<GlobalGitHubSnapshot>(GLOBAL_GITHUB_SNAPSHOT_CACHE_KEY),
    provider: storage.provider,
  };
}

export async function writeCachedGlobalGitHubSnapshot(
  snapshot: GlobalGitHubSnapshot,
  ttlSeconds: number,
) {
  const storage = await resolveServerStorage();
  await storage.writeCache(GLOBAL_GITHUB_SNAPSHOT_CACHE_KEY, snapshot, ttlSeconds);
  return storage.provider;
}
