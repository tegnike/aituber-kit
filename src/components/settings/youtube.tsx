import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'

import settingsStore from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'
import { ToggleSwitch } from '../toggleSwitch'
import { isMultiModalAvailable } from '@/features/constants/aiModels'
import { loadPreset } from '@/features/presets/presetLoader'

const YouTube = () => {
  const [showAdvancedPrompts, setShowAdvancedPrompts] = useState(false)
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

  const youtubeCommentInterval = settingsStore((s) => s.youtubeCommentInterval)
  const conversationContinuityMode = settingsStore(
    (s) => s.conversationContinuityMode
  )
  const conversationContinuityNewTopicThreshold = settingsStore(
    (s) => s.conversationContinuityNewTopicThreshold
  )
  const conversationContinuitySleepThreshold = settingsStore(
    (s) => s.conversationContinuitySleepThreshold
  )
  const conversationContinuityPromptEvaluate = settingsStore(
    (s) => s.conversationContinuityPromptEvaluate
  )
  const conversationContinuityPromptContinuation = settingsStore(
    (s) => s.conversationContinuityPromptContinuation
  )
  const conversationContinuityPromptSleep = settingsStore(
    (s) => s.conversationContinuityPromptSleep
  )
  const conversationContinuityPromptNewTopic = settingsStore(
    (s) => s.conversationContinuityPromptNewTopic
  )
  const conversationContinuityPromptSelectComment = settingsStore(
    (s) => s.conversationContinuityPromptSelectComment
  )
  const slideMode = settingsStore((s) => s.slideMode)

  const { t, i18n } = useTranslation()

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
            <div className="my-4 text-xl font-bold">{t('YoutubeAPIKey')}</div>
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
            <div className="my-4 text-xl font-bold">{t('YoutubeLiveID')}</div>
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
            <div className="my-4 text-xl font-bold">{t('OneCommePort')}</div>
            <input
              className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
              type="number"
              placeholder="11180"
              value={onecommePort}
              onChange={(e) => {
                const parsed = Number(e.target.value)
                const clamped = Number.isFinite(parsed)
                  ? Math.min(Math.max(parsed, 1), 65535)
                  : 11180
                settingsStore.setState({ onecommePort: clamped })
              }}
            />
          </>
        )}

        <div className="mt-6">
          <div className="my-4 text-xl font-bold">
            {t('YoutubeCommentInterval')}: {youtubeCommentInterval}
          </div>
          <input
            type="range"
            min={3}
            max={30}
            step={1}
            value={youtubeCommentInterval}
            className="mt-2 mb-4 input-range"
            onChange={(e) => {
              settingsStore.setState({
                youtubeCommentInterval: Number(e.target.value),
              })
            }}
          />
        </div>

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
          {conversationContinuityMode && (
            <>
              <div className="mt-4">
                <Image
                  src={
                    i18n.language === 'ja'
                      ? '/images/docs/conversation-continuity-workflow-ja.png'
                      : '/images/docs/conversation-continuity-workflow-en.png'
                  }
                  alt={t('ConversationContinuityMode')}
                  width={800}
                  height={400}
                  className="w-full rounded-lg"
                />
              </div>
              <div className="mt-4">
                <div className="my-4 text-xl font-bold">
                  {t('ConversationContinuityNewTopicThreshold')}:{' '}
                  {conversationContinuityNewTopicThreshold}
                </div>
                <div className="my-2 text-sm whitespace-pre-wrap">
                  {t('ConversationContinuityNewTopicThresholdInfo')}
                </div>
                <input
                  type="range"
                  min={1}
                  max={conversationContinuitySleepThreshold - 1}
                  step={1}
                  value={conversationContinuityNewTopicThreshold}
                  className="mt-2 mb-4 input-range"
                  onChange={(e) => {
                    settingsStore.setState({
                      conversationContinuityNewTopicThreshold: Number(
                        e.target.value
                      ),
                    })
                  }}
                />
              </div>
              <div className="mt-4">
                <div className="my-4 text-xl font-bold">
                  {t('ConversationContinuitySleepThreshold')}:{' '}
                  {conversationContinuitySleepThreshold}
                </div>
                <div className="my-2 text-sm whitespace-pre-wrap">
                  {t('ConversationContinuitySleepThresholdInfo')}
                </div>
                <input
                  type="range"
                  min={conversationContinuityNewTopicThreshold + 1}
                  max={20}
                  step={1}
                  value={conversationContinuitySleepThreshold}
                  className="mt-2 mb-4 input-range"
                  onChange={(e) => {
                    settingsStore.setState({
                      conversationContinuitySleepThreshold: Number(
                        e.target.value
                      ),
                    })
                  }}
                />
              </div>
              <div className="mt-6">
                <button
                  className="flex items-center text-lg font-bold text-primary hover:opacity-80"
                  onClick={() => setShowAdvancedPrompts(!showAdvancedPrompts)}
                >
                  <span className="mr-2">
                    {showAdvancedPrompts ? '▼' : '▶'}
                  </span>
                  {t('ConversationContinuityAdvancedPrompts')}
                </button>
                {showAdvancedPrompts && (
                  <div className="mt-2">
                    <div className="my-2 text-sm whitespace-pre-wrap">
                      {t('ConversationContinuityAdvancedPromptsInfo')}
                    </div>
                    <div className="mt-4">
                      <div className="my-2 text-base font-bold">
                        {t('ConversationContinuityPromptEvaluate')}
                      </div>
                      <div className="my-1 text-sm whitespace-pre-wrap">
                        {t('ConversationContinuityPromptEvaluateInfo')}
                      </div>
                      <textarea
                        className="px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                        rows={4}
                        value={conversationContinuityPromptEvaluate}
                        onChange={(e) =>
                          settingsStore.setState({
                            conversationContinuityPromptEvaluate:
                              e.target.value,
                          })
                        }
                      />
                      <button
                        className="mt-2 px-3 py-1 text-sm rounded-lg bg-white hover:bg-white-hover"
                        onClick={async () => {
                          const content = await loadPreset(
                            'youtube-prompt-evaluate.txt'
                          )
                          if (content !== null) {
                            settingsStore.setState({
                              conversationContinuityPromptEvaluate: content,
                            })
                          } else {
                            toastStore.getState().addToast({
                              message: t('Toasts.PresetLoadFailed'),
                              type: 'error',
                              tag: 'preset-load-error',
                            })
                          }
                        }}
                      >
                        {t('ResetToDefault')}
                      </button>
                    </div>
                    <div className="mt-4">
                      <div className="my-2 text-base font-bold">
                        {t('ConversationContinuityPromptContinuation')}
                      </div>
                      <div className="my-1 text-sm whitespace-pre-wrap">
                        {t('ConversationContinuityPromptContinuationInfo')}
                      </div>
                      <textarea
                        className="px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                        rows={4}
                        value={conversationContinuityPromptContinuation}
                        onChange={(e) =>
                          settingsStore.setState({
                            conversationContinuityPromptContinuation:
                              e.target.value,
                          })
                        }
                      />
                      <button
                        className="mt-2 px-3 py-1 text-sm rounded-lg bg-white hover:bg-white-hover"
                        onClick={async () => {
                          const content = await loadPreset(
                            'youtube-prompt-continuation.txt'
                          )
                          if (content !== null) {
                            settingsStore.setState({
                              conversationContinuityPromptContinuation: content,
                            })
                          } else {
                            toastStore.getState().addToast({
                              message: t('Toasts.PresetLoadFailed'),
                              type: 'error',
                              tag: 'preset-load-error',
                            })
                          }
                        }}
                      >
                        {t('ResetToDefault')}
                      </button>
                    </div>
                    <div className="mt-4">
                      <div className="my-2 text-base font-bold">
                        {t('ConversationContinuityPromptSelectComment')}
                      </div>
                      <div className="my-1 text-sm whitespace-pre-wrap">
                        {t('ConversationContinuityPromptSelectCommentInfo')}
                      </div>
                      <textarea
                        className="px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                        rows={4}
                        value={conversationContinuityPromptSelectComment}
                        onChange={(e) =>
                          settingsStore.setState({
                            conversationContinuityPromptSelectComment:
                              e.target.value,
                          })
                        }
                      />
                      <button
                        className="mt-2 px-3 py-1 text-sm rounded-lg bg-white hover:bg-white-hover"
                        onClick={async () => {
                          const content = await loadPreset(
                            'youtube-prompt-select-comment.txt'
                          )
                          if (content !== null) {
                            settingsStore.setState({
                              conversationContinuityPromptSelectComment:
                                content,
                            })
                          } else {
                            toastStore.getState().addToast({
                              message: t('Toasts.PresetLoadFailed'),
                              type: 'error',
                              tag: 'preset-load-error',
                            })
                          }
                        }}
                      >
                        {t('ResetToDefault')}
                      </button>
                    </div>
                    <div className="mt-4">
                      <div className="my-2 text-base font-bold">
                        {t('ConversationContinuityPromptNewTopic')}
                      </div>
                      <div className="my-1 text-sm whitespace-pre-wrap">
                        {t('ConversationContinuityPromptNewTopicInfo')}
                      </div>
                      <textarea
                        className="px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                        rows={4}
                        value={conversationContinuityPromptNewTopic}
                        onChange={(e) =>
                          settingsStore.setState({
                            conversationContinuityPromptNewTopic:
                              e.target.value,
                          })
                        }
                      />
                      <button
                        className="mt-2 px-3 py-1 text-sm rounded-lg bg-white hover:bg-white-hover"
                        onClick={async () => {
                          const content = await loadPreset(
                            'youtube-prompt-new-topic.txt'
                          )
                          if (content !== null) {
                            settingsStore.setState({
                              conversationContinuityPromptNewTopic: content,
                            })
                          } else {
                            toastStore.getState().addToast({
                              message: t('Toasts.PresetLoadFailed'),
                              type: 'error',
                              tag: 'preset-load-error',
                            })
                          }
                        }}
                      >
                        {t('ResetToDefault')}
                      </button>
                    </div>
                    <div className="mt-4">
                      <div className="my-2 text-base font-bold">
                        {t('ConversationContinuityPromptSleep')}
                      </div>
                      <div className="my-1 text-sm whitespace-pre-wrap">
                        {t('ConversationContinuityPromptSleepInfo')}
                      </div>
                      <textarea
                        className="px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                        rows={4}
                        value={conversationContinuityPromptSleep}
                        onChange={(e) =>
                          settingsStore.setState({
                            conversationContinuityPromptSleep: e.target.value,
                          })
                        }
                      />
                      <button
                        className="mt-2 px-3 py-1 text-sm rounded-lg bg-white hover:bg-white-hover"
                        onClick={async () => {
                          const content = await loadPreset(
                            'youtube-prompt-sleep.txt'
                          )
                          if (content !== null) {
                            settingsStore.setState({
                              conversationContinuityPromptSleep: content,
                            })
                          } else {
                            toastStore.getState().addToast({
                              message: t('Toasts.PresetLoadFailed'),
                              type: 'error',
                              tag: 'preset-load-error',
                            })
                          }
                        }}
                      >
                        {t('ResetToDefault')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
export default YouTube
