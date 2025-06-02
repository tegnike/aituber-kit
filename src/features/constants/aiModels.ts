import { AIService } from './settings'

/**
 * 各AIサービスのモデル一覧
 */
export const aiModels: Record<AIService, string[]> = {
  openai: [
    'chatgpt-4o-latest',
    'gpt-4o-mini-2024-07-18',
    'gpt-4o-2024-11-20',
    'gpt-4.5-preview-2025-02-27',
    'gpt-4.1-nano-2025-04-14',
    'gpt-4.1-mini-2025-04-14',
    'gpt-4.1-2025-04-14',
  ],
  anthropic: [
    'claude-3-opus-20240229',
    'claude-3-7-sonnet-20250219',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
  ],
  google: [
    'gemini-2.0-flash-001',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b-latest',
    'gemini-1.5-pro-latest',
  ],
  azure: [],
  groq: [
    'gemma2-9b-it',
    'llama-3.3-70b-versatile',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
  ],
  cohere: [
    'command-light',
    'command-light-nightly',
    'command-nightly',
    'command-r',
    'command-r-08-2024',
    'command-r-plus',
    'command-r-plus-08-2024',
  ],
  mistralai: [
    'mistral-large-latest',
    'open-mistral-nemo',
    'codestral-latest',
    'mistral-embed',
  ],
  perplexity: [
    'llama-3-sonar-large-32k-online',
    'sonar-small-online',
    'sonar-medium-online',
    'sonar-large-online',
  ],
  fireworks: [
    'accounts/fireworks/models/firefunction-v2',
    'accounts/fireworks/models/llama-v3-8b',
    'accounts/fireworks/models/llama-v3-70b',
  ],
  deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
  lmstudio: [],
  ollama: [],
  dify: [],
  'custom-api': [],
}

/**
 * スライド変換時に使用するモデル一覧
 */
export const slideConvertModels: Partial<Record<AIService, string[]>> = {
  openai: [
    'chatgpt-4o-latest',
    'gpt-4o-mini-2024-07-18',
    'gpt-4o-2024-11-20',
    'gpt-4.5-preview-2025-02-27',
    'gpt-4.1-nano-2025-04-14',
    'gpt-4.1-mini-2025-04-14',
    'gpt-4.1-2025-04-14',
  ],
  anthropic: [
    'claude-3-opus-20240229',
    'claude-3-7-sonnet-20250219',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
  ],
  google: [
    'gemini-2.0-flash-001',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b-latest',
    'gemini-1.5-pro-latest',
  ],
}

/**
 * 各AIサービスのデフォルトモデル
 */
export const defaultModels: Record<
  AIService | 'openaiAudio' | 'openaiRealtime',
  string
> = {
  openai: 'gpt-4o-2024-11-20',
  openaiAudio: 'gpt-4o-audio-preview-2024-10-01',
  openaiRealtime: 'gpt-4o-realtime-preview-2024-10-01',
  anthropic: 'claude-3-5-sonnet-20241022',
  google: 'gemini-1.5-flash-latest',
  azure: '',
  groq: 'gemma2-9b-it',
  cohere: 'command-r-plus',
  mistralai: 'mistral-large-latest',
  perplexity: 'llama-3-sonar-large-32k-online',
  fireworks: 'accounts/fireworks/models/firefunction-v2',
  deepseek: 'deepseek-chat',
  lmstudio: '',
  ollama: '',
  dify: '',
  'custom-api': '',
}

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
 * AIサービス名からスライド変換用のモデル一覧を取得する
 * @param service AIサービス名
 * @returns スライド変換用のモデル一覧
 */
export function getSlideConvertModels(service: AIService): string[] {
  return slideConvertModels[service] || []
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
 * 指定されたAIサービスとモデルがマルチモーダル（画像入力）に対応しているかチェックする
 * @param service AIサービス名
 * @param model モデル名（省略可）
 * @returns マルチモーダル対応の場合true
 */
export function isMultiModalCapable(service: AIService, model?: string): boolean {
  const slideModels = slideConvertModels[service]
  if (!slideModels) return false
  
  if (!model) return slideModels.length > 0
  
  return slideModels.includes(model)
}
