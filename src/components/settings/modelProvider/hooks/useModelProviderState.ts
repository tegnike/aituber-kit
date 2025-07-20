import { useMemo } from 'react'
import settingsStore from '@/features/stores/settings'
import { isMultiModalModelWithToggle } from '@/features/constants/aiModels'

export const useModelProviderState = () => {
  const externalLinkageMode = settingsStore((s) => s.externalLinkageMode)
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const realtimeAPIModeContentType = settingsStore(
    (s) => s.realtimeAPIModeContentType
  )
  const realtimeAPIModeVoice = settingsStore((s) => s.realtimeAPIModeVoice)
  const audioMode = settingsStore((s) => s.audioMode)
  const audioModeInputType = settingsStore((s) => s.audioModeInputType)
  const audioModeVoice = settingsStore((s) => s.audioModeVoice)
  const openaiKey = settingsStore((s) => s.openaiKey)
  const anthropicKey = settingsStore((s) => s.anthropicKey)
  const googleKey = settingsStore((s) => s.googleKey)
  const azureKey = settingsStore((s) => s.azureKey)
  const azureEndpoint = settingsStore((s) => s.azureEndpoint)
  const xaiKey = settingsStore((s) => s.xaiKey)
  const groqKey = settingsStore((s) => s.groqKey)
  const cohereKey = settingsStore((s) => s.cohereKey)
  const mistralaiKey = settingsStore((s) => s.mistralaiKey)
  const perplexityKey = settingsStore((s) => s.perplexityKey)
  const fireworksKey = settingsStore((s) => s.fireworksKey)
  const difyKey = settingsStore((s) => s.difyKey)
  const useSearchGrounding = settingsStore((s) => s.useSearchGrounding)
  const dynamicRetrievalThreshold = settingsStore(
    (s) => s.dynamicRetrievalThreshold
  )
  const deepseekKey = settingsStore((s) => s.deepseekKey)
  const openrouterKey = settingsStore((s) => s.openrouterKey)
  const maxPastMessages = settingsStore((s) => s.maxPastMessages)
  const temperature = settingsStore((s) => s.temperature)
  const maxTokens = settingsStore((s) => s.maxTokens)
  const multiModalMode = settingsStore((s) => s.multiModalMode)
  const multiModalAiDecisionPrompt = settingsStore(
    (s) => s.multiModalAiDecisionPrompt
  )
  const enableMultiModal = settingsStore((s) => s.enableMultiModal)
  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectAIModel = settingsStore((s) => s.selectAIModel)
  const localLlmUrl = settingsStore((s) => s.localLlmUrl)
  const imageDisplayPosition = settingsStore((s) => s.imageDisplayPosition)
  const customModel = settingsStore((s) => s.customModel)
  const difyUrl = settingsStore((s) => s.difyUrl)
  const customApiUrl = settingsStore((s) => s.customApiUrl)
  const customApiHeaders = settingsStore((s) => s.customApiHeaders)
  const customApiBody = settingsStore((s) => s.customApiBody)
  const customApiStream = settingsStore((s) => s.customApiStream)
  const includeSystemMessagesInCustomApi = settingsStore(
    (s) => s.includeSystemMessagesInCustomApi
  )
  const customApiIncludeMimeType = settingsStore(
    (s) => s.customApiIncludeMimeType
  )

  const isMultiModalSupported = useMemo(
    () =>
      isMultiModalModelWithToggle(
        selectAIService,
        selectAIModel,
        enableMultiModal,
        customModel
      ),
    [selectAIService, selectAIModel, enableMultiModal, customModel]
  )

  return {
    externalLinkageMode,
    realtimeAPIMode,
    realtimeAPIModeContentType,
    realtimeAPIModeVoice,
    audioMode,
    audioModeInputType,
    audioModeVoice,
    openaiKey,
    anthropicKey,
    googleKey,
    azureKey,
    azureEndpoint,
    xaiKey,
    groqKey,
    cohereKey,
    mistralaiKey,
    perplexityKey,
    fireworksKey,
    difyKey,
    useSearchGrounding,
    dynamicRetrievalThreshold,
    deepseekKey,
    openrouterKey,
    maxPastMessages,
    temperature,
    maxTokens,
    multiModalMode,
    multiModalAiDecisionPrompt,
    enableMultiModal,
    selectAIService,
    selectAIModel,
    localLlmUrl,
    imageDisplayPosition,
    customModel,
    difyUrl,
    customApiUrl,
    customApiHeaders,
    customApiBody,
    customApiStream,
    includeSystemMessagesInCustomApi,
    customApiIncludeMimeType,
    isMultiModalSupported,
  }
}
