function readString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true';
  }

  return fallback;
}

const aiConfiguredFlag = readBoolean(process.env.AI_CONFIGURED, false);
const aiProviderLabel = readString(process.env.AI_PROVIDER, 'OpenRouter');
const aiModelLabel = readString(process.env.AI_MODEL, 'stepfun/step-3.5-flash:free');

export const AI_CONFIG_ERROR =
  `AI features are unavailable because ${aiProviderLabel} is not configured for this deployment.`;

// Backward-compatible alias used by existing UI imports.
export const GEMINI_CONFIG_ERROR = AI_CONFIG_ERROR;
export const isAiConfigured = aiConfiguredFlag;
export const isGeminiConfigured = isAiConfigured;
export const defaultAiModelLabel = aiModelLabel;

export interface AgentEvaluationResult {
  estimatedTokensPerMonth: number;
  confidenceInterval: number;
  sourceTag: string;
  reasoning: string;
  wealthStructure: { name: string; value: number }[];
}

export interface LocationResult {
  text: string;
  links: { name: string; url: string }[];
}

interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

interface AiApiResponse<T> {
  data: T;
}

async function requestAi<T>(payload: Record<string, unknown>) {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error || `AI request failed with status ${response.status}.`);
  }

  return (body as AiApiResponse<T>).data;
}

export async function runDataEngineEvaluation(entityName: string, company: string): Promise<AgentEvaluationResult> {
  return requestAi<AgentEvaluationResult>({
    action: 'evaluate',
    entityName,
    company,
  });
}

export async function chatWithPro(message: string, history: ChatHistoryItem[] = []) {
  const result = await requestAi<{ text: string }>({
    action: 'chat',
    mode: 'deep',
    message,
    history,
  });

  return result.text;
}

export async function chatWithFlashLite(message: string) {
  const result = await requestAi<{ text: string }>({
    action: 'chat',
    mode: 'fast',
    message,
  });

  return result.text;
}

export async function locateDataCenters(query: string): Promise<LocationResult> {
  return requestAi<LocationResult>({
    action: 'locate',
    query,
  });
}
