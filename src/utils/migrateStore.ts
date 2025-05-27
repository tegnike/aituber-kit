import { isLanguageSupported } from '@/features/constants/settings'
import homeStore, { PersistedState } from '@/features/stores/home'
import settingsStore, { SettingsState } from '@/features/stores/settings'

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

const migrateStore = () => {
  const rawStore = window.localStorage.getItem('chatVRMParams')
  if (!rawStore) return

  type Store = Omit<SettingsState, 'selectLanguage'> &
    Pick<PersistedState, 'chatLog' | 'showIntroduction'> & {
      selectLanguage: string
    }

  const store = JSON.parse(rawStore) as Store

  const ss = settingsStore.getState()
  const hs = homeStore.getState()

  Object.entries(store).forEach(([k, v]) => {
    if (k in ss) {
      ;(ss as any)[k] = v
    } else if (k in hs) {
      ;(hs as any)[k] = v
    }
  })

  // selectLanguage migration: follow ISO 639-1 and lowercased, e.g. JP → ja
  let lang = ss.selectLanguage.toLowerCase()
  lang = lang === 'jp' ? 'ja' : lang
  ss.selectLanguage = isLanguageSupported(lang) ? lang : 'ja'

  settingsStore.setState(ss)
  homeStore.setState(hs)

  window.localStorage.removeItem('chatVRMParams')
}
export default migrateStore
