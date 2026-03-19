import fetch from 'node-fetch';

export async function getOpenRouterUsage(apiKey: string) {
    const url = "https://openrouter.ai/api/v1/auth/key";

    const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${apiKey}` }
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const resData: any = await response.json();
    const data = resData.data || {};

    return {
        provider: "OpenRouter",
        total_cost_usd: data.usage || 0.0,
        credit_limit: data.limit || 0.0,
        raw_tokens: null
    };
}
