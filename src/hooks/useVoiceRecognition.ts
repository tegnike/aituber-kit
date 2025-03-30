import { useState, useEffect, useCallback, useRef } from 'react'
import settingsStore from '@/features/stores/settings'
import webSocketStore from '@/features/stores/websocketStore'
import toastStore from '@/features/stores/toast'
import { useTranslation } from 'react-i18next'
import homeStore from '@/features/stores/home'
import { getVoiceLanguageCode } from '@/utils/voiceLanguage'
import { processAudio, base64EncodeAudio } from '@/utils/audioProcessing'
import { useSilenceDetection } from './useSilenceDetection'
import { SpeakQueue } from '@/features/messages/speakQueue'

// AudioContext の型定義を拡張
type AudioContextType = typeof AudioContext

type UseVoiceRecognitionProps = {
  onChatProcessStart: (text: string) => void
}

export const useVoiceRecognition = ({
  onChatProcessStart,
}: UseVoiceRecognitionProps) => {
  const { t } = useTranslation()
  const selectLanguage = settingsStore((s) => s.selectLanguage)
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const speechRecognitionMode = settingsStore((s) => s.speechRecognitionMode)
  const continuousMicListeningMode = settingsStore(
    (s) => s.continuousMicListeningMode
  )
  const initialSpeechTimeout = settingsStore((s) => s.initialSpeechTimeout)

  // ----- 状態管理 -----
  const [userMessage, setUserMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const isListeningRef = useRef(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // ----- 音声認識関連 -----
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const transcriptRef = useRef('')
  const speechDetectedRef = useRef<boolean>(false)
  const recognitionStartTimeRef = useRef<number>(0)
  const initialSpeechCheckTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ----- 音声録音関連 (リアルタイムAPIとWhisper用) -----
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const audioBufferRef = useRef<Float32Array | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // ----- キーボードトリガー関連 -----
  const keyPressStartTime = useRef<number | null>(null)
  const isKeyboardTriggered = useRef(false)

  // ----- 参照保持用 -----
  const stopListeningRef = useRef<(() => Promise<void>) | null>(null)
  const sendAudioBufferRef = useRef<(() => void) | null>(null)

  // ----- 無音検出フックを使用（ブラウザモードのみ） -----
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

  // ----- 音声停止 -----
  const handleStopSpeaking = useCallback(() => {
    homeStore.setState({ isSpeaking: false })
  }, [])

  // ----- 初期音声検出タイマーをクリアする関数 -----
  const clearInitialSpeechCheckTimer = useCallback(() => {
    if (initialSpeechCheckTimerRef.current) {
      clearTimeout(initialSpeechCheckTimerRef.current)
      initialSpeechCheckTimerRef.current = null
    }
  }, [])

  // ----- マイク権限確認 -----
  const checkMicrophonePermission = async (): Promise<boolean> => {
    // Firefoxの場合はエラーメッセージを表示して終了
    if (
      navigator.userAgent.toLowerCase().includes('firefox') &&
      speechRecognitionMode === 'browser'
    ) {
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

  // ----- リアルタイムAPI用の音声データ送信 -----
  const sendAudioBuffer = useCallback(() => {
    if (!audioBufferRef.current || audioBufferRef.current.length === 0) {
      console.error('音声バッファが空です')
      return
    }

    const base64Chunk = base64EncodeAudio(audioBufferRef.current)
    const ss = settingsStore.getState()
    const wsManager = webSocketStore.getState().wsManager

    if (wsManager?.websocket?.readyState !== WebSocket.OPEN) {
      return
    }

    let sendContent: { type: string; text?: string; audio?: string }[] = []

    if (ss.realtimeAPIModeContentType === 'input_audio') {
      console.log('Sending buffer. Length:', audioBufferRef.current.length)
      sendContent = [{ type: 'input_audio', audio: base64Chunk }]
    } else {
      const currentText = transcriptRef.current.trim()
      if (currentText) {
        console.log('Sending text. userMessage:', currentText)
        sendContent = [{ type: 'input_text', text: currentText }]
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

    audioBufferRef.current = null // 送信後にバッファをクリア
  }, [])

  // ----- 音声認識停止処理 -----
  const stopListeningImpl = useCallback(async () => {
    // 各種タイマーをクリア（ブラウザモードのみ）
    if (speechRecognitionMode === 'browser') {
      clearSilenceDetection()
      clearInitialSpeechCheckTimer()
    }

    // リスニング状態を更新
    isListeningRef.current = false
    setIsListening(false)

    if (speechRecognitionMode === 'browser') {
      // ブラウザモードの場合
      if (!recognition) return

      // 音声認識を停止
      recognition.stop()

      // リアルタイムAPIモードの場合の処理
      if (realtimeAPIMode && mediaRecorder) {
        mediaRecorder.stop()
        mediaRecorder.ondataavailable = null

        // 録音データの処理と送信
        await new Promise<void>((resolve) => {
          mediaRecorder.onstop = async () => {
            console.log('stop MediaRecorder')
            if (audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, {
                type: 'audio/webm',
              })
              const arrayBuffer = await audioBlob.arrayBuffer()

              if (audioContext) {
                const audioBuffer =
                  await audioContext.decodeAudioData(arrayBuffer)
                const processedData = processAudio(audioBuffer)
                audioBufferRef.current = processedData
              }
              resolve()
            } else {
              console.error('音声チャンクが空です')
              resolve()
            }
          }
        })

        // 音声データ送信
        if (sendAudioBufferRef.current) {
          sendAudioBufferRef.current()
        }
      }

      // キーボードトリガーの場合の処理
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
    } else {
      // Whisperモードの場合
      if (!mediaRecorder) return

      // 録音停止
      mediaRecorder.stop()

      try {
        // 録音データを処理して文字起こし
        if (audioChunksRef.current.length > 0) {
          console.log(
            `Processing ${audioChunksRef.current.length} audio chunks for Whisper`
          )

          // 保存されたMIMEタイプを取得
          let blobType = 'audio/webm'
          if (mediaRecorder.mimeType && mediaRecorder.mimeType !== '') {
            blobType = mediaRecorder.mimeType
          }

          console.log(`Creating blob with MIME type: ${blobType}`)

          // 音声チャンクをマージしてBlobに変換
          const audioBlob = new Blob(audioChunksRef.current, {
            type: blobType, // MediaRecorderで使用されたMIMEタイプを使用
          })

          console.log(
            'Created audio blob:',
            audioBlob.size,
            'bytes,',
            audioBlob.type
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
        } else {
          console.warn('No audio chunks recorded')
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
      } finally {
        // リソース解放
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach((track) => track.stop())
        }
        setMediaRecorder(null)
        audioChunksRef.current = []
      }
    }
  }, [
    speechRecognitionMode,
    recognition,
    realtimeAPIMode,
    mediaRecorder,
    audioContext,
    onChatProcessStart,
    clearInitialSpeechCheckTimer,
    clearSilenceDetection,
    isSpeechEnded,
    processWhisperRecognition,
  ])

  // ----- 音声認識開始処理 -----
  const startListening = useCallback(async () => {
    const hasPermission = await checkMicrophonePermission()
    if (!hasPermission) return

    if (speechRecognitionMode === 'browser') {
      // ブラウザモードの場合
      if (!recognition || isListeningRef.current || !audioContext) return

      // トランスクリプトをリセット
      transcriptRef.current = ''
      setUserMessage('')

      try {
        recognition.start()
      } catch (error) {
        console.error('Error starting recognition:', error)
        return
      }

      // リスニング状態を更新
      isListeningRef.current = true
      setIsListening(true)

      // リアルタイムAPIモードの場合の録音開始
      if (realtimeAPIMode) {
        audioChunksRef.current = [] // 音声チャンクをリセット

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          })
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
        } catch (error) {
          console.error('Error starting media recorder:', error)
          // 録音に失敗しても音声認識は続行する
        }
      }
    } else {
      // Whisperモードの場合
      if (isListeningRef.current) return

      // リスニング状態を更新
      isListeningRef.current = true
      setIsListening(true)

      // トランスクリプトをリセット
      transcriptRef.current = ''
      setUserMessage('')

      // 音声チャンクをリセット
      audioChunksRef.current = []

      try {
        // MediaRecorderでの録音を開始
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000, // Whisperに最適化
            echoCancellation: true,
            noiseSuppression: true,
          },
        })

        // MediaRecorderでサポートされているmimeTypeを確認
        const mimeTypes = [
          'audio/mp3',
          'audio/mp4',
          'audio/mpeg',
          'audio/ogg',
          'audio/wav',
          'audio/webm',
          'audio/webm;codecs=opus',
        ]

        let selectedMimeType = 'audio/webm'
        for (const type of mimeTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            selectedMimeType = type
            // mp3とoggを優先
            if (type === 'audio/mp3' || type === 'audio/ogg') {
              break
            }
          }
        }

        console.log(
          `Using MIME type: ${selectedMimeType} for Whisper recording`
        )

        // OpenAI Whisperが対応している形式で録音
        const recorder = new MediaRecorder(stream, {
          mimeType: selectedMimeType,
          audioBitsPerSecond: 128000, // 音質設定
        })

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
            console.log(
              'Whisper recording: added chunk, size:',
              event.data.size,
              'type:',
              event.data.type
            )
          }
        }

        setMediaRecorder(recorder)
        recorder.start(100) // 100msごとにデータ収集
      } catch (error) {
        console.error('Error starting Whisper recording:', error)
        isListeningRef.current = false
        setIsListening(false)

        toastStore.getState().addToast({
          message: t('Toasts.SpeechRecognitionError'),
          type: 'error',
          tag: 'speech-recognition-error',
        })
      }
    }
  }, [
    speechRecognitionMode,
    recognition,
    audioContext,
    realtimeAPIMode,
    checkMicrophonePermission,
  ])

  // AIの発話完了後に音声認識を自動的に再開する処理
  const handleSpeakCompletion = useCallback(() => {
    // 常時マイク入力モードがONで、現在マイク入力が行われていない場合のみ実行
    if (
      continuousMicListeningMode &&
      !isListeningRef.current &&
      speechRecognitionMode === 'browser' &&
      !homeStore.getState().chatProcessing
    ) {
      console.log('🔄 AIの発話が完了しました。音声認識を自動的に再開します。')
      setTimeout(() => {
        startListening()
      }, 300) // マイク起動までに少し遅延を入れる
    }
  }, [continuousMicListeningMode, speechRecognitionMode, startListening])

  // 常時マイク入力モードの変更を監視
  useEffect(() => {
    if (
      continuousMicListeningMode &&
      !isListeningRef.current &&
      speechRecognitionMode === 'browser' &&
      !homeStore.getState().isSpeaking &&
      !homeStore.getState().chatProcessing
    ) {
      // 常時マイク入力モードがONになった場合、自動的にマイク入力を開始
      console.log(
        '🎤 常時マイク入力モードがONになりました。音声認識を開始します。'
      )
      startListening()
    }
  }, [continuousMicListeningMode, speechRecognitionMode, startListening])

  // 発話完了時のコールバックを登録
  useEffect(() => {
    // ブラウザモードでのみコールバックを登録
    if (speechRecognitionMode === 'browser') {
      SpeakQueue.onSpeakCompletion(handleSpeakCompletion)

      return () => {
        // コンポーネントのアンマウント時にコールバックを削除
        SpeakQueue.removeSpeakCompletionCallback(handleSpeakCompletion)
      }
    }
  }, [speechRecognitionMode, handleSpeakCompletion])

  // コンポーネントのマウント時に常時マイク入力モードがONの場合は自動的にマイク入力を開始
  useEffect(() => {
    if (
      continuousMicListeningMode &&
      speechRecognitionMode === 'browser' &&
      !isListeningRef.current &&
      !homeStore.getState().isSpeaking &&
      !homeStore.getState().chatProcessing
    ) {
      const delayedStart = async () => {
        console.log('🎤 コンポーネントマウント時に音声認識を自動的に開始します')
        // コンポーネントマウント時に少し遅延させてから開始
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (
          continuousMicListeningMode &&
          !isListeningRef.current &&
          !homeStore.getState().isSpeaking &&
          !homeStore.getState().chatProcessing
        ) {
          startListening()
        }
      }

      delayedStart()
    }

    return () => {
      // コンポーネントのアンマウント時にマイク入力を停止
      if (isListeningRef.current) {
        stopListeningRef.current?.()
      }
    }
  }, []) // マウント時のみ実行

  // ----- 音声認識トグル処理 -----
  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListeningRef.current?.()
    } else {
      keyPressStartTime.current = Date.now()
      isKeyboardTriggered.current = true
      startListening()
      handleStopSpeaking()
    }
  }, [startListening, handleStopSpeaking])

  // ----- メッセージ送信 -----
  const handleSendMessage = useCallback(() => {
    if (userMessage.trim()) {
      handleStopSpeaking()
      onChatProcessStart(userMessage)
      setUserMessage('')
    }
  }, [userMessage, onChatProcessStart, handleStopSpeaking])

  // ----- メッセージ入力 -----
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setUserMessage(e.target.value)
    },
    []
  )

  // ----- 簡易版の停止関数 -----
  const stopListening = useCallback(async () => {
    if (stopListeningRef.current) {
      await stopListeningRef.current()
    }
  }, [])

  // ----- 副作用処理 -----

  // stopListeningRefの更新
  useEffect(() => {
    stopListeningRef.current = stopListeningImpl
  }, [stopListeningImpl])

  // sendAudioBufferRefの更新
  useEffect(() => {
    sendAudioBufferRef.current = sendAudioBuffer
  }, [sendAudioBuffer])

  // AudioContextの初期化
  useEffect(() => {
    const AudioContextClass = (window.AudioContext ||
      (window as any).webkitAudioContext) as AudioContextType
    const context = new AudioContextClass()
    setAudioContext(context)
  }, [])

  // 音声認識オブジェクトの初期化とイベントハンドラ設定（ブラウザモードのみ）
  useEffect(() => {
    // Whisperモードの場合は初期化しない
    if (speechRecognitionMode !== 'browser') return

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) return

    const newRecognition = new SpeechRecognition()
    newRecognition.lang = getVoiceLanguageCode(selectLanguage)
    newRecognition.continuous = true
    newRecognition.interimResults = true

    // ----- イベントハンドラの設定 -----

    // 音声認識開始時
    newRecognition.onstart = () => {
      console.log('Speech recognition started')
      recognitionStartTimeRef.current = Date.now()
      speechDetectedRef.current = false

      // 初期音声検出タイマー設定
      if (initialSpeechTimeout > 0) {
        initialSpeechCheckTimerRef.current = setTimeout(() => {
          if (!speechDetectedRef.current && isListeningRef.current) {
            console.log(
              `⏱️ ${initialSpeechTimeout}秒間音声が検出されませんでした。音声認識を停止します。`
            )
            stopListening()

            toastStore.getState().addToast({
              message: t('Toasts.NoSpeechDetected'),
              type: 'info',
              tag: 'no-speech-detected',
            })
          }
        }, initialSpeechTimeout * 1000)
      }

      // 無音検出開始
      if (stopListeningRef.current) {
        startSilenceDetection(stopListeningRef.current)
      }
    }

    // 音声入力検出時
    newRecognition.onspeechstart = () => {
      console.log('🗣️ 音声入力を検出しました（onspeechstart）')
      speechDetectedRef.current = true
      updateSpeechTimestamp()
    }

    // 音量レベル追跡用変数
    let lastTranscriptLength = 0

    // 音声認識結果が得られたとき
    newRecognition.onresult = (event) => {
      if (!isListeningRef.current) return

      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('')

      // 有意な変化があるかチェック
      const isSignificantChange =
        transcript.trim().length > lastTranscriptLength
      lastTranscriptLength = transcript.trim().length

      if (isSignificantChange) {
        console.log('📢 有意な音声を検出しました（トランスクリプト変更あり）')
        updateSpeechTimestamp()
        speechDetectedRef.current = true
      } else {
        console.log(
          '🔇 バックグラウンドノイズを無視します（トランスクリプト変更なし）'
        )
      }

      transcriptRef.current = transcript
      setUserMessage(transcript)
    }

    // 音声入力終了時
    newRecognition.onspeechend = () => {
      console.log(
        '🛑 音声入力が終了しました（onspeechend）。無音検出タイマーが動作中です。'
      )
    }

    // 音声認識終了時
    newRecognition.onend = () => {
      console.log('Recognition ended')
      clearSilenceDetection()
      clearInitialSpeechCheckTimer()
    }

    // 音声認識エラー時
    newRecognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      clearSilenceDetection()
      clearInitialSpeechCheckTimer()
      stopListening()
    }

    setRecognition(newRecognition)
  }, [
    speechRecognitionMode,
    selectLanguage,
    t,
    stopListening,
    clearInitialSpeechCheckTimer,
    clearSilenceDetection,
    startSilenceDetection,
    updateSpeechTimestamp,
  ])

  // キーボードショートカットの設定
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Alt' && !isListeningRef.current) {
        // Alt キーを押した時の処理
        keyPressStartTime.current = Date.now()
        isKeyboardTriggered.current = true
        handleStopSpeaking()
        await startListening()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && isListeningRef.current) {
        // Alt キーを離した時の処理
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

  // 公開するAPI
  return {
    userMessage,
    isListening,
    isProcessing,
    silenceTimeoutRemaining:
      speechRecognitionMode === 'browser' ? silenceTimeoutRemaining : null,
    handleInputChange,
    handleSendMessage,
    toggleListening,
    handleStopSpeaking,
    startListening,
    stopListening,
  }
}
