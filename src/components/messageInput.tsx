import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import { IconButton } from './iconButton'

type Props = {
  userMessage: string
  isMicRecording: boolean
  onChangeUserMessage: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  onClickSendButton: (event: React.MouseEvent<HTMLButtonElement>) => void
  onClickMicButton: (event: React.MouseEvent<HTMLButtonElement>) => void
  onClickStopButton: (event: React.MouseEvent<HTMLButtonElement>) => void
  isSpeaking: boolean
  silenceTimeoutRemaining: number | null
  continuousMicListeningMode: boolean
  onToggleContinuousMode: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export const MessageInput = ({
  userMessage,
  isMicRecording,
  onChangeUserMessage,
  onClickMicButton,
  onClickSendButton,
  onClickStopButton,
  silenceTimeoutRemaining,
  continuousMicListeningMode,
}: Props) => {
  const chatProcessing = homeStore((s) => s.chatProcessing)
  const slidePlaying = slideStore((s) => s.isPlaying)
  const [rows, setRows] = useState(1)
  const [loadingDots, setLoadingDots] = useState('')
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const showSilenceProgressBar = settingsStore((s) => s.showSilenceProgressBar)
  const speechRecognitionMode = settingsStore((s) => s.speechRecognitionMode)

  const { t } = useTranslation()

  useEffect(() => {
    if (chatProcessing) {
      const interval = setInterval(() => {
        setLoadingDots((prev) => {
          if (prev === '...') return ''
          return prev + '.'
        })
      }, 200)

      return () => clearInterval(interval)
    } else {
      if (textareaRef.current) {
        textareaRef.current.value = ''
        const isTouchDevice = () => {
          if (typeof window === 'undefined') return false
          return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            // @ts-expect-error: msMaxTouchPoints is IE-specific
            navigator.msMaxTouchPoints > 0
          )
        }
        if (!isTouchDevice()) {
          textareaRef.current.focus()
        }
      }
    }
  }, [chatProcessing])

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      !event.nativeEvent.isComposing &&
      event.keyCode !== 229 && // IME (Input Method Editor)
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault() // デフォルトの挙動を防止
      if (userMessage.trim() !== '') {
        onClickSendButton(
          event as unknown as React.MouseEvent<HTMLButtonElement>
        )
        setRows(1)
      }
    } else if (event.key === 'Enter' && event.shiftKey) {
      setRows(rows + 1)
    } else if (
      event.key === 'Backspace' &&
      rows > 1 &&
      userMessage.slice(-1) === '\n'
    ) {
      setRows(rows - 1)
    }
  }

  const handleMicClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClickMicButton(event)
  }

  return (
    <div className="absolute bottom-0 z-20 w-screen">
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {t('MicrophonePermission')}
            </h3>
            <p className="mb-4">{t('MicrophonePermissionMessage')}</p>
            <button
              className="bg-secondary hover:bg-secondary-hover px-4 py-2 rounded-lg"
              onClick={() => setShowPermissionModal(false)}
            >
              {t('Close')}
            </button>
          </div>
        </div>
      )}
      <div className="bg-base-light text-black">
        <div className="mx-auto max-w-4xl p-4">
          {/* プログレスバー - 設定に基づいて表示/非表示 */}
          {isMicRecording && showSilenceProgressBar && (
            <div className="w-full h-2 bg-gray-200 rounded-full mb-2 overflow-hidden">
              <div
                className="h-full bg-secondary transition-all duration-200 ease-linear"
                style={{
                  // プログレスバーの幅計算 - 最初と最後の0.3秒は表示しない
                  width:
                    silenceTimeoutRemaining !== null
                      ? `${Math.min(
                          100,
                          Math.max(
                            0,
                            ((settingsStore.getState().noSpeechTimeout * 1000 -
                              silenceTimeoutRemaining -
                              300) /
                              (settingsStore.getState().noSpeechTimeout * 1000 -
                                600)) *
                              100
                          )
                        )}%`
                      : '0%',
                }}
              ></div>
            </div>
          )}
          <div className="grid grid-flow-col gap-[8px] grid-cols-[min-content_1fr_min-content]">
            <IconButton
              iconName="24/Microphone"
              backgroundColor={
                continuousMicListeningMode
                  ? 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white'
                  : undefined
              }
              isProcessing={isMicRecording}
              isProcessingIcon={'24/PauseAlt'}
              disabled={chatProcessing}
              onClick={handleMicClick}
            />
            <textarea
              ref={textareaRef}
              placeholder={
                chatProcessing
                  ? `${t('AnswerGenerating')}${loadingDots}`
                  : continuousMicListeningMode && isMicRecording
                    ? t('ListeningContinuously')
                    : t('EnterYourQuestion')
              }
              onChange={onChangeUserMessage}
              onKeyDown={handleKeyPress}
              disabled={chatProcessing || slidePlaying || realtimeAPIMode}
              className="bg-white hover:bg-white-hover focus:bg-white disabled:bg-gray-100 disabled:text-primary-disabled rounded-2xl w-full px-4 text-text-primary text-base font-bold disabled"
              value={userMessage}
              rows={rows}
              style={{ lineHeight: '1.5', padding: '8px 16px', resize: 'none' }}
            ></textarea>

            <IconButton
              iconName="24/Send"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
              isProcessing={chatProcessing}
              disabled={chatProcessing || !userMessage || realtimeAPIMode}
              onClick={onClickSendButton}
            />

            <IconButton
              iconName="stop"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
              onClick={onClickStopButton}
              isProcessing={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
