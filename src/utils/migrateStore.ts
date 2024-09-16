import { isLanguageSupported } from '@/features/constants/settings'
import homeStore, { PersistedState } from '@/features/stores/home'
import settingsStore, { SettingsState } from '@/features/stores/settings'

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
