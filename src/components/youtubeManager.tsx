import { FC, useCallback } from 'react'
import useYoutube from './useYoutube'
import { handleSendChatFn } from '@/features/chat/handlers'

export const YoutubeManager: FC = () => {
  const handleSendChat = useCallback((text: string, userName?: string) => {
    const fn = handleSendChatFn()
    return fn(text, 'youtube', userName)
  }, [])

  useYoutube({ handleSendChat })

  return null
}
