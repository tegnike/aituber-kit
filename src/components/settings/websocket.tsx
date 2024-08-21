import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'

const WebSocket = () => {
  const { t } = useTranslation()
  const webSocketMode = settingsStore((s) => s.webSocketMode)

  return (
    <div className="my-40">
      <div className="my-16 typography-20 font-bold">
        {t('ExternalConnectionMode')}
      </div>
      <div className="my-8">
        <TextButton
          onClick={() => {
            settingsStore.setState({ webSocketMode: !webSocketMode })
          }}
        >
          {webSocketMode ? t('StatusOn') : t('StatusOff')}
        </TextButton>
      </div>
    </div>
  )
}
export default WebSocket
