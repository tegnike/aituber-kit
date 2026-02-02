import { Message } from '@/features/messages/messages'
import {
  DEFAULT_PROMPT_EVALUATE,
  DEFAULT_PROMPT_NEW_TOPIC,
  DEFAULT_PROMPT_SELECT_COMMENT,
} from './defaultPrompts'

/**
 * 直近Nメッセージを取得し、user/assistant のみに絞り、
 * 連続する同一roleをマージする。
 * 先頭がuserでない場合は先頭から削除し、
 * 末尾がassistantの場合はダミーuserメッセージを追加する。
 */
export function getLastMessages(
  messages: Message[],
  numberOfMessages: number
): Message[] {
  const filteredMessages = messages
    .filter(({ role }) => role === 'user' || role === 'assistant')
    .slice(-numberOfMessages)

  const returnMessages: Message[] = []
  let lastRole: string | null = null
  let combinedContent = ''

  filteredMessages.forEach((message: Message, index: number) => {
    if (message.role === lastRole) {
      const normalizedContent = message.content
        ? typeof message.content === 'string'
          ? message.content
          : (message.content[0]?.text ?? '')
        : ''
      combinedContent += '\n' + normalizedContent
    } else {
      if (lastRole !== null) {
        returnMessages.push({ role: lastRole, content: combinedContent })
      }
      lastRole = message.role
      combinedContent = message.content
        ? typeof message.content === 'string'
          ? message.content
          : (message.content[0]?.text ?? '')
        : ''
    }

    if (index === filteredMessages.length - 1) {
      returnMessages.push({ role: lastRole!, content: combinedContent })
    }
  })

  while (returnMessages.length > 0 && returnMessages[0].role !== 'user') {
    returnMessages.shift()
  }

  if (
    (returnMessages.length > 0 &&
      returnMessages[returnMessages.length - 1].role === 'assistant') ||
    returnMessages.length === 0
  ) {
    returnMessages.push({
      role: 'user',
      content: 'CONTINUE',
    })
  }

  return returnMessages
}

/**
 * キャラクターシステムメッセージを構築する
 */
export function buildCharacterSystemMessage(
  systemPrompt: string,
  additionalGuidelines: string
): string {
  return `あなたには以下のキャラクター情報と状況に基づいて、提供された会話に続くコメントを生成します。

まず、以下のキャラクター情報を注意深く読んでください：

\`\`\`
${systemPrompt}
\`\`\`

次に、以下のガイドラインと状況を考慮してください：

- あなたは二人で会話をしています。
- キャラクターの口調や性格を忠実に再現し、状況に合わせた具体的で魅力的なコメントを作成してください。
- 可能な限り詳細なレスポンスを提供し、キャラクターのコメントのみを返答としてください。
${additionalGuidelines}

以下の対話に続くコメントを生成してください。

**重要** 最後のユーザーメッセージが「CONTINUE」である場合、直前のAIメッセージに続く内容を話してください。`
}

/**
 * 継続チェック用システムプロンプト
 */
export function continuationCheckSystemPrompt(override?: string): string {
  if (override) return override
  return DEFAULT_PROMPT_EVALUATE
}

/**
 * ベストコメント選択用プロンプトメッセージを構築する
 */
export function buildBestCommentSelectionMessages(
  chatLog: Message[],
  youtubeComments: { userComment: string; userName: string }[],
  instructionOverride?: string
): Message[] {
  const lastTenMessages = getLastMessages(chatLog, 10)
  const instruction = instructionOverride || DEFAULT_PROMPT_SELECT_COMMENT
  const systemMessage = `${instruction}

## 実際の会話歴
\`\`\`
${lastTenMessages.map((m) => `${m.role}: ${m.content}`).join('\n')}
\`\`\`

## 実際のコメント一覧`

  return [
    { role: 'system', content: systemMessage },
    {
      role: 'user',
      content:
        '[\n' +
        youtubeComments.map((comment) => comment.userComment).join(',\n') +
        '\n]',
    },
  ]
}

/**
 * 新トピック生成用プロンプトメッセージを構築する
 */
export function buildNewTopicGenerationMessages(
  chatLog: Message[],
  instructionOverride?: string
): Message[] {
  const lastTenMessages = getLastMessages(chatLog, 10)
  const instruction = instructionOverride || DEFAULT_PROMPT_NEW_TOPIC
  return [
    {
      role: 'system',
      content: `${instruction}\n\n## 会話文`,
    },
    ...lastTenMessages,
  ]
}
