import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import settingsStore from '@/features/stores/settings'
import webSocketStore from '@/features/stores/websocketStore'
import toastStore from '@/features/stores/toast'
import { TextButton } from '../../textButton'
import { ApiKeyInput } from './ApiKeyInput'
import { MultiModalToggle } from './MultiModalToggle'
import { defaultModels } from '@/features/constants/aiModels'
import {
  RealtimeAPIModeContentType,
  RealtimeAPIModeVoice,
  RealtimeAPIModeAzureVoice,
} from '@/features/constants/settings'

interface AzureConfigProps {
  azureKey: string
  azureEndpoint: string
  realtimeAPIMode: boolean
  realtimeAPIModeContentType: RealtimeAPIModeContentType
  realtimeAPIModeVoice: RealtimeAPIModeVoice | RealtimeAPIModeAzureVoice
  enableMultiModal: boolean
}

export const AzureConfig = ({
  azureKey,
  azureEndpoint,
  realtimeAPIMode,
  realtimeAPIModeContentType,
  realtimeAPIModeVoice,
  enableMultiModal,
}: AzureConfigProps) => {
  const { t } = useTranslation()

  const handleRealtimeAPIModeChange = useCallback((newMode: boolean) => {
    settingsStore.setState({
      realtimeAPIMode: newMode,
    })
    if (newMode) {
      settingsStore.setState({
        audioMode: false,
        speechRecognitionMode: 'browser',
        selectAIModel: defaultModels.openaiRealtime,
        initialSpeechTimeout: 0,
        noSpeechTimeout: 0,
        showSilenceProgressBar: false,
        continuousMicListeningMode: false,
      })
    }
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

  const handleMultiModalToggle = useCallback(() => {
    settingsStore.setState({ enableMultiModal: !enableMultiModal })
  }, [enableMultiModal])

  return (
    <>
      <ApiKeyInput
        label={t('AzureAPIKeyLabel')}
        value={azureKey}
        onChange={(value) => settingsStore.setState({ azureKey: value })}
        linkUrl="https://portal.azure.com/#view/Microsoft_Azure_AI/AzureOpenAI/keys"
        linkLabel="Azure OpenAI"
      />

      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('AzureEndpoint')}</div>
        <div className="my-4">
          Chat API ex.
          https://RESOURCE_NAME.openai.azure.com/openai/deployments/
          DEPLOYMENT_NAME/chat/completions?api-version=API_VERSION
          <br />
          Realtime API ex. wss://RESOURCE_NAME.openai.azure.com/openai/realtime?
          api-version=API_VERSION&deployment=DEPLOYMENT_NAME
        </div>
        <input
          className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
          type="text"
          placeholder="..."
          value={azureEndpoint}
          onChange={(e) =>
            settingsStore.setState({ azureEndpoint: e.target.value })
          }
        />
      </div>

      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('RealtimeAPIMode')}</div>
        <div className="my-2">
          <TextButton
            onClick={() => handleRealtimeAPIModeChange(!realtimeAPIMode)}
          >
            {realtimeAPIMode ? t('StatusOn') : t('StatusOff')}
          </TextButton>
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
                  realtimeAPIModeVoice: e.target
                    .value as RealtimeAPIModeAzureVoice,
                })
              }}
            >
              <option value="alloy">alloy</option>
              <option value="amuch">amuch</option>
              <option value="breeze">breeze</option>
              <option value="cove">cove</option>
              <option value="dan">dan</option>
              <option value="echo">echo</option>
              <option value="elan">elan</option>
              <option value="ember">ember</option>
              <option value="jupiter">jupiter</option>
              <option value="marilyn">marilyn</option>
              <option value="shimmer">shimmer</option>
            </select>

            <div className="my-4">
              <div className="my-4">{t('UpdateRealtimeAPISettingsInfo')}</div>
              <TextButton onClick={handleUpdate}>
                {t('UpdateRealtimeAPISettings')}
              </TextButton>
            </div>
          </>
        )}
      </div>

      <MultiModalToggle
        enabled={enableMultiModal}
        onToggle={handleMultiModalToggle}
      />
    </>
  )
}
