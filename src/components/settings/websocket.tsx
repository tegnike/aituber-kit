import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'

const WebSocket = () => {
  const { t } = useTranslation()

  const webSocketMode = settingsStore((s) => s.webSocketMode)

  const handleChangeYoutubeMode = (youtubeMode: boolean) => {
    settingsStore.setState({ youtubeMode })

    if (youtubeMode) {
      homeStore.setState({ modalImage: '' })
      menuStore.setState({ showWebcam: false })
    }
  }

  return (
    <div className="my-40">
      <div className="my-16 typography-20 font-bold">
        {t('ExternalConnectionMode')}
      </div>
      <div className="my-8">
        {webSocketMode ? (
          <TextButton
            onClick={() => {
              settingsStore.setState({ webSocketMode: false })
              webSocketMode && handleChangeYoutubeMode(false)
            }}
          >
            {t('StatusOn')}
          </TextButton>
        ) : (
          <TextButton
            onClick={() => {
              settingsStore.setState({ webSocketMode: true })
              webSocketMode && handleChangeYoutubeMode(false)
            }}
          >
            {t('StatusOff')}
          </TextButton>
        )}
      </div>
    </div>
  )
}
export default WebSocket
