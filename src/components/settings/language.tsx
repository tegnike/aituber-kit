import i18n from 'i18next'
import { useTranslation } from 'react-i18next'

import { Language } from '@/features/constants/settings'
import settingsStore from '@/features/stores/settings'

const LanguageSetting = () => {
  const selectLanguage = settingsStore((s) => s.selectLanguage)

  const { t } = useTranslation()

  return (
    <div className="my-24">
      <div className="my-16 typography-20 font-bold">{t('Language')}</div>
      <div className="my-8">
        <select
          className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8"
          value={selectLanguage}
          onChange={(e) => {
            const newLanguage = e.target.value as Language

            const ss = settingsStore.getState()
            const jaVoiceSelected =
              ss.selectVoice === 'voicevox' || ss.selectVoice === 'koeiromap'

            switch (newLanguage) {
              case 'ja':
                settingsStore.setState({
                  selectLanguage: 'ja',
                  selectVoiceLanguage: 'ja-JP',
                })

                i18n.changeLanguage('ja')
                break
              case 'en':
                settingsStore.setState({ selectLanguage: 'en' })

                if (jaVoiceSelected) {
                  settingsStore.setState({ selectVoice: 'google' })
                }
                settingsStore.setState({ selectVoiceLanguage: 'en-US' })

                i18n.changeLanguage('en')
                break
              case 'zh':
                settingsStore.setState({ selectLanguage: 'zh' })

                if (jaVoiceSelected) {
                  settingsStore.setState({ selectVoice: 'google' })
                }
                settingsStore.setState({ selectVoiceLanguage: 'zh-TW' })

                i18n.changeLanguage('zh-TW')
                break
              case 'ko':
                settingsStore.setState({ selectLanguage: 'ko' })

                if (jaVoiceSelected) {
                  settingsStore.setState({ selectVoice: 'google' })
                }
                settingsStore.setState({ selectVoiceLanguage: 'ko-KR' })

                i18n.changeLanguage('ko')
                break
              default:
                break
            }
          }}
        >
          <option value="ja">日本語 - Japanese</option>
          <option value="en">英語 - English</option>
          <option value="zh">繁體中文 - Traditional Chinese</option>
          <option value="ko">韓語 - Korean</option>
        </select>
      </div>
    </div>
  )
}
export default LanguageSetting
