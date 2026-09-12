import { AIService, ReasoningEffort } from './settings'

/**
 * モデルの属性定義
 */
interface ModelInfo {
  /** モデル名 */
  name: string
  /** マルチモーダル対応かどうか */
  multiModal?: boolean
  /** デフォルトモデルかどうか */
  isDefault?: boolean
  /**
   * 推論effortレベルの選択肢。
   * - undefined: 推論非対応
   * - []: 推論対応だがeffortセレクタ不要（トグルのみ or tokenBudgetのみ）
   * - ['low', 'high']: 推論対応で選択可能なeffort値
   */
  reasoningEfforts?: ReasoningEffort[]
  /** tokenBudget設定が利用可能か */
  reasoningTokenBudget?: boolean
}

/**
 * 各AIサービスのモデル定義（属性付き）
 */
const modelDefinitions: Record<AIService, ModelInfo[]> = {
  openai: [
    {
      name: 'gpt-5.6-sol',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.6-terra',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.6-luna',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.5',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.5-2026-04-23',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.4-pro',
      multiModal: true,
      reasoningEfforts: ['medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.4-pro-2026-03-05',
      multiModal: true,
      reasoningEfforts: ['medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.4',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.4-2026-03-05',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.4-mini',
      multiModal: true,
      isDefault: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.4-mini-2026-03-17',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.4-nano',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.4-nano-2026-03-17',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    { name: 'gpt-5.3-chat-latest', multiModal: true },
    {
      name: 'gpt-5.3-codex',
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.2-pro',
      multiModal: true,
      reasoningEfforts: ['medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.2-pro-2025-12-11',
      multiModal: true,
      reasoningEfforts: ['medium', 'high', 'xhigh'],
    },
    { name: 'gpt-5.2-chat-latest', multiModal: true },
    {
      name: 'gpt-5.2',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.2-2025-12-11',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.2-codex',
      reasoningEfforts: ['low', 'medium', 'high', 'xhigh'],
    },
    {
      name: 'gpt-5.1-codex-mini',
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    {
      name: 'gpt-5.1-codex',
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    {
      name: 'gpt-5.1-codex-max',
      reasoningEfforts: ['low', 'medium', 'high', 'xhigh'],
    },
    { name: 'gpt-5.1-chat-latest', multiModal: true },
    {
      name: 'gpt-5.1',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high'],
    },
    {
      name: 'gpt-5.1-2025-11-13',
      multiModal: true,
      reasoningEfforts: ['none', 'low', 'medium', 'high'],
    },
    {
      name: 'gpt-5-pro',
      multiModal: true,
      reasoningEfforts: ['high'],
    },
    {
      name: 'gpt-5-pro-2025-10-06',
      multiModal: true,
      reasoningEfforts: ['high'],
    },
    {
      name: 'gpt-5',
      multiModal: true,
      reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    },
    {
      name: 'gpt-5-2025-08-07',
      multiModal: true,
      reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    },
    {
      name: 'gpt-5-mini',
      multiModal: true,
      reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    },
    {
      name: 'gpt-5-mini-2025-08-07',
      multiModal: true,
      reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    },
    {
      name: 'gpt-5-nano',
      multiModal: true,
      reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    },
    {
      name: 'gpt-5-nano-2025-08-07',
      multiModal: true,
      reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    },
    {
      name: 'gpt-5-codex',
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    { name: 'gpt-5-chat-latest', multiModal: true },
    { name: 'gpt-4.1', multiModal: true },
    { name: 'gpt-4.1-2025-04-14', multiModal: true },
    { name: 'gpt-4.1-mini', multiModal: true },
    { name: 'gpt-4.1-mini-2025-04-14', multiModal: true },
    { name: 'gpt-4.1-nano', multiModal: true },
    { name: 'gpt-4.1-nano-2025-04-14', multiModal: true },
    { name: 'gpt-4o', multiModal: true },
    { name: 'gpt-4o-2024-05-13', multiModal: true },
    { name: 'gpt-4o-2024-08-06', multiModal: true },
    { name: 'gpt-4o-2024-11-20', multiModal: true },
    { name: 'gpt-4o-mini', multiModal: true },
    { name: 'gpt-4o-mini-2024-07-18', multiModal: true },
    { name: 'gpt-3.5-turbo' },
    { name: 'gpt-3.5-turbo-0125' },
    { name: 'gpt-3.5-turbo-1106' },
    {
      name: 'o4-mini',
      multiModal: true,
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    {
      name: 'o4-mini-2025-04-16',
      multiModal: true,
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    {
      name: 'o3',
      multiModal: true,
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    {
      name: 'o3-2025-04-16',
      multiModal: true,
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    {
      name: 'o3-mini',
      multiModal: true,
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    {
      name: 'o3-mini-2025-01-31',
      multiModal: true,
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    {
      name: 'o1',
      multiModal: true,
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    {
      name: 'o1-2024-12-17',
      multiModal: true,
      reasoningEfforts: ['low', 'medium', 'high'],
    },
  ],
  anthropic: [
    {
      name: 'claude-fable-5',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-opus-4-8',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-opus-4-7',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-opus-4-6',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-sonnet-4-6',
      multiModal: true,
      isDefault: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-opus-4-5',
      multiModal: true,
      reasoningEfforts: ['low', 'medium', 'high'],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-opus-4-5-20251101',
      multiModal: true,
      reasoningEfforts: ['low', 'medium', 'high'],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-opus-4-1',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-opus-4-1-20250805',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-opus-4-0',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-opus-4-20250514',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-sonnet-4-5',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-sonnet-4-5-20250929',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-sonnet-4-0',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-sonnet-4-20250514',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-haiku-4-5',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'claude-haiku-4-5-20251001',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    { name: 'claude-3-haiku-20240307', multiModal: true },
  ],
  google: [
    {
      name: 'gemini-3.5-flash',
      multiModal: true,
      reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    },
    {
      name: 'gemini-3.1-pro-preview',
      multiModal: true,
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    {
      name: 'gemini-3.1-pro-preview-customtools',
      multiModal: true,
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    {
      name: 'gemini-3.1-flash-image-preview',
      multiModal: true,
      reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    },
    {
      name: 'gemini-3.1-flash-lite-preview',
      multiModal: true,
      reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    },
    {
      name: 'gemini-3.1-flash-tts-preview',
      multiModal: true,
      reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    },
    {
      name: 'gemini-3-pro-preview',
      multiModal: true,
      reasoningEfforts: ['low', 'high'],
    },
    {
      name: 'gemini-3-pro-image-preview',
      multiModal: true,
      reasoningEfforts: ['low', 'high'],
    },
    {
      name: 'gemini-3-flash-preview',
      multiModal: true,
      reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    },
    {
      name: 'gemini-2.5-pro',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'gemini-2.5-flash',
      multiModal: true,
      isDefault: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'gemini-2.5-flash-image',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'gemini-2.5-flash-lite',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'gemini-2.5-flash-preview-tts',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'gemini-2.5-pro-preview-tts',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'gemini-2.5-flash-native-audio-latest',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'gemini-2.5-flash-native-audio-preview-09-2025',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'gemini-2.5-flash-native-audio-preview-12-2025',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'gemini-2.5-computer-use-preview-10-2025',
      multiModal: true,
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    { name: 'gemini-2.0-flash', multiModal: true },
    { name: 'gemini-2.0-flash-001', multiModal: true },
    { name: 'gemini-2.0-flash-lite', multiModal: true },
    { name: 'gemini-2.0-flash-lite-001', multiModal: true },
    { name: 'gemini-pro-latest', multiModal: true },
    { name: 'gemini-flash-latest', multiModal: true },
    { name: 'gemini-flash-lite-latest', multiModal: true },
    { name: 'deep-research-pro-preview-12-2025', multiModal: true },
    { name: 'nano-banana-pro-preview', multiModal: true },
    { name: 'aqa' },
    { name: 'gemini-robotics-er-1.5-preview', multiModal: true },
    { name: 'gemma-3-1b-it' },
    { name: 'gemma-3-4b-it' },
    { name: 'gemma-3n-e4b-it' },
    { name: 'gemma-3n-e2b-it' },
    { name: 'gemma-3-12b-it' },
    { name: 'gemma-3-27b-it' },
  ],
  azure: [],
  xai: [
    {
      name: 'grok-4.5',
      multiModal: true,
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    {
      name: 'grok-4-1-fast-reasoning',
      reasoningEfforts: ['low', 'high'],
    },
    { name: 'grok-4-1-fast-non-reasoning' },
    { name: 'grok-4-fast-non-reasoning' },
    { name: 'grok-4-fast-reasoning', reasoningEfforts: ['low', 'high'] },
    { name: 'grok-4.20-0309-non-reasoning' },
    { name: 'grok-4.20-0309-reasoning', reasoningEfforts: ['low', 'high'] },
    { name: 'grok-4.20-multi-agent-0309', reasoningEfforts: ['low', 'high'] },
    { name: 'grok-code-fast-1' },
    {
      name: 'grok-4',
      multiModal: true,
      isDefault: true,
      reasoningEfforts: ['low', 'high'],
    },
    {
      name: 'grok-4-0709',
      multiModal: true,
      reasoningEfforts: ['low', 'high'],
    },
    {
      name: 'grok-4-latest',
      multiModal: true,
      reasoningEfforts: ['low', 'high'],
    },
    { name: 'grok-3', multiModal: true, reasoningEfforts: ['low', 'high'] },
    {
      name: 'grok-3-latest',
      multiModal: true,
      reasoningEfforts: ['low', 'high'],
    },
    {
      name: 'grok-3-mini',
      multiModal: true,
      reasoningEfforts: ['low', 'high'],
    },
    {
      name: 'grok-3-mini-latest',
      multiModal: true,
      reasoningEfforts: ['low', 'high'],
    },
  ],
  groq: [
    { name: 'llama-3.1-8b-instant' },
    { name: 'llama-3.3-70b-versatile', isDefault: true },
    {
      name: 'openai/gpt-oss-120b',
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    { name: 'openai/gpt-oss-20b', reasoningEfforts: ['low', 'medium', 'high'] },
    { name: 'groq/compound' },
    { name: 'groq/compound-mini' },
    { name: 'meta-llama/llama-4-scout-17b-16e-instruct', multiModal: true },
    { name: 'meta-llama/llama-prompt-guard-2-22m' },
    { name: 'meta-llama/llama-prompt-guard-2-86m' },
    {
      name: 'openai/gpt-oss-safeguard-20b',
      reasoningEfforts: ['low', 'medium', 'high'],
    },
    { name: 'qwen/qwen3-32b', reasoningEfforts: [] },
    { name: 'qwen/qwen3.6-27b', reasoningEfforts: [] },
  ],
  cohere: [
    { name: 'command-a-03-2025', isDefault: true },
    {
      name: 'command-a-reasoning-08-2025',
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    { name: 'command-a-vision-07-2025', multiModal: true },
    { name: 'command-r7b-12-2024' },
    { name: 'command-r-plus-04-2024' },
    { name: 'command-r-plus' },
    { name: 'command-r-08-2024' },
    { name: 'command-r-03-2024' },
    { name: 'command-r' },
    { name: 'command' },
    { name: 'command-nightly' },
    { name: 'command-light' },
    { name: 'command-light-nightly' },
  ],
  mistralai: [
    { name: 'ministral-3b-latest' },
    { name: 'ministral-8b-latest' },
    { name: 'ministral-14b-latest' },
    { name: 'mistral-large-latest', isDefault: true },
    { name: 'mistral-medium-latest' },
    { name: 'mistral-medium-3' },
    { name: 'mistral-large-2512' },
    { name: 'mistral-medium-2508' },
    { name: 'mistral-medium-2505' },
    { name: 'mistral-small-2506' },
    { name: 'pixtral-large-latest', multiModal: true },
    { name: 'mistral-medium-3.5' },
    { name: 'mistral-small-latest' },
    { name: 'mistral-small-2603' },
    {
      name: 'magistral-medium-latest',
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'magistral-small-latest',
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'magistral-medium-2509',
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'magistral-small-2509',
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
  ],
  perplexity: [
    { name: 'sonar-deep-research' },
    { name: 'sonar-reasoning-pro' },
    { name: 'sonar-reasoning' },
    { name: 'sonar-pro', multiModal: true, isDefault: true },
    { name: 'sonar' },
  ],
  fireworks: [
    { name: 'accounts/fireworks/models/deepseek-v3' },
    { name: 'accounts/fireworks/models/llama-v3p3-70b-instruct' },
    { name: 'accounts/fireworks/models/llama-v3p2-3b-instruct' },
    { name: 'accounts/fireworks/models/llama-v3p1-405b-instruct' },
    { name: 'accounts/fireworks/models/llama-v3p1-8b-instruct' },
    { name: 'accounts/fireworks/models/mixtral-8x7b-instruct' },
    { name: 'accounts/fireworks/models/mixtral-8x22b-instruct' },
    { name: 'accounts/fireworks/models/mixtral-8x7b-instruct-hf' },
    { name: 'accounts/fireworks/models/qwen2p5-coder-32b-instruct' },
    { name: 'accounts/fireworks/models/qwen2p5-72b-instruct' },
    { name: 'accounts/fireworks/models/qwen-qwq-32b-preview' },
    {
      name: 'accounts/fireworks/models/qwen2-vl-72b-instruct',
      multiModal: true,
    },
    {
      name: 'accounts/fireworks/models/llama-v3p2-11b-vision-instruct',
      multiModal: true,
    },
    { name: 'accounts/fireworks/models/qwq-32b' },
    { name: 'accounts/fireworks/models/yi-large' },
    { name: 'accounts/fireworks/models/kimi-k2-instruct' },
    {
      name: 'accounts/fireworks/models/kimi-k2-thinking',
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    {
      name: 'accounts/fireworks/models/kimi-k2p5',
      reasoningEfforts: [],
      reasoningTokenBudget: true,
    },
    { name: 'accounts/fireworks/models/minimax-m2' },
  ],
  deepseek: [{ name: 'deepseek-chat' }, { name: 'deepseek-reasoner' }],
  openrouter: [],
  orcarouter: [],
  lmstudio: [],
  ollama: [],
  dify: [],
  'custom-api': [],
}

/**
 * 各AIサービスのモデル一覧（従来の形式との互換性のため）
 */
export const aiModels: Record<AIService, string[]> = Object.fromEntries(
  Object.entries(modelDefinitions).map(([service, models]) => [
    service,
    models.map((model) => model.name),
  ])
) as Record<AIService, string[]>

/**
 * 各AIサービスのデフォルトモデル
 */
export const defaultModels: Record<
  AIService | 'openaiAudio' | 'openaiRealtime',
  string
> = {
  ...Object.fromEntries(
    Object.entries(modelDefinitions).map(([service, models]) => [
      service,
      models.find((model) => model.isDefault)?.name || '',
    ])
  ),
  openaiAudio: 'gpt-audio-mini',
  openaiRealtime: 'gpt-realtime-2.1',
} as Record<AIService | 'openaiAudio' | 'openaiRealtime', string>

/**
 * マルチモーダル対応モデル一覧
 */
export const multiModalModels: Record<AIService, string[]> = Object.fromEntries(
  Object.entries(modelDefinitions).map(([service, models]) => [
    service,
    models.filter((model) => model.multiModal).map((model) => model.name),
  ])
) as Record<AIService, string[]>

/**
 * 特定のAIサービスのデフォルトモデルを取得する（openaiAudio, openaiRealtime も対応）
 * @param service AIサービス名、または 'openaiAudio'/'openaiRealtime'
 * @returns デフォルトモデル
 */
export function getSpecificDefaultModel(
  service: AIService | 'openaiAudio' | 'openaiRealtime'
): string {
  return defaultModels[service] || ''
}

/**
 * AIサービス名からデフォルトモデルを取得する
 * @param service AIサービス名
 * @returns デフォルトモデル
 */
export function getDefaultModel(service: AIService): string {
  return defaultModels[service] || ''
}

/**
 * AIサービス名からモデル一覧を取得する
 * @param service AIサービス名
 * @returns モデル一覧
 */
export function getModels(service: AIService): string[] {
  return aiModels[service] || []
}

/**
 * AIサービス名からマルチモーダル対応モデル一覧を取得する
 * @param service AIサービス名
 * @returns マルチモーダル対応モデル一覧
 */
export function getMultiModalModels(service: AIService): string[] {
  return multiModalModels[service] || []
}

/**
 * OpenAIのリアルタイムAPIモードで使用するモデル一覧
 */
export const openAIRealtimeModels = [
  'gpt-realtime-2.1',
  'gpt-realtime-2.1-mini',
] as const

/**
 * OpenAIのオーディオAPIモードで使用するモデル一覧
 */
export const openAIAudioModels = [
  'gpt-audio-1.5',
  'gpt-audio',
  'gpt-audio-2025-08-28',
  'gpt-audio-mini',
  'gpt-audio-mini-2025-12-15',
  'gpt-audio-mini-2025-10-06',
] as const

/**
 * OpenAIのリアルタイムAPIモデル一覧を取得する
 * @returns OpenAIのリアルタイムAPIモデル一覧
 */
export function getOpenAIRealtimeModels(): string[] {
  return [...openAIRealtimeModels]
}

/**
 * OpenAIのオーディオAPIモデル一覧を取得する
 * @returns OpenAIのオーディオAPIモデル一覧
 */
export function getOpenAIAudioModels(): string[] {
  return [...openAIAudioModels]
}

/**
 * OpenAIのWhisper(音声認識)用モデル一覧
 */
export const openAIWhisperModels = [
  'gpt-transcribe',
  'whisper-1',
  'gpt-4o-transcribe',
  'gpt-4o-transcribe-diarize',
  'gpt-4o-mini-transcribe',
  'gpt-4o-mini-transcribe-2025-12-15',
] as const

export const defaultOpenAITranscriptionModel = 'gpt-transcribe' as const

export function migrateOpenAITranscriptionModel(modelName: string): string {
  if (modelName === 'gpt-4o-mini-transcribe-2025-03-20') {
    return 'gpt-4o-mini-transcribe-2025-12-15'
  }
  return modelName
}

/**
 * OpenAIのWhisperモデル一覧を取得する
 */
export function getOpenAIWhisperModels(): string[] {
  return [...openAIWhisperModels]
}

/**
 * OpenAIのTTS(音声合成)用モデル一覧
 */
export const openAITTSModels = [
  'tts-1',
  'tts-1-1106',
  'tts-1-hd',
  'tts-1-hd-1106',
  'gpt-4o-mini-tts',
  'gpt-4o-mini-tts-2025-03-20',
  'gpt-4o-mini-tts-2025-12-15',
] as const

/**
 * OpenAIのTTSモデル一覧を取得する
 */
export function getOpenAITTSModels(): string[] {
  return [...openAITTSModels]
}

/**
 * モデルがマルチモーダル対応かどうかを判定する
 * @param service AIサービス名
 * @param model モデル名
 * @returns マルチモーダル対応の場合はtrue
 */
export function isMultiModalModel(service: AIService, model: string): boolean {
  return multiModalModels[service]?.includes(model) || false
}

/**
 * トグルボタンの状態を考慮してマルチモーダル機能が利用可能かどうかを判定する
 * @param service AIサービス名
 * @param model モデル名
 * @param enableMultiModal マルチモーダルトグルの状態
 * @param customModel カスタムモデルかどうか
 * @returns マルチモーダル機能が利用可能な場合はtrue
 */
export function isMultiModalModelWithToggle(
  service: AIService,
  model: string,
  enableMultiModal: boolean,
  customModel?: boolean
): boolean {
  // 一部のサービスではモデル単位での判定ができないため、トグルボタンの状態のみで判定
  if (
    [
      'azure',
      'openrouter',
      'orcarouter',
      'lmstudio',
      'ollama',
      'custom-api',
    ].includes(service)
  ) {
    return enableMultiModal
  }

  // カスタムモデルの場合は、トグルボタンの状態で判定
  if (customModel) {
    return enableMultiModal
  }

  // その他のサービスは従来通りモデル定義に基づく判定
  return isMultiModalModel(service, model)
}

/**
 * マルチモーダル機能が実際に使用可能かどうかを包括的に判定する
 * モデル対応状況、設定の全てを考慮する
 * @param service AIサービス名
 * @param model モデル名
 * @param enableMultiModal マルチモーダルトグルの状態
 * @param customModel カスタムモデルかどうか
 * @returns マルチモーダル機能が使用可能な場合はtrue
 */
export function isMultiModalAvailable(
  service: AIService,
  model: string,
  enableMultiModal: boolean,
  customModel?: boolean
): boolean {
  return isMultiModalModelWithToggle(
    service,
    model,
    enableMultiModal,
    customModel
  )
}

export const googleSearchGroundingModels = [
  'gemini-3.5-flash',
  'gemini-3.1-pro-preview',
  'gemini-3.1-pro-preview-customtools',
  'gemini-3.1-flash-lite-preview',
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-lite-001',
  'gemini-pro-latest',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
] as const

/**
 * モデルが検索グラウンディング機能をサポートしているかどうかを判定する
 * @param service AIサービス名
 * @param model モデル名
 * @returns 検索グラウンディング機能をサポートしている場合はtrue
 */
export function isSearchGroundingModel(
  service: AIService,
  model: string
): boolean {
  // 現在はGoogleのみサポート
  if (service === 'google') {
    return (googleSearchGroundingModels as readonly string[]).includes(model)
  }
  return false
}

/**
 * カスタムモデルやモデルリストを持たないサービス向けのフォールバック
 */
const serviceReasoningDefaults: Partial<
  Record<AIService, { efforts: ReasoningEffort[]; tokenBudget: boolean }>
> = {
  openai: {
    efforts: ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'],
    tokenBudget: false,
  },
  azure: { efforts: ['low', 'medium', 'high'], tokenBudget: false },
  anthropic: { efforts: [], tokenBudget: true },
  google: { efforts: ['low', 'medium', 'high'], tokenBudget: true },
  xai: { efforts: ['low', 'high'], tokenBudget: false },
  groq: { efforts: ['low', 'medium', 'high'], tokenBudget: false },
  cohere: { efforts: [], tokenBudget: true },
  ollama: { efforts: ['none', 'low', 'medium', 'high'], tokenBudget: false },
}

/**
 * モデル定義からModelInfoを検索する
 */
function findModelInfo(
  service: AIService,
  model: string
): ModelInfo | undefined {
  return modelDefinitions[service]?.find((m) => m.name === model)
}

/**
 * 推論対応モデルかどうかを判定する
 * @param service AIサービス名
 * @param model モデル名
 * @param customModel カスタムモデルかどうか
 * @returns 推論対応の場合はtrue
 */
export function isReasoningModel(
  service: AIService,
  model: string,
  customModel?: boolean
): boolean {
  if (customModel) {
    return serviceReasoningDefaults[service] !== undefined
  }

  // モデルリストが空のサービス（Azure等）はフォールバック
  if (modelDefinitions[service]?.length === 0) {
    return serviceReasoningDefaults[service] !== undefined
  }

  const info = findModelInfo(service, model)
  return info?.reasoningEfforts !== undefined
}

/**
 * モデルの推論effort選択肢を取得する
 * @param service AIサービス名
 * @param model モデル名
 * @param customModel カスタムモデルかどうか
 * @returns effort選択肢の配列（推論非対応の場合は空配列）
 */
export function getReasoningEfforts(
  service: AIService,
  model: string,
  customModel?: boolean
): ReasoningEffort[] {
  if (customModel) {
    return serviceReasoningDefaults[service]?.efforts ?? []
  }

  // モデルリストが空のサービス（Azure等）はフォールバック
  if (modelDefinitions[service]?.length === 0) {
    return serviceReasoningDefaults[service]?.efforts ?? []
  }

  const info = findModelInfo(service, model)
  return info?.reasoningEfforts ?? []
}

/**
 * モデルにtokenBudget設定が必要かどうかを判定する
 * @param service AIサービス名
 * @param model モデル名
 * @param customModel カスタムモデルかどうか
 * @returns tokenBudget設定が必要な場合はtrue
 */
export function needsReasoningTokenBudget(
  service: AIService,
  model: string,
  customModel?: boolean
): boolean {
  if (customModel) {
    return serviceReasoningDefaults[service]?.tokenBudget ?? false
  }

  // モデルリストが空のサービス（Azure等）はフォールバック
  if (modelDefinitions[service]?.length === 0) {
    return serviceReasoningDefaults[service]?.tokenBudget ?? false
  }

  const info = findModelInfo(service, model)
  return info?.reasoningTokenBudget ?? false
}
