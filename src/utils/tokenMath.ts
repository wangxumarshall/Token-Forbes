export interface TokenMetricShape {
  totalTokens: number;
  tokensPerDay: number;
  tokensPerMonth: number;
  tokensPerYear: number;
}

export interface CalculateAITokensInput {
  commits: number;
  additions: number;
  deletions: number;
  effectiveLines?: number;
  aiNativeScore: number;
  repoStars: number;
  repoForks: number;
  repoKind:
    | 'agent-framework'
    | 'ai-app'
    | 'infra'
    | 'general';
  activeWeeks: number;
  languages?: string[];
}

export interface CalculatedAITokens extends TokenMetricShape {
  averageDailyTokens: number;
  averageMonthlyTokens: number;
  intensityScore: number;
}

export const AI_CODING_ERA_START = new Date('2025-01-01T00:00:00.000Z');
const DAYS_PER_MONTH = 30;
const HIGH_INTENSITY_DAILY_BASE = 50_000_000;
const MIN_MONTHLY_BURN = 150_000_000;
const MAX_MONTHLY_BURN = 18_000_000_000;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToNearestMillion(value: number) {
  return Math.round(value / 1_000_000) * 1_000_000;
}

export function getMonthsSinceAICodingEraStart(now = new Date()) {
  const startYear = AI_CODING_ERA_START.getUTCFullYear();
  const startMonth = AI_CODING_ERA_START.getUTCMonth();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  return Math.max(1, (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1);
}

export function createEraTokenMetricsFromMonthlyBurn(averageMonthlyTokens: number, now = new Date()): TokenMetricShape {
  const monthly = Math.max(0, Math.round(averageMonthlyTokens));
  const months = getMonthsSinceAICodingEraStart(now);

  return {
    totalTokens: monthly * months,
    tokensPerDay: monthly,
    tokensPerMonth: monthly,
    tokensPerYear: monthly * 12,
  };
}

export function getAverageMonthlyBurn(metrics: TokenMetricShape, now = new Date()) {
  const months = getMonthsSinceAICodingEraStart(now);

  return Math.max(
    metrics.tokensPerMonth || 0,
    metrics.tokensPerDay || 0,
    (metrics.tokensPerDay || 0) * DAYS_PER_MONTH,
    (metrics.tokensPerYear || 0) / 12,
    (metrics.totalTokens || 0) / months,
  );
}

export function normalizeTokenMetrics<T extends TokenMetricShape>(metrics: T, now = new Date()): T {
  const normalized = createEraTokenMetricsFromMonthlyBurn(getAverageMonthlyBurn(metrics, now), now);
  return { ...metrics, ...normalized };
}

export function calculateAITokens(input: CalculateAITokensInput, now = new Date()): CalculatedAITokens {
  const effectiveLines = input.effectiveLines ?? input.additions + input.deletions * 0.9 + input.commits * 180;
  const normalizedCommits = clamp(Math.log1p(input.commits) / Math.log1p(180), 0.08, 1.45);
  const normalizedLines = clamp(Math.log1p(effectiveLines) / Math.log1p(180_000), 0.1, 1.4);
  const normalizedStars = clamp(Math.log1p(input.repoStars) / Math.log1p(300_000), 0.2, 1.35);
  const normalizedForks = clamp(Math.log1p(input.repoForks) / Math.log1p(50_000), 0.15, 1.2);
  const activeWeeksRatio = clamp(input.activeWeeks / 4, 0.25, 1.2);
  const rewriteRatio = clamp(input.deletions / Math.max(1, input.additions + input.deletions), 0.08, 0.8);
  const systemsLangBonus = (input.languages || []).some((language) =>
    ['rust', 'go', 'c++', 'cuda', 'c', 'kotlin'].includes(language.toLowerCase()),
  )
    ? 0.08
    : 0;

  const repoKindMultiplier: Record<CalculateAITokensInput['repoKind'], number> = {
    'agent-framework': 1.42,
    'ai-app': 1.32,
    infra: 1.26,
    general: 1.12,
  };

  const contextWindowMultiplier =
    1.05 +
    input.aiNativeScore * 0.95 +
    normalizedStars * 0.18 +
    normalizedForks * 0.08 +
    systemsLangBonus;

  const multiPassMultiplier =
    1.02 +
    normalizedCommits * 0.34 +
    normalizedLines * 0.26 +
    activeWeeksRatio * 0.12 +
    rewriteRatio * 0.16;

  const intensityScore = clamp(
    normalizedCommits * 0.31 +
      normalizedLines * 0.28 +
      activeWeeksRatio * 0.14 +
      normalizedStars * 0.12 +
      input.aiNativeScore * 0.15,
    0.12,
    1.8,
  );

  const averageDailyTokens =
    HIGH_INTENSITY_DAILY_BASE *
    intensityScore *
    repoKindMultiplier[input.repoKind] *
    contextWindowMultiplier *
    multiPassMultiplier;

  const averageMonthlyTokens = clamp(
    roundToNearestMillion(averageDailyTokens * DAYS_PER_MONTH),
    MIN_MONTHLY_BURN,
    MAX_MONTHLY_BURN,
  );

  return {
    ...createEraTokenMetricsFromMonthlyBurn(averageMonthlyTokens, now),
    averageDailyTokens,
    averageMonthlyTokens,
    intensityScore,
  };
}
