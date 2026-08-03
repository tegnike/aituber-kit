import { z } from 'zod'

import settingsStore, {
  CURRENT_SETTINGS_VERSION,
  PersistedSettings,
  SettingsState,
  runSettingsMigrations,
  selectPersistedSettings,
} from '@/features/stores/settings'

export const SETTINGS_FILE_FORMAT = 'aituber-kit-settings'
export const SETTINGS_FILE_FORMAT_VERSION = 1
export const SETTINGS_FILE_MAX_BYTES = 5 * 1024 * 1024

const settingsFileEnvelopeSchema = z
  .object({
    format: z.literal(SETTINGS_FILE_FORMAT),
    formatVersion: z.number().int().nonnegative(),
    settingsVersion: z.number().int().nonnegative(),
    exportedAt: z.string().datetime(),
    secretsIncluded: z.boolean(),
    settings: z.record(z.unknown()),
  })
  .strict()

export type SettingsFileErrorCode =
  | 'invalid-json'
  | 'invalid-format'
  | 'unsupported-format-version'
  | 'newer-settings-version'
  | 'unknown-setting'
  | 'invalid-setting-value'
  | 'sensitive-data-mismatch'
  | 'environment-override-enabled'

export class SettingsFileError extends Error {
  constructor(
    public readonly code: SettingsFileErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'SettingsFileError'
  }
}

export const SENSITIVE_SETTINGS_KEYS = [
  'openaiKey',
  'anthropicKey',
  'googleKey',
  'azureKey',
  'xaiKey',
  'groqKey',
  'difyKey',
  'cohereKey',
  'mistralaiKey',
  'perplexityKey',
  'fireworksKey',
  'deepseekKey',
  'openrouterKey',
  'lmstudioKey',
  'ollamaKey',
  'koeiromapKey',
  'youtubeApiKey',
  'elevenlabsApiKey',
  'cartesiaApiKey',
  'aivisCloudApiKey',
  'stylebertvits2ApiKey',
  'azureTTSKey',
  'customApiHeaders',
  'customApiBody',
  'kioskPasscode',
] as const satisfies readonly (keyof PersistedSettings)[]

const sensitiveSettingsKeys = new Set<string>(SENSITIVE_SETTINGS_KEYS)
const dangerousObjectKeys = new Set(['__proto__', 'constructor', 'prototype'])
const migratedSettingSourceKeys: Partial<
  Record<keyof PersistedSettings, readonly string[]>
> = {
  presenceGreetingPhrases: ['presenceGreetingMessage'],
  presenceDeparturePhrases: ['presenceDepartureMessage'],
  enableMultiModal: ['multiModalMode'],
}

export interface SettingsFileData {
  format: typeof SETTINGS_FILE_FORMAT
  formatVersion: typeof SETTINGS_FILE_FORMAT_VERSION
  settingsVersion: number
  exportedAt: string
  secretsIncluded: boolean
  settings: Partial<PersistedSettings>
}

export interface SettingsImportData {
  settingsVersion: number
  exportedAt: string
  secretsIncluded: boolean
  settings: Partial<PersistedSettings>
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const isJsonSafeValue = (value: unknown, depth = 0): boolean => {
  if (depth > 20) return false
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return true
  }
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) {
    return value.every((item) => isJsonSafeValue(item, depth + 1))
  }
  if (!isPlainObject(value)) return false

  return Object.entries(value).every(
    ([key, item]) =>
      !dangerousObjectKeys.has(key) && isJsonSafeValue(item, depth + 1)
  )
}

const matchesTopLevelType = (
  key: string,
  value: unknown,
  reference: unknown
): boolean => {
  if (key === 'chatLogEdgeOffset') {
    return (
      value === null || (typeof value === 'number' && Number.isFinite(value))
    )
  }
  if (reference === null) {
    return value === null
  }
  if (Array.isArray(reference)) return Array.isArray(value)
  if (typeof reference === 'number') {
    return typeof value === 'number' && Number.isFinite(value)
  }
  if (typeof reference === 'object') return isPlainObject(value)
  return typeof value === typeof reference
}

export const isEnvironmentSettingsOverrideEnabled = () =>
  process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES === 'true'

export const createSettingsFileData = (
  includeSecrets: boolean,
  exportedAt = new Date()
): SettingsFileData => {
  const persistedSettings = selectPersistedSettings(settingsStore.getState())
  const settings = Object.fromEntries(
    Object.entries(persistedSettings).filter(
      ([key]) => includeSecrets || !sensitiveSettingsKeys.has(key)
    )
  ) as Partial<PersistedSettings>

  return {
    format: SETTINGS_FILE_FORMAT,
    formatVersion: SETTINGS_FILE_FORMAT_VERSION,
    settingsVersion: CURRENT_SETTINGS_VERSION,
    exportedAt: exportedAt.toISOString(),
    secretsIncluded: includeSecrets,
    settings,
  }
}

export const createSettingsFileJson = (
  includeSecrets: boolean,
  exportedAt = new Date()
) => JSON.stringify(createSettingsFileData(includeSecrets, exportedAt), null, 2)

export const createSettingsFilename = (exportedAt = new Date()) => {
  const timestamp = exportedAt
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .slice(0, 15)
  return `aituber-kit-settings-${timestamp}.json`
}

export const downloadSettingsFile = (includeSecrets: boolean): void => {
  const exportedAt = new Date()
  const blob = new Blob([createSettingsFileJson(includeSecrets, exportedAt)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = createSettingsFilename(exportedAt)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export const parseSettingsFile = (contents: string): SettingsImportData => {
  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(contents)
  } catch {
    throw new SettingsFileError('invalid-json', 'Invalid JSON')
  }

  const envelopeResult = settingsFileEnvelopeSchema.safeParse(parsedJson)
  if (!envelopeResult.success) {
    throw new SettingsFileError('invalid-format', 'Invalid settings file')
  }

  const envelope = envelopeResult.data
  if (envelope.formatVersion !== SETTINGS_FILE_FORMAT_VERSION) {
    throw new SettingsFileError(
      'unsupported-format-version',
      'Unsupported settings file format version'
    )
  }
  if (envelope.settingsVersion > CURRENT_SETTINGS_VERSION) {
    throw new SettingsFileError(
      'newer-settings-version',
      'Settings file was created by a newer settings schema'
    )
  }
  if (!isJsonSafeValue(envelope.settings)) {
    throw new SettingsFileError(
      'invalid-setting-value',
      'Settings file contains an invalid value'
    )
  }

  const originalSettingKeys = new Set(Object.keys(envelope.settings))
  const migratedSettings = runSettingsMigrations(
    envelope.settings,
    envelope.settingsVersion
  )
  const currentSettings = selectPersistedSettings(settingsStore.getState())
  const currentSettingsRecord = currentSettings as Record<string, unknown>
  const sanitizedSettings: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(migratedSettings)) {
    const migrationSourceKeys =
      migratedSettingSourceKeys[key as keyof PersistedSettings] ?? []
    const wasProvidedByFile =
      originalSettingKeys.has(key) ||
      migrationSourceKeys.some((sourceKey) =>
        originalSettingKeys.has(sourceKey)
      )
    if (!wasProvidedByFile) continue

    if (!Object.hasOwn(currentSettingsRecord, key)) {
      throw new SettingsFileError('unknown-setting', `Unknown setting: ${key}`)
    }
    if (!envelope.secretsIncluded && sensitiveSettingsKeys.has(key)) {
      throw new SettingsFileError(
        'sensitive-data-mismatch',
        'Settings file contains sensitive data without declaring it'
      )
    }
    if (!matchesTopLevelType(key, value, currentSettingsRecord[key])) {
      throw new SettingsFileError(
        'invalid-setting-value',
        `Invalid setting value: ${key}`
      )
    }
    sanitizedSettings[key] = value
  }

  return {
    settingsVersion: envelope.settingsVersion,
    exportedAt: envelope.exportedAt,
    secretsIncluded: envelope.secretsIncluded,
    settings: sanitizedSettings as Partial<PersistedSettings>,
  }
}

export const applySettingsImport = (importData: SettingsImportData): void => {
  if (isEnvironmentSettingsOverrideEnabled()) {
    throw new SettingsFileError(
      'environment-override-enabled',
      'Environment variables override browser settings'
    )
  }

  const mergedState = {
    ...settingsStore.getState(),
    ...importData.settings,
  } as SettingsState
  settingsStore.setState(selectPersistedSettings(mergedState))
}
