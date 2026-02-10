import { useState, useEffect, useCallback, useRef } from 'react'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import { speakCharacter } from '@/features/messages/speakCharacter'
import { SpeakQueue } from '@/features/messages/speakQueue'
import { IdlePhrase, EmotionType } from '@/features/idle/idleTypes'
import { Talk } from '@/features/messages/messages'
import { generateIdleAIPhrase } from '@/features/idle/generateIdleAIPhrase'

/**
 * アイドル状態の型定義
 */
export type IdleState = 'disabled' | 'waiting' | 'speaking'

/**
 * useIdleModeフックのプロパティ
 */
export interface UseIdleModeProps {
  onIdleSpeechStart?: (phrase: { text: string; emotion: EmotionType }) => void
  onIdleSpeechComplete?: () => void
  onIdleSpeechInterrupted?: () => void
}

/**
 * useIdleModeフックの戻り値
 */
export interface UseIdleModeReturn {
  /** アイドル発話がアクティブかどうか */
  isIdleActive: boolean
  /** 現在の状態 */
  idleState: IdleState
  /** 手動でタイマーをリセット */
  resetTimer: () => void
  /** 手動で発話を停止 */
  stopIdleSpeech: () => void
  /** 次の発話までの残り秒数 */
  secondsUntilNextSpeech: number
}

/**
 * 時間帯を判定する関数
 */
function getTimePeriod(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) {
    return 'morning'
  } else if (hour >= 11 && hour < 17) {
    return 'afternoon'
  } else {
    return 'evening'
  }
}

/**
 * アイドルモードのコアロジックを提供するカスタムフック
 *
 * 会話経過時間を監視し、設定された時間が経過したら自動発話をトリガーする。
 * 人感検知・AI処理中との競合を回避し、VRM/Live2D両モデルでモーション連動する。
 *
 * @param props - コールバック群
 * @returns アイドルモードの状態と制御関数
 */
export function useIdleMode({
  onIdleSpeechStart,
  onIdleSpeechComplete,
  onIdleSpeechInterrupted,
}: UseIdleModeProps): UseIdleModeReturn {
  // ----- 設定の取得 -----
  const idleModeEnabled = settingsStore((s) => s.idleModeEnabled)
  const idlePhrases = settingsStore((s) => s.idlePhrases)
  const idlePlaybackMode = settingsStore((s) => s.idlePlaybackMode)
  const idleInterval = settingsStore((s) => s.idleInterval)
  const idleTimePeriodEnabled = settingsStore((s) => s.idleTimePeriodEnabled)
  const idleTimePeriodMorning = settingsStore((s) => s.idleTimePeriodMorning)
  const idleTimePeriodMorningEmotion = settingsStore(
    (s) => s.idleTimePeriodMorningEmotion
  )
  const idleTimePeriodAfternoon = settingsStore(
    (s) => s.idleTimePeriodAfternoon
  )
  const idleTimePeriodAfternoonEmotion = settingsStore(
    (s) => s.idleTimePeriodAfternoonEmotion
  )
  const idleTimePeriodEvening = settingsStore((s) => s.idleTimePeriodEvening)
  const idleTimePeriodEveningEmotion = settingsStore(
    (s) => s.idleTimePeriodEveningEmotion
  )
  const idleAiGenerationEnabled = settingsStore(
    (s) => s.idleAiGenerationEnabled
  )

  // ----- 状態 -----
  const [idleState, setIdleState] = useState<IdleState>(
    idleModeEnabled ? 'waiting' : 'disabled'
  )
  const [secondsUntilNextSpeech, setSecondsUntilNextSpeech] =
    useState<number>(idleInterval)

  // ----- Refs -----
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentPhraseIndexRef = useRef<number>(0)
  const sessionIdRef = useRef<string | null>(null)

  // Callback refs to avoid stale closures
  const callbackRefs = useRef({
    onIdleSpeechStart,
    onIdleSpeechComplete,
    onIdleSpeechInterrupted,
  })

  // Update callback refs in useEffect to avoid accessing refs during render
  useEffect(() => {
    callbackRefs.current = {
      onIdleSpeechStart,
      onIdleSpeechComplete,
      onIdleSpeechInterrupted,
    }
  })

  // ----- 発話条件判定 -----
  const canSpeak = useCallback((): boolean => {
    const hs = homeStore.getState()

    // AI処理中は発話しない
    if (hs.chatProcessingCount > 0) {
      return false
    }

    // 発話中は発話しない
    if (hs.isSpeaking) {
      return false
    }

    // 人感検知で人がいる場合は発話しない
    if (hs.presenceState !== 'idle') {
      return false
    }

    return true
  }, [])

  // ----- セリフ選択 -----
  const selectPhrase = useCallback((): {
    text: string
    emotion: EmotionType
  } | null => {
    // 時間帯別挨拶が有効な場合
    if (idleTimePeriodEnabled) {
      const period = getTimePeriod()
      let text: string
      let emotion: EmotionType
      switch (period) {
        case 'morning':
          text = idleTimePeriodMorning
          emotion = idleTimePeriodMorningEmotion
          break
        case 'afternoon':
          text = idleTimePeriodAfternoon
          emotion = idleTimePeriodAfternoonEmotion
          break
        case 'evening':
          text = idleTimePeriodEvening
          emotion = idleTimePeriodEveningEmotion
          break
      }
      if (text) {
        return { text, emotion }
      }
    }

    // 発話リストが空の場合
    if (idlePhrases.length === 0) {
      // AI生成モードの場合はtriggerSpeech側で非同期処理する
      return null
    }

    // 発話リストをorder順にソート
    const sortedPhrases = [...idlePhrases].sort((a, b) => a.order - b.order)

    let phrase: IdlePhrase

    if (idlePlaybackMode === 'sequential') {
      // 順番モード
      phrase = sortedPhrases[currentPhraseIndexRef.current]
      currentPhraseIndexRef.current =
        (currentPhraseIndexRef.current + 1) % sortedPhrases.length
    } else {
      // ランダムモード
      const randomIndex = Math.floor(Math.random() * sortedPhrases.length)
      phrase = sortedPhrases[randomIndex]
    }

    return { text: phrase.text, emotion: phrase.emotion }
  }, [
    idlePhrases,
    idlePlaybackMode,
    idleTimePeriodEnabled,
    idleTimePeriodMorning,
    idleTimePeriodMorningEmotion,
    idleTimePeriodAfternoon,
    idleTimePeriodAfternoonEmotion,
    idleTimePeriodEvening,
    idleTimePeriodEveningEmotion,
    idleAiGenerationEnabled,
  ])

  // ----- 発話実行 -----
  const triggerSpeech = useCallback(async () => {
    if (!canSpeak()) {
      return
    }

    let phrase: { text: string; emotion: EmotionType } | null = null

    // AI自動生成モードの場合
    let isAiGenerated = false
    if (idleAiGenerationEnabled && !idleTimePeriodEnabled) {
      const ss = settingsStore.getState()
      phrase = await generateIdleAIPhrase(ss.idleAiPromptTemplate)
      isAiGenerated = true
    } else {
      phrase = selectPhrase()
    }

    if (!phrase) {
      // セリフがない場合はスキップしてタイマーリセット
      setSecondsUntilNextSpeech(idleInterval)
      return
    }

    // AI生成の場合はchatLogにアシスタントメッセージとして追加
    if (isAiGenerated) {
      homeStore.getState().upsertMessage({
        role: 'assistant',
        content: phrase.text,
      })
    }

    // 状態を speaking に変更
    setIdleState('speaking')

    // コールバック呼び出し
    callbackRefs.current.onIdleSpeechStart?.(phrase)

    // Talk オブジェクト作成
    const talk: Talk = {
      message: phrase.text,
      emotion: phrase.emotion,
    }

    // セッションIDを更新
    sessionIdRef.current = `idle-${Date.now()}`

    // 発話実行
    speakCharacter(
      sessionIdRef.current,
      talk,
      () => {
        // onStart - 何もしない（既に状態は変更済み）
      },
      () => {
        // onComplete
        setIdleState('waiting')
        setSecondsUntilNextSpeech(idleInterval)
        callbackRefs.current.onIdleSpeechComplete?.()
      }
    )
  }, [
    canSpeak,
    selectPhrase,
    idleInterval,
    idleAiGenerationEnabled,
    idleTimePeriodEnabled,
  ])

  // ----- タイマーリセット -----
  const resetTimer = useCallback(() => {
    setSecondsUntilNextSpeech(idleInterval)
  }, [idleInterval])

  // ----- 発話停止 -----
  const stopIdleSpeech = useCallback(() => {
    SpeakQueue.stopAll()
    setIdleState('waiting')
    setSecondsUntilNextSpeech(idleInterval)
    callbackRefs.current.onIdleSpeechInterrupted?.()
  }, [idleInterval])

  // ----- アイドルモード有効/無効の監視 -----
  useEffect(() => {
    if (idleModeEnabled) {
      setIdleState('waiting')
      setSecondsUntilNextSpeech(idleInterval)
    } else {
      setIdleState('disabled')
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [idleModeEnabled, idleInterval])

  // ----- タイマー処理 -----
  useEffect(() => {
    if (!idleModeEnabled || idleState === 'disabled') {
      return
    }

    // 既存タイマーをクリア
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // 毎秒タイマーを設定（カウントダウンのみ）
    timerRef.current = setInterval(() => {
      setSecondsUntilNextSpeech((prev) => prev - 1)
    }, 1000)

    // クリーンアップ
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [idleModeEnabled, idleState])

  // ----- 発話トリガー（カウントダウン0以下で発火）-----
  useEffect(() => {
    if (
      secondsUntilNextSpeech <= 0 &&
      idleModeEnabled &&
      idleState === 'waiting'
    ) {
      triggerSpeech()
      setSecondsUntilNextSpeech(idleInterval)
    }
  }, [
    secondsUntilNextSpeech,
    idleModeEnabled,
    idleState,
    idleInterval,
    triggerSpeech,
  ])

  // ----- chatLog変更の監視（ユーザー入力検知） -----
  useEffect(() => {
    const unsubscribe = homeStore.subscribe((state, prevState) => {
      // chatLogが変更された場合タイマーをリセット
      if (state.chatLog !== prevState.chatLog && state.chatLog.length > 0) {
        resetTimer()

        // 発話中の場合は停止
        if (idleState === 'speaking') {
          stopIdleSpeech()
        }
      }
    })

    return unsubscribe
  }, [idleState, resetTimer, stopIdleSpeech])

  return {
    isIdleActive: idleModeEnabled && idleState !== 'disabled',
    idleState,
    resetTimer,
    stopIdleSpeech,
    secondsUntilNextSpeech,
  }
}
