import { FC } from 'react'
import useYoutube from './useYoutube'
import { handleSendChatFn } from '@/features/chat/handlers'

export const YoutubeManager: FC = () => {
  const handleSendChat = handleSendChatFn()

  useYoutube({ handleSendChat })

  return null
}
