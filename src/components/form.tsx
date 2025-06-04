import { useCallback, useEffect, useState } from 'react'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import slideStore from '@/features/stores/slide'
import { handleSendChatFn } from '../features/chat/handlers'
import { MessageInputContainer } from './messageInputContainer'
import { PresetQuestionButtons } from './presetQuestionButtons'
import { SlideText } from './slideText'
import { isMultiModalModel } from '@/features/constants/aiModels'
import { AIService } from '@/features/constants/settings'

export const Form = () => {
  const modalImage = homeStore((s) => s.modalImage)
  const webcamStatus = homeStore((s) => s.webcamStatus)
  const captureStatus = homeStore((s) => s.captureStatus)
  const slideMode = settingsStore((s) => s.slideMode)
  const slideVisible = menuStore((s) => s.slideVisible)
  const slidePlaying = slideStore((s) => s.isPlaying)
  const chatProcessingCount = homeStore((s) => s.chatProcessingCount)
  const autoSendImagesInMultiModal = settingsStore((s) => s.autoSendImagesInMultiModal)
  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectAIModel = settingsStore((s) => s.selectAIModel)
  const [delayedText, setDelayedText] = useState('')
  const handleSendChat = handleSendChatFn()

  useEffect(() => {
    // テキストと画像がそろったら、チャットを送信
    if (delayedText && modalImage) {
      handleSendChat(delayedText)
      setDelayedText('')
    }
  }, [modalImage, delayedText, handleSendChat])

  const hookSendChat = useCallback(
    (text: string) => {
      // 画像を自動送信するかどうかの判定
      const shouldAutoSendImages = autoSendImagesInMultiModal && 
        isMultiModalModel(selectAIService as AIService, selectAIModel)
      
      // 自動送信が有効で、カメラ/画面共有がアクティブな場合のみ画像キャプチャ
      if (shouldAutoSendImages && (webcamStatus || captureStatus)) {
        // すでにmodalImageが存在する場合は、Webcamのキャプチャーをスキップ
        if (!homeStore.getState().modalImage) {
          homeStore.setState({ triggerShutter: true })
        }
        // 画像が取得されるまで遅延させる
        setDelayedText(text)
      } else {
        // 自動送信が無効、またはカメラ/画面共有が無効な場合は直接送信
        handleSendChat(text)
      }
    },
    [handleSendChat, webcamStatus, captureStatus, setDelayedText, autoSendImagesInMultiModal, selectAIService, selectAIModel]
  )

  return slideMode &&
    slideVisible &&
    slidePlaying &&
    chatProcessingCount !== 0 ? (
    <SlideText />
  ) : (
    <>
      <PresetQuestionButtons onSelectQuestion={hookSendChat} />
      <MessageInputContainer onChatProcessStart={hookSendChat} />
    </>
  )
}
