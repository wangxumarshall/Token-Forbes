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
import { allMockEntities, Entity } from './data/mockData';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import clsx from 'clsx';

export default function App() {
  const [leaderboardData, setLeaderboardData] = useState<Entity[]>([]);
  const [activeTab, setActiveTab] = useState<'individual' | 'enterprise'>('individual');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'proofs'), (snapshot) => {
      const proofs = snapshot.docs.map(doc => doc.data());
      
      // Merge mock entities and proofs
      let mergedEntities = [...allMockEntities];
      
      for (const proof of proofs) {
        const existingIndex = mergedEntities.findIndex(e => e.name.toLowerCase() === proof.name?.toLowerCase());
        
        if (existingIndex >= 0) {
          // Accumulate tokens
          const addedTokens = proof.tokens || 0;
          mergedEntities[existingIndex] = {
            ...mergedEntities[existingIndex],
            totalTokens: mergedEntities[existingIndex].totalTokens + addedTokens,
            tokensPerMonth: mergedEntities[existingIndex].tokensPerMonth + addedTokens,
            tokensPerYear: mergedEntities[existingIndex].tokensPerYear + (addedTokens * 12),
            tokensPerDay: mergedEntities[existingIndex].tokensPerDay + (addedTokens / 30),
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        } else {
          // Add new row
          const tokens = proof.tokens || 0;
          let categoryLabel = 'Token Enthusiast';
          if (tokens >= 1e12) categoryLabel = 'Compute Giant';
          else if (tokens >= 1e9) categoryLabel = 'Enterprise Whale';
          else if (tokens >= 1e6) categoryLabel = 'Super Geek';

          mergedEntities.push({
            id: proof.userId || Math.random().toString(),
            rank: 0,
            name: proof.name || 'Unknown',
            title: categoryLabel,
            company: 'Independent',
            avatar: proof.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${proof.name}`,
            totalTokens: tokens,
            tokensPerDay: tokens / 30,
            tokensPerMonth: tokens,
            tokensPerYear: tokens * 12,
            confidenceInterval: 0,
            sourceTag: 'Direct Disclosure',
            updateFrequency: 'Real-time',
            lastUpdated: new Date().toISOString().split('T')[0],
            nextUpdate: 'Real-time',
            entityType: 'individual',
            wealthStructure: [{ name: 'Submitted Compute', value: 100 }],
            description: 'User submitted proof of compute.'
          });
        }
      }

      // Sort by totalTokens descending
      mergedEntities.sort((a, b) => b.totalTokens - a.totalTokens);

      setLeaderboardData(mergedEntities);
    }, (error) => {
      console.error("Error fetching proofs:", error);
      // Fallback to mock data sorted
      let fallback = [...allMockEntities].sort((a, b) => b.totalTokens - a.totalTokens);
      setLeaderboardData(fallback);
    });

    return () => unsubscribe();
  }, []);

  const filteredData = leaderboardData
    .filter(entity => entity.entityType === activeTab)
    .map((entity, index) => ({ ...entity, rank: index + 1 }));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#D4AF37] selection:text-black">
      <Header />
      <HeroTicker />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight">
            The New <span className="text-[#D4AF37] italic">Digital Oil</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            In the AI era, tokens and compute have replaced traditional physical resources as the absolute measure of influence. Welcome to the Global AI Token Consumption Leaderboard.
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

