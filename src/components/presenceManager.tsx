/**
 * PresenceManager Component
 *
 * 人感検知機能を管理し、設定に応じて検出を開始/停止する
 */

import { useEffect } from 'react'
import { usePresenceDetection } from '@/hooks/usePresenceDetection'
import { handleSendChatFn } from '@/features/chat/handlers'
import settingsStore from '@/features/stores/settings'
import PresenceIndicator from './presenceIndicator'
import PresenceDebugPreview from './presenceDebugPreview'

const PresenceManager = () => {
  const presenceDetectionEnabled = settingsStore(
    (s) => s.presenceDetectionEnabled
  )
  const presenceDebugMode = settingsStore((s) => s.presenceDebugMode)
  const handleSendChat = handleSendChatFn()

  const {
    startDetection,
    stopDetection,
    completeGreeting,
    videoRef,
    detectionResult,
    isDetecting,
  } = usePresenceDetection({
    onGreetingStart: async (message: string) => {
      // 挨拶メッセージをAIに送信
      await handleSendChat(message)
      // 挨拶完了
      completeGreeting()
    },
  })

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
