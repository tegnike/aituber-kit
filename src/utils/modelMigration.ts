// Legacy OpenAI model names with date suffixes
const LEGACY_OPENAI_MODELS: Record<string, string> = {
  'gpt-4o-mini-2024-07-18': 'gpt-4o-mini',
  'gpt-4o-2024-11-20': 'gpt-4o',
  'gpt-4.5-preview-2025-02-27': 'gpt-4.5-preview',
  'gpt-4.1-nano-2025-04-14': 'gpt-4.1-nano',
  'gpt-4.1-mini-2025-04-14': 'gpt-4.1-mini',
  'gpt-4.1-2025-04-14': 'gpt-4.1',
}

// Migrate OpenAI model names from old format to new format
export const migrateOpenAIModelName = (modelName: string): string => {
  return LEGACY_OPENAI_MODELS[modelName] || modelName
}
