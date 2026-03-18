export type SourceTag = 'Direct Disclosure' | 'Proxy Inference' | 'Model Estimation' | 'API Partner';

export interface WealthStructure {
  name: string;
  value: number;
}

export interface Entity {
  id: string;
  rank: number;
  name: string;
  title: string;
  company: string;
  avatar: string;
  totalTokens: number;
  tokensPerDay: number;
  tokensPerMonth: number;
  tokensPerYear: number;
  confidenceInterval: number;
  sourceTag: SourceTag;
  updateFrequency: string;
  lastUpdated: string;
  nextUpdate: string;
  entityType: 'individual' | 'enterprise';
  wealthStructure: WealthStructure[];
  description: string;
}

export const individualEntities: Entity[] = [
  {
    id: 'i1',
    rank: 1,
    name: 'Mark Zuckerberg',
    title: 'Compute Giant',
    company: 'Meta',
    avatar: 'https://picsum.photos/seed/zuck/200/200',
    totalTokens: 15400 * 1e12,
    tokensPerDay: 42.1 * 1e12,
    tokensPerMonth: 1280 * 1e12,
    tokensPerYear: 15400 * 1e12,
    confidenceInterval: 5,
    sourceTag: 'Direct Disclosure',
    updateFrequency: 'Weekly',
    lastUpdated: new Date().toISOString().split('T')[0],
    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    entityType: 'individual',
    wealthStructure: [
      { name: 'Llama 3/4 Training', value: 70 },
      { name: 'Internal R&D', value: 20 },
      { name: 'Inference', value: 10 },
    ],
    description: 'Meta publicly disclosed 350k H100s. The sheer volume of compute dedicated to Llama models places Zuckerberg at the absolute pinnacle.'
  },
  {
    id: 'i2',
    rank: 2,
    name: 'Sam Altman',
    title: 'Compute Giant',
    company: 'OpenAI',
    avatar: 'https://picsum.photos/seed/sam/200/200',
    totalTokens: 12800 * 1e12,
    tokensPerDay: 35.0 * 1e12,
    tokensPerMonth: 1060 * 1e12,
    tokensPerYear: 12800 * 1e12,
    confidenceInterval: 12,
    sourceTag: 'Proxy Inference',
    updateFrequency: 'Weekly',
    lastUpdated: new Date().toISOString().split('T')[0],
    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    entityType: 'individual',
    wealthStructure: [
      { name: 'GPT-4/5 Training', value: 65 },
      { name: 'ChatGPT Inference', value: 25 },
      { name: 'API Inference', value: 10 },
    ],
    description: 'Proxy metrics from Microsoft Azure revenue and ChatGPT DAU suggest a massive, continuous token burn rate attributed to OpenAI leadership.'
  },
  {
    id: 'i3',
    rank: 3,
    name: 'Sundar Pichai',
    title: 'Compute Giant',
    company: 'Google',
    avatar: 'https://picsum.photos/seed/sundar/200/200',
    totalTokens: 11500 * 1e12,
    tokensPerDay: 31.5 * 1e12,
    tokensPerMonth: 958 * 1e12,
    tokensPerYear: 11500 * 1e12,
    confidenceInterval: 8,
    sourceTag: 'Model Estimation',
    updateFrequency: 'Weekly',
    lastUpdated: new Date().toISOString().split('T')[0],
    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    entityType: 'individual',
    wealthStructure: [
      { name: 'Gemini Training', value: 60 },
      { name: 'Search Generative Experience', value: 30 },
      { name: 'Cloud API', value: 10 },
    ],
    description: 'Google\'s vast TPU v5p fleets provide unparalleled compute density. The integration of Gemini into Search drives a massive inference load.'
  },
  {
    id: 'i4',
    rank: 4,
    name: 'Elon Musk',
    title: 'Compute Giant',
    company: 'xAI',
    avatar: 'https://picsum.photos/seed/elon/200/200',
    totalTokens: 8900 * 1e12,
    tokensPerDay: 24.3 * 1e12,
    tokensPerMonth: 741 * 1e12,
    tokensPerYear: 8900 * 1e12,
    confidenceInterval: 10,
    sourceTag: 'Direct Disclosure',
    updateFrequency: 'Weekly',
    lastUpdated: new Date().toISOString().split('T')[0],
    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    entityType: 'individual',
    wealthStructure: [
      { name: 'Grok Training (Colossus)', value: 85 },
      { name: 'X Platform Inference', value: 15 },
    ],
    description: 'With the rapid deployment of the Colossus supercomputer (100k H100s), xAI has aggressively climbed the ranks.'
  },
  {
    id: 'i5',
    rank: 5,
    name: 'Dario Amodei',
    title: 'Compute Giant',
    company: 'Anthropic',
    avatar: 'https://picsum.photos/seed/dario/200/200',
    totalTokens: 7200 * 1e12,
    tokensPerDay: 19.7 * 1e12,
    tokensPerMonth: 600 * 1e12,
    tokensPerYear: 7200 * 1e12,
    confidenceInterval: 15,
    sourceTag: 'Proxy Inference',
    updateFrequency: 'Weekly',
    lastUpdated: new Date().toISOString().split('T')[0],
    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    entityType: 'individual',
    wealthStructure: [
      { name: 'Claude 3.5 Training', value: 75 },
      { name: 'API Inference', value: 20 },
      { name: 'Internal Eval', value: 5 },
    ],
    description: 'Anthropic\'s focus on constitutional AI requires extensive RLHF and constitutional training runs.'
  },
  {
    id: 'i6',
    rank: 6,
    name: 'Andrej Karpathy',
    title: 'Super Geek',
    company: 'Independent',
    avatar: 'https://picsum.photos/seed/karpathy/200/200',
    totalTokens: 8.2 * 1e6,
    tokensPerDay: 0.022 * 1e6,
    tokensPerMonth: 0.68 * 1e6,
    tokensPerYear: 8.2 * 1e6,
    confidenceInterval: 15,
    sourceTag: 'Proxy Inference',
    updateFrequency: 'Weekly',
    lastUpdated: new Date().toISOString().split('T')[0],
    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    entityType: 'individual',
    wealthStructure: [
      { name: 'Local Model Fine-tuning', value: 50 },
      { name: 'Educational Content Gen', value: 30 },
      { name: 'Daily Coding', value: 20 },
    ],
    description: 'Between building llm.c and creating educational content, Karpathy\'s personal compute usage rivals small startups.'
  }
];

export const enterpriseEntities: Entity[] = [
  {
    id: 'e1',
    rank: 1,
    name: 'Microsoft',
    title: 'Enterprise Whale',
    company: 'Microsoft',
    avatar: 'https://picsum.photos/seed/msft/200/200',
    totalTokens: 45000 * 1e12,
    tokensPerDay: 123.2 * 1e12,
    tokensPerMonth: 3750 * 1e12,
    tokensPerYear: 45000 * 1e12,
    confidenceInterval: 10,
    sourceTag: 'Model Estimation',
    updateFrequency: 'Weekly',
    lastUpdated: new Date().toISOString().split('T')[0],
    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    entityType: 'enterprise',
    wealthStructure: [
      { name: 'Azure OpenAI Hosting', value: 50 },
      { name: 'Copilot Inference', value: 30 },
      { name: 'Internal Model Training', value: 20 },
    ],
    description: 'As the primary compute provider for OpenAI and the host of Copilot across Office 365, Microsoft\'s aggregate token throughput is unmatched.'
  },
  {
    id: 'e2',
    rank: 2,
    name: 'Alphabet (Google)',
    title: 'Enterprise Whale',
    company: 'Google',
    avatar: 'https://picsum.photos/seed/goog/200/200',
    totalTokens: 38000 * 1e12,
    tokensPerDay: 104.1 * 1e12,
    tokensPerMonth: 3166 * 1e12,
    tokensPerYear: 38000 * 1e12,
    confidenceInterval: 8,
    sourceTag: 'Direct Disclosure',
    updateFrequency: 'Weekly',
    lastUpdated: new Date().toISOString().split('T')[0],
    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    entityType: 'enterprise',
    wealthStructure: [
      { name: 'Search Generative Experience', value: 45 },
      { name: 'DeepMind Training', value: 35 },
      { name: 'GCP Vertex AI', value: 20 },
    ],
    description: 'Google\'s massive internal TPU infrastructure powers both DeepMind\'s frontier models and billions of daily AI-augmented search queries.'
  },
  {
    id: 'e3',
    rank: 3,
    name: 'Meta',
    title: 'Enterprise Whale',
    company: 'Meta',
    avatar: 'https://picsum.photos/seed/meta/200/200',
    totalTokens: 28000 * 1e12,
    tokensPerDay: 76.7 * 1e12,
    tokensPerMonth: 2333 * 1e12,
    tokensPerYear: 28000 * 1e12,
    confidenceInterval: 5,
    sourceTag: 'Direct Disclosure',
    updateFrequency: 'Weekly',
    lastUpdated: new Date().toISOString().split('T')[0],
    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    entityType: 'enterprise',
    wealthStructure: [
      { name: 'Llama Training Runs', value: 60 },
      { name: 'Meta AI Inference (IG/FB/WA)', value: 30 },
      { name: 'Recommendation Systems', value: 10 },
    ],
    description: 'Meta\'s open-source strategy requires massive upfront training compute, while integrating Meta AI into WhatsApp and Instagram drives huge inference volume.'
  },
  {
    id: 'e4',
    rank: 4,
    name: 'ByteDance',
    title: 'Enterprise Whale',
    company: 'ByteDance',
    avatar: 'https://picsum.photos/seed/byte/200/200',
    totalTokens: 18000 * 1e12,
    tokensPerDay: 49.3 * 1e12,
    tokensPerMonth: 1500 * 1e12,
    tokensPerYear: 18000 * 1e12,
    confidenceInterval: 15,
    sourceTag: 'Proxy Inference',
    updateFrequency: 'Weekly',
    lastUpdated: new Date().toISOString().split('T')[0],
    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    entityType: 'enterprise',
    wealthStructure: [
      { name: 'Doubao Inference', value: 50 },
      { name: 'Recommendation Engine', value: 30 },
      { name: 'Video Gen (Jimeng)', value: 20 },
    ],
    description: 'ByteDance\'s aggressive push into generative AI with Doubao and Jimeng, combined with their massive user base, results in extreme token consumption.'
  },
  {
    id: 'e5',
    rank: 5,
    name: 'Scale AI',
    title: 'Enterprise Whale',
    company: 'Scale AI',
    avatar: 'https://picsum.photos/seed/scale/200/200',
    totalTokens: 850 * 1e9,
    tokensPerDay: 2.3 * 1e9,
    tokensPerMonth: 70.8 * 1e9,
    tokensPerYear: 850 * 1e9,
    confidenceInterval: 10,
    sourceTag: 'API Partner',
    updateFrequency: 'Weekly',
    lastUpdated: new Date().toISOString().split('T')[0],
    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    entityType: 'enterprise',
    wealthStructure: [
      { name: 'Data Labeling Automation', value: 60 },
      { name: 'RLHF Pipeline', value: 30 },
      { name: 'Internal Tools', value: 10 },
    ],
    description: 'As the premier data foundry for AI, Scale consumes massive amounts of API tokens to pre-label, verify, and structure data for the giants.'
  }
];

export const allMockEntities: Entity[] = [
  ...individualEntities,
  ...enterpriseEntities
];
