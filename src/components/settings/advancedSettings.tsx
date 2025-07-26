import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'

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
        <div className="my-4">{t('LocalStorageResetInfo')}</div>
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
      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('ShowQuickMenu')}</div>
        <div className="my-2">
          <TextButton
            onClick={() =>
              settingsStore.setState((s) => ({
                showQuickMenu: !s.showQuickMenu,
              }))
            }
          >
            {showQuickMenu ? t('StatusOn') : t('StatusOff')}
          </TextButton>
        </div>
      </div>
      <div className="my-6">
        <div className="my-4 text-xl font-bold">
          {t('IncludeTimestampInUserMessage')}
        </div>
        <div className="my-4 whitespace-pre-line">
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
    </div>
  )
}
export default AdvancedSettings
