import { useCallback, useEffect, useState } from 'react'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import { handleSendChatFn } from '../features/chat/handlers'
import { MessageInputContainer } from './messageInputContainer'
import { PresetQuestionButtons } from './presetQuestionButtons'
import { SlideText } from './slideText'
import { isMultiModalAvailable } from '@/features/constants/aiModels'
import { AIService } from '@/features/constants/settings'

export const Form = () => {
  const modalImage = homeStore((s) => s.modalImage)
  const webcamStatus = homeStore((s) => s.webcamStatus)
  const captureStatus = homeStore((s) => s.captureStatus)
  const slideMode = settingsStore((s) => s.slideMode)
  const slideVisible = menuStore((s) => s.slideVisible)
  const chatProcessingCount = homeStore((s) => s.chatProcessingCount)
  const isSpeaking = homeStore((s) => s.isSpeaking)
  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectAIModel = settingsStore((s) => s.selectAIModel)
  const enableMultiModal = settingsStore((s) => s.enableMultiModal)
  const customModel = settingsStore((s) => s.customModel)
  const gameCommentaryEnabled = settingsStore((s) => s.gameCommentaryEnabled)
  const gameCommentaryPlaying = settingsStore((s) => s.gameCommentaryPlaying)
  const showMessageInput = settingsStore((s) => s.showMessageInput)
  const [delayedText, setDelayedText] = useState('')
  const handleSendChat = handleSendChatFn()

  useEffect(() => {
    // テキストと画像がそろったら、チャットを送信
    if (!delayedText || !modalImage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      handleSendChat(delayedText)
      setDelayedText('')
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [modalImage, delayedText, handleSendChat])

  const hookSendChat = useCallback(
    (text: string) => {
      // マルチモーダル機能が使用可能かチェック
      const isMultiModalSupported = isMultiModalAvailable(
        selectAIService as AIService,
        selectAIModel,
        enableMultiModal,
        customModel
      )

      // マルチモーダル対応かつカメラ/キャプチャが有効なら画像を取得
      const isGameCommentaryRunning =
        gameCommentaryEnabled && gameCommentaryPlaying
      const shouldCaptureImage =
        isMultiModalSupported &&
        (webcamStatus || (captureStatus && !isGameCommentaryRunning))

      // 画像キャプチャが必要な場合
      if (shouldCaptureImage) {
        // すでにmodalImageが存在する場合は、Webcamのキャプチャーをスキップ
        homeStore.setState((state) => {
          if (!state.modalImage) {
            return { ...state, triggerShutter: true }
          }
          return state
        })
        // 画像が取得されるまで遅延させる
        setDelayedText(text)
      } else {
        // 画像キャプチャが不要な場合は直接送信
        handleSendChat(text)
      }
    },
    [
      handleSendChat,
      webcamStatus,
      captureStatus,
      setDelayedText,
      selectAIService,
      selectAIModel,
      enableMultiModal,
      customModel,
      gameCommentaryEnabled,
      gameCommentaryPlaying,
    ]
  )

  return slideMode &&
    slideVisible &&
    isSpeaking &&
    chatProcessingCount !== 0 ? (
    <SlideText />
  ) : (
    <>
      <PresetQuestionButtons onSelectQuestion={hookSendChat} />
      {showMessageInput && (
        <MessageInputContainer onChatProcessStart={hookSendChat} />
      )}
    </>
  )
}
