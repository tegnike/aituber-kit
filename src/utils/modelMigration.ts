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

// @ai-sdk/xaiが現行ラインナップから外したモデル（既定モデルへ移行する）
const RETIRED_XAI_MODELS = new Set([
  'grok-4',
  'grok-4-0709',
  'grok-4-latest',
  'grok-4-1-fast-reasoning',
  'grok-4-1-fast-non-reasoning',
  'grok-4-fast-reasoning',
  'grok-4-fast-non-reasoning',
  'grok-code-fast-1',
  'grok-3',
  'grok-3-latest',
  'grok-3-mini',
  'grok-3-mini-latest',
])

// Perplexity Sonar API（2026-09-27終了）→ Agent APIプリセット
// 対応はAI SDKの移行ガイドで推奨されている開始点に合わせる
const SONAR_TO_AGENT_PRESET: Record<string, string> = {
  sonar: 'fast',
  'sonar-pro': 'low',
  'sonar-reasoning': 'medium',
  'sonar-reasoning-pro': 'medium',
  'sonar-deep-research': 'high',
}

// Fireworksのサーバーレス提供が終了したモデル → 後継モデル
const RETIRED_FIREWORKS_MODELS: Record<string, string> = {
  'accounts/fireworks/models/kimi-k2p5': 'accounts/fireworks/models/kimi-k2p6',
}

/**
 * 提供終了・モデル一覧から外れたモデル名を後継モデルへ置き換える
 * @param service AIサービス名
 * @param modelName 保存されているモデル名
 * @param xaiDefaultModel xAIの移行先モデル
 * @returns 移行後のモデル名（対象外の場合はそのまま）
 */
export const migrateRetiredModelName = (
  service: string,
  modelName: string,
  xaiDefaultModel: string
): string => {
  switch (service) {
    case 'xai':
      return RETIRED_XAI_MODELS.has(modelName) ? xaiDefaultModel : modelName
    case 'perplexity':
      return SONAR_TO_AGENT_PRESET[modelName] ?? modelName
    case 'fireworks':
      return RETIRED_FIREWORKS_MODELS[modelName] ?? modelName
    default:
      return modelName
  }
}
