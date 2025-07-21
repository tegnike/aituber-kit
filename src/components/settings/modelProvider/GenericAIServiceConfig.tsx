import { useCallback } from 'react'
import settingsStore from '@/features/stores/settings'
import { ApiKeyInput } from './ApiKeyInput'
import { ModelSelector } from './ModelSelector'
import { AIService } from '@/features/constants/settings'

interface GenericAIServiceConfigProps {
  service: AIService
  apiKey: string
  selectAIModel: string
  customModel: boolean
  enableMultiModal: boolean
  updateMultiModalModeForModel: (service: AIService, model: string) => void
  config: {
    keyLabel?: string
    keyPlaceholder?: string
    linkUrl?: string
    linkLabel?: string
    description?: string
    showMultiModalToggle?: boolean
    customModelValidation?: boolean
  }
}

export const GenericAIServiceConfig = ({
  service,
  apiKey,
  selectAIModel,
  customModel,
  enableMultiModal,
  updateMultiModalModeForModel,
  config,
}: GenericAIServiceConfigProps) => {
  const handleModelChange = useCallback(
    (model: string) => {
      settingsStore.setState({ selectAIModel: model })
      updateMultiModalModeForModel(service, model)
    },
    [service, updateMultiModalModeForModel]
  )

  const handleCustomModelToggle = useCallback(() => {
    settingsStore.setState({ customModel: !customModel })
  }, [customModel])

  const handleMultiModalToggle = useCallback(() => {
    settingsStore.setState({ enableMultiModal: !enableMultiModal })
  }, [enableMultiModal])

  const handleApiKeyChange = useCallback(
    (value: string) => {
      const keyMap: Record<string, string> = {
        anthropic: 'anthropicKey',
        google: 'googleKey',
        azure: 'azureKey',
        xai: 'xaiKey',
        groq: 'groqKey',
        cohere: 'cohereKey',
        mistralai: 'mistralaiKey',
        perplexity: 'perplexityKey',
        fireworks: 'fireworksKey',
        deepseek: 'deepseekKey',
        openrouter: 'openrouterKey',
      }

      const stateKey = keyMap[service]
      if (stateKey) {
        settingsStore.setState({ [stateKey]: value })
      }
    },
    [service]
  )

  return (
    <>
      {config.keyLabel && (
        <ApiKeyInput
          label={config.keyLabel}
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder={config.keyPlaceholder}
          linkUrl={config.linkUrl}
          linkLabel={config.linkLabel}
          description={config.description}
        />
      )}

      <ModelSelector
        aiService={service}
        selectedModel={selectAIModel}
        customModel={customModel}
        enableMultiModal={enableMultiModal}
        onModelChange={handleModelChange}
        onCustomModelToggle={handleCustomModelToggle}
        onMultiModalToggle={handleMultiModalToggle}
        showMultiModalToggle={config.showMultiModalToggle}
        customModelValidation={config.customModelValidation}
      />
    </>
  )
}
