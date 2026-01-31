import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import { ToggleSwitch } from '../toggleSwitch'

const AdvancedSettings = () => {
  const includeTimestampInUserMessage = settingsStore(
    (s) => s.includeTimestampInUserMessage
  )
  const useVideoAsBackground = settingsStore((s) => s.useVideoAsBackground)
  const showQuickMenu = settingsStore((s) => s.showQuickMenu)

  const { t } = useTranslation()

  return (
    <div className="mb-10">
      <div className="mb-6 grid-cols-2">
        <div className="mb-4 text-xl font-bold">{t('LocalStorageReset')}</div>
        <div className="my-2 text-sm whitespace-pre-wrap">
          {t('LocalStorageResetInfo')}
        </div>
        <TextButton
          onClick={() => {
            settingsStore.persist.clearStorage()
            window.location.reload()
          }}
        >
          {t('LocalStorageResetButton')}
        </TextButton>
      </div>
      <div className="border-t border-gray-300 pt-6 my-6">
        <div className="my-4 text-xl font-bold">
          {t('UseVideoAsBackground')}
        </div>
        <div className="my-2">
          <ToggleSwitch
            enabled={useVideoAsBackground}
            onChange={(v) =>
              settingsStore.setState({ useVideoAsBackground: v })
            }
          />
        </div>
      </div>
      <div className="border-t border-gray-300 pt-6 my-6">
        <div className="my-4 text-xl font-bold">{t('ShowQuickMenu')}</div>
        <div className="my-2">
          <ToggleSwitch
            enabled={showQuickMenu}
            onChange={(v) => settingsStore.setState({ showQuickMenu: v })}
          />
        </div>
      </div>
      <div className="border-t border-gray-300 pt-6 my-6">
        <div className="my-4 text-xl font-bold">
          {t('IncludeTimestampInUserMessage')}
        </div>
        <div className="my-2 text-sm whitespace-pre-wrap">
          {t('IncludeTimestampInUserMessageInfo')}
        </div>
        <div className="my-2">
          <ToggleSwitch
            enabled={includeTimestampInUserMessage}
            onChange={(v) =>
              settingsStore.setState({ includeTimestampInUserMessage: v })
            }
          />
        </div>
      </div>
    </div>
  )
}
export default AdvancedSettings
