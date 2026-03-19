/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroTicker from './components/HeroTicker';
import Leaderboard from './components/Leaderboard';
import ProofOfCompute from './components/ProofOfCompute';
import Methodology from './components/Methodology';
import AgentDashboard from './components/AgentDashboard';
import Chatbot from './components/Chatbot';
import { ErrorBoundary } from './components/ErrorBoundary';
import GitHubRepoIntake from './components/GitHubRepoIntake';
import { allMockEntities, Entity } from './data/mockData';
import {
  LEADERBOARD_DATA_UPDATED_EVENT,
  fetchGlobalGitHubSnapshot,
  fetchLeaderboardSnapshot,
} from './services/leaderboardStore';
import type { GlobalGitHubSnapshot, StoredGitHubRanking, StoredProof } from './types/storage';
import { normalizeAvatarUrl } from './utils/avatar';
import { createEraTokenMetricsFromMonthlyBurn, normalizeTokenMetrics } from './utils/tokenMath';
import clsx from 'clsx';

const EMPTY_GLOBAL_SNAPSHOT: GlobalGitHubSnapshot = {
  generatedAt: '',
  individuals: [],
  enterprises: [],
  methodology: [],
  repoCount: 0,
  contributorCount: 0,
};

function getEntityKey(entity: Entity) {
  if (entity.sourceTag === 'Public GitHub Proxy') {
    return `${entity.entityType}:${entity.name.toLowerCase()}`;
  }

  if (entity.entityType === 'individual' && entity.company.toLowerCase() === 'independent') {
    return `proof:${entity.name.toLowerCase()}`;
  }

  return entity.id;
}

function mergeGitHubEntity(existing: Entity, incoming: Entity) {
  return incoming.totalTokens >= existing.totalTokens ? incoming : existing;
}

export default function App() {
  const [leaderboardData, setLeaderboardData] = useState<Entity[]>([]);
  const [activeTab, setActiveTab] = useState<'individual' | 'enterprise'>('individual');

  useEffect(() => {
    const baseEntities = [...allMockEntities].map((entity) => normalizeTokenMetrics({ ...entity }));
    
    const rebuildLeaderboard = (
      proofDocs: StoredProof[],
      githubDocs: StoredGitHubRanking[],
      globalSnapshot: GlobalGitHubSnapshot,
    ) => {
      const mergedMap = new Map<string, Entity>();
      const upsertEntity = (entity: Entity) => {
        const normalizedEntity = normalizeTokenMetrics({ ...entity });
        const key = getEntityKey(normalizedEntity);
        const existing = mergedMap.get(key);

        if (!existing) {
          mergedMap.set(key, normalizedEntity);
          return;
        }

        if (existing.sourceTag === 'Public GitHub Proxy' && normalizedEntity.sourceTag === 'Public GitHub Proxy') {
          mergedMap.set(key, mergeGitHubEntity(existing, normalizedEntity));
          return;
        }

        mergedMap.set(key, normalizedEntity);
      };

      for (const entity of baseEntities) {
        upsertEntity(entity);
      }

      for (const entity of globalSnapshot.individuals) {
        upsertEntity(entity);
      }

      for (const entity of globalSnapshot.enterprises) {
        upsertEntity(entity);
      }

      for (const ranking of githubDocs) {
        const enterpriseEntity = ranking.enterpriseEntity as Entity | undefined;
        const individualEntities = (ranking.individualEntities || []) as Entity[];

        if (enterpriseEntity) {
          upsertEntity(enterpriseEntity);
        }

        for (const entity of individualEntities) {
          upsertEntity(entity);
        }
      }

      for (const proof of proofDocs) {
        const proofName = proof.name?.trim() || 'Unknown';
        const proofKey = `proof:${proofName.toLowerCase()}`;
        const matchingEntry = mergedMap.get(proofKey);
        const addedMonthlyTokens = proof.tokens || 0;

        if (matchingEntry) {
          const mergedMetrics = createEraTokenMetricsFromMonthlyBurn(matchingEntry.tokensPerMonth + addedMonthlyTokens);
          mergedMap.set(proofKey, {
            ...matchingEntry,
            ...mergedMetrics,
            lastUpdated: new Date().toISOString().split('T')[0],
          });
          continue;
        }

        const tokens = proof.tokens || 0;
        let categoryLabel = 'Token Enthusiast';
        if (tokens >= 5e9) categoryLabel = 'Token Billionaire';
        else if (tokens >= 1e9) categoryLabel = 'Enterprise Whale';
        else if (tokens >= 1e8) categoryLabel = 'Super Geek';

        const proofMetrics = createEraTokenMetricsFromMonthlyBurn(tokens);

        const proofEntity: Entity = {
          id: proof.userId || Math.random().toString(),
          rank: 0,
          name: proofName,
          title: categoryLabel,
          company: 'Independent',
          avatar: normalizeAvatarUrl(proof.photoURL, proofName),
          ...proofMetrics,
          confidenceInterval: 0,
          sourceTag: 'Direct Disclosure',
          updateFrequency: 'Real-time',
          lastUpdated: new Date().toISOString().split('T')[0],
          nextUpdate: 'Real-time',
          entityType: 'individual',
          wealthStructure: [{ name: 'Submitted Compute', value: 100 }],
          description: 'User submitted average monthly compute consumption, converted into a cumulative total since January 2025.',
        };

        mergedMap.set(proofKey, proofEntity);
      }

      const mergedEntities = Array.from(mergedMap.values()).sort((a, b) => b.totalTokens - a.totalTokens);
      setLeaderboardData(mergedEntities);
    };

    const refreshLeaderboard = async () => {
      try {
        const [snapshot, globalSnapshot] = await Promise.all([
          fetchLeaderboardSnapshot(),
          fetchGlobalGitHubSnapshot(),
        ]);
        rebuildLeaderboard(snapshot.proofs, snapshot.githubRankings, globalSnapshot);
      } catch (error) {
        console.error('Error fetching leaderboard snapshot:', error);
        rebuildLeaderboard([], [], EMPTY_GLOBAL_SNAPSHOT);
      }
    };

    void refreshLeaderboard();

    const intervalId = window.setInterval(() => {
      void refreshLeaderboard();
    }, 60_000);

    const handleDataUpdate = () => {
      void refreshLeaderboard();
    };

    window.addEventListener(LEADERBOARD_DATA_UPDATED_EVENT, handleDataUpdate);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(LEADERBOARD_DATA_UPDATED_EVENT, handleDataUpdate);
    };
  }, []);

  const filteredData = leaderboardData
    .filter(entity => entity.entityType === activeTab)
    .map((entity, index) => ({ ...entity, rank: index + 1 }));
  const tickerData = leaderboardData.filter((entity) => entity.entityType === 'individual').slice(0, 10);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#D4AF37] selection:text-black">
      <Header />
      <HeroTicker data={tickerData} />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight">
            The New <span className="text-[#D4AF37] italic">Digital Oil</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            In the AI era, tokens and compute have replaced traditional physical resources as the absolute measure of influence. Rankings now track cumulative burn since January 2025 and the average monthly burn rate behind it.
          </p>
        </section>

        {/* Active Leaderboard */}
        <section id="rankings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-[#111] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('individual')}
                className={clsx(
                  "px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all",
                  activeTab === 'individual' 
                    ? "bg-[#D4AF37] text-black shadow-lg" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                Individuals
              </button>
              <button
                onClick={() => setActiveTab('enterprise')}
                className={clsx(
                  "px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all",
                  activeTab === 'enterprise' 
                    ? "bg-[#D4AF37] text-black shadow-lg" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                Enterprises
              </button>
            </div>
          </div>
          <Leaderboard data={filteredData} />
        </section>

        {/* Methodology Section */}
        <Methodology />

        {/* GitHub Repo Intake */}
        <ErrorBoundary>
          <GitHubRepoIntake />
        </ErrorBoundary>

        {/* Data Engine Agent Section */}
        <section id="data-engine" className="px-4 sm:px-6 lg:px-8">
          <ErrorBoundary>
            <AgentDashboard />
          </ErrorBoundary>
        </section>

        {/* Proof of Compute Section */}
        <section id="submit-proof">
          <ErrorBoundary>
            <ProofOfCompute />
          </ErrorBoundary>
        </section>
      </main>

      {/* Chatbot */}
      <ErrorBoundary>
        <Chatbot />
      </ErrorBoundary>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12 text-center text-sm text-gray-500 font-mono">
        <p>Token Forbes © {new Date().getFullYear()}. Data is estimated via proxy metrics and voluntary disclosure.</p>
        <p className="mt-2">1 SET = 1 Standard Equivalent Token</p>
      </footer>
    </div>
  );
}
