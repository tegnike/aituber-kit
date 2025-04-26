import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'
import homeStore from '@/features/stores/home'
import { useAudioProcessing } from './useAudioProcessing'
import { SpeakQueue } from '@/features/messages/speakQueue'

/**
 * Whisper APIを使用した音声認識のカスタムフック
 */
export const useWhisperRecognition = (
  onChatProcessStart: (text: string) => void
) => {
  const { t } = useTranslation()
  const selectLanguage = settingsStore((s) => s.selectLanguage)

  // ----- 状態管理 -----
  const [userMessage, setUserMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const isListeningRef = useRef(false)
  const transcriptRef = useRef('')

  // ----- オーディオ処理フックを使用 -----
  const { startRecording, stopRecording } = useAudioProcessing()

  // ----- Whisper APIに音声データを送信して文字起こし -----
  const processWhisperRecognition = async (
    audioBlob: Blob
  ): Promise<string> => {
    setIsProcessing(true)

    try {
      // 適切なフォーマットを確保するために新しいBlobを作成
      // OpenAI Whisper APIは特定の形式のみをサポート
      const formData = new FormData()

      // ファイル名とMIMEタイプを決定
      let fileExtension = 'webm'
      let mimeType = audioBlob.type

      // MIMEタイプに基づいて拡張子を設定
      if (mimeType.includes('mp3')) {
        fileExtension = 'mp3'
      } else if (mimeType.includes('ogg')) {
        fileExtension = 'ogg'
      } else if (mimeType.includes('wav')) {
        fileExtension = 'wav'
      } else if (mimeType.includes('mp4')) {
        fileExtension = 'mp4'
      }

      // ファイル名を生成
      const fileName = `audio.${fileExtension}`

      // FormDataにファイルを追加
      formData.append('file', audioBlob, fileName)

      // 言語設定の追加
      if (selectLanguage) {
        formData.append('language', selectLanguage)
      }

      // OpenAI APIキーを追加
      const openaiKey = settingsStore.getState().openaiKey
      if (openaiKey) {
        formData.append('openaiKey', openaiKey)
      }

      // Whisperモデルを追加
      const whisperModel = settingsStore.getState().whisperTranscriptionModel
      formData.append('model', whisperModel)

      console.log(
        `Sending audio to Whisper API - size: ${audioBlob.size} bytes, type: ${mimeType}, filename: ${fileName}, model: ${whisperModel}`
      )

      // APIリクエストを送信
      const response = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Whisper API error: ${response.status} - ${errorData.details || errorData.error || 'Unknown error'}`
        )
      }

      const result = await response.json()
      return result.text || ''
    } catch (error) {
      console.error('Whisper transcription error:', error)
      toastStore.getState().addToast({
        message: t('Toasts.WhisperError'),
        type: 'error',
        tag: 'whisper-error',
      })
      return ''
    } finally {
      setIsProcessing(false)
    }
  }

  // ----- 音声認識停止処理 -----
  const stopListening = useCallback(async () => {
    // リスニング状態を更新
    isListeningRef.current = false
    setIsListening(false)

    // 録音を停止して音声データを取得
    const audioBlob = await stopRecording()

    // 音声データが存在する場合のみ処理
    if (audioBlob) {
      try {
        console.log(
          `Processing audio blob for Whisper - size: ${audioBlob.size} bytes, type: ${audioBlob.type}`
        )

        // Whisper APIに送信
        const transcript = await processWhisperRecognition(audioBlob)

        if (transcript.trim()) {
          console.log('Whisper transcription result:', transcript)

          // 文字起こし結果をセット
          transcriptRef.current = transcript

          // LLMに送信
          onChatProcessStart(transcript)
        } else {
          console.log('Whisper returned empty transcription')
          toastStore.getState().addToast({
            message: t('Toasts.NoSpeechDetected'),
            type: 'info',
            tag: 'no-speech-detected',
          })
        }
      } catch (error) {
        console.error('Error processing Whisper audio:', error)
        toastStore.getState().addToast({
          message: t('Toasts.WhisperError'),
          type: 'error',
          tag: 'whisper-error',
        })
      }
    } else {
      console.warn('No audio data recorded')
      toastStore.getState().addToast({
        message: t('Toasts.NoSpeechDetected'),
        type: 'info',
        tag: 'no-speech-detected',
      })
    }
  }, [stopRecording, processWhisperRecognition, onChatProcessStart, t])

  // ----- 音声認識開始処理 -----
  const startListening = useCallback(async () => {
    // トランスクリプトをリセット
    transcriptRef.current = ''
    setUserMessage('')

    // オーディオ録音開始
    const success = await startRecording()

    if (success) {
      // リスニング状態を更新
      isListeningRef.current = true
      setIsListening(true)
    } else {
      toastStore.getState().addToast({
        message: t('Toasts.SpeechRecognitionError'),
        type: 'error',
        tag: 'speech-recognition-error',
      })
    }
  }, [startRecording, t])

  // ----- 音声認識トグル処理 -----
  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening()
    } else {
      // AIの発話を停止
      homeStore.setState({ isSpeaking: false })
      SpeakQueue.stopAll()
      startListening()
    }
  }, [startListening, stopListening])

  // ----- メッセージ送信 -----
  const handleSendMessage = useCallback(() => {
    if (userMessage.trim()) {
      // AIの発話を停止
      homeStore.setState({ isSpeaking: false })
      SpeakQueue.stopAll()
      onChatProcessStart(userMessage)
      setUserMessage('')
    }
  }, [userMessage, onChatProcessStart])

  // ----- メッセージ入力 -----
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setUserMessage(e.target.value)
    },
    []
  )

  return {
    userMessage,
    isListening,
    isProcessing,
    silenceTimeoutRemaining: null, // Whisperモードでは使用しない
    handleInputChange,
    handleSendMessage,
    toggleListening,
    startListening,
    stopListening,
  }
}
