import { Message } from '@/features/messages/messages'

/**
 * chatLogから最新のアシスタントメッセージのコンテンツを取得する
 * @param chatLog メッセージログ
 * @returns 最新のアシスタントメッセージの文字列コンテンツ、存在しない場合は空文字
 */
export const getLatestAssistantMessage = (
  chatLog: Message[] | null | undefined
): string => {
  if (!chatLog || chatLog.length === 0) {
    return ''
  }

  const assistantMessages = chatLog.filter((msg) => msg.role === 'assistant')

  if (assistantMessages.length === 0) {
    return ''
  }

  const lastMessage = assistantMessages[assistantMessages.length - 1]

  if (typeof lastMessage.content === 'string') {
    return lastMessage.content
  } else if (Array.isArray(lastMessage.content)) {
    const textContent = lastMessage.content.find((item) => item.type === 'text')
    return textContent && 'text' in textContent ? textContent.text : ''
  }

  return ''
}
