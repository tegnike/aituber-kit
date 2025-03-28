import { Message } from '@/features/messages/messages'

/**
 * AIサービスとモデルに応じてメッセージを修正する
 */
export function modifyMessages(
  aiService: string,
  model: string,
  messages: Message[]
): Message[] {
  if (
    aiService === 'anthropic' ||
    aiService === 'perplexity' ||
    (aiService === 'deepseek' && model === 'deepseek-reasoner')
  ) {
    return modifyAnthropicMessages(messages)
  }
  return messages
}

/**
 * Anthropicのメッセージフォーマットに合わせて修正する
 */
function modifyAnthropicMessages(messages: Message[]): Message[] {
  const systemMessage: Message | undefined = messages.find(
    (message) => message.role === 'system'
  )
  let userMessages = messages
    .filter((message) => message.role !== 'system')
    .filter((message) => message.content !== '')

  userMessages = consolidateMessages(userMessages)

  while (userMessages.length > 0 && userMessages[0].role !== 'user') {
    userMessages.shift()
  }

  const result: Message[] = systemMessage
    ? [systemMessage, ...userMessages]
    : userMessages
  return result
}

/**
 * 同じroleのメッセージを結合する
 */
export function consolidateMessages(messages: Message[]) {
  const consolidated: Message[] = []
  let lastRole: string | null = null
  let combinedContent:
    | string
    | [
        {
          type: 'text'
          text: string
        },
        {
          type: 'image'
          image: string
        },
      ]

  messages.forEach((message, index) => {
    if (message.role === lastRole) {
      if (typeof combinedContent === 'string') {
        combinedContent += '\n' + message.content
      } else {
        combinedContent[0].text += '\n' + message.content
      }
    } else {
      if (lastRole !== null) {
        consolidated.push({ role: lastRole, content: combinedContent })
      }
      lastRole = message.role
      combinedContent = message.content || ''
    }

    if (index === messages.length - 1) {
      consolidated.push({ role: lastRole, content: combinedContent })
    }
  })

  return consolidated
}
