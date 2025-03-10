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

  const { t } = useTranslation()

  return (
    <div className="mb-40">
      <div className="mb-24 grid-cols-2">
        <div className="mb-16 typography-20 font-bold">
          {t('LocalStorageReset')}
        </div>
        <div className="my-16 typography-16">{t('LocalStorageResetInfo')}</div>
        <TextButton
          onClick={() => {
            settingsStore.persist.clearStorage()
            window.location.reload()
          }}
        >
          {t('LocalStorageResetButton')}
        </TextButton>
      </div>
      <div className="my-24">
        <div className="my-16 typography-20 font-bold">
          {t('UseVideoAsBackground')}
        </div>
        <div className="my-8">
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
        <div className="my-24">
          <div className="my-16 typography-20 font-bold">
            {t('EnglishToJapanese')}
          </div>
          <div className="my-8">
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
      <div className="my-24">
        <div className="my-16 typography-20 font-bold">
          {t('IncludeTimestampInUserMessage')}
        </div>
        <div className="my-16 typography-16 whitespace-pre-line">
          {t('IncludeTimestampInUserMessageInfo')}
        </div>
        <div className="my-8">
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
      <div className="my-24">
        <div className="my-16 typography-20 font-bold">
          {t('NoSpeechTimeout')}
        </div>
        <div className="my-16 typography-16 whitespace-pre-line">
          {t('NoSpeechTimeoutInfo')}
        </div>
        <div className="mt-24 font-bold">
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
            className="mt-8 mb-16 input-range"
          />
        </div>
      </div>
    </div>
  )
}
export default AdvancedSettings
