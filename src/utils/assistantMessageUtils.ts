import { Message } from '@/features/messages/messages'

/**
 * chatLogから最新のアシスタントメッセージのコンテンツを取得する
 * @param chatLog メッセージログ
 * @returns 最新のアシスタントメッセージの文字列コンテンツ、存在しない場合は空文字
 */
export const getLatestAssistantMessage = (chatLog: Message[]): string => {
  const assistantMessages = chatLog.filter((msg) => msg.role === 'assistant')

  if (assistantMessages.length === 0) {
    return ''
  }

  const lastMessage = assistantMessages[assistantMessages.length - 1]
  return typeof lastMessage.content === 'string' ? lastMessage.content : ''
}
