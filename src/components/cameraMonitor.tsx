import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchUserIdFromCamera, updateUserId } from '@/features/chat/handlers'
import { isNewUser, addUserToHistory } from '@/utils/userHistory'
import settingsStore from '@/features/stores/settings'

type CameraMonitorProps = {
  onUserDetected?: (userId: string, isNewUser: boolean) => void
  onUserDisappeared?: () => void
  pollInterval?: number // ポーリング間隔（ミリ秒）
}

export const CameraMonitor = ({
  onUserDetected,
  onUserDisappeared,
  pollInterval = 5000, // デフォルトは5秒ごと
}: CameraMonitorProps) => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const previousUserIdRef = useRef<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const checkForUserChanges = useCallback(async () => {
    try {
      const userId = await fetchUserIdFromCamera(undefined)
      //console.log('ユーザーID:', userId) // for debug
      
      // ユーザーIDが取得できた場合
      if (userId) {
        const userIsNew = isNewUser(userId)
        
        // ユーザーIDが変更された場合
        if (previousUserIdRef.current !== userId) {
          console.log(`ユーザー変更検出: ${previousUserIdRef.current || 'なし'} → ${userId}`)
          previousUserIdRef.current = userId
          
          // ユーザーIDをグローバルに更新
          updateUserId(userId)
          
          // 履歴に追加
          addUserToHistory(userId)
          
          // コールバック実行
          if (onUserDetected) {
            onUserDetected(userId, userIsNew)
          }
        }
      }
      else {
        // ユーザーIDが取得できなかった場合
        console.log('ユーザー消失検出')
        //previousUserIdRef.current = null
        
        // コールバック実行
        if (onUserDisappeared) {
          onUserDisappeared()
        }
      } 
    } catch (error) {
      console.error('カメラAPIからのユーザー検出エラー:', error)
    }
  }, [onUserDetected,onUserDisappeared])

  // モニタリング開始
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return
    
    console.log('カメラによるユーザー監視を開始')
    setIsMonitoring(true)
    
    // 即時に1回実行
    //checkForUserChanges()
    
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