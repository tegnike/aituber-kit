import { useState, useEffect, useCallback, useRef } from 'react'
import { getVoiceLanguageCode } from '@/utils/voiceLanguage'
import settingsStore from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'
import homeStore from '@/features/stores/home'
import { useTranslation } from 'react-i18next'
import { useSilenceDetection } from './useSilenceDetection'
import { SpeakQueue } from '@/features/messages/speakQueue'

/**
 * ブラウザの音声認識APIを使用するためのカスタムフック
 */
export const useBrowserSpeechRecognition = (
  onChatProcessStart: (text: string) => void
) => {
  const { t } = useTranslation()
  const selectLanguage = settingsStore((s) => s.selectLanguage)
  const initialSpeechTimeout = settingsStore((s) => s.initialSpeechTimeout)

  // ----- 状態管理 -----
  const [userMessage, setUserMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const isListeningRef = useRef(false)

  // ----- 音声認識関連 -----
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const transcriptRef = useRef('')
  const speechDetectedRef = useRef<boolean>(false)
  const recognitionStartTimeRef = useRef<number>(0)
  const initialSpeechCheckTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ----- キーボードトリガー関連 -----
  const keyPressStartTime = useRef<number | null>(null)
  const isKeyboardTriggered = useRef(false)

  // ----- 無音検出フックを使用 -----
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

  // ----- 初期音声検出タイマーをクリアする関数 -----
  const clearInitialSpeechCheckTimer = useCallback(() => {
    if (initialSpeechCheckTimerRef.current) {
      clearTimeout(initialSpeechCheckTimerRef.current)
      initialSpeechCheckTimerRef.current = null
    }
  }, [])

  // ----- 音声認識停止処理 -----
  const stopListening = useCallback(async () => {
    // 各種タイマーをクリア
    clearSilenceDetection()
    clearInitialSpeechCheckTimer()

    // リスニング状態を更新
    isListeningRef.current = false
    setIsListening(false)

    if (!recognition) return

    // 音声認識を停止
    try {
      recognition.stop()
    } catch (error) {
      console.error('Error stopping recognition:', error)
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
  }, [
    clearSilenceDetection,
    clearInitialSpeechCheckTimer,
    recognition,
    isSpeechEnded,
    onChatProcessStart,
  ])

  // ----- マイク権限確認 -----
  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
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
      toastStore.getState().addToast({
        message: t('Toasts.MicrophonePermissionDenied'),
        type: 'error',
        tag: 'microphone-permission-error',
      })
      return false
    }
  }, [t])

  // ----- 音声認識開始処理 -----
  const startListening = useCallback(async () => {
    const hasPermission = await checkMicrophonePermission()
    if (!hasPermission) return

    if (!recognition) return

    // 既に認識が開始されている場合は、一度停止してから再開する
    if (isListeningRef.current) {
      try {
        recognition.stop()
        // 停止完了を待つための短い遅延
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (err) {
        console.log('Recognition was not running, proceeding to start', err)
      }
    }

    // トランスクリプトをリセット
    transcriptRef.current = ''
    setUserMessage('')

    try {
      recognition.start()
      console.log('Recognition started successfully')
      // リスニング状態を更新
      isListeningRef.current = true
      setIsListening(true)
    } catch (error) {
      console.error('Error starting recognition:', error)

      // InvalidStateErrorの場合は、既に開始されているとみなす
      if (error instanceof DOMException && error.name === 'InvalidStateError') {
        console.log('Recognition is already running, skipping retry')
        // 既に実行中なので、リスニング状態を更新する
        isListeningRef.current = true
        setIsListening(true)

        // onstart イベントハンドラと同様の処理を手動で実行
        console.log('Speech recognition started (manually triggered)')
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

              // 常時マイク入力モードをオフに設定
              if (settingsStore.getState().continuousMicListeningMode) {
                console.log(
                  '🔇 音声未検出により常時マイク入力モードをOFFに設定します。'
                )
                settingsStore.setState({ continuousMicListeningMode: false })
              }

              toastStore.getState().addToast({
                message: t('Toasts.NoSpeechDetected'),
                type: 'info',
                tag: 'no-speech-detected',
              })
            }
          }, initialSpeechTimeout * 1000)
        }

        // 無音検出開始
        startSilenceDetection(stopListening)
      } else {
        // その他のエラーの場合のみ再試行
        setTimeout(() => {
          try {
            if (recognition) {
              // 一度確実に停止を試みる
              try {
                recognition.stop()
                // 停止後に短い遅延
                setTimeout(() => {
                  recognition.start()
                  console.log('Recognition started on retry')
                  isListeningRef.current = true
                  setIsListening(true)
                }, 100)
              } catch (stopError) {
                // 停止できなかった場合は直接スタート
                try {
                  recognition.start()
                  console.log('Recognition started on retry without stopping')
                  isListeningRef.current = true
                  setIsListening(true)
                } catch (startError) {
                  console.error(
                    'Failed to start recognition on retry:',
                    startError
                  )
                  isListeningRef.current = false
                  setIsListening(false)
                }
              }
            }
          } catch (retryError) {
            console.error('Failed to start recognition on retry:', retryError)
            isListeningRef.current = false
            setIsListening(false)
            return
          }
        }, 300)
      }
    }
  }, [recognition, checkMicrophonePermission])

  // ----- 音声認識トグル処理 -----
  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening()
    } else {
      keyPressStartTime.current = Date.now()
      isKeyboardTriggered.current = true
      startListening()
      // AIの発話を停止
      homeStore.setState({ isSpeaking: false })
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

  // ----- 音声認識オブジェクトの初期化とイベントハンドラ設定 -----
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.error('Speech Recognition API is not supported in this browser')
      toastStore.getState().addToast({
        message: t('Toasts.SpeechRecognitionNotSupported'),
        type: 'error',
        tag: 'speech-recognition-not-supported',
      })
      return
    }

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

            // 常時マイク入力モードをオフに設定
            if (settingsStore.getState().continuousMicListeningMode) {
              console.log(
                '🔇 音声未検出により常時マイク入力モードをOFFに設定します。'
              )
              settingsStore.setState({ continuousMicListeningMode: false })
            }

            toastStore.getState().addToast({
              message: t('Toasts.NoSpeechDetected'),
              type: 'info',
              tag: 'no-speech-detected',
            })
          }
        }, initialSpeechTimeout * 1000)
      }

      // 無音検出開始
      startSilenceDetection(stopListening)
    }

    // 音声入力検出時
    newRecognition.onspeechstart = () => {
      console.log('🗣️ 音声入力を検出しました（onspeechstart）')
      // ここではタイマーをリセットするだけで、speechDetectedRefは設定しない
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
        console.log('🎤 有意な音声を検出しました（トランスクリプト変更あり）')
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

      // isListeningRef.currentがtrueの場合は再開
      if (isListeningRef.current) {
        console.log('Restarting speech recognition...')
        setTimeout(() => {
          startListening()
        }, 1000)
      }
    }

    // 音声認識エラー時
    newRecognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)

      // no-speechエラーの場合
      if (event.error === 'no-speech' && isListeningRef.current) {
        // 初回音声検出されていない場合のみ、累積時間をチェック
        if (!speechDetectedRef.current && initialSpeechTimeout > 0) {
          // 認識開始からの経過時間を計算
          const elapsedTime =
            (Date.now() - recognitionStartTimeRef.current) / 1000
          console.log(
            `音声未検出の累積時間: ${elapsedTime.toFixed(1)}秒 / 設定: ${initialSpeechTimeout}秒`
          )

          // 設定された初期音声タイムアウトを超えた場合は、再起動せずに終了
          if (elapsedTime >= initialSpeechTimeout) {
            console.log(
              `⏱️ ${initialSpeechTimeout}秒間音声が検出されませんでした。音声認識を停止します。`
            )
            clearSilenceDetection()
            clearInitialSpeechCheckTimer()
            stopListening()

            // 常時マイク入力モードをオフに設定
            if (settingsStore.getState().continuousMicListeningMode) {
              console.log(
                '🔇 音声未検出により常時マイク入力モードをOFFに設定します。'
              )
              settingsStore.setState({ continuousMicListeningMode: false })
            }

            toastStore.getState().addToast({
              message: t('Toasts.NoSpeechDetected'),
              type: 'info',
              tag: 'no-speech-detected',
            })
            return
          }
        }

        // 音声が既に検出されている場合、または初期タイムアウトに達していない場合は再起動
        console.log(
          'No speech detected, automatically restarting recognition...'
        )

        // 少し遅延を入れてから再起動
        setTimeout(() => {
          if (
            isListeningRef.current &&
            !homeStore.getState().chatProcessing &&
            // 常時マイクモードがオンの場合のみ再起動
            (settingsStore.getState().continuousMicListeningMode ||
              isKeyboardTriggered.current)
          ) {
            try {
              // 明示的に停止してから再開
              try {
                newRecognition.stop()
                // 少し待ってから再開
                setTimeout(() => {
                  newRecognition.start()
                  console.log(
                    'Recognition automatically restarted after no-speech timeout'
                  )
                }, 100)
              } catch (stopError) {
                // stop()でエラーが出た場合は直接start()を試みる
                newRecognition.start()
                console.log(
                  'Recognition automatically restarted without stopping'
                )
              }
            } catch (restartError) {
              console.error(
                'Failed to restart recognition after no-speech:',
                restartError
              )
              isListeningRef.current = false
              setIsListening(false)
            }
          } else {
            console.log(
              '音声認識の再起動をスキップします（常時マイクモードがオフまたは他の条件を満たさない）'
            )
            console.log('isListeningRef.current', isListeningRef.current)
            console.log(
              '!homeStore.getState().isSpeaking',
              !homeStore.getState().isSpeaking
            )
            console.log(
              '!homeStore.getState().chatProcessing',
              !homeStore.getState().chatProcessing
            )
          }
        }, 2000)
      } else {
        // その他のエラーの場合は通常の終了処理
        clearSilenceDetection()
        clearInitialSpeechCheckTimer()
        stopListening()
      }
    }

    setRecognition(newRecognition)

    // クリーンアップ関数
    return () => {
      try {
        if (newRecognition) {
          newRecognition.onstart = null
          newRecognition.onspeechstart = null
          newRecognition.onresult = null
          newRecognition.onspeechend = null
          newRecognition.onend = null
          newRecognition.onerror = null
          newRecognition.abort()
        }
      } catch (error) {
        console.error('Error cleaning up speech recognition:', error)
      }
      clearSilenceDetection()
      clearInitialSpeechCheckTimer()
    }
  }, [
    selectLanguage,
    initialSpeechTimeout,
    t,
    // stopListening,
    clearSilenceDetection,
    clearInitialSpeechCheckTimer,
    startSilenceDetection,
    updateSpeechTimestamp,
  ])

  return {
    userMessage,
    isListening,
    silenceTimeoutRemaining,
    handleInputChange,
    handleSendMessage,
    toggleListening,
    startListening,
    stopListening,
  }
}
