import { useCallback } from 'react'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import {
  isMultiModalModel,
  googleSearchGroundingModels,
  defaultModels,
} from '@/features/constants/aiModels'
import { AIService } from '@/features/constants/settings'

export const useAIServiceHandlers = () => {
  const updateMultiModalModeForModel = useCallback(
    (service: AIService, model: string) => {
      const currentState = settingsStore.getState()

      // カスタムモデルの場合は、ユーザーの設定を尊重してマルチモーダルモードを変更しない
      if (currentState.customModel) {
        return
      }

      if (!isMultiModalModel(service, model)) {
        settingsStore.setState({
          multiModalMode: 'never',
        })
      } else if (currentState.multiModalMode === 'never') {
        settingsStore.setState({
          multiModalMode: 'ai-decide',
        })
      }
    },
    []
  )

  const handleAIServiceChange = useCallback((newService: AIService) => {
    const selectedModel = defaultModels[newService]
    const currentState = settingsStore.getState()

    settingsStore.setState({
      selectAIService: newService,
      selectAIModel: selectedModel,
      multiModalMode:
        newService === 'custom-api' &&
        currentState.multiModalMode === 'ai-decide'
          ? 'always'
          : currentState.multiModalMode,
    })

    if (!isMultiModalModel(newService, selectedModel)) {
      menuStore.setState({ showWebcam: false })

      settingsStore.setState({
        conversationContinuityMode: false,
        slideMode: false,
        multiModalMode: 'never',
      })
      slideStore.setState({
        isPlaying: false,
      })
    }

    if (newService !== 'openai' && newService !== 'azure') {
      settingsStore.setState({
        realtimeAPIMode: false,
        audioMode: false,
      })
    }

    if (newService === 'google') {
      if (!googleSearchGroundingModels.includes(selectedModel as any)) {
        settingsStore.setState({ useSearchGrounding: false })
      }
    }
  }, [])

  return {
    updateMultiModalModeForModel,
    handleAIServiceChange,
  }
}
