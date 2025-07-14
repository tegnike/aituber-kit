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

  // 配列の末尾から逆順に検索してパフォーマンスを向上
  for (let i = chatLog.length - 1; i >= 0; i--) {
    const msg = chatLog[i]
    if (msg.role === 'assistant') {
      if (typeof msg.content === 'string') {
        return msg.content
      } else if (Array.isArray(msg.content)) {
        const textContent = msg.content.find(
          (item: { type: string }) => item.type === 'text'
        )
        return textContent && 'text' in textContent ? textContent.text : ''
      }
      return ''
    }
  }

  return ''
}
