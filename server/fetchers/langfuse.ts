import fetch from 'node-fetch';

export async function getLangfuseUsage(publicKey: string, secretKey: string, days: number = 30) {
    const url = `https://cloud.langfuse.com/api/public/metrics/usage?groupBy=model&timeFilter=past_${days}_days`;

    // Convert basic auth
    const authString = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');

    const response = await fetch(url, {
        headers: {
            "Authorization": `Basic ${authString}`
        }
    });

    if (!response.ok) {
        throw new Error(`Langfuse API error: ${response.statusText}`);
    }

    const resData: any = await response.json();
    const results = resData.data || [];

    let totalPrompt = 0;
    let totalCompletion = 0;

    for (const item of results) {
        totalPrompt += item.promptTokens || 0;
        totalCompletion += item.completionTokens || 0;
    }

    return {
        provider: "Langfuse",
        total_prompt_tokens: totalPrompt,
        total_completion_tokens: totalCompletion,
        raw_tokens: totalPrompt + totalCompletion,
        models_breakdown: results
    };
}
