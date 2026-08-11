import '@charcoal-ui/icons'
import { useEffect } from 'react'

import { isLanguageSupported } from '@/features/constants/settings'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import i18n from '@/lib/i18n'
import migrateStore from '@/utils/migrateStore'

export default function AppInitializer() {
  useEffect(() => {
    const hs = homeStore.getState()
    const ss = settingsStore.getState()

    if (hs.userOnboarded) {
      i18n.changeLanguage(ss.selectLanguage)
      document.documentElement.setAttribute('data-theme', ss.colorTheme)
      return
    }

    migrateStore()

    const browserLanguage = navigator.language
    const languageCode =
      browserLanguage === 'zh-TW'
        ? 'zh-TW'
        : browserLanguage.match(/^zh/i)
          ? 'zh-CN'
          : browserLanguage.split('-')[0].toLowerCase()

    let language = ss.selectLanguage
    if (!language) {
      language = isLanguageSupported(languageCode) ? languageCode : 'ja'
    }
    i18n.changeLanguage(language)
    settingsStore.setState({ selectLanguage: language })

    document.documentElement.setAttribute('data-theme', ss.colorTheme)
    homeStore.setState({ userOnboarded: true })
  }, [])

  return null
}
