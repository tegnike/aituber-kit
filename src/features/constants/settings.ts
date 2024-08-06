export type AIService =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'localLlm'
  | 'groq'
  | 'dify'

export interface AIServiceConfig {
  openai: { key: string; model: string }
  anthropic: { key: string; model: string }
  google: { key: string; model: string }
  localLlm: { url: string; model: string }
  groq: { key: string; model: string }
  dify: {
    key: string
    url: string
    conversationId: string
  }
}

export type AIVoice =
  | 'koeiromap'
  | 'google'
  | 'voicevox'
  | 'stylebertvits2'
  | 'gsvitts'
  | 'elevenlabs'

export type Language = 'en' | 'ja' | 'ko' | 'zh' // ISO 639-1

export const LANGUAGES: Language[] = ['en', 'ja', 'ko', 'zh']

export const isLanguageSupported = (language: string): language is Language =>
  LANGUAGES.includes(language as Language)

export type VoiceLanguage = 'en-US' | 'ja-JP' | 'ko-KR' | 'zh-TW'
