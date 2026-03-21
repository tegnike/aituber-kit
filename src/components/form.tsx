import { useCallback, useEffect, useState } from 'react'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import slideStore from '@/features/stores/slide'
import { handleSendChatFn } from '../features/chat/handlers'
import { MessageInputContainer } from './messageInputContainer'
import { PresetQuestionButtons } from './presetQuestionButtons'
import { SlideText } from './slideText'
import { isMultiModalAvailable } from '@/features/constants/aiModels'
import { AIService } from '@/features/constants/settings'
import { useIsMobileLayout } from '@/hooks/useIsMobileLayout'

export const Form = () => {
  const isMobileLayout = useIsMobileLayout()
  const modalImage = homeStore((s) => s.modalImage)
  const webcamStatus = homeStore((s) => s.webcamStatus)
  const captureStatus = homeStore((s) => s.captureStatus)
  const slideMode = settingsStore((s) => s.slideMode)
  const slideVisible = menuStore((s) => s.slideVisible)
  const slidePlaying = slideStore((s) => s.isPlaying)
  const chatProcessingCount = homeStore((s) => s.chatProcessingCount)
  const multiModalMode = settingsStore((s) => s.multiModalMode)
  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectAIModel = settingsStore((s) => s.selectAIModel)
  const enableMultiModal = settingsStore((s) => s.enableMultiModal)
  const customModel = settingsStore((s) => s.customModel)
  const [delayedText, setDelayedText] = useState('')
  const handleSendChat = handleSendChatFn()

  useEffect(() => {
    // 繝・く繧ｹ繝医→逕ｻ蜒上′縺昴ｍ縺｣縺溘ｉ縲√メ繝｣繝・ヨ繧帝∽ｿ｡
    if (delayedText && modalImage) {
      handleSendChat(delayedText)
      setDelayedText('')
    }

    // 繧ｳ繝ｳ繝昴・繝阪Φ繝医′繧｢繝ｳ繝槭え繝ｳ繝医＆繧後ｋ髫帙↓pending謫堺ｽ懊ｒ繧ｯ繝ｪ繝ｼ繝ｳ繧｢繝・・
    return () => {
      if (delayedText) {
        setDelayedText('')
      }
    }
  }, [modalImage, delayedText, handleSendChat])

  const hookSendChat = useCallback(
    (text: string) => {
      // 繝槭Ν繝√Δ繝ｼ繝繝ｫ讖溯・縺御ｽｿ逕ｨ蜿ｯ閭ｽ縺九メ繧ｧ繝・け
      const isMultiModalSupported = isMultiModalAvailable(
        selectAIService as AIService,
        selectAIModel,
        enableMultiModal,
        multiModalMode,
        customModel
      )

      // 繝｢繝ｼ繝峨↓蝓ｺ縺･縺・※逕ｻ蜒上く繝｣繝励メ繝｣縺ｮ蠢・ｦ∵ｧ繧貞愛螳・
      let shouldCaptureImage = false

      if (isMultiModalSupported && (webcamStatus || captureStatus)) {
        switch (multiModalMode) {
          case 'always':
            shouldCaptureImage = true
            break
          case 'never':
            shouldCaptureImage = false
            break
          case 'ai-decide':
            // AI蛻､譁ｭ繝｢繝ｼ繝峨・蝣ｴ蜷医√→繧翫≠縺医★逕ｻ蜒上ｒ繧ｭ繝｣繝励メ繝｣縺励※縲∝ｾ後〒AI縺ｫ蛻､譁ｭ縺輔○繧・
            shouldCaptureImage = true
            break
        }
      }

      // 逕ｻ蜒上く繝｣繝励メ繝｣縺悟ｿ・ｦ√↑蝣ｴ蜷・
      if (shouldCaptureImage) {
        // 縺吶〒縺ｫmodalImage縺悟ｭ伜惠縺吶ｋ蝣ｴ蜷医・縲仝ebcam縺ｮ繧ｭ繝｣繝励メ繝｣繝ｼ繧偵せ繧ｭ繝・・
        homeStore.setState((state) => {
          if (!state.modalImage) {
            return { ...state, triggerShutter: true }
          }
          return state
        })
        // 逕ｻ蜒上′蜿門ｾ励＆繧後ｋ縺ｾ縺ｧ驕・ｻｶ縺輔○繧・
        setDelayedText(text)
      } else {
        // 逕ｻ蜒上く繝｣繝励メ繝｣縺御ｸ崎ｦ√↑蝣ｴ蜷医・逶ｴ謗･騾∽ｿ｡
        handleSendChat(text)
      }
    },
    [
      handleSendChat,
      webcamStatus,
      captureStatus,
      setDelayedText,
      multiModalMode,
      selectAIService,
      selectAIModel,
      enableMultiModal,
      customModel,
    ]
  )

  return slideMode &&
    slideVisible &&
    slidePlaying &&
    chatProcessingCount !== 0 ? (
    <SlideText />
  ) : (
    <>
      {!isMobileLayout && (
        <PresetQuestionButtons onSelectQuestion={hookSendChat} />
      )}
      <MessageInputContainer onChatProcessStart={hookSendChat} />
    </>
  )
}
