import { useCallback, useEffect, useState, useRef } from 'react'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import slideStore from '@/features/stores/slide'
import { handleSendChatFn, fetchUserIdFromCamera } from '../features/chat/handlers'
import { MessageInputContainer } from './messageInputContainer'
import { SlideText } from './slideText'

export const Form = () => {
  const modalImage = homeStore((s) => s.modalImage)
  const webcamStatus = homeStore((s) => s.webcamStatus)
  const captureStatus = homeStore((s) => s.captureStatus)
  const slideMode = settingsStore((s) => s.slideMode)
  const slideVisible = menuStore((s) => s.slideVisible)
  const slidePlaying = slideStore((s) => s.isPlaying)
  const chatProcessingCount = homeStore((s) => s.chatProcessingCount)
  const [delayedText, setDelayedText] = useState('')
  const handleSendChat = handleSendChatFn()
  
  // ユーザーID管理用
  const currentUserIdRef = useRef<string | null>(null)
  const [monitoringActive, setMonitoringActive] = useState(true)
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ユーザーID監視の開始
  useEffect(() => {
    // カメラAPIからユーザーIDを定期的に取得
    if (monitoringActive) {
      // 初回実行
      fetchUserIdFromCamera((userId) => {
        if (userId) {
          currentUserIdRef.current = userId
          console.log(`初期ユーザーID設定: ${userId}`)
        }
      });
      
      // 定期的な監視設定
      monitoringIntervalRef.current = setInterval(() => {
        fetchUserIdFromCamera((userId) => {
          if (userId && userId !== currentUserIdRef.current) {
            const prevUserId = currentUserIdRef.current
            currentUserIdRef.current = userId
            console.log(`ユーザーID変更検出: ${prevUserId || 'なし'} → ${userId}`)
            
            // ここで新規ユーザー検出時の特別な処理を行うことができます
            // 例: 音声入力の自動開始など
          }
        });
      }, 5000); // 5秒ごとに監視
    }
    
    // クリーンアップ関数
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, [monitoringActive]);

  useEffect(() => {
    // テキストと画像がそろったら、チャットを送信
    if (delayedText && modalImage) {
      // 現在のユーザーIDを渡してチャットを送信
      handleSendChat(delayedText, currentUserIdRef.current || undefined)
      setDelayedText('')
    }
  }, [modalImage, delayedText, handleSendChat])

  const hookSendChat = useCallback(
    (text: string) => {
      // すでにmodalImageが存在する場合は、Webcamのキャプチャーをスキップ
      if (!homeStore.getState().modalImage) {
        homeStore.setState({ triggerShutter: true })
      }

      // MENUの中でshowCameraがtrueの場合、画像が取得されるまで待機
      if (webcamStatus || captureStatus) {
        // Webcamが開いている場合
        setDelayedText(text) // 画像が取得されるまで遅延させる
      } else {
        // 現在のユーザーIDを渡してチャットを送信
        handleSendChat(text, currentUserIdRef.current || undefined)
      }
    },
    [handleSendChat, webcamStatus, captureStatus, setDelayedText]
  )

  // MessageInputContainer に渡すProps
  const inputProps = {
    onChatProcessStart: hookSendChat,
    // 新しいユーザーが検出された時に自動音声入力を開始するかどうかのフラグ
    enableAutoVoiceStart: true,
    currentUserId: currentUserIdRef.current
  }

  return slideMode &&
    slideVisible &&
    (slidePlaying || chatProcessingCount !== 0) ? (
    <SlideText />
  ) : (
    <MessageInputContainer {...inputProps} />
  )
}