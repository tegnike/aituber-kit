import { useTranslation } from 'react-i18next'
import i18n from 'i18next'

import { Language } from '@/features/constants/settings'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'

const Based = () => {
  const { t } = useTranslation()
  const selectLanguage = settingsStore((s) => s.selectLanguage)

  return (
    <>
      <div className="mb-24">
        <div className="mb-16 typography-20 font-bold">{t('Language')}</div>
        <div className="my-8">
          <select
            className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8"
            value={selectLanguage}
            onChange={(e) => {
              const newLanguage = e.target.value as Language

              const ss = settingsStore.getState()
              const jaVoiceSelected =
                ss.selectVoice === 'voicevox' ||
                ss.selectVoice === 'koeiromap' ||
                ss.selectVoice === 'aivis_speech' ||
                ss.selectVoice === 'nijivoice'

              switch (newLanguage) {
                case 'ja':
                  settingsStore.setState({ selectLanguage: 'ja' })

                  i18n.changeLanguage('ja')
                  break
                case 'en':
                  settingsStore.setState({ selectLanguage: 'en' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('en')
                  break
                case 'zh':
                  settingsStore.setState({ selectLanguage: 'zh' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('zh-TW')
                  break
                case 'ko':
                  settingsStore.setState({ selectLanguage: 'ko' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('ko')
                  break
                case 'vi':
                  settingsStore.setState({ selectLanguage: 'vi' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('vi')
                  break
                case 'fr':
                  settingsStore.setState({ selectLanguage: 'fr' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('fr')
                  break
                case 'es':
                  settingsStore.setState({ selectLanguage: 'es' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('es')
                  break
                case 'pt':
                  settingsStore.setState({ selectLanguage: 'pt' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('pt')
                  break
                case 'de':
                  settingsStore.setState({ selectLanguage: 'de' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('de')
                  break
                case 'ru':
                  settingsStore.setState({ selectLanguage: 'ru' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('ru')
                  break
                case 'it':
                  settingsStore.setState({ selectLanguage: 'it' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('it')
                  break
                case 'ar':
                  settingsStore.setState({ selectLanguage: 'ar' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('ar')
                  break
                case 'hi':
                  settingsStore.setState({ selectLanguage: 'hi' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('hi')
                  break
                case 'pl':
                  settingsStore.setState({ selectLanguage: 'pl' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                default:
                  break
              }
            }}
          >
            <option value="ar">Arabic - アラビア語</option>
            <option value="de">German - ドイツ語</option>
            <option value="en">English - 英語</option>
            <option value="es">Spanish - スペイン語</option>
            <option value="fr">French - フランス語</option>
            <option value="hi">Hindi - ヒンディー語</option>
            <option value="it">Italian - イタリア語</option>
            <option value="ja">Japanese - 日本語</option>
            <option value="ko">Korean - 韓語</option>
            <option value="pl">Polish - ポーランド語</option>
            <option value="pt">Portuguese - ポルトガル語</option>
            <option value="ru">Russian - ロシア語</option>
            <option value="vi">Vietnamese - ベトナム語</option>
            <option value="zh">Traditional Chinese - 繁體中文</option>
          </select>
        </div>
      </div>
      <div className="mt-24">
        <div className="my-16 typography-20 font-bold">
          {t('BackgroundImage')}
        </div>
        <div className="my-8">
          <TextButton
            onClick={() => {
              const { bgFileInput } = menuStore.getState()
              bgFileInput?.click()
            }}
          >
            {t('ChangeBackgroundImage')}
          </TextButton>
        </div>
      </div>
    </>
  )
}
export default Based
