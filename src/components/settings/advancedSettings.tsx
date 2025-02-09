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
  const showControlPanel = settingsStore((s) => s.showControlPanel)
  const includeTimestampInUserMessage = settingsStore(
    (s) => s.includeTimestampInUserMessage
  )
  const showAssistantText = settingsStore((s) => s.showAssistantText)
  const showCharacterName = settingsStore((s) => s.showCharacterName)
  const useVideoAsBackground = settingsStore((s) => s.useVideoAsBackground)

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
      <div className="my-24">
        <div className="my-16 typography-20 font-bold">
          {t('ShowAssistantText')}
        </div>
        <div className="my-8">
          <TextButton
            onClick={() =>
              settingsStore.setState((s) => ({
                showAssistantText: !s.showAssistantText,
              }))
            }
          >
            {showAssistantText ? t('StatusOn') : t('StatusOff')}
          </TextButton>
        </div>
      </div>
      <div className="my-24">
        <div className="my-16 typography-20 font-bold">
          {t('ShowCharacterName')}
        </div>
        <div className="my-8">
          <TextButton
            onClick={() =>
              settingsStore.setState((s) => ({
                showCharacterName: !s.showCharacterName,
              }))
            }
          >
            {showCharacterName ? t('StatusOn') : t('StatusOff')}
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
          {t('ShowControlPanel')}
        </div>
        <div className="my-16 typography-16">{t('ShowControlPanelInfo')}</div>
        <div className="my-8">
          <TextButton
            onClick={() =>
              settingsStore.setState({
                showControlPanel: !showControlPanel,
              })
            }
          >
            {showControlPanel ? t('StatusOn') : t('StatusOff')}
          </TextButton>
        </div>
      </div>
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
    </div>
  )
}
export default AdvancedSettings
