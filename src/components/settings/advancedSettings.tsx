import { Disclosure } from '@headlessui/react'
import { ChevronUpIcon } from '@heroicons/react/24/solid'
import { useTranslation } from 'react-i18next'

import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'

const AdvancedSettings = () => {
  const selectLanguage = settingsStore((s) => s.selectLanguage)
  const changeEnglishToJapanese = settingsStore(
    (s) => s.changeEnglishToJapanese
  )
  const includeTimestampInUserMessage = settingsStore(
    (s) => s.includeTimestampInUserMessage
  )
  const useVideoAsBackground = settingsStore((s) => s.useVideoAsBackground)
  const noSpeechTimeout = settingsStore((s) => s.noSpeechTimeout)
  const showSilenceProgressBar = settingsStore((s) => s.showSilenceProgressBar)

  const { t } = useTranslation()

  return (
    <div className="mb-10">
      <div className="mb-6 grid-cols-2">
        <div className="mb-4 text-xl font-bold">{t('LocalStorageReset')}</div>
        <div className="my-4 text-base">{t('LocalStorageResetInfo')}</div>
        <TextButton
          onClick={() => {
            settingsStore.persist.clearStorage()
            window.location.reload()
          }}
        >
          {t('LocalStorageResetButton')}
        </TextButton>
      </div>
      <div className="my-6">
        <div className="my-4 text-xl font-bold">
          {t('UseVideoAsBackground')}
        </div>
        <div className="my-2">
          <TextButton
            onClick={() =>
              settingsStore.setState((s) => ({
                useVideoAsBackground: !s.useVideoAsBackground,
              }))
            }
          >
            {useVideoAsBackground ? t('StatusOn') : t('StatusOff')}
          </TextButton>
        </div>
      </div>
      {selectLanguage === 'ja' && (
        <div className="my-6">
          <div className="my-4 text-xl font-bold">{t('EnglishToJapanese')}</div>
          <div className="my-2">
            <TextButton
              onClick={() =>
                settingsStore.setState((prevState) => ({
                  changeEnglishToJapanese: !prevState.changeEnglishToJapanese,
                }))
              }
            >
              {t(changeEnglishToJapanese ? 'StatusOn' : 'StatusOff')}
            </TextButton>
          </div>
        </div>
      )}
      <div className="my-6">
        <div className="my-4 text-xl font-bold">
          {t('IncludeTimestampInUserMessage')}
        </div>
        <div className="my-4 text-base whitespace-pre-line">
          {t('IncludeTimestampInUserMessageInfo')}
        </div>
        <div className="my-2">
          <TextButton
            onClick={() =>
              settingsStore.setState({
                includeTimestampInUserMessage: !includeTimestampInUserMessage,
              })
            }
          >
            {includeTimestampInUserMessage ? t('StatusOn') : t('StatusOff')}
          </TextButton>
        </div>
      </div>
      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('NoSpeechTimeout')}</div>
        <div className="my-4 text-base whitespace-pre-line">
          {t('NoSpeechTimeoutInfo')}
        </div>
        <div className="mt-6 font-bold">
          <div className="select-none">
            {t('NoSpeechTimeout')}: {noSpeechTimeout.toFixed(1)}秒
          </div>
          <input
            type="range"
            min="0"
            max="4"
            step="0.1"
            value={noSpeechTimeout}
            onChange={(e) =>
              settingsStore.setState({
                noSpeechTimeout: parseFloat(e.target.value),
              })
            }
            className="mt-2 mb-4 input-range"
          />
        </div>
        <div className="mt-2">
          <div className="font-bold mb-2">{t('ShowSilenceProgressBar')}</div>
          <TextButton
            onClick={() =>
              settingsStore.setState({
                showSilenceProgressBar: !showSilenceProgressBar,
              })
            }
          >
            {showSilenceProgressBar ? t('StatusOn') : t('StatusOff')}
          </TextButton>
        </div>
      </div>
    </div>
  )
}
export default AdvancedSettings
