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
    { name: 'gpt-5.2-pro', multiModal: true },
    { name: 'gpt-5.2-chat-latest', multiModal: true },
    { name: 'gpt-5.2', multiModal: true },
    { name: 'gpt-5.1-codex-mini', multiModal: true },
    { name: 'gpt-5.1-codex', multiModal: true },
    { name: 'gpt-5.1-chat-latest', multiModal: true },
    { name: 'gpt-5.1', multiModal: true },
    { name: 'gpt-5-pro', multiModal: true },
    { name: 'gpt-5', multiModal: true },
    { name: 'gpt-5-mini', multiModal: true },
    { name: 'gpt-5-nano', multiModal: true },
    { name: 'gpt-5-codex', multiModal: true },
    { name: 'gpt-5-chat-latest', multiModal: true },
    { name: 'gpt-4.1', multiModal: true },
    { name: 'gpt-4.1-mini', multiModal: true, isDefault: true },
    { name: 'gpt-4.1-nano', multiModal: true },
    { name: 'gpt-4o', multiModal: true },
    { name: 'gpt-4o-mini', multiModal: true },
  ],
  anthropic: [
    { name: 'claude-opus-4-5', multiModal: true },
    { name: 'claude-opus-4-1', multiModal: true },
    { name: 'claude-opus-4-0', multiModal: true },
    { name: 'claude-sonnet-4-5', multiModal: true, isDefault: true },
    { name: 'claude-sonnet-4-0', multiModal: true },
    { name: 'claude-haiku-4-5', multiModal: true },
    { name: 'claude-3-7-sonnet-latest', multiModal: true },
    { name: 'claude-3-5-haiku-latest', multiModal: true },
  ],
  google: [
    { name: 'gemini-3-pro-preview', multiModal: true },
    { name: 'gemini-2.5-pro', multiModal: true },
    { name: 'gemini-2.5-flash', multiModal: true, isDefault: true },
    { name: 'gemini-2.5-flash-lite', multiModal: true },
    { name: 'gemini-2.5-flash-lite-preview-06-17', multiModal: true },
    { name: 'gemini-2.0-flash', multiModal: true },
    { name: 'gemini-1.5-pro', multiModal: true },
    { name: 'gemini-1.5-pro-latest', multiModal: true },
    { name: 'gemini-1.5-flash', multiModal: true },
    { name: 'gemini-1.5-flash-latest', multiModal: true },
    { name: 'gemini-1.5-flash-8b', multiModal: true },
    { name: 'gemini-1.5-flash-8b-latest', multiModal: true },
  ],
  azure: [],
  xai: [
    { name: 'grok-4-fast-non-reasoning' },
    { name: 'grok-4-fast-reasoning' },
    { name: 'grok-code-fast-1' },
    { name: 'grok-4', multiModal: true, isDefault: true },
    { name: 'grok-3', multiModal: true },
    { name: 'grok-3-latest', multiModal: true },
    { name: 'grok-3-fast', multiModal: true },
    { name: 'grok-3-fast-latest', multiModal: true },
    { name: 'grok-3-mini', multiModal: true },
    { name: 'grok-3-mini-latest', multiModal: true },
    { name: 'grok-3-mini-fast', multiModal: true },
    { name: 'grok-3-mini-fast-latest', multiModal: true },
    { name: 'grok-2', multiModal: true },
    { name: 'grok-2-latest', multiModal: true },
    { name: 'grok-2-1212', multiModal: true },
    { name: 'grok-2-vision', multiModal: true },
    { name: 'grok-2-vision-latest', multiModal: true },
    { name: 'grok-2-vision-1212', multiModal: true },
    { name: 'grok-beta', multiModal: true },
    { name: 'grok-vision-beta', multiModal: true },
  ],
  groq: [
    { name: 'gemma2-9b-it' },
    { name: 'llama-3.1-8b-instant' },
    { name: 'llama-3.3-70b-versatile', isDefault: true },
    { name: 'meta-llama/llama-guard-4-12b' },
    { name: 'deepseek-r1-distill-llama-70b' },
    { name: 'meta-llama/llama-4-maverick-17b-128e-instruct' },
    { name: 'meta-llama/llama-4-scout-17b-16e-instruct', multiModal: true },
    { name: 'meta-llama/llama-prompt-guard-2-22m' },
    { name: 'meta-llama/llama-prompt-guard-2-86m' },
    { name: 'moonshotai/kimi-k2-instruct-0905' },
    { name: 'qwen/qwen3-32b' },
    { name: 'llama-guard-3-8b' },
    { name: 'llama3-70b-8192' },
    { name: 'llama3-8b-8192' },
    { name: 'mixtral-8x7b-32768' },
    { name: 'qwen-qwq-32b' },
    { name: 'qwen-2.5-32b' },
    { name: 'deepseek-r1-distill-qwen-32b' },
    { name: 'openai/gpt-oss-20b' },
    { name: 'openai/gpt-oss-120b' },
  ],
  cohere: [
    { name: 'command-a-03-2025', isDefault: true },
    { name: 'command-a-reasoning-08-2025' },
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
    { name: 'mistral-large-latest', isDefault: true },
    { name: 'mistral-medium-latest' },
    { name: 'mistral-medium-2505' },
    { name: 'mistral-small-latest' },
    { name: 'pixtral-large-latest', multiModal: true },
    { name: 'pixtral-12b-2409', multiModal: true },
    { name: 'magistral-small-2506' },
    { name: 'magistral-medium-2506' },
    { name: 'ministral-3b-latest' },
    { name: 'ministral-8b-latest' },
    { name: 'open-mistral-7b' },
    { name: 'open-mixtral-8x7b' },
    { name: 'open-mixtral-8x22b' },
  ],
  perplexity: [
    { name: 'sonar-deep-research' },
    { name: 'sonar-reasoning-pro' },
    { name: 'sonar-reasoning' },
    { name: 'sonar-pro', multiModal: true, isDefault: true },
    { name: 'sonar' },
  ],
  fireworks: [
    { name: 'accounts/fireworks/models/firefunction-v1' },
    { name: 'accounts/fireworks/models/deepseek-r1' },
    { name: 'accounts/fireworks/models/deepseek-v3' },
    { name: 'accounts/fireworks/models/llama-v3p1-405b-instruct' },
    { name: 'accounts/fireworks/models/llama-v3p1-8b-instruct' },
    { name: 'accounts/fireworks/models/llama-v3p2-3b-instruct' },
    { name: 'accounts/fireworks/models/llama-v3p3-70b-instruct' },
    { name: 'accounts/fireworks/models/mixtral-8x7b-instruct' },
    { name: 'accounts/fireworks/models/mixtral-8x7b-instruct-hf' },
    { name: 'accounts/fireworks/models/mixtral-8x22b-instruct' },
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
  openaiAudio: 'tts-1',
  openaiRealtime: 'gpt-realtime',
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
  'gpt-realtime',
  'gpt-realtime-mini',
] as const

/**
 * OpenAIのオーディオAPIモードで使用するモデル一覧
 */
export const openAIAudioModels = [
  'tts-1',
  'tts-1-hd',
  'gpt-4o-mini-tts',
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
    ['azure', 'openrouter', 'lmstudio', 'ollama', 'custom-api'].includes(
      service
    )
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
 * モデル対応状況、設定、利用モードの全てを考慮する
 * @param service AIサービス名
 * @param model モデル名
 * @param enableMultiModal マルチモーダルトグルの状態
 * @param multiModalMode マルチモーダル利用モード
 * @param customModel カスタムモデルかどうか
 * @returns マルチモーダル機能が使用可能な場合はtrue
 */
export function isMultiModalAvailable(
  service: AIService,
  model: string,
  enableMultiModal: boolean,
  multiModalMode: 'ai-decide' | 'always' | 'never',
  customModel?: boolean
): boolean {
  // 利用モードが'never'の場合は常にfalse
  if (multiModalMode === 'never') {
    return false
  }

  // モデル・設定による基本的な判定
  return isMultiModalModelWithToggle(
    service,
    model,
    enableMultiModal,
    customModel
  )
}

export const googleSearchGroundingModels = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-8b-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash-8b',
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
