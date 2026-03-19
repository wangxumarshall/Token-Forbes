import { Entity, SourceTag, WealthStructure } from '../data/mockData';

const GITHUB_API_BASE = 'https://api.github.com';
const MAX_CONTRIBUTORS = 12;
const POLL_ATTEMPTS = 5;
const POLL_DELAY_MS = 1200;

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
  topics?: string[];
  owner: {
    login: string;
    type: 'User' | 'Organization';
    avatar_url: string;
    html_url: string;
  };
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
}

export interface GitHubRepoEvaluation {
  repo: RepoEvaluationSummary;
  individualEntities: Entity[];
  enterpriseEntity: Entity;
  methodology: string[];
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchGitHubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function getRepoKind(repo: GitHubRepoApiResponse, languages: GitHubLanguageMap): RepoKind {
  const blob = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')} ${Object.keys(languages).join(' ')}`.toLowerCase();

  if (/(agent|agents|workflow|langchain|langgraph|mastra|autogen|crewai|orchestr)/.test(blob)) {
    return 'agent-framework';
  }

  if (/(chat|assistant|copilot|llm|rag|prompt|embedding|anythingllm|danswer|chainlit|chatbot)/.test(blob)) {
    return 'ai-app';
  }

  if (/(inference|serving|gpu|cuda|kernel|runtime|vector|transformer|vllm|distributed)/.test(blob)) {
    return 'infra';
  }

  return 'general';
}

function getAiNativeScore(repo: GitHubRepoApiResponse, languages: GitHubLanguageMap, repoKind: RepoKind) {
  const blob = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')} ${Object.keys(languages).join(' ')}`.toLowerCase();
  let score = 0.35;

  const keywordWeights: [RegExp, number][] = [
    [/(llm|language-model|language model|gpt|claude|gemini)/, 0.15],
    [/(agent|agents|autogen|crewai|mastra|langchain|langgraph)/, 0.18],
    [/(rag|retrieval|embedding|vector|prompt)/, 0.14],
    [/(inference|serving|vllm|gpu|training|fine[- ]?tuning)/, 0.12],
    [/(copilot|assistant|chatbot|chat)/, 0.08],
  ];

  for (const [pattern, weight] of keywordWeights) {
    if (pattern.test(blob)) {
      score += weight;
    }
  }

  const repoKindBonus: Record<RepoKind, number> = {
    'agent-framework': 0.16,
    'ai-app': 0.12,
    infra: 0.1,
    general: 0,
  };

  score += repoKindBonus[repoKind];

  return clamp(score, 0.35, 1);
}

function getTokensPerLine(repoKind: RepoKind, languages: GitHubLanguageMap) {
  const langs = Object.keys(languages).map((item) => item.toLowerCase());
  let base = 36;

  if (repoKind === 'agent-framework') base = 42;
  if (repoKind === 'ai-app') base = 44;
  if (repoKind === 'infra') base = 48;

  if (langs.some((lang) => ['typescript', 'javascript', 'python'].includes(lang))) {
    base += 2;
  }

  if (langs.some((lang) => ['rust', 'go', 'c++', 'cuda'].includes(lang))) {
    base += 4;
  }

  return base;
}

function getIterationMultiplier(commits: number, effectiveLines: number) {
  if (commits > 250 || effectiveLines > 40000) return 1.2;
  if (commits > 80 || effectiveLines > 10000) return 1.12;
  return 1.05;
}

function getContributorTitle(yearlyTokens: number) {
  if (yearlyTokens >= 2_000_000) return 'Token Power Committer';
  if (yearlyTokens >= 1_000_000) return 'AI Shipyard Captain';
  if (yearlyTokens >= 500_000) return 'Agent Builder';
  return 'Model-Assisted Hacker';
}

function getEnterpriseTitle(yearlyTokens: number) {
  if (yearlyTokens >= 10_000_000) return 'Public GitHub AI Collective';
  if (yearlyTokens >= 2_000_000) return 'Enterprise Whale';
  return 'Super Geek Collective';
}

function buildWealthStructure(additions: number, deletions: number, aiAssistRatio: number): WealthStructure[] {
  const total = Math.max(additions + deletions, 1);
  const generatedCode = Math.round((additions / total) * 60);
  const rewrites = Math.round((deletions / total) * 25);
  const prompting = Math.max(10, Math.round(aiAssistRatio * 30));
  const normalized = generatedCode + rewrites + prompting;

  const scale = 100 / normalized;

  return [
    { name: 'Generated Code', value: Math.round(generatedCode * scale) },
    { name: 'Refactors & Rewrites', value: Math.round(rewrites * scale) },
    { name: 'Prompt / Review Loops', value: 100 - Math.round(generatedCode * scale) - Math.round(rewrites * scale) },
  ];
}

async function fetchContributorStats(fullName: string) {
  const endpoint = `${GITHUB_API_BASE}/repos/${fullName}/stats/contributors`;

  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
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

function getSourceTag(): SourceTag {
  return 'Public GitHub Proxy';
}

export async function evaluateGitHubRepo(repoInput: string): Promise<GitHubRepoEvaluation> {
  const { owner, repo } = parseGitHubRepoInput(repoInput);
  const repoResponse = await fetchGitHubJson<GitHubRepoApiResponse>(`${GITHUB_API_BASE}/repos/${owner}/${repo}`);
  const [languages, contributorStats] = await Promise.all([
    fetchGitHubJson<GitHubLanguageMap>(repoResponse.languages_url),
    fetchContributorStats(repoResponse.full_name),
  ]);

  const repoKind = getRepoKind(repoResponse, languages);
  const aiNativeScore = getAiNativeScore(repoResponse, languages, repoKind);
  const tokensPerLine = getTokensPerLine(repoKind, languages);
  const filteredContributors = contributorStats
    .filter((contributor) => contributor.author?.login && !contributor.author.login.endsWith('[bot]'))
    .map((contributor) => {
      const additions = contributor.weeks.reduce((sum, week) => sum + week.a, 0);
      const deletions = contributor.weeks.reduce((sum, week) => sum + week.d, 0);
      const commits = contributor.weeks.reduce((sum, week) => sum + week.c, 0);
      const effectiveLines = additions + deletions * 0.7;

      return {
        ...contributor,
        additions,
        deletions,
        commits,
        effectiveLines,
      };
    })
    .filter((contributor) => contributor.commits > 0)
    .sort((a, b) => b.effectiveLines - a.effectiveLines)
    .slice(0, MAX_CONTRIBUTORS);

  if (!filteredContributors.length) {
    throw new Error('No recent contributor activity found for this repository.');
  }

  const maxCommits = Math.max(...filteredContributors.map((item) => item.commits), 1);
  const today = formatDate();
  const nextUpdate = formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const individualEntities = filteredContributors.map((contributor, index) => {
    const contributorVelocity = Math.log1p(contributor.commits) / Math.log1p(maxCommits);
    const sizeFactor = Math.min(1, contributor.effectiveLines / 25000);
    const aiAssistRatio = clamp(
      0.22 + aiNativeScore * 0.22 + contributorVelocity * 0.12 + sizeFactor * 0.12,
      0.25,
      0.75,
    );
    const iterationMultiplier = getIterationMultiplier(contributor.commits, contributor.effectiveLines);
    const yearlyTokens = Math.round(contributor.effectiveLines * tokensPerLine * aiAssistRatio * iterationMultiplier);
    const confidenceInterval = Math.max(12, Math.round(34 - aiNativeScore * 10 - contributorVelocity * 6));
    const wealthStructure = buildWealthStructure(contributor.additions, contributor.deletions, aiAssistRatio);

    return {
      id: `github-${repoResponse.full_name.replace('/', '-')}-${contributor.author!.login}`,
      rank: index + 1,
      name: contributor.author!.login,
      title: getContributorTitle(yearlyTokens),
      company: repoResponse.full_name,
      avatar: contributor.author!.avatar_url,
      totalTokens: yearlyTokens,
      tokensPerDay: yearlyTokens / 365,
      tokensPerMonth: yearlyTokens / 12,
      tokensPerYear: yearlyTokens,
      confidenceInterval,
      sourceTag: getSourceTag(),
      updateFrequency: 'On demand',
      lastUpdated: today,
      nextUpdate,
      entityType: 'individual' as const,
      wealthStructure,
      description: `${contributor.author!.login} changed ~${Math.round(contributor.effectiveLines).toLocaleString()} effective lines across ${contributor.commits} recent commits in ${repoResponse.full_name}. The score blends real GitHub additions/deletions with an AI-native repo multiplier.`,
    };
  });

  const totalYearlyTokens = individualEntities.reduce((sum, entity) => sum + entity.tokensPerYear, 0);
  const totalAdditions = filteredContributors.reduce((sum, contributor) => sum + contributor.additions, 0);
  const totalDeletions = filteredContributors.reduce((sum, contributor) => sum + contributor.deletions, 0);
  const enterpriseEntity: Entity = {
    id: `github-enterprise-${repoResponse.full_name.replace('/', '-')}`,
    rank: 1,
    name: repoResponse.owner.login,
    title: getEnterpriseTitle(totalYearlyTokens),
    company: repoResponse.full_name,
    avatar: repoResponse.owner.avatar_url,
    totalTokens: totalYearlyTokens,
    tokensPerDay: totalYearlyTokens / 365,
    tokensPerMonth: totalYearlyTokens / 12,
    tokensPerYear: totalYearlyTokens,
    confidenceInterval: Math.max(10, Math.round(28 - aiNativeScore * 8)),
    sourceTag: getSourceTag(),
    updateFrequency: 'On demand',
    lastUpdated: today,
    nextUpdate,
    entityType: 'enterprise',
    wealthStructure: buildWealthStructure(totalAdditions, totalDeletions, aiNativeScore),
    description: `${repoResponse.full_name} aggregate estimate built from recent GitHub contributor stats, repo topics, language mix and a public AI-assistance probability model.`,
  };

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
    },
    individualEntities,
    enterpriseEntity,
    methodology: [
      'Use GitHub stats/contributors for real 52-week commits, additions and deletions per author.',
      'Convert raw changes into effective changed lines with deletion discounting (0.7x) to model rewrites.',
      `Apply repo-specific token-per-line priors (${tokensPerLine} tokens per effective line for this repository type).`,
      'Estimate AI-assist ratio from repo AI density, contributor velocity and recent modification scale.',
      'Convert top contributors and the owning repository into leaderboard-ready entities.',
    ],
  };
}
