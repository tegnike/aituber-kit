import { Message } from './messages'

export const messageSelectors = {
  // テキストまたは画像を含むメッセージのみを取得
  getTextAndImageMessages: (messages: Message[]): Message[] => {
    return messages
      .filter(
        (message) => message.content !== null && message.content !== undefined
      )
      .filter((message) => {
        if (
          typeof message.content === 'string' ||
          Array.isArray(message.content)
        ) {
          return true
        }
        return false
      })
  },

  getProcessedMessages: (messages: Message[]): Message[] => {
    return messages
      .map((message, index) => ({
        role: ['assistant', 'user', 'system'].includes(message.role)
          ? message.role
          : 'assistant',
        content:
          index === messages.length - 1
            ? message.content
            : Array.isArray(message.content)
              ? message.content[0].text
              : message.content,
      }))
      .slice(-10)
  },

  normalizeMessages: (messages: Message[]): Message[] => {
    let lastImageUrl = ''
    return messages
      .reduce((acc: Message[], item: Message) => {
        if (
          typeof item.content != 'string' &&
          item.content[0] &&
          item.content[1]
        ) {
          lastImageUrl = item.content[1].image
        }

        const lastItem = acc[acc.length - 1]
        if (lastItem && lastItem.role === item.role) {
          if (typeof item.content != 'string') {
            lastItem.content += ' ' + item.content[0].text
          } else {
            lastItem.content += ' ' + item.content
          }
        } else {
          const text =
            typeof item.content != 'string'
              ? item.content[0].text
              : item.content
          if (lastImageUrl != '') {
            acc.push({
              ...item,
              content: [
                { type: 'text', text: text.trim() },
                { type: 'image', image: lastImageUrl },
              ],
            })
            lastImageUrl = ''
          } else {
            acc.push({ ...item, content: text.trim() })
          }
        }
        return acc
      }, [])
      .filter((item) => item.content !== '')
  },

  cutImageMessage: (messages: Message[]): Message[] => {
    return messages.map((message: Message) => ({
      ...message,
      content:
        typeof message.content === 'string'
          ? message.content
          : message.content[0].text,
    }))
  },
}
