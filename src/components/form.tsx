import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import slideStore from '@/features/stores/slide'
import {
  handleSendChatFn,
  handleReceiveTextFromWsFn,
} from '../features/chat/handlers'
import { MessageInputContainer } from './messageInputContainer'
import useWebSocket from './useWebSocket'
import useYoutube from './useYoutube'
import { SlideText } from './slideText'

export const Form = () => {
  const modalImage = homeStore((s) => s.modalImage)
  const webcamStatus = homeStore((s) => s.webcamStatus)
  const captureStatus = homeStore((s) => s.captureStatus)
  const slideMode = settingsStore((s) => s.slideMode)
  const slideVisible = menuStore((s) => s.slideVisible)
  const slidePlaying = slideStore((s) => s.isPlaying)
  const chatProcessingCount = homeStore((s) => s.chatProcessingCount)

  const [delayedText, setDelayedText] = useState('')

  const { t } = useTranslation()
  const handleSendChat = handleSendChatFn({
    NotConnectedToExternalAssistant: t('NotConnectedToExternalAssistant'),
    APIKeyNotEntered: t('APIKeyNotEntered'),
  })
  const handleReceiveTextFromWs = handleReceiveTextFromWsFn()

  useYoutube({ handleSendChat })
  useWebSocket({ handleReceiveTextFromWs })

  useEffect(() => {
    // テキストと画像がそろったら、チャットを送信
    if (delayedText && modalImage) {
      handleSendChat(delayedText)
      setDelayedText('')
    }
  }, [modalImage, delayedText, handleSendChat])

  const hookSendChat = useCallback(
    (text: string) => {
      homeStore.setState({ triggerShutter: true })

      // MENUの中でshowCameraがtrueの場合、画像が取得されるまで待機
      if (webcamStatus || captureStatus) {
        // Webcamが開いている場合
        setDelayedText(text) // 画像が取得されるまで遅延させる
      } else {
        handleSendChat(text)
      }
    },
    [handleSendChat, webcamStatus, captureStatus, setDelayedText]
  )

  useEffect(() => {
    console.log('chatProcessingCount:', chatProcessingCount)
  }, [chatProcessingCount])

  return slideMode &&
    slideVisible &&
    (slidePlaying || chatProcessingCount !== 0) ? (
    <SlideText />
  ) : (
    <MessageInputContainer onChatProcessStart={hookSendChat} />
  )
}
