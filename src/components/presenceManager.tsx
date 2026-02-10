/**
 * PresenceManager Component
 *
 * 人感検知機能を管理し、設定に応じて検出を開始/停止する
 */

import { useEffect, useRef, useCallback } from 'react'
import { usePresenceDetection } from '@/hooks/usePresenceDetection'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import { speakCharacter } from '@/features/messages/speakCharacter'
import { Talk } from '@/features/messages/messages'
import { IdlePhrase } from '@/features/idle/idleTypes'
import PresenceIndicator from './presenceIndicator'
import PresenceDebugPreview from './presenceDebugPreview'

const PresenceManager = () => {
  const presenceDetectionEnabled = settingsStore(
    (s) => s.presenceDetectionEnabled
  )
  const presenceDebugMode = settingsStore((s) => s.presenceDebugMode)
  const sessionIdRef = useRef<string | null>(null)
  const completeGreetingRef = useRef<() => void>(() => {})

  // 挨拶開始時のコールバック
  const handleGreetingStart = useCallback((phrase: IdlePhrase) => {
    // セッションIDを生成
    sessionIdRef.current = `presence-${Date.now()}`

    // Talkオブジェクト作成
    const talk: Talk = {
      message: phrase.text,
      emotion: phrase.emotion,
    }

    // chatLogにassistantメッセージとして追加
    homeStore.getState().upsertMessage({
      role: 'assistant',
      content: phrase.text,
    })

    // キャラクターに直接発話させる
    speakCharacter(
      sessionIdRef.current,
      talk,
      () => {
        // onStart - 発話開始時
      },
      () => {
        // onComplete - 発話完了時
        completeGreetingRef.current()
      }
    )
  }, [])

  // 離脱時のコールバック
  const handlePersonDeparted = useCallback(() => {
    const ss = settingsStore.getState()

    // 離脱時メッセージの発話（設定されている場合）
    if (ss.presenceDeparturePhrases.length > 0) {
      const phrase =
        ss.presenceDeparturePhrases[
          Math.floor(Math.random() * ss.presenceDeparturePhrases.length)
        ]
      const departureSessionId = `presence-departure-${Date.now()}`
      const talk: Talk = {
        message: phrase.text,
        emotion: phrase.emotion,
      }

      // chatLogにassistantメッセージとして追加
      homeStore.getState().upsertMessage({
        role: 'assistant',
        content: phrase.text,
      })

      // キャラクターに発話させる
      speakCharacter(
        departureSessionId,
        talk,
        () => {
          // onStart - 発話開始時
        },
        () => {
          // onComplete - 発話完了後に会話履歴クリア
          if (ss.presenceClearChatOnDeparture) {
            homeStore.setState({ chatLog: [] })
          }
        }
      )
    } else {
      // 離脱フレーズがない場合も、設定に応じてチャットをクリア
      if (ss.presenceClearChatOnDeparture) {
        homeStore.setState({ chatLog: [] })
      }
    }
  }, [])

  const {
    startDetection,
    stopDetection,
    completeGreeting,
    videoRef,
    detectionResult,
    isDetecting,
  } = usePresenceDetection({
    onGreetingStart: handleGreetingStart,
    onPersonDeparted: handlePersonDeparted,
  })

  // completeGreetingをrefに保存（useCallbackの循環参照を避けるため）
  useEffect(() => {
    completeGreetingRef.current = completeGreeting
  }, [completeGreeting])

  // 設定の有効/無効に応じて検出を開始/停止
  useEffect(() => {
    if (presenceDetectionEnabled && !isDetecting) {
      startDetection()
    } else if (!presenceDetectionEnabled && isDetecting) {
      stopDetection()
    }
  }, [presenceDetectionEnabled, isDetecting, startDetection, stopDetection])

  // コンポーネントがアンマウントされるときに停止
  useEffect(() => {
    return () => {
      stopDetection()
    }
  }, [stopDetection])

  return (
    <>
      {/* 状態インジケーター */}
      <div className="absolute top-4 right-4 z-30">
        <PresenceIndicator />
      </div>

      {/* デバッグプレビュー（検出用ビデオも兼ねる） */}
      {presenceDetectionEnabled && (
        <div
          className={`absolute bottom-20 right-4 z-30 w-48 ${presenceDebugMode ? '' : 'opacity-0 pointer-events-none'}`}
        >
          <PresenceDebugPreview
            videoRef={videoRef}
            detectionResult={detectionResult}
          />
        </div>
      )}
    </>
  )
}

export default PresenceManager
