import { getGitHubAvatarUrl } from '../utils/avatar.js';
import { createEraTokenMetricsFromMonthlyBurn } from '../utils/tokenMath.js';

export type SourceTag =
  | 'Direct Disclosure'
  | 'Proxy Inference'
  | 'Model Estimation'
  | 'API Partner'
  | 'Public GitHub Proxy';

export interface WealthStructure {
  name: string;
  value: number;
}

export interface Entity {
  id: string;
  rank: number;
  name: string;
  title: string;
  company: string;
  avatar: string;
  profileUrl?: string;
  totalTokens: number;
  tokensPerDay: number;
  tokensPerMonth: number;
  tokensPerYear: number;
  confidenceInterval: number;
  sourceTag: SourceTag;
  updateFrequency: string;
  lastUpdated: string;
  nextUpdate: string;
  entityType: 'individual' | 'enterprise';
  wealthStructure: WealthStructure[];
  description: string;
}

const githubAvatar = (login: string) => getGitHubAvatarUrl(login);
const FALLBACK_MONTHLY_BURN_MULTIPLIER = 9000;

const today = new Date().toISOString().split('T')[0];
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

function createEntity(base: Omit<Entity, 'rank' | 'lastUpdated' | 'nextUpdate' | 'updateFrequency'>): Entity {
  const baselineMonthlyBurn = Math.max(
    base.tokensPerMonth,
    base.tokensPerDay * 30,
    base.tokensPerYear / 12,
    base.totalTokens / 12,
  );
  const eraMetrics = createEraTokenMetricsFromMonthlyBurn(
    Math.max(baselineMonthlyBurn * FALLBACK_MONTHLY_BURN_MULTIPLIER, 180_000_000),
  );

  return {
    rank: 0,
    updateFrequency: 'Weekly',
    lastUpdated: today,
    nextUpdate: nextWeek,
    ...base,
    ...eraMetrics,
  };
}

export const individualEntities: Entity[] = [
  createEntity({
    id: 'gh-i1',
    name: 'Kenny',
    title: 'Token Power Committer',
    company: 'Mastra',
    avatar: githubAvatar('kenny'),
    totalTokens: 2.75 * 1e6,
    tokensPerDay: (2.75 * 1e6) / 365,
    tokensPerMonth: (2.75 * 1e6) / 12,
    tokensPerYear: 2.75 * 1e6,
    confidenceInterval: 22,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'individual',
    wealthStructure: [
      { name: 'Generated Code', value: 58 },
      { name: 'Refactors & Rewrites', value: 24 },
      { name: 'Prompt / Review Loops', value: 18 },
    ],
    description:
      'Public GitHub proxy estimate driven by 1,298 recent commits in the Mastra AI framework, weighted by AI-native repo density and code-modification priors.',
  }),
  createEntity({
    id: 'gh-i2',
    name: 'Abhi Aiyer',
    title: 'Token Power Committer',
    company: 'Mastra',
    avatar: githubAvatar('abhi-aiyer'),
    totalTokens: 2.58 * 1e6,
    tokensPerDay: (2.58 * 1e6) / 365,
    tokensPerMonth: (2.58 * 1e6) / 12,
    tokensPerYear: 2.58 * 1e6,
    confidenceInterval: 22,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'individual',
    wealthStructure: [
      { name: 'Generated Code', value: 56 },
      { name: 'Refactors & Rewrites', value: 25 },
      { name: 'Prompt / Review Loops', value: 19 },
    ],
    description:
      'Mastra contributor with 1,219 public commits in the latest yearly window. Estimated token burn includes AI-assisted generation, debugging and maintenance iteration cycles.',
  }),
  createEntity({
    id: 'gh-i3',
    name: 'pablodanswer',
    title: 'AI Shipyard Captain',
    company: 'Danswer',
    avatar: githubAvatar('pablodanswer'),
    totalTokens: 2.25 * 1e6,
    tokensPerDay: (2.25 * 1e6) / 365,
    tokensPerMonth: (2.25 * 1e6) / 12,
    tokensPerYear: 2.25 * 1e6,
    confidenceInterval: 25,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'individual',
    wealthStructure: [
      { name: 'Generated Code', value: 52 },
      { name: 'Refactors & Rewrites', value: 28 },
      { name: 'Prompt / Review Loops', value: 20 },
    ],
    description:
      'Danswer ranks highly in the public proxy model because of sustained repo activity in an AI-native enterprise Q&A stack with a large code-change surface.',
  }),
  createEntity({
    id: 'gh-i4',
    name: 'Ehindero Israel',
    title: 'AI Shipyard Captain',
    company: 'Mastra',
    avatar: githubAvatar('ehinderolisa'),
    totalTokens: 2.02 * 1e6,
    tokensPerDay: (2.02 * 1e6) / 365,
    tokensPerMonth: (2.02 * 1e6) / 12,
    tokensPerYear: 2.02 * 1e6,
    confidenceInterval: 24,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'individual',
    wealthStructure: [
      { name: 'Generated Code', value: 57 },
      { name: 'Refactors & Rewrites', value: 23 },
      { name: 'Prompt / Review Loops', value: 20 },
    ],
    description:
      'Estimated from 965 public commits in the Mastra contributor table, plus a repo-type multiplier for agent workflow code and orchestration glue.',
  }),
  createEntity({
    id: 'gh-i5',
    name: 'dayo',
    title: 'Agent Builder',
    company: 'Mastra',
    avatar: githubAvatar('dayo85'),
    totalTokens: 1.60 * 1e6,
    tokensPerDay: (1.60 * 1e6) / 365,
    tokensPerMonth: (1.60 * 1e6) / 12,
    tokensPerYear: 1.60 * 1e6,
    confidenceInterval: 24,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'individual',
    wealthStructure: [
      { name: 'Generated Code', value: 54 },
      { name: 'Refactors & Rewrites', value: 26 },
      { name: 'Prompt / Review Loops', value: 20 },
    ],
    description:
      'Public GitHub proxy estimate for Mastra based on recent commit intensity, agentic framework complexity and AI-assistance probability scaling.',
  }),
  createEntity({
    id: 'gh-i6',
    name: 'Joshua Folorunsho',
    title: 'Agent Builder',
    company: 'Mastra',
    avatar: githubAvatar('folorunsojoshua'),
    totalTokens: 1.15 * 1e6,
    tokensPerDay: (1.15 * 1e6) / 365,
    tokensPerMonth: (1.15 * 1e6) / 12,
    tokensPerYear: 1.15 * 1e6,
    confidenceInterval: 25,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'individual',
    wealthStructure: [
      { name: 'Generated Code', value: 53 },
      { name: 'Refactors & Rewrites', value: 26 },
      { name: 'Prompt / Review Loops', value: 21 },
    ],
    description:
      'Derived from the public contributor table and normalized into yearly accepted-code tokens using the project’s AI-native repo profile.',
  }),
  createEntity({
    id: 'gh-i7',
    name: 'ccurme',
    title: 'Agent Builder',
    company: 'LangChain',
    avatar: githubAvatar('ccurme'),
    totalTokens: 1.03 * 1e6,
    tokensPerDay: (1.03 * 1e6) / 365,
    tokensPerMonth: (1.03 * 1e6) / 12,
    tokensPerYear: 1.03 * 1e6,
    confidenceInterval: 26,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'individual',
    wealthStructure: [
      { name: 'Generated Code', value: 51 },
      { name: 'Refactors & Rewrites', value: 27 },
      { name: 'Prompt / Review Loops', value: 22 },
    ],
    description:
      'LangChain remains one of the densest agent-framework repositories on GitHub, so high public contribution velocity converts into a strong token proxy score.',
  }),
  createEntity({
    id: 'gh-i8',
    name: 'rkuo-danswer',
    title: 'Model-Assisted Hacker',
    company: 'Danswer',
    avatar: githubAvatar('rkuo-danswer'),
    totalTokens: 0.80 * 1e6,
    tokensPerDay: (0.80 * 1e6) / 365,
    tokensPerMonth: (0.80 * 1e6) / 12,
    tokensPerYear: 0.80 * 1e6,
    confidenceInterval: 27,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'individual',
    wealthStructure: [
      { name: 'Generated Code', value: 50 },
      { name: 'Refactors & Rewrites', value: 28 },
      { name: 'Prompt / Review Loops', value: 22 },
    ],
    description:
      'Weighted by recent public commits in Danswer and the repo’s full-stack AI application profile, which typically carries larger accepted-code surfaces per change.',
  }),
  createEntity({
    id: 'gh-i9',
    name: 'timothycarambat',
    title: 'Model-Assisted Hacker',
    company: 'AnythingLLM',
    avatar: githubAvatar('timothycarambat'),
    totalTokens: 0.78 * 1e6,
    tokensPerDay: (0.78 * 1e6) / 365,
    tokensPerMonth: (0.78 * 1e6) / 12,
    tokensPerYear: 0.78 * 1e6,
    confidenceInterval: 27,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'individual',
    wealthStructure: [
      { name: 'Generated Code', value: 49 },
      { name: 'Refactors & Rewrites', value: 29 },
      { name: 'Prompt / Review Loops', value: 22 },
    ],
    description:
      'AnythingLLM contributor with outsized public activity inside a consumer-facing AI product stack, resulting in a strong yearly coding-token proxy.',
  }),
  createEntity({
    id: 'gh-i10',
    name: 'Erick Friis',
    title: 'Model-Assisted Hacker',
    company: 'LangChain',
    avatar: githubAvatar('erickfriis'),
    totalTokens: 0.62 * 1e6,
    tokensPerDay: (0.62 * 1e6) / 365,
    tokensPerMonth: (0.62 * 1e6) / 12,
    tokensPerYear: 0.62 * 1e6,
    confidenceInterval: 28,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'individual',
    wealthStructure: [
      { name: 'Generated Code', value: 50 },
      { name: 'Refactors & Rewrites', value: 27 },
      { name: 'Prompt / Review Loops', value: 23 },
    ],
    description:
      'Estimated from public LangChain contribution velocity and AI-agent framework weighting, normalized into annual coding-token consumption.',
  }),
];

export const enterpriseEntities: Entity[] = [
  createEntity({
    id: 'gh-e1',
    name: 'Mastra',
    title: 'Public GitHub AI Collective',
    company: 'mastra-ai/mastra',
    avatar: githubAvatar('mastra-ai'),
    totalTokens: 11.4 * 1e6,
    tokensPerDay: (11.4 * 1e6) / 365,
    tokensPerMonth: (11.4 * 1e6) / 12,
    tokensPerYear: 11.4 * 1e6,
    confidenceInterval: 23,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'enterprise',
    wealthStructure: [
      { name: 'Agent Framework Features', value: 55 },
      { name: 'Rewrites / Maintenance', value: 25 },
      { name: 'Prompt / Review Loops', value: 20 },
    ],
    description:
      'Aggregate proxy token estimate for the Mastra public contributor set. Built from recent contributor activity and AI-native framework weighting.',
  }),
  createEntity({
    id: 'gh-e2',
    name: 'LangChain',
    title: 'Public GitHub AI Collective',
    company: 'langchain-ai/langchain',
    avatar: githubAvatar('langchain-ai'),
    totalTokens: 4.9 * 1e6,
    tokensPerDay: (4.9 * 1e6) / 365,
    tokensPerMonth: (4.9 * 1e6) / 12,
    tokensPerYear: 4.9 * 1e6,
    confidenceInterval: 25,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'enterprise',
    wealthStructure: [
      { name: 'Framework Integrations', value: 50 },
      { name: 'Refactors / Maintenance', value: 27 },
      { name: 'Prompt / Review Loops', value: 23 },
    ],
    description:
      'LangChain’s public AI coding token estimate is built from its dense agent-framework ecosystem and top-contributor commit cadence.',
  }),
  createEntity({
    id: 'gh-e3',
    name: 'Danswer',
    title: 'Public GitHub AI Collective',
    company: 'danswer-ai/danswer',
    avatar: githubAvatar('danswer-ai'),
    totalTokens: 4.3 * 1e6,
    tokensPerDay: (4.3 * 1e6) / 365,
    tokensPerMonth: (4.3 * 1e6) / 12,
    tokensPerYear: 4.3 * 1e6,
    confidenceInterval: 26,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'enterprise',
    wealthStructure: [
      { name: 'AI Product Features', value: 48 },
      { name: 'Refactors / Maintenance', value: 31 },
      { name: 'Prompt / Review Loops', value: 21 },
    ],
    description:
      'Danswer scores highly because its public commit history combines retrieval, AI application logic and enterprise product maintenance.',
  }),
  createEntity({
    id: 'gh-e4',
    name: 'AnythingLLM',
    title: 'Public GitHub AI Collective',
    company: 'Mintplex-Labs/anything-llm',
    avatar: githubAvatar('Mintplex-Labs'),
    totalTokens: 1.4 * 1e6,
    tokensPerDay: (1.4 * 1e6) / 365,
    tokensPerMonth: (1.4 * 1e6) / 12,
    tokensPerYear: 1.4 * 1e6,
    confidenceInterval: 27,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'enterprise',
    wealthStructure: [
      { name: 'AI Product Features', value: 47 },
      { name: 'Refactors / Maintenance', value: 30 },
      { name: 'Prompt / Review Loops', value: 23 },
    ],
    description:
      'AnythingLLM’s public proxy score reflects high accepted-code density in a shipping AI product stack with multiple integration surfaces.',
  }),
  createEntity({
    id: 'gh-e5',
    name: 'Chainlit',
    title: 'Public GitHub AI Collective',
    company: 'Chainlit/chainlit',
    avatar: githubAvatar('Chainlit'),
    totalTokens: 0.9 * 1e6,
    tokensPerDay: (0.9 * 1e6) / 365,
    tokensPerMonth: (0.9 * 1e6) / 12,
    tokensPerYear: 0.9 * 1e6,
    confidenceInterval: 28,
    sourceTag: 'Public GitHub Proxy',
    entityType: 'enterprise',
    wealthStructure: [
      { name: 'Framework Features', value: 46 },
      { name: 'Refactors / Maintenance', value: 29 },
      { name: 'Prompt / Review Loops', value: 25 },
    ],
    description:
      'Public GitHub proxy estimate for Chainlit’s core contributor set, weighted toward framework changes and AI-assisted iteration.',
  }),
];

export const allMockEntities: Entity[] = [
  ...individualEntities,
  ...enterpriseEntities,
];
