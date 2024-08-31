import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import { TextButton } from '../textButton'
import { multiModalAIServices } from '@/features/stores/settings'

const YouTube = () => {
  const youtubeApiKey = settingsStore((s) => s.youtubeApiKey)
  const youtubeMode = settingsStore((s) => s.youtubeMode)
  const youtubeLiveId = settingsStore((s) => s.youtubeLiveId)
  const webSocketMode = settingsStore((s) => s.webSocketMode)
  const selectAIService = settingsStore((s) => s.selectAIService)

  const conversationContinuityMode = settingsStore(
    (s) => s.conversationContinuityMode
  )
  const slideMode = settingsStore((s) => s.slideMode)

  const { t } = useTranslation()

  const handleChangeYoutubeMode = (youtubeMode: boolean) => {
    settingsStore.setState({ youtubeMode })

    if (youtubeMode) {
      homeStore.setState({ modalImage: '' })
      menuStore.setState({ showWebcam: false })
      settingsStore.setState({ slideMode: false })
      slideStore.setState({ isPlaying: false })
    } else {
      settingsStore.setState({ youtubePlaying: false })
    }
  }

  return (
    <div className="my-40">
      <div className="my-16 typography-20 font-bold">{t('YoutubeMode')}</div>
      <div className="my-8">
        {youtubeMode ? (
          <TextButton onClick={() => handleChangeYoutubeMode(false)}>
            {t('StatusOn')}
          </TextButton>
        ) : (
          <TextButton onClick={() => handleChangeYoutubeMode(true)}>
            {t('StatusOff')}
          </TextButton>
        )}
      </div>
      <div className="my-16">
        {(() => {
          if (youtubeMode) {
            return (
              <>
                <div className="">{t('YoutubeInfo')}</div>
                <div className="my-16 typography-20 font-bold">
                  {t('YoutubeAPIKey')}
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={youtubeApiKey}
                  onChange={(e) =>
                    settingsStore.setState({
                      youtubeApiKey: e.target.value,
                    })
                  }
                />
                <div className="my-16 typography-20 font-bold">
                  {t('YoutubeLiveID')}
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={youtubeLiveId}
                  onChange={(e) =>
                    settingsStore.setState({
                      youtubeLiveId: e.target.value,
                    })
                  }
                />
                <div className="my-24">
                  <div className="my-16 typography-20 font-bold">
                    {t('ConversationContinuityMode')}
                  </div>
                  <div className="my-8">
                    {t('ConversationContinuityModeInfo')}
                  </div>
                  <div className="my-8">
                    {t('ConversationContinuityModeInfo2')}
                  </div>
                  <div className="mb-16">
                    {t('ConversationContinuityModeInfo3')}
                  </div>
                  <TextButton
                    onClick={() =>
                      settingsStore.setState({
                        conversationContinuityMode: !conversationContinuityMode,
                      })
                    }
                    disabled={
                      !multiModalAIServices.includes(selectAIService as any) ||
                      slideMode ||
                      webSocketMode
                    }
                  >
                    {t(conversationContinuityMode ? 'StatusOn' : 'StatusOff')}
                  </TextButton>
                </div>
              </>
            )
          }
        })()}
      </div>
    </div>
  )
}
export default YouTube
