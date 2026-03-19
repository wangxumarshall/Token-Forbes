import { Entity, SourceTag, WealthStructure } from '../data/mockData.js';
import { calculateAITokens, createEraTokenMetricsFromMonthlyBurn } from '../utils/tokenMath.js';

const GITHUB_API_BASE = 'https://api.github.com';
const RECENT_ACTIVITY_DAYS = 30;
const MAX_REPO_CONTRIBUTORS = 50;
const MAX_GLOBAL_CONTRIBUTORS = 500;
const MAX_GLOBAL_REPOS = 28;
const MAX_GLOBAL_REPOS_WITHOUT_TOKEN = 8;
const MAX_GLOBAL_REPO_CONTRIBUTORS = 24;
const SEARCH_RESULTS_PER_PAGE = 20;
const SEARCH_PAGES = 3;
const SEARCH_PAGES_WITHOUT_TOKEN = 1;
const POLL_ATTEMPTS = 5;
const POLL_DELAY_MS = 1200;
const BENCHMARK_REPOS = [
  'microsoft/vscode',
  'vercel/next.js',
  'langchain-ai/langchain',
  'huggingface/transformers',
];

type RepoKind = 'agent-framework' | 'ai-app' | 'infra' | 'general';

interface GitHubRepoApiResponse {
  full_name: string;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  languages_url: string;
  size: number;
  pushed_at: string;
  topics?: string[];
  owner: {
    login: string;
    type: 'User' | 'Organization';
    avatar_url: string;
    html_url: string;
  };
}

interface GitHubSearchResponse {
  items: GitHubRepoApiResponse[];
}

interface GitHubLanguageMap {
  [language: string]: number;
}

interface GitHubContributorWeek {
  w: number;
  a: number;
  d: number;
  c: number;
}

interface GitHubContributorStats {
  total: number;
  author?: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  weeks: GitHubContributorWeek[];
}

interface ContributorActivity {
  author: NonNullable<GitHubContributorStats['author']>;
  additions: number;
  deletions: number;
  commits: number;
  effectiveLines: number;
  activeWeeks: number;
}

interface BuildRepoEvaluationOptions {
  contributorLimit: number;
  updateFrequency: string;
}

interface GitHubRequestOptions {
  token?: string;
}

interface AggregatedEntitySeed {
  id: string;
  name: string;
  avatar: string;
  entityType: 'individual' | 'enterprise';
  sourceTag: SourceTag;
  confidenceInterval: number;
  monthlyBurn: number;
  additions: number;
  deletions: number;
  repoNames: string[];
  descriptions: string[];
}

export interface RepoEvaluationSummary {
  owner: string;
  repo: string;
  fullName: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  topics: string[];
  ownerType: 'User' | 'Organization';
  ownerAvatar: string;
  repoKind: RepoKind;
  aiNativeScore: number;
  pushedAt?: string;
  evaluationWindowDays?: number;
  activeContributors?: number;
}

export interface GitHubRepoEvaluation {
  repo: RepoEvaluationSummary;
  individualEntities: Entity[];
  enterpriseEntity: Entity;
  methodology: string[];
}

export interface GlobalGitHubRankingSnapshot {
  generatedAt: string;
  individuals: Entity[];
  enterprises: Entity[];
  methodology: string[];
  repoCount: number;
  contributorCount: number;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function getRecentActivityStart(now = new Date()) {
  return new Date(now.getTime() - RECENT_ACTIVITY_DAYS * 24 * 60 * 60 * 1000);
}

function createGitHubHeaders(token?: string) {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchGitHubJson<T>(url: string, options: GitHubRequestOptions = {}): Promise<T> {
  const response = await fetch(url, {
    headers: createGitHubHeaders(options.token),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

function parseGitHubRepoInput(input: string) {
  const trimmed = input.trim().replace(/\/+$/, '');

  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    if (!/github\.com$/i.test(url.hostname)) {
      throw new Error('Please enter a valid GitHub repository URL.');
    }

    const [, owner, repo] = url.pathname.split('/');
    if (!owner || !repo) {
      throw new Error('Repository URL must look like https://github.com/owner/repo.');
    }

    return { owner, repo };
  }

  const parts = trimmed.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Enter a GitHub repository as owner/repo or a full https://github.com/owner/repo URL.');
  }

  return { owner: parts[0], repo: parts[1] };
}

function getRepoKind(repo: GitHubRepoApiResponse, languages: GitHubLanguageMap): RepoKind {
  const blob = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')} ${Object.keys(languages).join(' ')}`.toLowerCase();

  if (/(agent|agents|workflow|langchain|langgraph|mastra|autogen|crewai|orchestr|assistant-runtime)/.test(blob)) {
    return 'agent-framework';
  }

  if (/(chat|assistant|copilot|llm|rag|prompt|embedding|chatbot|ai-sdk|inference-client)/.test(blob)) {
    return 'ai-app';
  }

  if (/(inference|serving|gpu|cuda|kernel|runtime|vector|transformer|vllm|distributed|compiler|bundler)/.test(blob)) {
    return 'infra';
  }

  return 'general';
}

function getAiNativeScore(repo: GitHubRepoApiResponse, languages: GitHubLanguageMap, repoKind: RepoKind) {
  const blob = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')} ${Object.keys(languages).join(' ')}`.toLowerCase();
  let score = 0.42;

  const keywordWeights: [RegExp, number][] = [
    [/(llm|language-model|language model|gpt|claude|gemini|openai|anthropic)/, 0.16],
    [/(agent|agents|autogen|crewai|mastra|langchain|langgraph)/, 0.18],
    [/(rag|retrieval|embedding|vector|prompt|rerank)/, 0.14],
    [/(inference|serving|transformer|gpu|cuda|training|fine[- ]?tuning|reasoning)/, 0.13],
    [/(copilot|assistant|chatbot|sdk|ide|editor)/, 0.08],
  ];

  for (const [pattern, weight] of keywordWeights) {
    if (pattern.test(blob)) {
      score += weight;
    }
  }

  const repoKindBonus: Record<RepoKind, number> = {
    'agent-framework': 0.14,
    'ai-app': 0.1,
    infra: 0.08,
    general: 0,
  };

  score += repoKindBonus[repoKind];

  return clamp(score, 0.42, 1);
}

function getContributorTitle(totalTokens: number) {
  if (totalTokens >= 120_000_000_000) return 'AI Coding Titan';
  if (totalTokens >= 60_000_000_000) return 'Token Power Committer';
  if (totalTokens >= 25_000_000_000) return 'AI Shipyard Captain';
  if (totalTokens >= 10_000_000_000) return 'Agent Builder';
  return 'Model-Assisted Hacker';
}

function getEnterpriseTitle(totalTokens: number) {
  if (totalTokens >= 300_000_000_000) return 'Public GitHub AI Superpower';
  if (totalTokens >= 120_000_000_000) return 'Public GitHub AI Collective';
  if (totalTokens >= 40_000_000_000) return 'Enterprise Whale';
  return 'Super Geek Collective';
}

function buildWealthStructure(additions: number, deletions: number, aiAssistRatio: number): WealthStructure[] {
  const total = Math.max(additions + deletions, 1);
  const generatedCode = Math.round((additions / total) * 58);
  const rewrites = Math.round((deletions / total) * 27);
  const prompting = Math.max(15, Math.round(aiAssistRatio * 30));
  const normalized = generatedCode + rewrites + prompting;
  const scale = 100 / normalized;

  return [
    { name: 'Generated Code', value: Math.round(generatedCode * scale) },
    { name: 'Refactors & Rewrites', value: Math.round(rewrites * scale) },
    { name: 'Prompt / Review Loops', value: 100 - Math.round(generatedCode * scale) - Math.round(rewrites * scale) },
  ];
}

async function fetchContributorStats(fullName: string, options: GitHubRequestOptions = {}) {
  const endpoint = `${GITHUB_API_BASE}/repos/${fullName}/stats/contributors`;

  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    const response = await fetch(endpoint, {
      headers: createGitHubHeaders(options.token),
    });

    if (response.status === 202) {
      await wait(POLL_DELAY_MS);
      continue;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub contributor stats error (${response.status}): ${errorText || response.statusText}`);
    }

    return response.json() as Promise<GitHubContributorStats[]>;
  }

  throw new Error('GitHub is still computing contributor statistics. Please retry in a few seconds.');
}

function getRecentContributorActivity(
  contributor: GitHubContributorStats,
  now = new Date(),
): ContributorActivity | null {
  if (!contributor.author?.login || contributor.author.login.endsWith('[bot]') || contributor.author.login.endsWith('-bot')) {
    return null;
  }

  const cutoff = getRecentActivityStart(now).getTime() / 1000;
  const recentWeeks = contributor.weeks.filter((week) => week.w >= cutoff);
  const additions = recentWeeks.reduce((sum, week) => sum + week.a, 0);
  const deletions = recentWeeks.reduce((sum, week) => sum + week.d, 0);
  const commits = recentWeeks.reduce((sum, week) => sum + week.c, 0);
  const activeWeeks = recentWeeks.filter((week) => week.c > 0 || week.a > 0 || week.d > 0).length;
  const effectiveLines = additions + deletions * 0.9 + commits * 180;

  if (commits <= 0 && additions <= 0 && deletions <= 0) {
    return null;
  }

  return {
    author: contributor.author,
    additions,
    deletions,
    commits,
    effectiveLines,
    activeWeeks,
  };
}

function getSourceTag(): SourceTag {
  return 'Public GitHub Proxy';
}

function buildContributorEntity(
  repoResponse: GitHubRepoApiResponse,
  contributor: ContributorActivity,
  index: number,
  languages: GitHubLanguageMap,
  repoKind: RepoKind,
  aiNativeScore: number,
  updateFrequency: string,
): Entity {
  const tokenEstimate = calculateAITokens({
    commits: contributor.commits,
    additions: contributor.additions,
    deletions: contributor.deletions,
    effectiveLines: contributor.effectiveLines,
    aiNativeScore,
    repoStars: repoResponse.stargazers_count,
    repoForks: repoResponse.forks_count,
    repoKind,
    activeWeeks: contributor.activeWeeks,
    languages: Object.keys(languages),
  });
  const confidenceInterval = Math.max(8, Math.round(24 - aiNativeScore * 7 - contributor.activeWeeks * 2));
  const wealthStructure = buildWealthStructure(contributor.additions, contributor.deletions, aiNativeScore);
  const today = formatDate();
  const nextUpdate = formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

  return {
    id: `github-${repoResponse.full_name.replace('/', '-')}-${contributor.author.login}`,
    rank: index + 1,
    name: contributor.author.login,
    title: getContributorTitle(tokenEstimate.totalTokens),
    company: repoResponse.full_name,
    avatar: contributor.author.avatar_url,
    totalTokens: tokenEstimate.totalTokens,
    tokensPerDay: tokenEstimate.tokensPerDay,
    tokensPerMonth: tokenEstimate.tokensPerMonth,
    tokensPerYear: tokenEstimate.tokensPerYear,
    confidenceInterval,
    sourceTag: getSourceTag(),
    updateFrequency,
    lastUpdated: today,
    nextUpdate,
    entityType: 'individual',
    wealthStructure,
    description: `${contributor.author.login} posted ${contributor.commits} commits and ~${Math.round(contributor.effectiveLines).toLocaleString()} effective changed lines in the last ${RECENT_ACTIVITY_DAYS} days on ${repoResponse.full_name}. Token burn is calibrated to high-intensity AI coding loops and normalized back to the January 2025 AI-coding era baseline.`,
  };
}

function buildEnterpriseEntity(
  repoResponse: GitHubRepoApiResponse,
  contributorEntities: Entity[],
  contributorActivities: ContributorActivity[],
  aiNativeScore: number,
  updateFrequency: string,
): Entity {
  const totalMonthlyBurn = contributorEntities.reduce((sum, entity) => sum + entity.tokensPerMonth, 0);
  const metrics = createEraTokenMetricsFromMonthlyBurn(totalMonthlyBurn);
  const totalAdditions = contributorActivities.reduce((sum, contributor) => sum + contributor.additions, 0);
  const totalDeletions = contributorActivities.reduce((sum, contributor) => sum + contributor.deletions, 0);
  const today = formatDate();
  const nextUpdate = formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

  return {
    id: `github-enterprise-${repoResponse.full_name.replace('/', '-')}`,
    rank: 1,
    name: repoResponse.owner.login,
    title: getEnterpriseTitle(metrics.totalTokens),
    company: repoResponse.full_name,
    avatar: repoResponse.owner.avatar_url,
    totalTokens: metrics.totalTokens,
    tokensPerDay: metrics.tokensPerDay,
    tokensPerMonth: metrics.tokensPerMonth,
    tokensPerYear: metrics.tokensPerYear,
    confidenceInterval: Math.max(8, Math.round(20 - aiNativeScore * 6)),
    sourceTag: getSourceTag(),
    updateFrequency,
    lastUpdated: today,
    nextUpdate,
    entityType: 'enterprise',
    wealthStructure: buildWealthStructure(totalAdditions, totalDeletions, aiNativeScore),
    description: `${repoResponse.full_name} aggregates its most active public contributors over the last ${RECENT_ACTIVITY_DAYS} days, then converts that AI-assisted coding intensity into an average monthly token burn and a cumulative total since January 2025.`,
  };
}

function buildMethodology(tokensPerMonth: number, mode: 'repo' | 'global') {
  const monthlyLabel = Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(tokensPerMonth);

  const steps = [
    `Filter GitHub activity to repositories pushed in the last ${RECENT_ACTIVITY_DAYS} days and to contributors with non-zero commits in that same window.`,
    'Convert recent additions, deletions, and commit loops into effective coding workload instead of relying on lifetime contributor totals.',
    `Calibrate the token model against high-intensity AI coding usage, where a frontier developer can burn ~50M tokens per day and ${monthlyLabel} tokens per month.`,
    'Normalize each entity into January 2025-to-present cumulative totals and average monthly burn for cross-project ranking consistency.',
  ];

  if (mode === 'global') {
    steps.unshift('Blend GitHub Search API results with benchmark repos such as microsoft/vscode, vercel/next.js, langchain-ai/langchain, and huggingface/transformers.');
  }

  return steps;
}

function isRelevantCodeRepo(repo: GitHubRepoApiResponse) {
  const text = `${repo.full_name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
  const blockedPatterns = /(awesome|tutorial|course|roadmap|bios|firmware|papers|ebook|collection|archive|template|boilerplate|cheatsheet|interview|resources|newsletter)/;
  const blockedLanguages = new Set(['markdown', 'tex', 'lua']);

  if (blockedPatterns.test(text)) {
    return false;
  }

  if (repo.language && blockedLanguages.has(repo.language.toLowerCase())) {
    return false;
  }

  return repo.size >= 200;
}

function getRepoPriority(repo: GitHubRepoApiResponse) {
  const pushedAgeHours = Math.max(
    1,
    (Date.now() - new Date(repo.pushed_at).getTime()) / (60 * 60 * 1000),
  );
  const freshnessScore = 1 / pushedAgeHours;
  return repo.stargazers_count * 0.65 + repo.forks_count * 0.2 + freshnessScore * 10_000;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function fetchRepositoryDetails(fullName: string, options: GitHubRequestOptions = {}) {
  return fetchGitHubJson<GitHubRepoApiResponse>(`${GITHUB_API_BASE}/repos/${fullName}`, options);
}

async function buildRepoEvaluation(
  repoResponse: GitHubRepoApiResponse,
  options: BuildRepoEvaluationOptions,
  requestOptions: GitHubRequestOptions = {},
): Promise<GitHubRepoEvaluation | null> {
  const [languages, contributorStats] = await Promise.all([
    fetchGitHubJson<GitHubLanguageMap>(repoResponse.languages_url, requestOptions),
    fetchContributorStats(repoResponse.full_name, requestOptions),
  ]);

  const repoKind = getRepoKind(repoResponse, languages);
  const aiNativeScore = getAiNativeScore(repoResponse, languages, repoKind);
  const contributorActivities = contributorStats
    .map((contributor) => getRecentContributorActivity(contributor))
    .filter((contributor): contributor is ContributorActivity => contributor !== null)
    .sort((a, b) => {
      if (b.commits !== a.commits) {
        return b.commits - a.commits;
      }
      return b.effectiveLines - a.effectiveLines;
    })
    .slice(0, options.contributorLimit);

  if (!contributorActivities.length) {
    return null;
  }

  const individualEntities = contributorActivities.map((contributor, index) =>
    buildContributorEntity(repoResponse, contributor, index, languages, repoKind, aiNativeScore, options.updateFrequency),
  );
  const enterpriseEntity = buildEnterpriseEntity(
    repoResponse,
    individualEntities,
    contributorActivities,
    aiNativeScore,
    options.updateFrequency,
  );

  return {
    repo: {
      owner: repoResponse.owner.login,
      repo: repoResponse.name,
      fullName: repoResponse.full_name,
      url: repoResponse.html_url,
      stars: repoResponse.stargazers_count,
      forks: repoResponse.forks_count,
      openIssues: repoResponse.open_issues_count,
      language: repoResponse.language,
      topics: repoResponse.topics || [],
      ownerType: repoResponse.owner.type,
      ownerAvatar: repoResponse.owner.avatar_url,
      repoKind,
      aiNativeScore,
      pushedAt: repoResponse.pushed_at,
      evaluationWindowDays: RECENT_ACTIVITY_DAYS,
      activeContributors: contributorActivities.length,
    },
    individualEntities,
    enterpriseEntity,
    methodology: buildMethodology(enterpriseEntity.tokensPerMonth, 'repo'),
  };
}

function aggregateIndividuals(evaluations: GitHubRepoEvaluation[]) {
  const aggregate = new Map<string, AggregatedEntitySeed>();

  for (const evaluation of evaluations) {
    for (const entity of evaluation.individualEntities) {
      const key = entity.name.toLowerCase();
      const existing = aggregate.get(key);

      if (existing) {
        existing.monthlyBurn += entity.tokensPerMonth;
        existing.additions += entity.wealthStructure[0]?.value || 0;
        existing.deletions += entity.wealthStructure[1]?.value || 0;
        existing.confidenceInterval = Math.round((existing.confidenceInterval + entity.confidenceInterval) / 2);
        existing.repoNames.push(entity.company);
        existing.descriptions.push(entity.description);
        continue;
      }

      aggregate.set(key, {
        id: `github-user-${entity.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`,
        name: entity.name,
        avatar: entity.avatar,
        entityType: 'individual',
        sourceTag: entity.sourceTag,
        confidenceInterval: entity.confidenceInterval,
        monthlyBurn: entity.tokensPerMonth,
        additions: entity.wealthStructure[0]?.value || 0,
        deletions: entity.wealthStructure[1]?.value || 0,
        repoNames: [entity.company],
        descriptions: [entity.description],
      });
    }
  }

  return Array.from(aggregate.values())
    .map((seed) => {
      const metrics = createEraTokenMetricsFromMonthlyBurn(seed.monthlyBurn);
      const repoNames = Array.from(new Set(seed.repoNames));
      const companyLabel =
        repoNames.length > 2
          ? `${repoNames[0]} + ${repoNames.length - 1} more`
          : repoNames.join(' + ');

      return {
        id: seed.id,
        rank: 0,
        name: seed.name,
        title: getContributorTitle(metrics.totalTokens),
        company: companyLabel,
        avatar: seed.avatar,
        totalTokens: metrics.totalTokens,
        tokensPerDay: metrics.tokensPerDay,
        tokensPerMonth: metrics.tokensPerMonth,
        tokensPerYear: metrics.tokensPerYear,
        confidenceInterval: seed.confidenceInterval,
        sourceTag: seed.sourceTag,
        updateFrequency: 'Hourly cache',
        lastUpdated: formatDate(),
        nextUpdate: formatDate(new Date(Date.now() + 60 * 60 * 1000)),
        entityType: 'individual' as const,
        wealthStructure: buildWealthStructure(seed.additions, seed.deletions, 0.78),
        description: `${seed.name} is aggregated across ${repoNames.length} recently pushed high-signal repositories, turning the last ${RECENT_ACTIVITY_DAYS} days of public coding activity into a monthly AI token burn proxy and a total since January 2025.`,
      };
    })
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, MAX_GLOBAL_CONTRIBUTORS)
    .map((entity, index) => ({ ...entity, rank: index + 1 }));
}

function aggregateEnterprises(evaluations: GitHubRepoEvaluation[]) {
  const aggregate = new Map<string, AggregatedEntitySeed>();

  for (const evaluation of evaluations) {
    const entity = evaluation.enterpriseEntity;
    const key = entity.name.toLowerCase();
    const existing = aggregate.get(key);

    if (existing) {
      existing.monthlyBurn += entity.tokensPerMonth;
      existing.additions += entity.wealthStructure[0]?.value || 0;
      existing.deletions += entity.wealthStructure[1]?.value || 0;
      existing.confidenceInterval = Math.round((existing.confidenceInterval + entity.confidenceInterval) / 2);
      existing.repoNames.push(entity.company);
      existing.descriptions.push(entity.description);
      continue;
    }

    aggregate.set(key, {
      id: `github-org-${entity.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`,
      name: entity.name,
      avatar: entity.avatar,
      entityType: 'enterprise',
      sourceTag: entity.sourceTag,
      confidenceInterval: entity.confidenceInterval,
      monthlyBurn: entity.tokensPerMonth,
      additions: entity.wealthStructure[0]?.value || 0,
      deletions: entity.wealthStructure[1]?.value || 0,
      repoNames: [entity.company],
      descriptions: [entity.description],
    });
  }

  return Array.from(aggregate.values())
    .map((seed) => {
      const metrics = createEraTokenMetricsFromMonthlyBurn(seed.monthlyBurn);
      const repoNames = Array.from(new Set(seed.repoNames));
      const companyLabel =
        repoNames.length > 2
          ? `${repoNames[0]} + ${repoNames.length - 1} more`
          : repoNames.join(' + ');

      return {
        id: seed.id,
        rank: 0,
        name: seed.name,
        title: getEnterpriseTitle(metrics.totalTokens),
        company: companyLabel,
        avatar: seed.avatar,
        totalTokens: metrics.totalTokens,
        tokensPerDay: metrics.tokensPerDay,
        tokensPerMonth: metrics.tokensPerMonth,
        tokensPerYear: metrics.tokensPerYear,
        confidenceInterval: seed.confidenceInterval,
        sourceTag: seed.sourceTag,
        updateFrequency: 'Hourly cache',
        lastUpdated: formatDate(),
        nextUpdate: formatDate(new Date(Date.now() + 60 * 60 * 1000)),
        entityType: 'enterprise' as const,
        wealthStructure: buildWealthStructure(seed.additions, seed.deletions, 0.76),
        description: `${seed.name} is aggregated across ${repoNames.length} highly active repositories with stars above 1,000 and pushes in the last ${RECENT_ACTIVITY_DAYS} days.`,
      };
    })
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .map((entity, index) => ({ ...entity, rank: index + 1 }));
}

async function searchActiveRepositories(options: GitHubRequestOptions = {}) {
  const startDate = formatDate(getRecentActivityStart());
  const query = encodeURIComponent(`stars:>1000 pushed:>=${startDate} archived:false fork:false size:>200`);
  const repoMap = new Map<string, GitHubRepoApiResponse>();
  const searchPages = options.token ? SEARCH_PAGES : SEARCH_PAGES_WITHOUT_TOKEN;
  const maxRepoCount = options.token ? MAX_GLOBAL_REPOS : MAX_GLOBAL_REPOS_WITHOUT_TOKEN;

  for (let page = 1; page <= searchPages; page += 1) {
    const url = `${GITHUB_API_BASE}/search/repositories?q=${query}&sort=updated&order=desc&per_page=${SEARCH_RESULTS_PER_PAGE}&page=${page}`;
    const response = await fetchGitHubJson<GitHubSearchResponse>(url, options);
    for (const repo of response.items) {
      if (isRelevantCodeRepo(repo)) {
        repoMap.set(repo.full_name.toLowerCase(), repo);
      }
    }
  }

  for (const benchmarkRepo of BENCHMARK_REPOS) {
    const key = benchmarkRepo.toLowerCase();
    if (!repoMap.has(key)) {
      const repo = await fetchRepositoryDetails(benchmarkRepo, options);
      if (isRelevantCodeRepo(repo)) {
        repoMap.set(key, repo);
      }
    }
  }

  return Array.from(repoMap.values())
    .sort((a, b) => getRepoPriority(b) - getRepoPriority(a))
    .slice(0, maxRepoCount);
}

export async function evaluateGitHubRepo(repoInput: string): Promise<GitHubRepoEvaluation> {
  const { owner, repo } = parseGitHubRepoInput(repoInput);
  const repoResponse = await fetchRepositoryDetails(`${owner}/${repo}`);
  const evaluation = await buildRepoEvaluation(
    repoResponse,
    {
      contributorLimit: MAX_REPO_CONTRIBUTORS,
      updateFrequency: 'On demand',
    },
  );

  if (!evaluation) {
    throw new Error('No recent contributor activity found for this repository.');
  }

  return evaluation;
}

export async function buildGlobalGitHubRankingSnapshot(
  options: GitHubRequestOptions = {},
): Promise<GlobalGitHubRankingSnapshot> {
  const repos = await searchActiveRepositories(options);
  const evaluations = (
    await mapWithConcurrency(repos, 4, async (repo) =>
      {
        try {
          return await buildRepoEvaluation(
            repo,
            {
              contributorLimit: MAX_GLOBAL_REPO_CONTRIBUTORS,
              updateFrequency: 'Hourly cache',
            },
            options,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`Skipping ${repo.full_name} during global snapshot build: ${message}`);
          return null;
        }
      },
    )
  ).filter((evaluation): evaluation is GitHubRepoEvaluation => evaluation !== null);

  if (!evaluations.length) {
    throw new Error('No GitHub repositories produced contributor data for the global snapshot.');
  }

  const individuals = aggregateIndividuals(evaluations);
  const enterprises = aggregateEnterprises(evaluations);
  const totalMonthlyBurn = individuals.reduce((sum, entity) => sum + entity.tokensPerMonth, 0);

  return {
    generatedAt: new Date().toISOString(),
    individuals,
    enterprises,
    methodology: buildMethodology(totalMonthlyBurn, 'global'),
    repoCount: evaluations.length,
    contributorCount: individuals.length,
  };
}
