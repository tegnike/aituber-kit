import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import { handleSendChatFn } from './handlers'
import { MessageInputContainer } from './messageInputContainer'
import useWebSocket from './useWebSocket'
import useYoutube from './useYoutube'

export const Form = () => {
  const modalImage = homeStore((s) => s.modalImage)
  const webcamStatus = homeStore((s) => s.webcamStatus)

  const [delayedText, setDelayedText] = useState('')

  const { t } = useTranslation()
  const handleSendChat = handleSendChatFn({
    NotConnectedToExternalAssistant: t('NotConnectedToExternalAssistant'),
    APIKeyNotEntered: t('APIKeyNotEntered'),
  })

  useYoutube({ handleSendChat })
  useWebSocket({ handleSendChat })

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
      if (webcamStatus) {
        // Webcamが開いている場合
        setDelayedText(text) // 画像が取得されるまで遅延させる
      } else {
        handleSendChat(text)
      }
    },
    [handleSendChat, webcamStatus, setDelayedText]
  )

  return <MessageInputContainer onChatProcessStart={hookSendChat} />
}
