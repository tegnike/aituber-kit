import { FC } from 'react'
import useYoutube from './useYoutube'
import { handleSendChatFn } from '@/features/chat/handlers'
import { useTranslation } from 'react-i18next'

export const YoutubeManager: FC = () => {
  const { t } = useTranslation()
  const handleSendChat = handleSendChatFn({
    NotConnectedToExternalAssistant: t('NotConnectedToExternalAssistant'),
    APIKeyNotEntered: t('APIKeyNotEntered'),
  })

  useYoutube({ handleSendChat })

  return null
}
