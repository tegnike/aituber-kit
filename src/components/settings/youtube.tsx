import { useTranslation } from 'react-i18next'
import Image from 'next/image'

import settingsStore from '@/features/stores/settings'
import { ToggleSwitch } from '../toggleSwitch'
import { isMultiModalAvailable } from '@/features/constants/aiModels'

const YouTube = () => {
  const youtubeApiKey = settingsStore((s) => s.youtubeApiKey)
  const youtubeMode = settingsStore((s) => s.youtubeMode)
  const youtubeLiveId = settingsStore((s) => s.youtubeLiveId)
  const youtubeCommentSource = settingsStore((s) => s.youtubeCommentSource)
  const onecommePort = settingsStore((s) => s.onecommePort)
  const externalLinkageMode = settingsStore((s) => s.externalLinkageMode)
  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectAIModel = settingsStore((s) => s.selectAIModel)
  const enableMultiModal = settingsStore((s) => s.enableMultiModal)
  const multiModalMode = settingsStore((s) => s.multiModalMode)
  const customModel = settingsStore((s) => s.customModel)

  const conversationContinuityMode = settingsStore(
    (s) => s.conversationContinuityMode
  )
  const slideMode = settingsStore((s) => s.slideMode)

  const { t } = useTranslation()

  const handleChangeYoutubeMode = (youtubeMode: boolean) => {
    settingsStore.setState({ youtubeMode })

    if (!youtubeMode) {
      settingsStore.setState({ youtubePlaying: false })
    }
  }

  return (
    <>
      <div className="flex items-center mb-6">
        <Image
          src="/images/setting-icons/youtube-settings.svg"
          alt="YouTube Settings"
          width={24}
          height={24}
          className="mr-2"
        />
        <h2 className="text-2xl font-bold">{t('YoutubeSettings')}</h2>
      </div>
      <div className="mb-4 text-xl font-bold">{t('YoutubeMode')}</div>
      <div className="my-2">
        <ToggleSwitch
          enabled={youtubeMode}
          onChange={handleChangeYoutubeMode}
        />
      </div>
      <div className="mt-4">
        {(() => {
          if (youtubeMode) {
            return (
              <>
                <div className="my-4 text-xl font-bold">
                  {t('YoutubeCommentSource')}
                </div>
                <div className="my-2 flex">
                  <button
                    className={`px-4 py-2 rounded-lg mr-2 ${
                      youtubeCommentSource === 'youtube-api'
                        ? 'bg-primary text-theme'
                        : 'bg-white hover:bg-white-hover'
                    }`}
                    onClick={() =>
                      settingsStore.setState({
                        youtubeCommentSource: 'youtube-api',
                      })
                    }
                  >
                    {t('YoutubeCommentSourceAPI')}
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg ${
                      youtubeCommentSource === 'onecomme'
                        ? 'bg-primary text-theme'
                        : 'bg-white hover:bg-white-hover'
                    }`}
                    onClick={() =>
                      settingsStore.setState({
                        youtubeCommentSource: 'onecomme',
                      })
                    }
                  >
                    {t('YoutubeCommentSourceOneComme')}
                  </button>
                </div>

                {youtubeCommentSource === 'youtube-api' && (
                  <>
                    <div className="my-2 text-sm whitespace-pre-wrap">
                      {t('YoutubeInfo')}
                    </div>
                    <div className="my-4 text-xl font-bold">
                      {t('YoutubeAPIKey')}
                    </div>
                    <input
                      className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
                      type="text"
                      placeholder="..."
                      value={youtubeApiKey}
                      onChange={(e) =>
                        settingsStore.setState({
                          youtubeApiKey: e.target.value,
                        })
                      }
                    />
                    <div className="my-4 text-xl font-bold">
                      {t('YoutubeLiveID')}
                    </div>
                    <input
                      className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
                      type="text"
                      placeholder="..."
                      value={youtubeLiveId}
                      onChange={(e) =>
                        settingsStore.setState({
                          youtubeLiveId: e.target.value,
                        })
                      }
                    />
                  </>
                )}

                {youtubeCommentSource === 'onecomme' && (
                  <>
                    <div className="my-2 text-sm whitespace-pre-wrap">
                      {t('OneCommeInfo')}
                    </div>
                    <div className="my-4 text-xl font-bold">
                      {t('OneCommePort')}
                    </div>
                    <input
                      className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
                      type="number"
                      placeholder="11180"
                      value={onecommePort}
                      onChange={(e) =>
                        settingsStore.setState({
                          onecommePort: parseInt(e.target.value) || 11180,
                        })
                      }
                    />
                  </>
                )}

                <div className="mt-6">
                  <div className="my-4 text-xl font-bold">
                    {t('ConversationContinuityMode')}
                  </div>
                  <div className="my-2 text-sm whitespace-pre-wrap">
                    {t('ConversationContinuityModeInfo')}
                  </div>
                  <div className="my-2 text-sm whitespace-pre-wrap">
                    {t('ConversationContinuityModeInfo2')}
                  </div>
                  <div className="my-2 text-sm whitespace-pre-wrap">
                    {t('ConversationContinuityModeInfo3')}
                  </div>
                  <ToggleSwitch
                    enabled={conversationContinuityMode}
                    onChange={(v) =>
                      settingsStore.setState({
                        conversationContinuityMode: v,
                      })
                    }
                    disabled={
                      !isMultiModalAvailable(
                        selectAIService,
                        selectAIModel,
                        enableMultiModal,
                        multiModalMode,
                        customModel
                      ) ||
                      slideMode ||
                      externalLinkageMode
                    }
                  />
                </div>
              </>
            )
          }
        })()}
      </div>
    </>
  )
}
export default YouTube
