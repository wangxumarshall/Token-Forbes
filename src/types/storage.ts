import type { Entity } from '../data/mockData';
import type { RepoEvaluationSummary } from '../services/githubRankingService';

export type StorageProvider = 'vercel-blob' | 'local-storage';

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
  methodology: string[];
  repoCount: number;
  contributorCount: number;
}
