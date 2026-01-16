import { useEffect, useCallback, useRef } from 'react'
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import { SpeakQueue } from '@/features/messages/speakQueue'
import { useBrowserSpeechRecognition } from './useBrowserSpeechRecognition'
import { useWhisperRecognition } from './useWhisperRecognition'
import { useRealtimeVoiceAPI } from './useRealtimeVoiceAPI'

type UseVoiceRecognitionProps = {
  onChatProcessStart: (text: string) => void
}

/**
 * 音声認識フックのメインインターフェース
 * 各モード（ブラウザ、Whisper、リアルタイムAPI）に応じて適切なフックを使用
 */
export function useVoiceRecognition({
  onChatProcessStart,
}: UseVoiceRecognitionProps) {
  // ----- 設定の取得 -----
  const speechRecognitionMode = settingsStore((s) => s.speechRecognitionMode)
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const continuousMicListeningMode = settingsStore(
    (s) => s.continuousMicListeningMode
  )

  // ----- 各モードのフックを使用 -----
  // ブラウザ音声認識フック
  const browserSpeech = useBrowserSpeechRecognition(onChatProcessStart)

  // Whisper音声認識フック
  const whisperSpeech = useWhisperRecognition(onChatProcessStart)

  // リアルタイムAPI処理フック
  const realtimeAPI = useRealtimeVoiceAPI(onChatProcessStart)

  // ----- 現在のモードに基づいて適切なフックを選択 -----
  const currentHook =
    speechRecognitionMode === 'browser'
      ? realtimeAPIMode
        ? realtimeAPI
        : browserSpeech
      : whisperSpeech

  // ----- currentHookの関数参照をrefで保持（依存配列からcurrentHookを除去するため） -----
  const currentHookRef = useRef({
    startListening: currentHook.startListening,
    stopListening: currentHook.stopListening,
    userMessage: currentHook.userMessage,
    isListening: currentHook.isListening,
    handleInputChange: currentHook.handleInputChange,
    checkRecognitionActive:
      'checkRecognitionActive' in currentHook
        ? (currentHook as any).checkRecognitionActive
        : null,
  })

  // ref更新はeffectで（render中アクセス禁止lint対策）
  useIsomorphicLayoutEffect(() => {
    currentHookRef.current = {
      startListening: currentHook.startListening,
      stopListening: currentHook.stopListening,
      userMessage: currentHook.userMessage,
      isListening: currentHook.isListening,
      handleInputChange: currentHook.handleInputChange,
      checkRecognitionActive:
        'checkRecognitionActive' in currentHook
          ? (currentHook as any).checkRecognitionActive
          : null,
    }
  }, [currentHook])

  // ----- 音声停止 -----
  const handleStopSpeaking = useCallback(() => {
    // isSpeaking を false に設定し、発話キューを完全に停止
    homeStore.setState({ isSpeaking: false })
    SpeakQueue.stopAll()

    // 常時マイク入力モードの場合、ストップ後にマイクを再開
    // （stopAllではコールバックが呼ばれないため、ここで再開処理を行う）
    if (
      settingsStore.getState().continuousMicListeningMode &&
      settingsStore.getState().speechRecognitionMode === 'browser' &&
      !homeStore.getState().chatProcessing
    ) {
      console.log('🔄 ストップボタンが押されました。音声認識を再開します。')
      setTimeout(() => {
        currentHookRef.current.startListening()
      }, 300)
    }
  }, [])

  // AIの発話完了後に音声認識を自動的に再開する処理
  const handleSpeakCompletion = useCallback(() => {
    // 常時マイク入力モードがONで、現在マイク入力が行われていない場合のみ実行
    if (
      continuousMicListeningMode &&
      speechRecognitionMode === 'browser' &&
      !homeStore.getState().chatProcessing
    ) {
      console.log('🔄 AIの発話が完了しました。音声認識を自動的に再開します。')
      setTimeout(() => {
        currentHookRef.current.startListening()
      }, 300) // マイク起動までに少し遅延を入れる
    }
  }, [continuousMicListeningMode, speechRecognitionMode])

  // 常時マイク入力モードの変更を監視
  useEffect(() => {
    if (
      continuousMicListeningMode &&
      !currentHookRef.current.isListening &&
      speechRecognitionMode === 'browser' &&
      !homeStore.getState().isSpeaking &&
      !homeStore.getState().chatProcessing
    ) {
      // 常時マイク入力モードがONになった場合、自動的にマイク入力を開始
      console.log(
        '🎤 常時マイク入力モードがONになりました。音声認識を開始します。'
      )
      currentHookRef.current.startListening()
    }
  }, [continuousMicListeningMode, speechRecognitionMode])

  // ----- 常時マイク入力モードの定期チェック -----
  // マイクがOFFになっていたら自動でONに戻す
  useEffect(() => {
    // 常時マイク入力モードがOFF、またはブラウザモード以外の場合は何もしない
    if (!continuousMicListeningMode || speechRecognitionMode !== 'browser') {
      return
    }

    const checkAndRestartMic = () => {
      const isSpeaking = homeStore.getState().isSpeaking
      const chatProcessing = homeStore.getState().chatProcessing
      const isListening = currentHookRef.current.isListening
      const checkRecognitionActive =
        currentHookRef.current.checkRecognitionActive

      // マイクがOFFで、発話中でも処理中でもない場合は再開
      if (!isListening && !isSpeaking && !chatProcessing) {
        console.log(
          '🔄 常時マイク入力モード: マイクがOFFになっていたため、自動で再開します。'
        )
        currentHookRef.current.startListening()
        return
      }

      // isListeningがtrueでも、実際にアクティブでない場合は再起動
      if (
        isListening &&
        !isSpeaking &&
        !chatProcessing &&
        checkRecognitionActive
      ) {
        if (!checkRecognitionActive()) {
          console.log(
            '🔄 常時マイク入力モード: 音声認識が非アクティブのため再起動します。'
          )
          currentHookRef.current.stopListening()
          setTimeout(() => {
            currentHookRef.current.startListening()
          }, 100)
        }
      }
    }

    // 1秒ごとにチェック
    const intervalId = setInterval(checkAndRestartMic, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [continuousMicListeningMode, speechRecognitionMode])

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
    // マウント時の処理（settingsStore.getState()でstale closure回避）
    if (
      settingsStore.getState().continuousMicListeningMode &&
      settingsStore.getState().speechRecognitionMode === 'browser' &&
      !currentHookRef.current.isListening &&
      !homeStore.getState().isSpeaking &&
      !homeStore.getState().chatProcessing
    ) {
      const delayedStart = async () => {
        console.log('🎤 コンポーネントマウント時に音声認識を自動的に開始します')
        // コンポーネントマウント時に少し遅延させてから開始
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (
          settingsStore.getState().continuousMicListeningMode &&
          !currentHookRef.current.isListening &&
          !homeStore.getState().isSpeaking &&
          !homeStore.getState().chatProcessing
        ) {
          currentHookRef.current.startListening()
        }
      }

      delayedStart()
    }

    return () => {
      // コンポーネントのアンマウント時にマイク入力を停止（ref経由で最新関数を取得）
      if (currentHookRef.current.isListening) {
        currentHookRef.current.stopListening()
      }
    }
  }, []) // マウント時のみ実行（ref経由で最新値を取得）

  // ----- キーボードショートカットの設定 -----
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Alt' && !currentHookRef.current.isListening) {
        // Alt キーを押した時の処理
        handleStopSpeaking()
        await currentHookRef.current.startListening()
      }
    }

    const handleKeyUp = async (e: KeyboardEvent) => {
      if (e.key === 'Alt' && currentHookRef.current.isListening) {
        // Alt キーを離した時の処理
        // マイクボタンと同じ動作をさせるため、toggleListeningを使用せず
        // stopListeningを直接呼び出し、テキストが存在する場合は送信する

        // メッセージを先に変数に保存（stopListening後にuserMessageが変わる可能性があるため）
        const message = currentHookRef.current.userMessage.trim()

        // 先に音声認識を停止
        await currentHookRef.current.stopListening()

        // stopListening完了後にメッセージを送信
        if (message) {
          // chatProcessing を true に設定
          homeStore.setState({ chatProcessing: true })
          // メッセージを空にする
          currentHookRef.current.handleInputChange({
            target: { value: '' },
          } as React.ChangeEvent<HTMLTextAreaElement>)
          // 処理を開始
          onChatProcessStart(message)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleStopSpeaking, onChatProcessStart])

  // 現在のモードに基づいて適切なフックのAPIを返す
  return {
    userMessage: currentHook.userMessage,
    isListening: currentHook.isListening,
    isProcessing:
      'isProcessing' in currentHook ? currentHook.isProcessing : false,
    silenceTimeoutRemaining: currentHook.silenceTimeoutRemaining,
    handleInputChange: currentHook.handleInputChange,
    handleSendMessage: currentHook.handleSendMessage,
    toggleListening: currentHook.toggleListening,
    handleStopSpeaking,
    startListening: currentHook.startListening,
    stopListening: currentHook.stopListening,
  }
}
