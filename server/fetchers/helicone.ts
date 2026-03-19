import fetch from 'node-fetch';

export async function getHeliconeUsage(apiKey: string) {
    const url = "https://www.helicone.ai/api/graphql";
    const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
    };

    const query = `
    query {
      aggregatedRequests {
        sum_prompt_tokens
        sum_completion_tokens
        sum_cost_usd
      }
    }
    `;

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
    });

    if (!response.ok) {
        throw new Error(`Helicone API error: ${response.statusText}`);
    }

    const resData: any = await response.json();
    const data = resData.data?.aggregatedRequests?.[0] || {};

    return {
        provider: "Helicone",
        raw_tokens: (data.sum_prompt_tokens || 0) + (data.sum_completion_tokens || 0),
        total_cost_usd: data.sum_cost_usd || 0.0
    };
}
