import { parseRequestBody, sendJson } from './_storage.js';

export const runtime = 'nodejs';

const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_OPENROUTER_MODEL = 'stepfun/step-3.5-flash:free';
const OPENROUTER_CONFIG_ERROR =
  'AI features are unavailable because OpenRouter is not configured for this deployment.';

type ChatMode = 'fast' | 'deep';

interface ChatHistoryItem {
  role: 'user' | 'model';
  parts?: Array<{ text?: string }>;
}

interface AiRequestPayload {
  action?: 'chat' | 'evaluate' | 'locate';
  mode?: ChatMode;
  message?: string;
  history?: ChatHistoryItem[];
  entityName?: string;
  company?: string;
  query?: string;
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AgentEvaluationResult {
  estimatedTokensPerMonth: number;
  confidenceInterval: number;
  sourceTag: string;
  reasoning: string;
  wealthStructure: { name: string; value: number }[];
}

interface LocationResult {
  text: string;
  links: { name: string; url: string }[];
}

function getConfig() {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error(OPENROUTER_CONFIG_ERROR);
  }

  return {
    apiKey,
    baseUrl: (process.env.OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL).trim().replace(/\/+$/, ''),
    model: (process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL).trim(),
  };
}

function getRequestOrigin(request: any) {
  const forwardedProto = request.headers?.['x-forwarded-proto'];
  const forwardedHost = request.headers?.['x-forwarded-host'];
  const host = forwardedHost || request.headers?.host || 'token-forbes.vercel.app';
  const proto = forwardedProto || 'https';
  return `${proto}://${host}`;
}

function extractTextContent(content: unknown): string {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object' && 'text' in item && typeof (item as any).text === 'string') {
          return (item as any).text;
        }
        return '';
      })
      .join('\n')
      .trim();
  }

  return '';
}

async function callOpenRouter(
  request: any,
  body: Record<string, unknown>,
) {
  const config = getConfig();
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || getRequestOrigin(request),
      'X-OpenRouter-Title': 'Token Forbes',
    },
    body: JSON.stringify({
      model: config.model,
      reasoning: { exclude: true },
      ...body,
    }),
  });

  const rawText = await response.text();
  let parsed: any = null;

  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const message = parsed?.error?.message || parsed?.message || rawText || response.statusText;
    throw new Error(`OpenRouter API error (${response.status}): ${message}`);
  }

  const text = extractTextContent(parsed?.choices?.[0]?.message?.content);

  return {
    data: parsed,
    text,
  };
}

function parseJsonObject<T>(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payload = fenced?.[1] || trimmed;
  return JSON.parse(payload) as T;
}

function validateWealthStructure(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const name = typeof (item as any).name === 'string' ? (item as any).name : '';
      const rawValue = typeof (item as any).value === 'number' ? (item as any).value : Number((item as any).value);

      if (!name || Number.isNaN(rawValue)) {
        return null;
      }

      return {
        name,
        value: Math.max(0, Math.round(rawValue)),
      };
    })
    .filter((item): item is { name: string; value: number } => item !== null);
}

async function handleChat(request: any, payload: AiRequestPayload) {
  const message = payload.message?.trim();
  if (!message) {
    throw new Error('message is required.');
  }

  const mode = payload.mode === 'fast' ? 'fast' : 'deep';
  const historyMessages = (payload.history || [])
    .slice(-10)
    .map((item) => ({
      role: item.role === 'model' ? 'assistant' : 'user',
      content: (item.parts || [])
        .map((part) => part.text || '')
        .join('\n')
        .trim(),
    }))
    .filter((item) => item.content.length > 0) as OpenRouterMessage[];

  const systemPrompt =
    mode === 'fast'
      ? 'You are a concise assistant for Token Forbes. Give short, direct answers.'
      : 'You are the Token Forbes AI Assistant. Help users understand the leaderboard, methodology, GitHub ranking logic, token-burn semantics since January 2025, and the AI compute landscape. Be concise, analytical, and practical.';

  const response = await callOpenRouter(request, {
    temperature: mode === 'fast' ? 0.35 : 0.55,
    max_tokens: mode === 'fast' ? 420 : 1200,
    messages: [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: message },
    ],
  });

  return {
    text: response.text || 'No response returned.',
  };
}

async function handleEvaluation(request: any, payload: AiRequestPayload): Promise<AgentEvaluationResult> {
  const entityName = payload.entityName?.trim();
  const company = payload.company?.trim();

  if (!entityName || !company) {
    throw new Error('entityName and company are required.');
  }

  const prompt = `
You are the Token Forbes Data Engine.

Estimate the CURRENT average monthly AI token consumption for ${entityName} (${company}).

Research public evidence with the web plugin:
- product usage, customer scale, cloud or GPU footprint
- engineering velocity, model or inference activity
- funding, revenue, disclosed infra partnerships, or deployment scale

Return ONLY a JSON object with these keys:
- estimatedTokensPerMonth: number
- confidenceInterval: number
- sourceTag: string (Direct Disclosure, Proxy Inference, Model Estimation, or API Partner)
- reasoning: string
- wealthStructure: array of { "name": string, "value": number } where values sum to about 100

The estimate should be in raw token numbers, and should reflect average monthly burn, not yearly totals.
  `.trim();

  const response = await callOpenRouter(request, {
    temperature: 0.2,
    max_tokens: 1400,
    response_format: { type: 'json_object' },
    plugins: [
      { id: 'web', max_results: 5 },
      { id: 'response-healing' },
    ],
    messages: [
      { role: 'system', content: 'You are a careful AI infrastructure analyst. Return machine-parseable JSON only.' },
      { role: 'user', content: prompt },
    ],
  });

  const parsed = parseJsonObject<Partial<AgentEvaluationResult>>(response.text);
  const estimatedTokensPerMonth = Number(parsed.estimatedTokensPerMonth || 0);
  const confidenceInterval = Number(parsed.confidenceInterval || 0);
  const sourceTag = typeof parsed.sourceTag === 'string' ? parsed.sourceTag : 'Model Estimation';
  const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : 'No reasoning provided.';
  const wealthStructure = validateWealthStructure(parsed.wealthStructure);

  if (!estimatedTokensPerMonth || Number.isNaN(estimatedTokensPerMonth)) {
    throw new Error('Failed to parse estimatedTokensPerMonth from OpenRouter response.');
  }

  return {
    estimatedTokensPerMonth: Math.round(estimatedTokensPerMonth),
    confidenceInterval: confidenceInterval || 20,
    sourceTag,
    reasoning,
    wealthStructure: wealthStructure.length
      ? wealthStructure
      : [
          { name: 'Inference', value: 55 },
          { name: 'Training / Fine-tuning', value: 25 },
          { name: 'Experimentation', value: 20 },
        ],
  };
}

async function handleLocate(request: any, payload: AiRequestPayload): Promise<LocationResult> {
  const query = payload.query?.trim();
  if (!query) {
    throw new Error('query is required.');
  }

  const prompt = `
Find likely data centers, cloud regions, or AI infrastructure locations related to ${query}.

Return ONLY a JSON object:
{
  "text": "short summary",
  "links": [
    { "name": "descriptive label", "url": "https://..." }
  ]
}

Use the web plugin. Prefer official sources, cloud provider docs, company engineering blogs, and public infrastructure announcements.
  `.trim();

  const response = await callOpenRouter(request, {
    temperature: 0.2,
    max_tokens: 900,
    response_format: { type: 'json_object' },
    plugins: [
      { id: 'web', max_results: 5 },
      { id: 'response-healing' },
    ],
    messages: [
      { role: 'system', content: 'You are a careful infrastructure research assistant. Return machine-parseable JSON only.' },
      { role: 'user', content: prompt },
    ],
  });

  const parsed = parseJsonObject<Partial<LocationResult>>(response.text);
  const links = Array.isArray(parsed.links)
    ? parsed.links
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const name = typeof (item as any).name === 'string' ? (item as any).name : '';
          const url = typeof (item as any).url === 'string' ? (item as any).url : '';

          if (!name || !url) {
            return null;
          }

          return { name, url };
        })
        .filter((item): item is { name: string; url: string } => item !== null)
    : [];

  return {
    text: typeof parsed.text === 'string' ? parsed.text : response.text,
    links,
  };
}

export default async function handler(request: any, response: any) {
  if (request.method === 'GET') {
    const configured = Boolean((process.env.OPENROUTER_API_KEY || '').trim());
    return sendJson(response, {
      configured,
      provider: 'OpenRouter',
      model: (process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL).trim(),
    });
  }

  if (request.method !== 'POST') {
    return sendJson(response, { error: 'Method not allowed.' }, 405);
  }

  try {
    const payload = parseRequestBody<AiRequestPayload>(request.body);

    if (payload.action === 'chat') {
      const data = await handleChat(request, payload);
      return sendJson(response, { data });
    }

    if (payload.action === 'evaluate') {
      const data = await handleEvaluation(request, payload);
      return sendJson(response, { data });
    }

    if (payload.action === 'locate') {
      const data = await handleLocate(request, payload);
      return sendJson(response, { data });
    }

    return sendJson(response, { error: 'Unknown AI action.' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed.';
    const status = message === OPENROUTER_CONFIG_ERROR ? 503 : 400;
    return sendJson(response, { error: message }, status);
  }
}
