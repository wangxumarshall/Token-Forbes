import type { Entity, SourceTag, WealthStructure } from '../data/mockData.js';
import { createEraTokenMetricsFromMonthlyBurn } from '../utils/tokenMath.js';

interface EnterpriseProxySeed {
  id: string;
  name: string;
  company: string;
  avatar?: string;
  sourceTag: SourceTag;
  confidenceInterval: number;
  scaleMultiplier: number;
  githubAliases: string[];
  signals: {
    inferenceScale: number;
    researchScale: number;
    productReach: number;
    developerSurface: number;
    publicCode: number;
  };
  narrative: string;
}

interface GlobalEnterpriseRankingSnapshot {
  enterprises: Entity[];
  methodology: string[];
}

const BASE_ENTERPRISE_MONTHLY_BURN = 2_600_000_000;
const UPDATE_FREQUENCY = 'Daily cache';

const GLOBAL_ENTERPRISE_SEEDS: EnterpriseProxySeed[] = [
  {
    id: 'enterprise-openai',
    name: 'OpenAI',
    company: 'Model lab + API platform',
    avatar: 'openai',
    sourceTag: 'Proxy Inference',
    confidenceInterval: 18,
    scaleMultiplier: 3.2,
    githubAliases: ['openai'],
    signals: {
      inferenceScale: 96,
      researchScale: 95,
      productReach: 94,
      developerSurface: 90,
      publicCode: 40,
    },
    narrative: 'Scores highest on model-training cadence, API demand, and end-user product surface across ChatGPT, enterprise deployments, and developer tooling.',
  },
  {
    id: 'enterprise-google-deepmind',
    name: 'Google DeepMind',
    company: 'Cloud + foundation model stack',
    avatar: 'google',
    sourceTag: 'Proxy Inference',
    confidenceInterval: 19,
    scaleMultiplier: 3,
    githubAliases: ['google', 'google-deepmind', 'tensorflow'],
    signals: {
      inferenceScale: 93,
      researchScale: 96,
      productReach: 88,
      developerSurface: 90,
      publicCode: 54,
    },
    narrative: 'Combines hyperscale infrastructure, Gemini product reach, and one of the deepest public research pipelines in frontier AI.',
  },
  {
    id: 'enterprise-microsoft-ai',
    name: 'Microsoft AI',
    company: 'Copilot + cloud AI platform',
    avatar: 'microsoft',
    sourceTag: 'Proxy Inference',
    confidenceInterval: 19,
    scaleMultiplier: 2.9,
    githubAliases: ['microsoft'],
    signals: {
      inferenceScale: 90,
      researchScale: 84,
      productReach: 96,
      developerSurface: 95,
      publicCode: 75,
    },
    narrative: 'Large Copilot distribution, Azure AI demand, and broad developer-product integration create one of the biggest enterprise token surfaces globally.',
  },
  {
    id: 'enterprise-anthropic',
    name: 'Anthropic',
    company: 'Model lab + enterprise API',
    avatar: 'anthropics',
    sourceTag: 'Proxy Inference',
    confidenceInterval: 20,
    scaleMultiplier: 2.5,
    githubAliases: ['anthropic', 'anthropics'],
    signals: {
      inferenceScale: 88,
      researchScale: 90,
      productReach: 78,
      developerSurface: 84,
      publicCode: 28,
    },
    narrative: 'Strong enterprise API usage, high-context coding workloads, and sustained frontier-model iteration keep Anthropic near the top tier.',
  },
  {
    id: 'enterprise-meta-ai',
    name: 'Meta AI',
    company: 'Research lab + open model ecosystem',
    avatar: 'meta',
    sourceTag: 'Proxy Inference',
    confidenceInterval: 20,
    scaleMultiplier: 2.35,
    githubAliases: ['meta', 'pytorch'],
    signals: {
      inferenceScale: 85,
      researchScale: 92,
      productReach: 82,
      developerSurface: 91,
      publicCode: 62,
    },
    narrative: 'Meta mixes frontier research, open-weight distribution, and broad internal deployment across consumer products and developer frameworks.',
  },
  {
    id: 'enterprise-xai',
    name: 'xAI',
    company: 'Frontier model lab + consumer assistant',
    avatar: 'xai-org',
    sourceTag: 'Model Estimation',
    confidenceInterval: 24,
    scaleMultiplier: 2,
    githubAliases: ['xai-org'],
    signals: {
      inferenceScale: 82,
      researchScale: 86,
      productReach: 76,
      developerSurface: 62,
      publicCode: 18,
    },
    narrative: 'Rapid model iteration plus Grok-facing consumer demand pushes xAI into the global enterprise ranking despite a smaller public software footprint.',
  },
  {
    id: 'enterprise-amazon-aws-ai',
    name: 'Amazon AWS AI',
    company: 'Cloud AI + model marketplace',
    avatar: 'aws',
    sourceTag: 'Proxy Inference',
    confidenceInterval: 22,
    scaleMultiplier: 1.95,
    githubAliases: ['aws', 'aws-samples'],
    signals: {
      inferenceScale: 81,
      researchScale: 74,
      productReach: 84,
      developerSurface: 82,
      publicCode: 44,
    },
    narrative: 'AWS carries huge inference distribution through Bedrock and enterprise workloads even when its public foundation-model profile is less consumer-visible.',
  },
  {
    id: 'enterprise-bytedance-doubao',
    name: 'ByteDance / Doubao',
    company: 'Consumer AI + recommendation infra',
    avatar: '',
    sourceTag: 'Model Estimation',
    confidenceInterval: 24,
    scaleMultiplier: 1.9,
    githubAliases: [],
    signals: {
      inferenceScale: 84,
      researchScale: 78,
      productReach: 88,
      developerSurface: 68,
      publicCode: 12,
    },
    narrative: 'Massive consumer traffic and recommendation-scale infrastructure imply substantial ongoing token throughput even with limited public engineering disclosure.',
  },
  {
    id: 'enterprise-alibaba-qwen',
    name: 'Alibaba / Qwen',
    company: 'Cloud + open model platform',
    avatar: 'alibaba',
    sourceTag: 'Proxy Inference',
    confidenceInterval: 22,
    scaleMultiplier: 1.85,
    githubAliases: ['alibaba', 'qwenlm', 'modelscope'],
    signals: {
      inferenceScale: 80,
      researchScale: 81,
      productReach: 76,
      developerSurface: 79,
      publicCode: 56,
    },
    narrative: 'Qwen combines public model releases, cloud distribution, and enterprise AI adoption into a large token-consumption footprint.',
  },
  {
    id: 'enterprise-baidu-ernie',
    name: 'Baidu / ERNIE',
    company: 'Search AI + enterprise cloud',
    avatar: 'baidu',
    sourceTag: 'Model Estimation',
    confidenceInterval: 24,
    scaleMultiplier: 1.7,
    githubAliases: [],
    signals: {
      inferenceScale: 78,
      researchScale: 76,
      productReach: 74,
      developerSurface: 62,
      publicCode: 14,
    },
    narrative: 'ERNIE’s enterprise and search distribution keep Baidu in the modeled global ranking despite relatively modest public-code visibility.',
  },
  {
    id: 'enterprise-mistral',
    name: 'Mistral AI',
    company: 'Model lab + developer platform',
    avatar: 'mistralai',
    sourceTag: 'Public GitHub Proxy',
    confidenceInterval: 23,
    scaleMultiplier: 1.45,
    githubAliases: ['mistralai'],
    signals: {
      inferenceScale: 73,
      researchScale: 83,
      productReach: 66,
      developerSurface: 74,
      publicCode: 68,
    },
    narrative: 'Mistral punches above its size because public model releases, enterprise APIs, and active developer adoption reinforce each other.',
  },
  {
    id: 'enterprise-perplexity',
    name: 'Perplexity',
    company: 'Consumer AI search product',
    avatar: 'perplexity-ai',
    sourceTag: 'Model Estimation',
    confidenceInterval: 24,
    scaleMultiplier: 1.3,
    githubAliases: ['perplexity-ai'],
    signals: {
      inferenceScale: 69,
      researchScale: 62,
      productReach: 79,
      developerSurface: 58,
      publicCode: 22,
    },
    narrative: 'Perplexity’s monthly burn is driven more by always-on consumer inference than by a large public engineering footprint.',
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToNearestHundredMillion(value: number) {
  return Math.round(value / 100_000_000) * 100_000_000;
}

function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function formatCompactTokens(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function getEnterpriseTitle(totalTokens: number) {
  if (totalTokens >= 300_000_000_000) return 'Global AI Superpower';
  if (totalTokens >= 120_000_000_000) return 'Enterprise Whale';
  if (totalTokens >= 40_000_000_000) return 'AI Scale Leader';
  return 'Frontier Compute Operator';
}

function buildWealthStructure(seed: EnterpriseProxySeed): WealthStructure[] {
  const total =
    seed.signals.inferenceScale +
    seed.signals.researchScale +
    seed.signals.productReach +
    seed.signals.developerSurface +
    seed.signals.publicCode;

  const trainingShare = Math.round(
    ((seed.signals.researchScale + seed.signals.inferenceScale * 0.25) / total) * 100,
  );
  const servingShare = Math.round(
    ((seed.signals.inferenceScale * 0.55 + seed.signals.productReach) / total) * 100,
  );

  return [
    { name: 'Model Training & Research', value: clamp(trainingShare, 18, 52) },
    { name: 'Inference & Product Traffic', value: clamp(servingShare, 24, 58) },
    {
      name: 'Internal Copilot / Engineering',
      value: Math.max(8, 100 - clamp(trainingShare, 18, 52) - clamp(servingShare, 24, 58)),
    },
  ];
}

function buildOpenSourceLookup(openSourceEnterprises: Entity[]) {
  const lookup = new Map<string, Entity>();

  for (const entity of openSourceEnterprises) {
    lookup.set(entity.name.toLowerCase(), entity);
    lookup.set(entity.id.toLowerCase(), entity);
  }

  return lookup;
}

function calculateProxyMonthlyBurn(seed: EnterpriseProxySeed, openSourceMonthlyBurn: number) {
  const weightedSignal =
    seed.signals.inferenceScale * 0.34 +
    seed.signals.researchScale * 0.24 +
    seed.signals.productReach * 0.2 +
    seed.signals.developerSurface * 0.14 +
    seed.signals.publicCode * 0.08;

  const baseBurn =
    BASE_ENTERPRISE_MONTHLY_BURN *
    (1 + weightedSignal / 16) *
    seed.scaleMultiplier;

  const publicCodeBoost =
    openSourceMonthlyBurn > 0
      ? openSourceMonthlyBurn * (0.35 + seed.signals.publicCode / 220)
      : 0;

  return roundToNearestHundredMillion(baseBurn + publicCodeBoost);
}

function buildMethodology() {
  return [
    'Start from a curated global enterprise universe spanning frontier model labs, hyperscalers, and AI-native application companies.',
    'Score each company on five project-methodology signals: inference footprint, research cadence, product reach, developer surface area, and public code output.',
    'Use public GitHub enterprise burn, when available, as a calibration layer rather than the whole answer so closed-source giants can still be ranked.',
    'Convert the blended proxy score into average monthly token burn, then normalize each company to cumulative totals since January 2025.',
  ];
}

export function buildGlobalEnterpriseRankingSnapshot(
  openSourceEnterprises: Entity[] = [],
  now = new Date(),
): GlobalEnterpriseRankingSnapshot {
  const lookup = buildOpenSourceLookup(openSourceEnterprises);
  const today = formatDate(now);
  const nextUpdate = formatDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  const enterprises = GLOBAL_ENTERPRISE_SEEDS.map((seed) => {
    const matchedOpenSource = seed.githubAliases
      .map((alias) => lookup.get(alias.toLowerCase()))
      .filter((entity): entity is Entity => Boolean(entity));

    const openSourceMonthlyBurn = matchedOpenSource.reduce(
      (sum, entity) => sum + entity.tokensPerMonth,
      0,
    );
    const metrics = createEraTokenMetricsFromMonthlyBurn(
      calculateProxyMonthlyBurn(seed, openSourceMonthlyBurn),
      now,
    );
    const publicCodeNote =
      openSourceMonthlyBurn > 0
        ? ` Public open-source calibration contributed ${formatCompactTokens(openSourceMonthlyBurn)} monthly tokens from ${matchedOpenSource.map((entity) => entity.name).join(', ')}.`
        : '';

    return {
      id: seed.id,
      rank: 0,
      name: seed.name,
      title: getEnterpriseTitle(metrics.totalTokens),
      company: seed.company,
      avatar: seed.avatar || '',
      ...metrics,
      confidenceInterval: seed.confidenceInterval,
      sourceTag: seed.sourceTag,
      updateFrequency: UPDATE_FREQUENCY,
      lastUpdated: today,
      nextUpdate,
      entityType: 'enterprise' as const,
      wealthStructure: buildWealthStructure(seed),
      description: `${seed.narrative}${publicCodeNote} Token burn is modeled with the same proxy methodology used across Token Forbes and normalized back to the January 2025 AI-coding era baseline.`,
    };
  })
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .map((entity, index) => ({ ...entity, rank: index + 1 }));

  return {
    enterprises,
    methodology: buildMethodology(),
  };
}
