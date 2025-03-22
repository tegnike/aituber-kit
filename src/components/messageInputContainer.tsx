import { useEffect } from 'react'
import { MessageInput } from '@/components/messageInput'
import homeStore from '@/features/stores/home'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'

// 無音検出用の状態と変数を追加
type Props = {
  onChatProcessStart: (text: string) => void
}

export const MessageInputContainer = ({ onChatProcessStart }: Props) => {
  const isSpeaking = homeStore((s) => s.isSpeaking)

  // 音声認識フックを使用
  const {
    userMessage,
    isListening,
    silenceTimeoutRemaining,
    handleInputChange,
    handleSendMessage,
    toggleListening,
    handleStopSpeaking,
    startListening,
    stopListening,
  } = useVoiceRecognition({ onChatProcessStart })

  // キーボードショートカットのイベントリスナーを設定
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Alt' && !isListening) {
        handleStopSpeaking()
        await startListening()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        stopListening()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [startListening, stopListening, handleStopSpeaking, isListening])

  return (
    <MessageInput
      userMessage={userMessage}
      isMicRecording={isListening}
      onChangeUserMessage={handleInputChange}
      onClickMicButton={toggleListening}
      onClickSendButton={handleSendMessage}
      onClickStopButton={handleStopSpeaking}
      isSpeaking={isSpeaking}
      silenceTimeoutRemaining={silenceTimeoutRemaining}
    />
  )
}
