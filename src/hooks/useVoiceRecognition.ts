import { useState, useEffect, useCallback, useRef } from 'react'
import settingsStore from '@/features/stores/settings'
import webSocketStore from '@/features/stores/websocketStore'
import toastStore from '@/features/stores/toast'
import { useTranslation } from 'react-i18next'
import homeStore from '@/features/stores/home'
import { getVoiceLanguageCode } from '@/utils/voiceLanguage'
import { processAudio, base64EncodeAudio } from '@/utils/audioProcessing'
import { useSilenceDetection } from './useSilenceDetection'

// AudioContext の型定義を拡張
type AudioContextType = typeof AudioContext

// 音声認識開始後、音声が検出されないまま経過した場合のタイムアウト（5秒）
const INITIAL_SPEECH_TIMEOUT = 5000

type UseVoiceRecognitionProps = {
  onChatProcessStart: (text: string) => void
}

export const useVoiceRecognition = ({
  onChatProcessStart,
}: UseVoiceRecognitionProps) => {
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const [userMessage, setUserMessage] = useState('')
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const keyPressStartTime = useRef<number | null>(null)
  const transcriptRef = useRef('')
  const isKeyboardTriggered = useRef(false)
  const audioBufferRef = useRef<Float32Array | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const isListeningRef = useRef(false)
  const [isListening, setIsListening] = useState(false)
  // 音声認識開始時刻を保持する変数を追加
  const recognitionStartTimeRef = useRef<number>(0)
  // 音声が検出されたかどうかのフラグ
  const speechDetectedRef = useRef<boolean>(false)
  // 初期音声検出用のタイマー
  const initialSpeechCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  const selectLanguage = settingsStore((s) => s.selectLanguage)

  const { t } = useTranslation()

  const stopListeningRef = useRef<(() => Promise<void>) | null>(null)
  const sendAudioBufferRef = useRef<(() => void) | null>(null)

  // 無音検出フックを使用
  const {
    silenceTimeoutRemaining,
    clearSilenceDetection,
    startSilenceDetection,
    updateSpeechTimestamp,
    isSpeechEnded,
  } = useSilenceDetection({
    onTextDetected: onChatProcessStart,
    transcriptRef,
    setUserMessage,
    speechDetectedRef,
  })

  // 音声停止
  const handleStopSpeaking = useCallback(() => {
    homeStore.setState({ isSpeaking: false })
  }, [])

  // 初期音声検出タイマーをクリアする関数
  const clearInitialSpeechCheckTimer = useCallback(() => {
    if (initialSpeechCheckTimerRef.current) {
      clearTimeout(initialSpeechCheckTimerRef.current)
      initialSpeechCheckTimerRef.current = null
    }
  }, [])

  const checkMicrophonePermission = async (): Promise<boolean> => {
    // Firefoxの場合はエラーメッセージを表示して終了
    if (navigator.userAgent.toLowerCase().includes('firefox')) {
      toastStore.getState().addToast({
        message: t('Toasts.FirefoxNotSupported'),
        type: 'error',
        tag: 'microphone-permission-error-firefox',
      })
      return false
    }

    try {
      // getUserMediaを直接呼び出し、ブラウザのネイティブ許可モーダルを表示
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch (error) {
      // ユーザーが明示的に拒否した場合や、その他のエラーの場合
      console.error('Microphone permission error:', error)
      return false
    }
  }

  // stopListening関数の先行宣言（実際の実装は下部で行う）
  const stopListening = useCallback(async () => {
    if (stopListeningRef.current) {
      await stopListeningRef.current()
    }
  }, [])

  // sendAudioBuffer関数をここに移動
  const sendAudioBuffer = useCallback(() => {
    if (audioBufferRef.current && audioBufferRef.current.length > 0) {
      const base64Chunk = base64EncodeAudio(audioBufferRef.current)
      const ss = settingsStore.getState()
      const wsManager = webSocketStore.getState().wsManager
      if (wsManager?.websocket?.readyState === WebSocket.OPEN) {
        let sendContent: { type: string; text?: string; audio?: string }[] = []

        if (ss.realtimeAPIModeContentType === 'input_audio') {
          console.log('Sending buffer. Length:', audioBufferRef.current.length)
          sendContent = [
            {
              type: 'input_audio',
              audio: base64Chunk,
            },
          ]
        } else {
          const currentText = transcriptRef.current.trim()
          console.log('Sending text. userMessage:', currentText)
          if (currentText) {
            sendContent = [
              {
                type: 'input_text',
                text: currentText,
              },
            ]
          }
        }

        if (sendContent.length > 0) {
          wsManager.websocket.send(
            JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: sendContent,
              },
            })
          )
          wsManager.websocket.send(
            JSON.stringify({
              type: 'response.create',
            })
          )
        }
      }
      audioBufferRef.current = null // 送信後にバッファをクリア
    } else {
      console.error('音声バッファが空です')
    }
  }, [])

  // sendAudioBufferをRefに保存
  useEffect(() => {
    sendAudioBufferRef.current = sendAudioBuffer
  }, [sendAudioBuffer])

  // ここで最終的なstopListening実装を行う
  const stopListeningImpl = useCallback(async () => {
    // 無音検出をクリア
    clearSilenceDetection()

    // 初期音声検出タイマーをクリア
    clearInitialSpeechCheckTimer()

    isListeningRef.current = false
    setIsListening(false)
    if (recognition) {
      recognition.stop()

      if (realtimeAPIMode) {
        if (mediaRecorder) {
          mediaRecorder.stop()
          mediaRecorder.ondataavailable = null
          await new Promise<void>((resolve) => {
            mediaRecorder.onstop = async () => {
              console.log('stop MediaRecorder')
              if (audioChunksRef.current.length > 0) {
                const audioBlob = new Blob(audioChunksRef.current, {
                  type: 'audio/webm',
                })
                const arrayBuffer = await audioBlob.arrayBuffer()
                const audioBuffer =
                  await audioContext!.decodeAudioData(arrayBuffer)
                const processedData = processAudio(audioBuffer)

                audioBufferRef.current = processedData
                resolve()
              } else {
                console.error('音声チャンクが空です')
                resolve()
              }
            }
          })
        }
        // sendAudioBufferの代わりにsendAudioBufferRef.currentを使用
        if (sendAudioBufferRef.current) {
          sendAudioBufferRef.current()
        }
      }

      const trimmedTranscriptRef = transcriptRef.current.trim()
      if (isKeyboardTriggered.current) {
        const pressDuration = Date.now() - (keyPressStartTime.current || 0)
        // 押してから1秒以上 かつ 文字が存在する場合のみ送信
        // 無音検出による自動送信が既に行われていない場合のみ送信する
        if (pressDuration >= 1000 && trimmedTranscriptRef && !isSpeechEnded()) {
          onChatProcessStart(trimmedTranscriptRef)
          setUserMessage('')
        }
        isKeyboardTriggered.current = false
      }
    }
  }, [
    recognition,
    realtimeAPIMode,
    mediaRecorder,
    audioContext,
    onChatProcessStart,
    clearInitialSpeechCheckTimer,
    clearSilenceDetection,
    isSpeechEnded,
  ])

  // stopListeningの実装を上書き
  useEffect(() => {
    stopListeningRef.current = stopListeningImpl
  }, [stopListeningImpl])

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const newRecognition = new SpeechRecognition()
      newRecognition.lang = getVoiceLanguageCode(selectLanguage)
      newRecognition.continuous = true
      newRecognition.interimResults = true

      // 音声認識開始時のハンドラを追加
      newRecognition.onstart = () => {
        console.log('Speech recognition started')
        // 音声認識開始時刻を記録
        recognitionStartTimeRef.current = Date.now()
        // 音声検出フラグをリセット
        speechDetectedRef.current = false

        // 5秒後に音声が検出されているかチェックするタイマーを設定
        initialSpeechCheckTimerRef.current = setTimeout(() => {
          // 音声が検出されていない場合は音声認識を停止
          if (!speechDetectedRef.current && isListeningRef.current) {
            console.log(
              '⏱️ 5秒間音声が検出されませんでした。音声認識を停止します。'
            )
            stopListening()

            // 必要に応じてトースト通知を表示
            toastStore.getState().addToast({
              message: t('Toasts.NoSpeechDetected'),
              type: 'info',
              tag: 'no-speech-detected',
            })
          }
        }, INITIAL_SPEECH_TIMEOUT)

        // 無音検出を開始
        if (stopListeningRef.current) {
          startSilenceDetection(stopListeningRef.current)
        }
      }

      // 音声入力検出時のハンドラを追加
      newRecognition.onspeechstart = () => {
        console.log('🗣️ 音声入力を検出しました（onspeechstart）')
        // 音声検出フラグを立てる
        speechDetectedRef.current = true
        // 音声検出時刻を更新
        updateSpeechTimestamp()
      }

      // 音量レベルを追跡するための変数を追加
      let significantSpeechDetected = false
      let lastTranscriptLength = 0

      // 結果が返ってきた時のハンドラ（音声検出中）
      newRecognition.onresult = (event) => {
        if (!isListeningRef.current) return

        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('')

        // トランスクリプトが変化した場合のみ意味のある音声とみなす
        const isSignificantChange =
          transcript.trim().length > lastTranscriptLength
        lastTranscriptLength = transcript.trim().length

        // 実際に認識可能な音声が検出された場合のみタイムスタンプを更新
        if (isSignificantChange) {
          console.log('📢 有意な音声を検出しました（トランスクリプト変更あり）')
          significantSpeechDetected = true
          // 意味のある音声を検出したので、タイムスタンプを更新
          updateSpeechTimestamp()
          // 音声検出フラグを立てる
          speechDetectedRef.current = true
        } else {
          console.log(
            '🔇 バックグラウンドノイズを無視します（トランスクリプト変更なし）'
          )
        }

        transcriptRef.current = transcript
        setUserMessage(transcript)
      }

      // 音声入力終了時のハンドラ
      newRecognition.onspeechend = () => {
        console.log(
          '🛑 音声入力が終了しました（onspeechend）。無音検出タイマーが動作中です。'
        )
        // 音声入力が終わったが、無音検出はそのまま継続する
        // タイマーが自動的に処理する
      }

      // 音声認識終了時のハンドラ
      newRecognition.onend = () => {
        console.log('Recognition ended')
        // 無音検出をクリア
        clearSilenceDetection()
        // 初期音声検出タイマーをクリア
        clearInitialSpeechCheckTimer()
      }

      newRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        clearSilenceDetection()
        // 初期音声検出タイマーをクリア
        clearInitialSpeechCheckTimer()
        stopListening()
      }

      setRecognition(newRecognition)
    }
  }, [
    stopListening,
    clearInitialSpeechCheckTimer,
    selectLanguage,
    t,
    clearSilenceDetection,
    startSilenceDetection,
    updateSpeechTimestamp,
  ])

  useEffect(() => {
    const AudioContextClass = (window.AudioContext ||
      (window as any).webkitAudioContext) as AudioContextType
    const context = new AudioContextClass()
    setAudioContext(context)
  }, [])

  const startListening = useCallback(async () => {
    const hasPermission = await checkMicrophonePermission()
    if (!hasPermission) return

    if (recognition && !isListeningRef.current && audioContext) {
      transcriptRef.current = ''
      setUserMessage('')
      try {
        recognition.start()
      } catch (error) {
        console.error('Error starting recognition:', error)
      }
      isListeningRef.current = true
      setIsListening(true)

      if (realtimeAPIMode) {
        audioChunksRef.current = [] // 音声チャンクをリセット

        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
          setMediaRecorder(recorder)

          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              if (!isListeningRef.current) {
                recognition.stop()
                recorder.stop()
                recorder.ondataavailable = null
                return
              }
              audioChunksRef.current.push(event.data)
              console.log('add audio chunk:', audioChunksRef.current.length)
            }
          }

          recorder.start(100) // より小さな間隔でデータを収集
        })
      }
    }
  }, [recognition, audioContext, realtimeAPIMode])

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening()
    } else {
      keyPressStartTime.current = Date.now()
      isKeyboardTriggered.current = true
      startListening()
      handleStopSpeaking()
    }
  }, [startListening, stopListening, handleStopSpeaking])

  // メッセージ送信
  const handleSendMessage = useCallback(() => {
    if (userMessage.trim()) {
      handleStopSpeaking()
      onChatProcessStart(userMessage)
      setUserMessage('')
    }
  }, [userMessage, onChatProcessStart, handleStopSpeaking])

  // メッセージ入力
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setUserMessage(e.target.value)
    },
    []
  )

  return {
    userMessage,
    isListening,
    silenceTimeoutRemaining,
    handleInputChange,
    handleSendMessage,
    toggleListening,
    handleStopSpeaking,
    startListening,
    stopListening,
  }
}
