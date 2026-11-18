import { logger } from '@/lib/logger'
import {
  CHARACTER_MODEL_TYPES,
  type CharacterModelType,
} from '@/features/constants/modelType'
import type { SettingsState, PresetQuestion } from '@/features/stores/settings'

export type EmbedModelType = CharacterModelType

export type EmbedConfig = {
  id?: string
  characterName?: string
  userDisplayName?: string
  systemPrompt?: string
  modelType?: EmbedModelType
  selectedVrmPath?: string
  selectedLive2DPath?: string
  selectedPNGTuberPath?: string
  selectedLivlivPath?: string
  showAssistantText?: boolean
  showCharacterName?: boolean
  showPresetQuestions?: boolean
  presetQuestions?: string[]
  colorTheme?: SettingsState['colorTheme']
  backgroundImageUrl?: string
  allowedOrigins?: string[]
}

type EmbedConfigMap = Record<string, EmbedConfig>

const MODEL_TYPES: readonly EmbedModelType[] = CHARACTER_MODEL_TYPES
const COLOR_THEMES: SettingsState['colorTheme'][] = [
  'default',
  'cool',
  'mono',
  'ocean',
  'forest',
  'sunset',
]

const parseBoolean = (value: string | null): boolean | undefined => {
  if (value === null) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

const parseList = (value: string | null): string[] | undefined => {
  if (!value) return undefined
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const parseEmbedConfigMap = (): EmbedConfigMap => {
  const rawConfig = process.env.NEXT_PUBLIC_AITUBERKIT_EMBEDS
  if (!rawConfig) return {}

  try {
    const parsed = JSON.parse(rawConfig)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }
    return parsed as EmbedConfigMap
  } catch (error) {
    logger.warn('Failed to parse NEXT_PUBLIC_AITUBERKIT_EMBEDS:', error)
    return {}
  }
}

export const getDefaultEmbedId = () =>
  process.env.NEXT_PUBLIC_AITUBERKIT_DEFAULT_EMBED_ID || 'default'

export const getEmbedConfig = (embedId?: string): EmbedConfig => {
  const configs = parseEmbedConfigMap()
  const resolvedEmbedId = embedId || getDefaultEmbedId()

  return {
    id: resolvedEmbedId,
    ...(configs[resolvedEmbedId] || configs.default || {}),
  }
}

export const getEmbedOverridesFromSearchParams = (
  params: URLSearchParams
): EmbedConfig => {
  const modelType = params.get('modelType')
  const colorTheme = params.get('colorTheme')

  return {
    characterName: params.get('characterName') || undefined,
    userDisplayName: params.get('userDisplayName') || undefined,
    systemPrompt: params.get('systemPrompt') || undefined,
    modelType: MODEL_TYPES.includes(modelType as EmbedModelType)
      ? (modelType as EmbedModelType)
      : undefined,
    selectedVrmPath: params.get('selectedVrmPath') || undefined,
    selectedLive2DPath: params.get('selectedLive2DPath') || undefined,
    selectedPNGTuberPath: params.get('selectedPNGTuberPath') || undefined,
    selectedLivlivPath: params.get('selectedLivlivPath') || undefined,
    showAssistantText: parseBoolean(params.get('showAssistantText')),
    showCharacterName: parseBoolean(params.get('showCharacterName')),
    showPresetQuestions: parseBoolean(params.get('showPresetQuestions')),
    presetQuestions: parseList(params.get('presetQuestions')),
    colorTheme: COLOR_THEMES.includes(colorTheme as SettingsState['colorTheme'])
      ? (colorTheme as SettingsState['colorTheme'])
      : undefined,
    backgroundImageUrl: params.get('backgroundImageUrl') || undefined,
  }
}

export const mergeEmbedConfig = (
  baseConfig: EmbedConfig,
  overrideConfig: EmbedConfig
): EmbedConfig => ({
  ...baseConfig,
  ...Object.fromEntries(
    Object.entries(overrideConfig).filter(([, value]) => value !== undefined)
  ),
  allowedOrigins: baseConfig.allowedOrigins,
})

export const toPresetQuestions = (questions?: string[]): PresetQuestion[] =>
  (questions || []).map((text, index) => ({
    id: `embed-preset-question-${index}`,
    text,
    order: index,
  }))

export const isEmbedOriginAllowed = (config: EmbedConfig, referrer: string) => {
  const allowedOrigins = config.allowedOrigins || []
  if (allowedOrigins.length === 0) return true
  if (!referrer) return false

  try {
    const origin = new URL(referrer).origin
    return allowedOrigins.includes(origin)
  } catch {
    return false
  }
}
