import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import settingsStore from '@/features/stores/settings'
import webSocketStore from '@/features/stores/websocketStore'
import toastStore from '@/features/stores/toast'
import { TextButton } from '../../textButton'
import { ToggleSwitch } from '../../toggleSwitch'
import { ApiKeyInput } from './ApiKeyInput'
import { ModelSelector } from './ModelSelector'
import { MultiModalToggle } from './MultiModalToggle'
import {
  getModels,
  getOpenAIRealtimeModels,
  getOpenAIAudioModels,
  isMultiModalModel,
} from '@/features/constants/aiModels'
import {
  RealtimeAPIModeContentType,
  RealtimeAPIModeVoice,
  RealtimeAPIModeAzureVoice,
  AudioModeInputType,
  OpenAITTSVoice,
  AIService,
} from '@/features/constants/settings'

interface OpenAIConfigProps {
  openaiKey: string
  realtimeAPIMode: boolean
  audioMode: boolean
  realtimeAPIModeContentType: RealtimeAPIModeContentType
  realtimeAPIModeVoice: RealtimeAPIModeVoice | RealtimeAPIModeAzureVoice
  audioModeInputType: AudioModeInputType
  audioModeVoice: OpenAITTSVoice
  selectAIModel: string
  customModel: boolean
  enableMultiModal: boolean
  multiModalMode: string
  updateMultiModalModeForModel: (service: AIService, model: string) => void
}

export const OpenAIConfig = ({
  openaiKey,
  realtimeAPIMode,
  audioMode,
  realtimeAPIModeContentType,
  realtimeAPIModeVoice,
  audioModeInputType,
  audioModeVoice,
  selectAIModel,
  customModel,
  enableMultiModal,
  multiModalMode,
  updateMultiModalModeForModel,
}: OpenAIConfigProps) => {
  const { t } = useTranslation()

  const handleRealtimeAPIModeChange = useCallback((newMode: boolean) => {
    settingsStore.setState({ realtimeAPIMode: newMode })
  }, [])

  const handleAudioModeChange = useCallback((newMode: boolean) => {
    settingsStore.setState({ audioMode: newMode })
  }, [])

  const handleUpdate = useCallback(() => {
    const wsManager = webSocketStore.getState().wsManager
    if (!wsManager || !wsManager.reconnect()) {
      toastStore.getState().addToast({
        message: t('Toasts.WebSocketReconnectFailed'),
        type: 'error',
        duration: 3000,
      })
    }
  }, [t])

  const handleModelChange = useCallback(
    (model: string) => {
      settingsStore.setState({ selectAIModel: model })
      updateMultiModalModeForModel('openai' as AIService, model)
    },
    [updateMultiModalModeForModel]
  )

  const handleCustomModelToggle = useCallback(() => {
    settingsStore.setState({ customModel: !customModel })
  }, [customModel])

  const handleMultiModalToggle = useCallback(() => {
    settingsStore.setState({ enableMultiModal: !enableMultiModal })
  }, [enableMultiModal])

  return (
    <>
      <ApiKeyInput
        label={t('OpenAIAPIKeyLabel')}
        value={openaiKey}
        onChange={(value) => settingsStore.setState({ openaiKey: value })}
        placeholder="sk-..."
        linkUrl="https://platform.openai.com/account/api-keys"
        linkLabel="OpenAI Platform"
      />

      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('RealtimeAPIMode')}</div>
        <div className="my-2">
          <ToggleSwitch
            enabled={realtimeAPIMode}
            onChange={handleRealtimeAPIModeChange}
          />
        </div>
      </div>

      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('AudioMode')}</div>
        <div className="my-2">
          <ToggleSwitch enabled={audioMode} onChange={handleAudioModeChange} />
        </div>
      </div>

      {realtimeAPIMode && (
        <>
          <div className="my-4 font-bold">
            {t('RealtimeAPIModeContentType')}
          </div>
          <select
            className="px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
            value={realtimeAPIModeContentType}
            onChange={(e) => {
              settingsStore.setState({
                realtimeAPIModeContentType: e.target
                  .value as RealtimeAPIModeContentType,
              })
            }}
          >
            <option value="input_text">{t('InputText')}</option>
            <option value="input_audio">{t('InputAudio')}</option>
          </select>

          <div className="my-4 font-bold">{t('RealtimeAPIModeVoice')}</div>
          <select
            className="px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
            value={realtimeAPIModeVoice}
            onChange={(e) => {
              settingsStore.setState({
                realtimeAPIModeVoice: e.target.value as RealtimeAPIModeVoice,
              })
            }}
          >
            <option value="alloy">alloy</option>
            <option value="ash">ash</option>
            <option value="ballad">ballad</option>
            <option value="coral">coral</option>
            <option value="echo">echo</option>
            <option value="sage">sage</option>
            <option value="shimmer">shimmer</option>
            <option value="verse">verse</option>
          </select>

          <div className="my-6">
            <div className="my-4 font-bold">{t('SelectModel')}</div>
            <select
              className="px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
              value={selectAIModel}
              onChange={(e) => handleModelChange(e.target.value)}
            >
              {getOpenAIRealtimeModels().map((model) => (
                <option key={model} value={model}>
                  {model} {isMultiModalModel('openai', model) ? '📷' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="my-4">
            <div className="my-2 text-sm whitespace-pre-wrap">
              {t('UpdateRealtimeAPISettingsInfo')}
            </div>
            <TextButton onClick={handleUpdate}>
              {t('UpdateRealtimeAPISettings')}
            </TextButton>
          </div>
        </>
      )}

      {audioMode && (
        <>
          <div className="my-4 font-bold">
            {t('RealtimeAPIModeContentType')}
          </div>
          <select
            className="px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
            value={audioModeInputType}
            onChange={(e) => {
              settingsStore.setState({
                audioModeInputType: e.target.value as AudioModeInputType,
              })
            }}
          >
            <option value="input_text">{t('InputText')}</option>
            <option value="input_audio">{t('InputAudio')}</option>
          </select>

          <div className="my-4 font-bold">{t('RealtimeAPIModeVoice')}</div>
          <select
            className="px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
            value={audioModeVoice}
            onChange={(e) => {
              settingsStore.setState({
                audioModeVoice: e.target.value as OpenAITTSVoice,
              })
            }}
          >
            <option value="alloy">alloy</option>
            <option value="echo">echo</option>
            <option value="fable">fable</option>
            <option value="onyx">onyx</option>
            <option value="nova">nova</option>
            <option value="shimmer">shimmer</option>
          </select>

          <div className="my-6">
            <div className="my-4 font-bold">{t('SelectModel')}</div>
            <select
              className="px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
              value={selectAIModel}
              onChange={(e) => handleModelChange(e.target.value)}
            >
              {getOpenAIAudioModels().map((model) => (
                <option key={model} value={model}>
                  {model} {isMultiModalModel('openai', model) ? '📷' : ''}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {!realtimeAPIMode && !audioMode && (
        <>
          <ModelSelector
            aiService="openai"
            selectedModel={selectAIModel}
            customModel={customModel}
            enableMultiModal={enableMultiModal}
            onModelChange={handleModelChange}
            onCustomModelToggle={handleCustomModelToggle}
            onMultiModalToggle={handleMultiModalToggle}
            showMultiModalToggle={true}
          />
        </>
      )}
    </>
  )
}
