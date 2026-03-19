import type {
  GlobalGitHubSnapshot,
  LeaderboardSnapshot,
  RankingUpdatedBy,
  StorageProvider,
  StoredGitHubRanking,
  StoredProof,
} from '../types/storage';

const PROOF_KEY_PREFIX = 'token-forbes/proofs/';
const GITHUB_RANKING_KEY_PREFIX = 'token-forbes/github-rankings/';
const GUEST_ID_KEY = 'token-forbes/guest-id';
export const LEADERBOARD_DATA_UPDATED_EVENT = 'token-forbes:data-updated';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function dispatchLeaderboardUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(LEADERBOARD_DATA_UPDATED_EVENT));
  }
}

function readLocalRecord<T>(key: string): T | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  const value = window.localStorage.getItem(key);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function writeLocalRecord<T>(key: string, value: T) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function listLocalRecords<T>(prefix: string) {
  if (!canUseLocalStorage()) {
    return [] as T[];
  }

  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(prefix))
    .map((key) => readLocalRecord<T>(key))
    .filter((value): value is T => value !== null);
}

type ApiError = Error & { status?: number };

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const payload = await response.json();
      if (payload?.error) {
        message = payload.error;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }

    const error = new Error(message) as ApiError;
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function shouldUseLocalFallback(error: unknown) {
  if (error instanceof TypeError) {
    return true;
  }

  const status = (error as ApiError | undefined)?.status;
  return status === 404 || status === 503;
}

function getProofStorageKey(userId: string) {
  return `${PROOF_KEY_PREFIX}${userId}`;
}

function getGitHubRankingStorageKey(docId: string) {
  return `${GITHUB_RANKING_KEY_PREFIX}${docId}`;
}

function getLocalSnapshot(): LeaderboardSnapshot {
  return {
    proofs: listLocalRecords<StoredProof>(PROOF_KEY_PREFIX),
    githubRankings: listLocalRecords<StoredGitHubRanking>(GITHUB_RANKING_KEY_PREFIX),
    provider: 'local-storage',
  };
}

function getEmptyGlobalGitHubSnapshot(): GlobalGitHubSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    individuals: [],
    enterprises: [],
    methodology: [],
    repoCount: 0,
    contributorCount: 0,
  };
}

export function getBrowserGuestId() {
  if (!canUseLocalStorage()) {
    return 'guest-session';
  }

  const existing = window.localStorage.getItem(GUEST_ID_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `guest-${crypto.randomUUID()}`
      : `guest-${Date.now()}`;

  window.localStorage.setItem(GUEST_ID_KEY, generated);
  return generated;
}

export async function fetchLeaderboardSnapshot(): Promise<LeaderboardSnapshot> {
  try {
    const snapshot = await requestJson<Omit<LeaderboardSnapshot, 'provider'>>('/api/leaderboard');
    return { ...snapshot, provider: 'vercel-blob' };
  } catch (error) {
    if (!shouldUseLocalFallback(error)) {
      throw error;
    }

    return getLocalSnapshot();
  }
}

export async function fetchGlobalGitHubSnapshot(): Promise<GlobalGitHubSnapshot> {
  try {
    return await requestJson<GlobalGitHubSnapshot>('/api/github-global-ranking');
  } catch (error) {
    if (!shouldUseLocalFallback(error)) {
      throw error;
    }

    return getEmptyGlobalGitHubSnapshot();
  }
}

export async function fetchUserProof(userId: string) {
  try {
    return await requestJson<StoredProof | null>(`/api/proof?userId=${encodeURIComponent(userId)}`);
  } catch (error) {
    if (!shouldUseLocalFallback(error)) {
      throw error;
    }

    return readLocalRecord<StoredProof>(getProofStorageKey(userId));
  }
}

export async function saveUserProof(input: Omit<StoredProof, 'updatedAt'>): Promise<StorageProvider> {
  const record: StoredProof = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  try {
    await requestJson<StoredProof>('/api/proof', {
      method: 'PUT',
      body: JSON.stringify(record),
    });
    dispatchLeaderboardUpdate();
    return 'vercel-blob';
  } catch (error) {
    if (!shouldUseLocalFallback(error)) {
      throw error;
    }

    writeLocalRecord(getProofStorageKey(record.userId), record);
    dispatchLeaderboardUpdate();
    return 'local-storage';
  }
}

export async function saveGitHubRanking(
  input: Omit<StoredGitHubRanking, 'updatedAt'> & { updatedBy?: RankingUpdatedBy },
): Promise<StorageProvider> {
  const record: StoredGitHubRanking = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  try {
    await requestJson<StoredGitHubRanking>('/api/github-ranking', {
      method: 'PUT',
      body: JSON.stringify(record),
    });
    dispatchLeaderboardUpdate();
    return 'vercel-blob';
  } catch (error) {
    if (!shouldUseLocalFallback(error)) {
      throw error;
    }

    writeLocalRecord(getGitHubRankingStorageKey(record.docId), record);
    dispatchLeaderboardUpdate();
    return 'local-storage';
  }
}
