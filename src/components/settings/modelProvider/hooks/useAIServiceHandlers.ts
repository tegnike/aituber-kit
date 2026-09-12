import { useCallback } from 'react'
import settingsStore from '@/features/stores/settings'
import { isMultiModalModel, defaultModels } from '@/features/constants/aiModels'
import { AIService } from '@/features/constants/settings'

const multiModalToggleOnlyServices = new Set<AIService>([
  'azure',
  'openrouter',
  'orcarouter',
  'lmstudio',
  'ollama',
  'custom-api',
])

export const useAIServiceHandlers = () => {
  const updateMultiModalModeForModel = useCallback(
    (service: AIService, model: string) => {
      const currentState = settingsStore.getState()

      // カスタムモデルの場合は、ユーザーの設定を尊重してマルチモーダルモードを変更しない
      if (currentState.customModel) {
        return
      }

      if (multiModalToggleOnlyServices.has(service)) {
        return
      }

      if (!isMultiModalModel(service, model)) {
        settingsStore.setState({
          enableMultiModal: false,
        })
      } else if (!currentState.enableMultiModal) {
        settingsStore.setState({
          enableMultiModal: true,
        })
      }
    },
    []
  )

  const handleAIServiceChange = useCallback((newService: AIService) => {
    const selectedModel = defaultModels[newService]
    const currentState = settingsStore.getState()

    // 排他ルールはミドルウェアが自動適用する
    settingsStore.setState({
      selectAIService: newService,
      selectAIModel: selectedModel,
      enableMultiModal: currentState.enableMultiModal,
    })
  }, [])

  return {
    updateMultiModalModeForModel,
    handleAIServiceChange,
  }
}
