import { FC } from 'react'
import useYoutube from './useYoutube'
import { handleSendChatFn } from '@/features/chat/handlers'

export const YoutubeManager: FC = () => {
  const handleSendChat = handleSendChatFn()

  const { oneCommeStatus } = useYoutube({ handleSendChat })

  if (oneCommeStatus.error) {
    console.warn('OneComme connection error:', oneCommeStatus.error)
  }

  return null
}
