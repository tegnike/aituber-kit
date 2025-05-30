import { AIService } from './settings'

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
}

/**
 * 各AIサービスのモデル定義（属性付き）
 */
const modelDefinitions: Record<AIService, ModelInfo[]> = {
  openai: [
    { name: 'gpt-4.1', multiModal: true, isDefault: true },
    { name: 'gpt-4.1-mini', multiModal: true },
    { name: 'gpt-4.1-nano', multiModal: true },
    { name: 'gpt-4o', multiModal: true },
    { name: 'gpt-4o-mini', multiModal: true },
    { name: 'o1', multiModal: true },
    { name: 'o1-mini', multiModal: true },
    { name: 'o1-preview' },
    { name: 'o3-mini' },
    { name: 'o3', multiModal: true },
    { name: 'o4-mini', multiModal: true },
    { name: 'chatgpt-4o-latest', multiModal: true },
  ],
  anthropic: [
    { name: 'claude-4-opus-20250514', multiModal: true },
    { name: 'claude-4-sonnet-20250514', multiModal: true },
    { name: 'claude-3-7-sonnet-20250219', multiModal: true },
    { name: 'claude-3-5-sonnet-20241022', multiModal: true, isDefault: true },
    { name: 'claude-3-5-sonnet-20240620', multiModal: true },
    { name: 'claude-3-5-haiku-20241022', multiModal: true },
  ],
  google: [
    { name: 'gemini-2.5-pro-preview-05-06', multiModal: true },
    { name: 'gemini-2.5-flash-preview-04-17', multiModal: true },
    { name: 'gemini-2.5-pro-exp-03-25', multiModal: true },
    { name: 'gemini-2.0-flash', multiModal: true },
    { name: 'gemini-1.5-pro', multiModal: true },
    { name: 'gemini-1.5-pro-latest', multiModal: true },
    { name: 'gemini-1.5-flash', multiModal: true },
    { name: 'gemini-1.5-flash-latest', multiModal: true, isDefault: true },
    { name: 'gemini-1.5-flash-8b', multiModal: true },
    { name: 'gemini-1.5-flash-8b-latest', multiModal: true },
  ],
  azure: [],
  xai: [
    { name: 'grok-3', isDefault: true },
    { name: 'grok-3-fast' },
    { name: 'grok-3-mini' },
    { name: 'grok-3-mini-fast' },
    { name: 'grok-2-1212' },
    { name: 'grok-2-vision-1212', multiModal: true },
  ],
  groq: [
    { name: 'meta-llama/llama-4-scout-17b-16e-instruct', multiModal: true },
    { name: 'gemma2-9b-it' },
    { name: 'llama-3.3-70b-versatile' },
    { name: 'llama-3.1-8b-instant' },
    { name: 'llama-guard-3-8b' },
    { name: 'llama3-70b-8192' },
    { name: 'llama3-8b-8192' },
    { name: 'mixtral-8x7b-32768' },
    { name: 'qwen-qwq-32b' },
    { name: 'mistral-saba-24b' },
    { name: 'qwen-2.5-32b' },
    { name: 'deepseek-r1-distill-qwen-32b' },
    { name: 'deepseek-r1-distill-llama-70b' },
  ],
  cohere: [
    { name: 'command-a-03-2025' },
    { name: 'command-r-plus' },
    { name: 'command-r' },
    { name: 'command' },
    { name: 'command-light' },
  ],
  mistralai: [
    { name: 'pixtral-large-latest', multiModal: true },
    { name: 'mistral-large-latest' },
    { name: 'mistral-small-latest' },
    { name: 'ministral-3b-latest' },
    { name: 'ministral-8b-latest' },
    { name: 'pixtral-12b-2409', multiModal: true },
  ],
  perplexity: [
    { name: 'sonar-pro' },
    { name: 'sonar' },
    { name: 'sonar-deep-research' },
  ],
  fireworks: [
    { name: 'accounts/fireworks/models/deepseek-r1' },
    { name: 'accounts/fireworks/models/deepseek-v3' },
    { name: 'accounts/fireworks/models/llama-v3p1-405b-instruct' },
    { name: 'accounts/fireworks/models/llama-v3p1-8b-instruct' },
    { name: 'accounts/fireworks/models/llama-v3p2-3b-instruct' },
    { name: 'accounts/fireworks/models/llama-v3p3-70b-instruct' },
    { name: 'accounts/fireworks/models/mixtral-8x7b-instruct-hf' },
    { name: 'accounts/fireworks/models/mixtral-8x22b-instruct' },
    { name: 'accounts/fireworks/models/qwen2p5-coder-32b-instruct' },
    {
      name: 'accounts/fireworks/models/llama-v3p2-11b-vision-instruct',
      multiModal: true,
    },
    { name: 'accounts/fireworks/models/yi-large' },
  ],
  deepseek: [{ name: 'deepseek-chat' }, { name: 'deepseek-reasoner' }],
  openrouter: [],
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
  openaiAudio: 'gpt-4o-audio-preview-2024-10-01',
  openaiRealtime: 'gpt-4o-realtime-preview-2024-10-01',
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
  'gpt-4o-realtime-preview-2024-10-01',
  'gpt-4o-realtime-preview-2024-12-17',
  'gpt-4o-mini-realtime-preview-2024-12-17',
] as const

/**
 * OpenAIのオーディオAPIモードで使用するモデル一覧
 */
export const openAIAudioModels = [
  'gpt-4o-audio-preview-2024-10-01',
  'gpt-4o-audio-preview-2024-12-17',
  'gpt-4o-mini-audio-preview-2024-12-17',
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
  'whisper-1',
  'gpt-4o-transcribe',
  'gpt-4o-mini-transcribe',
] as const

/**
 * OpenAIのWhisperモデル一覧を取得する
 */
export function getOpenAIWhisperModels(): string[] {
  return [...openAIWhisperModels]
}

/**
 * OpenAIのTTS(音声合成)用モデル一覧
 */
export const openAITTSModels = ['tts-1', 'tts-1-hd', 'gpt-4o-mini-tts'] as const

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

export const googleSearchGroundingModels = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-8b-latest',
] as const
