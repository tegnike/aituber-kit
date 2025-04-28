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
    'gpt-4o-realtime-preview-2024-10-01',
    'gpt-4o-realtime-preview-2024-12-17',
    'gpt-4o-mini-realtime-preview-2024-12-17',
    'gpt-4o-audio-preview-2024-10-01',
    'gpt-4o-audio-preview-2024-12-17',
    'gpt-4o-mini-audio-preview-2024-12-17',
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
export const defaultModels: Record<AIService, string> = {
  openai: 'gpt-4o-2024-11-20',
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
