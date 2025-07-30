import { FC } from 'react'
import useExternalLinkage from './useExternalLinkage'
import useRealtimeAPI from './useRealtimeAPI'
import {
  handleReceiveTextFromWsFn,
  handleReceiveTextFromRtFn,
} from '@/features/chat/handlers'

export const WebSocketManager: FC = () => {
  // ハンドラー関数を初期化
  const handleReceiveTextFromWs = handleReceiveTextFromWsFn()
  const handleReceiveTextFromRt = handleReceiveTextFromRtFn()

  // WebSocket関連の機能をここで初期化
  useExternalLinkage({ handleReceiveTextFromWs })
  useRealtimeAPI({ handleReceiveTextFromRt })

  // このコンポーネントは表示要素を持たない
  return null
}
