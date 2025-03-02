import { useState, useEffect, useCallback, useRef } from 'react'
import { MessageInput } from '@/components/messageInput'
import settingsStore from '@/features/stores/settings'
import { VoiceLanguage } from '@/features/constants/settings'
import webSocketStore from '@/features/stores/websocketStore'
import { useTranslation } from 'react-i18next'
import toastStore from '@/features/stores/toast'
import homeStore from '@/features/stores/home'

// AudioContext の型定義を拡張
type AudioContextType = typeof AudioContext

// 音声認識開始後、音声が検出されないまま経過した場合のタイムアウト（5秒）
const INITIAL_SPEECH_TIMEOUT = 5000

// 無音検出用の状態と変数を追加
type Props = {
  onChatProcessStart: (text: string) => void
}

export const MessageInputContainer = ({ onChatProcessStart }: Props) => {
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
  const isSpeaking = homeStore((s) => s.isSpeaking)
  // 音声認識開始時刻を保持する変数を追加
  const recognitionStartTimeRef = useRef<number>(0)
  // 音声が検出されたかどうかのフラグ
  const speechDetectedRef = useRef<boolean>(false)
  // 初期音声検出用のタイマー
  const initialSpeechCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  const selectLanguage = settingsStore((s) => s.selectLanguage)

  const { t } = useTranslation()

  // 無音検出用の追加変数
  const lastSpeechTimestamp = useRef<number>(0)
  const silenceCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const speechEndedRef = useRef<boolean>(false)
  const stopListeningRef = useRef<(() => Promise<void>) | null>(null)
  // 関数をuseRefで保持して依存関係の循環を防ぐ
  const startSilenceDetectionRef = useRef<
    ((stopListeningFn: () => Promise<void>) => void) | null
  >(null)
  const clearSilenceDetectionRef = useRef<(() => void) | null>(null)
  const sendAudioBufferRef = useRef<(() => void) | null>(null)

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

  // getVoiceLanguageCodeをuseCallbackでラップして依存関係を明確にする
  const getVoiceLanguageCode = useCallback(
    (selectLanguage: string): VoiceLanguage => {
      switch (selectLanguage) {
        case 'ja':
          return 'ja-JP'
        case 'en':
          return 'en-US'
        case 'ko':
          return 'ko-KR'
        case 'zh':
          return 'zh-TW'
        case 'vi':
          return 'vi-VN'
        case 'fr':
          return 'fr-FR'
        case 'es':
          return 'es-ES'
        case 'pt':
          return 'pt-PT'
        case 'de':
          return 'de-DE'
        case 'ru':
          return 'ru-RU'
        case 'it':
          return 'it-IT'
        case 'ar':
          return 'ar-SA'
        case 'hi':
          return 'hi-IN'
        case 'pl':
          return 'pl-PL'
        case 'th':
          return 'th-TH'
        default:
          return 'ja-JP'
      }
    },
    []
  )

  // 無音検出をクリーンアップする関数 - 依存がないので先に定義
  const clearSilenceDetection = useCallback(() => {
    if (silenceCheckInterval.current) {
      clearInterval(silenceCheckInterval.current)
      silenceCheckInterval.current = null
    }
  }, [])

  // clearSilenceDetectionをRefに保存
  useEffect(() => {
    clearSilenceDetectionRef.current = clearSilenceDetection
  }, [clearSilenceDetection])

  // stopListening関数の先行宣言（実際の実装は下部で行う）
  const stopListening = useCallback(async () => {
    if (stopListeningRef.current) {
      await stopListeningRef.current()
    }
  }, [])

  // 無音検出の繰り返しチェックを行う関数
  const startSilenceDetection = useCallback(
    (stopListeningFn: () => Promise<void>) => {
      // 前回のタイマーがあれば解除
      if (silenceCheckInterval.current) {
        clearInterval(silenceCheckInterval.current)
      }

      // 音声検出時刻を記録
      lastSpeechTimestamp.current = Date.now()
      speechEndedRef.current = false
      console.log(
        '🎤 無音検出を開始しました。無音検出タイムアウトの設定値に基づいて自動送信します。'
      )

      // 250ms間隔で無音状態をチェック
      silenceCheckInterval.current = setInterval(() => {
        // 現在時刻と最終音声検出時刻の差を計算
        const silenceDuration = Date.now() - lastSpeechTimestamp.current

        // 無音状態が5秒以上続いた場合は、テキストの有無に関わらず音声認識を停止
        if (silenceDuration >= 5000 && !speechEndedRef.current) {
          console.log(
            `⏱️ ${silenceDuration}ms の長時間無音を検出しました。音声認識を停止します。`
          )
          speechEndedRef.current = true
          stopListeningFn()

          // トースト通知を表示
          toastStore.getState().addToast({
            message: t('Toasts.NoSpeechDetected'),
            type: 'info',
            tag: 'no-speech-detected-long-silence',
          })
        }
        // 無音状態が2秒以上続いたかつテキストがある場合は自動送信
        else if (
          settingsStore.getState().noSpeechTimeout > 0 &&
          silenceDuration >= settingsStore.getState().noSpeechTimeout * 1000 &&
          !speechEndedRef.current
        ) {
          const trimmedTranscript = transcriptRef.current.trim()
          console.log(
            `⏱️ ${silenceDuration}ms の無音を検出しました（閾値: ${settingsStore.getState().noSpeechTimeout * 1000}ms）。無音検出タイムアウトが0秒の場合は自動送信は無効です。`
          )
          console.log(`📝 認識テキスト: "${trimmedTranscript}"`)

          if (
            trimmedTranscript &&
            settingsStore.getState().noSpeechTimeout > 0
          ) {
            speechEndedRef.current = true
            console.log('✅ 無音検出による自動送信を実行します')
            // 無音検出で自動送信
            onChatProcessStart(trimmedTranscript)
            setUserMessage('')
            stopListeningFn()
          }
        }
      }, 250) // 250msごとにチェック
    },
    [onChatProcessStart]
  )

  // startSilenceDetectionをRefに保存
  useEffect(() => {
    startSilenceDetectionRef.current = startSilenceDetection
  }, [startSilenceDetection])

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
    if (clearSilenceDetectionRef.current) {
      clearSilenceDetectionRef.current()
    }

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
        if (
          pressDuration >= 1000 &&
          trimmedTranscriptRef &&
          !speechEndedRef.current
        ) {
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
        if (stopListeningRef.current && startSilenceDetectionRef.current) {
          startSilenceDetectionRef.current(stopListeningRef.current)
        }
      }

      // 音声入力検出時のハンドラを追加
      newRecognition.onspeechstart = () => {
        console.log('🗣️ 音声入力を検出しました')
        // 音声検出フラグを立てる
        speechDetectedRef.current = true
        // 音声検出時刻を更新
        lastSpeechTimestamp.current = Date.now()
      }

      // 結果が返ってきた時のハンドラ（音声検出中）
      newRecognition.onresult = (event) => {
        if (!isListeningRef.current) return

        // 音声を検出したので、タイムスタンプを更新
        lastSpeechTimestamp.current = Date.now()
        // 音声検出フラグを立てる（結果が返ってきたということは音声が検出されている）
        speechDetectedRef.current = true

        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('')
        transcriptRef.current = transcript
        setUserMessage(transcript)
      }

      // 音声入力終了時のハンドラ
      newRecognition.onspeechend = () => {
        console.log('🛑 音声入力が終了しました。無音検出タイマーが動作中です。')
        // 音声入力が終わったが、無音検出はそのまま継続する
        // タイマーが2秒後に処理する
      }

      // 音声認識終了時のハンドラ
      newRecognition.onend = () => {
        console.log('Recognition ended')
        // 無音検出をクリア
        if (clearSilenceDetectionRef.current) {
          clearSilenceDetectionRef.current()
        }
        // 初期音声検出タイマーをクリア
        clearInitialSpeechCheckTimer()
      }

      newRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if (clearSilenceDetectionRef.current) {
          clearSilenceDetectionRef.current()
        }
        // 初期音声検出タイマーをクリア
        clearInitialSpeechCheckTimer()
        stopListening()
      }

      setRecognition(newRecognition)
    }
  }, [
    stopListening,
    getVoiceLanguageCode,
    clearInitialSpeechCheckTimer,
    selectLanguage,
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

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Alt' && !isListeningRef.current) {
        keyPressStartTime.current = Date.now()
        isKeyboardTriggered.current = true
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

  return (
    <MessageInput
      userMessage={userMessage}
      isMicRecording={isListening}
      onChangeUserMessage={handleInputChange}
      onClickMicButton={toggleListening}
      onClickSendButton={handleSendMessage}
      onClickStopButton={handleStopSpeaking}
      isSpeaking={isSpeaking}
    />
  )
}

// リサンプリング関数
const resampleAudio = (
  audioData: Float32Array,
  fromSampleRate: number,
  toSampleRate: number
): Float32Array => {
  const ratio = fromSampleRate / toSampleRate
  const newLength = Math.round(audioData.length / ratio)
  const result = new Float32Array(newLength)

  for (let i = 0; i < newLength; i++) {
    const position = i * ratio
    const leftIndex = Math.floor(position)
    const rightIndex = Math.ceil(position)
    const fraction = position - leftIndex

    if (rightIndex >= audioData.length) {
      result[i] = audioData[leftIndex]
    } else {
      result[i] =
        (1 - fraction) * audioData[leftIndex] + fraction * audioData[rightIndex]
    }
  }

  return result
}

// リサンプリングとモノラル変換を行う関数
const processAudio = (audioBuffer: AudioBuffer): Float32Array => {
  const targetSampleRate = 24000
  const numChannels = audioBuffer.numberOfChannels

  // モノラルに変換
  let monoData = new Float32Array(audioBuffer.length)
  for (let i = 0; i < audioBuffer.length; i++) {
    let sum = 0
    for (let channel = 0; channel < numChannels; channel++) {
      sum += audioBuffer.getChannelData(channel)[i]
    }
    monoData[i] = sum / numChannels
  }

  // リサンプリング
  return resampleAudio(monoData, audioBuffer.sampleRate, targetSampleRate)
}

// Float32Array を PCM16 ArrayBuffer に変換する関数
const floatTo16BitPCM = (float32Array: Float32Array) => {
  const buffer = new ArrayBuffer(float32Array.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return buffer
}

// Float32Array を base64エンコードされた PCM16 データに変換する関数
const base64EncodeAudio = (float32Array: Float32Array) => {
  const arrayBuffer = floatTo16BitPCM(float32Array)
  let binary = ''
  const bytes = new Uint8Array(arrayBuffer)
  const chunkSize = 0x8000 // 32KB chunk size
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize))
    )
  }
  return btoa(binary)
}
