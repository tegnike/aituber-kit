import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchUserIdFromCamera, updateUserId } from '@/features/chat/handlers'
import settingsStore from '@/features/stores/settings'

type CameraMonitorProps = {
  onUserDetected?: (userId: string, isNewUser: boolean) => void
  pollInterval?: number // ポーリング間隔（ミリ秒）
  apiUrl?: string
}

export const CameraMonitor = ({
  onUserDetected,
  pollInterval = 5000, // デフォルトは5秒ごと
  apiUrl = 'http://localhost:8000/data/'
}: CameraMonitorProps) => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const previousUserIdRef = useRef<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const checkForUserChanges = useCallback(async () => {
    try {
      const userId = await fetchUserIdFromCamera(undefined, apiUrl)
      
      // ユーザーIDが取得できた場合
      if (userId) {
        const prevUserId = previousUserIdRef.current
        const isNewUser = prevUserId !== userId
        
        // ユーザーIDが変更された場合
        if (isNewUser) {
          console.log(`ユーザー変更検出: ${prevUserId || 'なし'} → ${userId}`)
          previousUserIdRef.current = userId
          
          // ユーザーIDをグローバルに更新
          updateUserId(userId)
          
          // コールバック実行
          if (onUserDetected) {
            onUserDetected(userId, prevUserId === null || prevUserId !== userId)
          }
        }
      }
    } catch (error) {
      console.error('カメラAPIからのユーザー検出エラー:', error)
    }
  }, [apiUrl, onUserDetected])

  // モニタリング開始
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return
    
    console.log('カメラによるユーザー監視を開始')
    setIsMonitoring(true)
    
    // 即時に1回実行
    checkForUserChanges()
    
    // 定期的なポーリングを設定
    timerRef.current = setInterval(checkForUserChanges, pollInterval)
  }, [checkForUserChanges, isMonitoring, pollInterval])

  // モニタリング停止
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return
    
    console.log('カメラによるユーザー監視を停止')
    setIsMonitoring(false)
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [isMonitoring])

  // コンポーネントマウント時に監視開始
  useEffect(() => {
    startMonitoring()
    
    // アンマウント時に監視停止
    return () => {
      stopMonitoring()
    }
  }, [startMonitoring, stopMonitoring])

  // 表示要素なし（バックグラウンド処理のみ）
  return null
}