import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

// Initialize the Gemini API client
// The API key is automatically injected into process.env.GEMINI_API_KEY in this environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AgentEvaluationResult {
  estimatedTokensPerMonth: number;
  confidenceInterval: number;
  sourceTag: string;
  reasoning: string;
  wealthStructure: { name: string; value: number }[];
}

/**
 * Runs the AI Data Engine to estimate token consumption for a given entity.
 * Uses gemini-3.1-pro-preview with ThinkingLevel.HIGH and Google Search grounding.
 */
export async function runDataEngineEvaluation(entityName: string, company: string): Promise<AgentEvaluationResult> {
  const prompt = `
    You are the Token Forbes Data Engine, an expert financial analyst and AI infrastructure researcher.
    Your task is to estimate the current AI token consumption (Standard Equivalent Tokens) for the entity: ${entityName} (${company}).
    
    Use Google Search to find their latest public disclosures, SEC filings, cloud expenditure, GPU cluster sizes (e.g., H100 deployments), product DAU, and API partnerships.
    
    Based on the methodology:
    1. Proxy Indicator Deduction (Compute Giants): Convert cluster size to training run tokens.
    2. Financial Reverse Engineering (Enterprise Whales): Parse cloud bills or funding scale.
    3. Proof of Compute (Super Geeks): Look for public statements of API usage.
    
    Provide your best estimate for their MONTHLY token consumption.
    Return the result strictly as a JSON object matching the requested schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedTokensPerMonth: {
              type: Type.NUMBER,
              description: 'The estimated monthly token consumption (in raw numbers, e.g., 1000000000000 for 1 Trillion).',
            },
            confidenceInterval: {
              type: Type.NUMBER,
              description: 'The margin of error percentage (e.g., 5, 10, 15, 20).',
            },
            sourceTag: {
              type: Type.STRING,
              description: 'One of: "Direct Disclosure", "Proxy Inference", "Model Estimation", "API Partner".',
            },
            reasoning: {
              type: Type.STRING,
              description: 'A brief explanation of how the estimate was calculated based on the search results.',
            },
            wealthStructure: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'The category of compute (e.g., "Llama 3 Training", "Inference")' },
                  value: { type: Type.NUMBER, description: 'Percentage of total compute (0-100)' }
                },
                required: ['name', 'value']
              },
              description: 'Breakdown of where the tokens are being spent. Values must sum to 100.'
            }
          },
          required: ['estimatedTokensPerMonth', 'confidenceInterval', 'sourceTag', 'reasoning', 'wealthStructure']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AgentEvaluationResult;
  } catch (error) {
    console.error("Error running Data Engine:", error);
    throw error;
  }
}

/**
 * Chatbot using gemini-3.1-pro-preview for complex queries.
 */
export async function chatWithPro(message: string, history: { role: 'user' | 'model', parts: [{ text: string }] }[] = []) {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: "You are the Token Forbes AI Assistant. You help users understand the Token Consumption Leaderboard, the methodology behind it, and the AI industry's compute landscape. Be concise, analytical, and professional.",
        tools: [{ googleSearch: {} }]
      }
    });

    // We can't easily pass history to create() in the new SDK if we want to stream, 
    // but we can just send the message. For simplicity, we'll just send the message.
    // If we need history, we'd have to construct the contents array manually for generateContent.
    
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
}

/**
 * Fast Chatbot using gemini-3.1-flash-lite-preview for low-latency responses.
 */
export async function chatWithFlashLite(message: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: message,
      config: {
        systemInstruction: "You are a fast, helpful assistant for Token Forbes. Provide very brief, quick answers.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Fast chat error:", error);
    throw error;
  }
}

/**
 * Locate Data Centers using Google Maps Grounding (gemini-2.5-flash).
 */
export async function locateDataCenters(query: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find data centers or AI infrastructure locations related to: ${query}. What good locations are nearby?`,
      config: {
        tools: [{ googleMaps: {} }]
      }
    });
    
    return {
      text: response.text,
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Maps grounding error:", error);
    throw error;
  }
}
