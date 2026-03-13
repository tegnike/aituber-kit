import { useState, useCallback, useRef, MutableRefObject } from 'react'
import settingsStore from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'
import { useTranslation } from 'react-i18next'

type UseSilenceDetectionProps = {
  onTextDetected: (text: string) => void
  transcriptRef: MutableRefObject<string>
  setUserMessage: (message: string) => void
  speechDetectedRef: MutableRefObject<boolean>
}

export function useSilenceDetection({
  onTextDetected,
  transcriptRef,
  setUserMessage,
  speechDetectedRef,
}: UseSilenceDetectionProps) {
  // 無音タイムアウト残り時間のステート
  const [silenceTimeoutRemaining, setSilenceTimeoutRemaining] = useState<
    number | null
  >(null)
  const { t } = useTranslation()

  // 無音検出用の追加変数
  const lastSpeechTimestamp = useRef<number>(0)
  const silenceCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const speechEndedRef = useRef<boolean>(false)

  // 無音検出をクリーンアップする関数
  const clearSilenceDetection = useCallback(() => {
    if (silenceCheckInterval.current) {
      clearInterval(silenceCheckInterval.current)
      silenceCheckInterval.current = null
    }
    // 残り時間表示をリセット
    setSilenceTimeoutRemaining(null)
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
      // 初期状態では残り時間表示をnullに設定（プログレスバーを非表示に）
      setSilenceTimeoutRemaining(null)
      console.log(
        '🎤 無音検出を開始しました。無音検出タイムアウトの設定値に基づいて自動送信します。'
      )

      // 100ms間隔で無音状態をチェック
      silenceCheckInterval.current = setInterval(async () => {
        // すでに音声終了処理が行われていれば何もしない
        if (speechEndedRef.current) {
          console.log(
            '🔇 すでに音声終了処理が完了しているため、無音チェックをスキップします'
          )
          return
        }

        // 現在時刻と最終音声検出時刻の差を計算
        const silenceDuration = Date.now() - lastSpeechTimestamp.current
        const noSpeechTimeoutMs =
          settingsStore.getState().noSpeechTimeout * 1000

        // 常に無音時間をログ表示
        if (silenceDuration <= noSpeechTimeoutMs) {
          console.log(
            `🔊 無音経過時間: ${silenceDuration}ms / 閾値: ${noSpeechTimeoutMs}ms（${(silenceDuration / 1000).toFixed(1)}秒 / ${(noSpeechTimeoutMs / 1000).toFixed(1)}秒）`
          )
        }

        const initialSpeechTimeout =
          settingsStore.getState().initialSpeechTimeout

        // 無音状態が設定値以上続いた場合は、テキストの有無に関わらず音声認識を停止
        if (
          initialSpeechTimeout > 0 &&
          silenceDuration >= initialSpeechTimeout * 1000 &&
          !speechEndedRef.current &&
          !speechDetectedRef.current
        ) {
          console.log(
            `⏱️ ${silenceDuration}ms の長時間無音を検出しました。音声認識を停止します。`
          )
          // 重複実行を防ぐためにフラグをセット
          speechEndedRef.current = true
          setSilenceTimeoutRemaining(null)

          // stopListeningFnを呼び出す前にインターバルをクリア（二重停止防止）
          if (silenceCheckInterval.current) {
            clearInterval(silenceCheckInterval.current)
            silenceCheckInterval.current = null
          }

          // 常時マイク入力モードをOFFに設定
          if (settingsStore.getState().continuousMicListeningMode) {
            console.log(
              '🔇 長時間無音検出により常時マイク入力モードをOFFに設定します。'
            )
            settingsStore.setState({ continuousMicListeningMode: false })
          }

          // stopListeningFnを非同期で呼び出し
          try {
            await stopListeningFn()
            console.log(
              '🛑 無音検出タイムアウトによる音声認識停止が完了しました'
            )
          } catch (error) {
            console.error(
              '🔴 無音検出タイムアウトによる音声認識停止でエラーが発生しました:',
              error
            )
          }

          // トースト通知を表示
          toastStore.getState().addToast({
            message: t('Toasts.NoSpeechDetected'),
            type: 'info',
            tag: 'no-speech-detected-long-silence',
          })
        }
        // 無音状態が設定値以上続いたかつテキストがある場合は自動送信
        else if (
          settingsStore.getState().noSpeechTimeout > 0 &&
          silenceDuration >= noSpeechTimeoutMs &&
          !speechEndedRef.current
        ) {
          const trimmedTranscript = transcriptRef.current.trim()
          console.log(
            `⏱️ ${silenceDuration}ms の無音を検出しました（閾値: ${noSpeechTimeoutMs}ms）。無音検出タイムアウトが0秒の場合は自動送信は無効です。`
          )
          console.log(`📝 認識テキスト: "${trimmedTranscript}"`)

          if (
            trimmedTranscript &&
            settingsStore.getState().noSpeechTimeout > 0
          ) {
            // 送信前にフラグを立てて重複送信を防止
            speechEndedRef.current = true
            setSilenceTimeoutRemaining(null)

            // stopListeningFnを呼び出す前にインターバルをクリア（二重停止防止）
            if (silenceCheckInterval.current) {
              clearInterval(silenceCheckInterval.current)
              silenceCheckInterval.current = null
            }

            console.log('✅ 無音検出による自動送信を実行します')
            // 無音検出で自動送信
            onTextDetected(trimmedTranscript)
            setUserMessage('')

            // stopListeningFnを非同期で呼び出し
            try {
              await stopListeningFn()
              console.log(
                '🛑 無音検出による自動送信の後、音声認識停止が完了しました'
              )
            } catch (error) {
              console.error(
                '🔴 無音検出による自動送信の後、音声認識停止でエラーが発生しました:',
                error
              )
            }
          }
        }
        // 残り時間を更新（音声が検出された後、かつテキストがある場合のみ）
        else if (
          settingsStore.getState().noSpeechTimeout > 1 &&
          !speechEndedRef.current &&
          speechDetectedRef.current &&
          transcriptRef.current.trim() !== ''
        ) {
          const remainingTime = Math.max(0, noSpeechTimeoutMs - silenceDuration)
          setSilenceTimeoutRemaining(remainingTime)
        }
      }, 100) // 100msごとにチェック
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- transcriptRefはrefオブジェクトのため依存配列不要
    [onTextDetected, setUserMessage, speechDetectedRef, t]
  )

  // 音声検出時刻を更新する関数
  const updateSpeechTimestamp = useCallback(() => {
    lastSpeechTimestamp.current = Date.now()
  }, [])

  // 現在speechEndedの状態を取得
  const isSpeechEnded = useCallback(() => {
    return speechEndedRef.current
  }, [])

  return {
    silenceTimeoutRemaining,
    clearSilenceDetection,
    startSilenceDetection,
    updateSpeechTimestamp,
    isSpeechEnded,
  }
}
