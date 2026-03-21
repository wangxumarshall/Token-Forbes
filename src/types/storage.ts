import type { Entity } from '../data/mockData';
import type { RepoEvaluationSummary } from '../services/githubRankingService';

export type ServerStorageProvider = 'sqlite' | 'vercel-blob';
export type StorageProvider = ServerStorageProvider | 'local-storage';

export interface StoredProof {
  userId: string;
  name: string;
  tokens: number;
  photoURL?: string | null;
  updatedAt: string;
}

export interface RankingUpdatedBy {
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
}

export interface StoredGitHubRanking {
  docId: string;
  repo: RepoEvaluationSummary;
  enterpriseEntity: Entity;
  individualEntities: Entity[];
  methodology: string[];
  updatedAt: string;
  updatedBy?: RankingUpdatedBy;
}

export interface LeaderboardSnapshot {
  proofs: StoredProof[];
  githubRankings: StoredGitHubRanking[];
  provider: StorageProvider;
}

export interface GlobalGitHubSnapshot {
  generatedAt: string;
  individuals: Entity[];
  enterprises: Entity[];
  openSourceEnterprises: Entity[];
  methodology: string[];
  enterpriseMethodology: string[];
  repoCount: number;
  contributorCount: number;
  enterpriseCount: number;
}

export interface StoredRecordResponse<T> {
  record: T | null;
  provider: ServerStorageProvider;
}
