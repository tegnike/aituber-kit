// Legacy OpenAI model names with date suffixes
const LEGACY_OPENAI_MODELS: Record<string, string> = {
  'gpt-4o-mini-2024-07-18': 'gpt-4o-mini',
  'gpt-4o-2024-11-20': 'gpt-4o',
  'gpt-4.5-preview-2025-02-27': 'gpt-4.5-preview',
  'gpt-4.1-nano-2025-04-14': 'gpt-4.1-nano',
  'gpt-4.1-mini-2025-04-14': 'gpt-4.1-mini',
  'gpt-4.1-2025-04-14': 'gpt-4.1',
  // audioモード用モデルは新しいAPIキーでアクセスできず404 model_not_foundになるため移行
  'gpt-4o-audio-preview': 'gpt-audio',
  'gpt-4o-audio-preview-2024-12-17': 'gpt-audio',
  'gpt-4o-audio-preview-2025-06-03': 'gpt-audio',
  'gpt-4o-mini-audio-preview': 'gpt-audio-mini',
  'gpt-4o-mini-audio-preview-2024-12-17': 'gpt-audio-mini',
  // 2027-01-20に廃止されるRealtime APIモデルを現行モデルへ移行
  'gpt-realtime': 'gpt-realtime-2.1',
  'gpt-4o-realtime': 'gpt-realtime-2.1',
  'gpt-realtime-mini': 'gpt-realtime-2.1-mini',
  'gpt-4o-mini-realtime': 'gpt-realtime-2.1-mini',
}

// Migrate OpenAI model names from old format to new format
export const migrateOpenAIModelName = (modelName: string): string => {
  return LEGACY_OPENAI_MODELS[modelName] || modelName
}
