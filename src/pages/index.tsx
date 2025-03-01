import { Form } from '@/components/form'
import MessageReceiver from '@/components/messageReceiver'
import { Introduction } from '@/components/introduction'
import { Menu } from '@/components/menu'
import { Meta } from '@/components/meta'
import ModalImage from '@/components/modalImage'
import VrmViewer from '@/components/vrmViewer'
import Live2DViewer from '@/components/live2DViewer'
import { Toasts } from '@/components/toasts'
import { WebSocketManager } from '@/components/websocketManager'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import '@/lib/i18n'
import { buildUrl } from '@/utils/buildUrl'
import { YoutubeManager } from '@/components/youtubeManager'
import { useEffect, useState } from 'react'
import { CameraMonitor } from '@/components/cameraMonitor'
import { MessageInputContainer } from '@/components/messageInputContainer'
import { handleSendChatFn } from '@/features/chat/handlers'

const Home = () => {
  const webcamStatus = homeStore((s) => s.webcamStatus)
  const captureStatus = homeStore((s) => s.captureStatus)
  const backgroundImageUrl = homeStore((s) => s.backgroundImageUrl)
  const useVideoAsBackground = settingsStore((s) => s.useVideoAsBackground)
  const bgUrl =
    (webcamStatus || captureStatus) && useVideoAsBackground
      ? ''
      : `url(${buildUrl(backgroundImageUrl)})`
  const messageReceiverEnabled = settingsStore((s) => s.messageReceiverEnabled)
  const modelType = settingsStore((s) => s.modelType)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)

  // ユーザー検出ハンドラ
  const handleUserDetected = (userId: string, newUser: boolean) => {
    setCurrentUserId(userId)
    setIsNewUser(newUser)
    
    // 新規ユーザー検出時の追加処理があればここに記述
    if (newUser) {
      console.log('新しいユーザーを歓迎する処理を実行')
    }
  }

  // チャット送信ハンドラ
  const handleSendChat = handleSendChatFn()

  return (
    <div className="h-[100svh] bg-cover" style={{ backgroundImage: bgUrl }}>
      <Meta />
      <Introduction />
      {modelType === 'vrm' ? <VrmViewer /> : <Live2DViewer />}
      <Form />
      <Menu />
      <ModalImage />
      {messageReceiverEnabled && <MessageReceiver />}
      <Toasts />
      <WebSocketManager />
      <YoutubeManager />
      {/* バックグラウンドでカメラ監視を実行 */}
      <CameraMonitor onUserDetected={handleUserDetected} />
      
      {/* メッセージ入力と送信 */}
      <MessageInputContainer onChatProcessStart={(text) => handleSendChat(text, currentUserId)} />
      
      {/* ユーザー情報表示 (デバッグ用) */}
      {currentUserId && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded">
          ユーザー: {currentUserId} {isNewUser ? '(新規)' : '(継続)'}
        </div>
      )}
    </div>
  )
}

export default Home
