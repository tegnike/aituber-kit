import { Message } from '@/features/messages/messages'
import { getVercelAIChatResponse } from '@/features/chat/vercelAIChat'

const fetchAIResponse = async (queryMessages: any[]): Promise<any> => {
  return getVercelAIChatResponse(queryMessages)
}

/**
 * 共通のシステムメッセージをを返します。
 *
 * @returns {Promise<string>} - 修正されたシステムメッセージ
 */
const getCommonSystemMessage = (
  systemPrompt: string,
  additionalGuidelines: string
): string => {
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

以下の対話に続くコメントを生成してください。`
}

/**
 * 指定された数の最新メッセージを取得し、文字列として返します。
 * ユーザーとアシスタントのメッセージのみを対象とします。
 *
 * @param {Message[]} messages - メッセージの配列
 * @param {number} numberOfMessages - 取得するメッセージの数
 * @returns {Message[]} - メッセージの配列
 */
const getLastMessages = (
  messages: Message[],
  numberOfMessages: number
): Message[] => {
  const filteredMessages = messages
    .filter(({ role }) => role === 'user' || role === 'assistant')
    .slice(-numberOfMessages)

  const returnMessages: Message[] = []
  let lastRole: string | null = null
  let combinedContent = ''

  filteredMessages.forEach((message: Message, index: number) => {
    if (message.role === lastRole) {
      combinedContent += '\n' + message.content
    } else {
      if (lastRole !== null) {
        returnMessages.push({ role: lastRole, content: combinedContent })
      }
      lastRole = message.role
      combinedContent = message.content
        ? typeof message.content === 'string'
          ? message.content
          : message.content[0].text
        : ''
    }

    // 最後のメッセージの場合、現在の内容を追加
    if (index === filteredMessages.length - 1) {
      returnMessages.push({ role: lastRole, content: combinedContent })
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
      content:
        'これはシステムメッセージです。回答を作成してください。このコメントは無視してください。',
    })
  }

  return returnMessages
}

/**
 * ユーザーのコメントとYoutubeのコメントを受け取り、最適なコメントを返します。
 *
 * @param {Message[]} messages - メッセージの配列
 * @param {any[]} youtubeComments - Youtubeのコメントの配列
 * @returns {Promise<string>} - 最適なコメント
 */
export const getBestComment = async (
  messages: Message[],
  youtubeComments: any[]
): Promise<string> => {
  console.log('getBestComment')
  const lastTenMessages = getLastMessages(messages, 10)
  const systemMessage = `# 会話選択タスク
これからあなたに複数の会話履歴と選択肢となるコメントが与えられます。
これらの情報を基に、会話の流れに最も適したコメントを1つ選んでください。選んだコメントの内容のみを返答としてください。

## 例
### コメント一覧
[
​知らないな、いつの年代の映画？,
​そうなんだ,
​明後日の天気は？,
​ポケモン好き？,
]

### 選択したコメント
明後日の天気は？

## 実際の会話歴
\`\`\`
${lastTenMessages}
\`\`\`

## 実際のコメント一覧`

  const queryMessages = [
    { role: 'system', content: systemMessage },
    {
      role: 'user',
      content:
        '[\n' +
        youtubeComments.map((comment) => comment.userComment).join(',\n') +
        '\n]',
    },
  ]

  const response = await fetchAIResponse(queryMessages)

  return response.text
}

/**
 * システムプロンプトを受け取り、休憩用のメッセージを返します。
 *
 * @param {string} systemPrompt - システムプロンプト
 * @param {Message[]} messages - メッセージの配列
 * @returns {Promise<Message[]>} - メッセージの配列
 */
export const getMessagesForSleep = async (
  systemPrompt: string,
  messages: Message[]
): Promise<Message[]> => {
  console.log('getMessagesForSleep')
  const lastTenMessages = getLastMessages(messages, 10)
  const systemMessage = getCommonSystemMessage(
    systemPrompt,
    '- あなたはYouTubeの配信者ですが、現在視聴者があまり来ていません。\n- 視聴者が来るまで別の作業をしている旨のセリフを生成してください。'
  )

  return [{ role: 'system', content: systemMessage }, ...lastTenMessages]
}

/**
 * メッセージを受け取り、最新の4つのメッセージを使用して別の話題を取得します。
 *
 * @param {Message[]} messages - メッセージの配列
 * @returns {Promise<string>} - 別の話題
 */
export const getAnotherTopic = async (messages: Message[]): Promise<string> => {
  console.log('getAnotherTopic')
  const lastTenMessages = getLastMessages(messages, 10)
  const queryMessages = [
    {
      role: 'system',
      content: `次に渡される会話文から関連する別の話題を1つ考えてください。
回答は単語か非口語の短文で返してください。

## 解答例
- 最近見た映画
- ヘルスケア
- 5年後の自分
- 今ハマっている趣味

## 会話文`,
    },
    ...lastTenMessages,
  ]

  const response = await fetchAIResponse(queryMessages)

  return response.text
}

/**
 * メッセージを受け取り、新しい話題のためのメッセージを取得します。
 *
 * @param {string} systemPrompt - システムプロンプト
 * @param {Message[]} messages - メッセージの配列
 * @param {string} topic - 新しい話題
 * @returns {Promise<Message[]>} - メッセージの配列
 */
export const getMessagesForNewTopic = async (
  systemPrompt: string,
  messages: Message[],
  topic: string
): Promise<Message[]> => {
  console.log('getMessagesForNewTopic')
  const lastTenMessages = getLastMessages(messages, 10)
  const systemMessage = getCommonSystemMessage(
    systemPrompt,
    `- 話題を「${topic}」に切り替える必要があります。話題を切り替える旨のセリフもコメントに含めてください。`
  )

  return [{ role: 'system', content: systemMessage }, ...lastTenMessages]
}

/**
 * メッセージを受け取り、次の発言者を判断します。
 *
 * @param {Message[]} messages - メッセージの配列
 * @returns {Promise<boolean>} - 次の発言者
 */
export const checkIfResponseContinuationIsRequired = async (
  messages: Message[]
): Promise<boolean> => {
  console.log('checkIfResponseContinuationIsRequired')
  const lastTenMessages = getLastMessages(messages, 10)
  if (!lastTenMessages.some((message) => message.role === 'assistant')) {
    return false
  }

  const systemMessage = `与えられた会話文の文脈から、次にどの話者が発言すべきかを判断してください。
最後の話者が話を続けるべきならば "true" を、逆に交代が必要な場合は "false" を返します。
回答はJSON形式で、answerとreasonの2つのキーを持つオブジェクトとしてください。

## 例

1.
A: 今日の天気はどうかな？
B: 朝のうちは晴れるみたいだけど、午後から雨が降るって予報があるよ。
A: そうなんだ。じゃあ、朝のうちに買い物に行こうかな。
B: うん、それがいいと思う。
{
  "answer": "false",
  "reason": "Bの同意で一旦区切りがついており、次はAが話す番だと判断できる。"
}

2.
A: 新しいレストランができたって聞いたんだけど、知ってる？
B: ああ、イタリアンのお店でしょ？メニューを見たら美味しそうだったよ。
A: 良かったら今度一緒に行ってみない？
B: ぜひ行きたいな。
{
  "answer": "true",
  "reason": "Bの発言では会話が完結しておらず、予定の詳細などを話す必要があると判断できる。"
}

3.
A: 最近、仕事がなかなか忙しくて大変だ。
B: 私も同じだよ。プロジェクトの締め切りが近くて残業ばかりしてる。
A: 体調管理に気を付けないとね。
B: そうだね。お互い頑張ろう。
{
  "answer": "false",
  "reason": "Bの励ましで一旦区切りがついており、次はAが話す番だと判断できる。"
}

4.
A: 今年の夏休みはどこか旅行に行きたいんだけど、おすすめの場所ある？
B: 国内だったら、京都とか北海道はどうかな。
A: そうだね。自然も豊かだし、食べ物も美味しそう。
B: 海外だと、ヨーロッパとかも楽しいよ。
{
  "answer": "true",
  "reason": "Bの発言で新しい提案があり、続けて旅行の話を深める必要があると判断できる。"
}

5.
A: 昨日、友達から面白い動画が送られてきたんだ。
B: どんな動画だったの？
A: 犬と猫が一緒に遊んでる動画で、すごく仲良しなんだよ。
B: 見てみたいな。送ってくれない？
{
  "answer": "false",
  "reason": "Bの要求で一旦区切りがついており、次はAが動画を送信するなどの行動を取る番だと判断できる。"
}

## 会話文`

  const queryMessages = [
    { role: 'system', content: systemMessage },
    ...lastTenMessages,
  ]

  // エラーが発生した場合はfalseを返す
  let answer
  try {
    const response = await fetchAIResponse(queryMessages)
    console.log('response.message:', response.text)
    const responseJson = JSON.parse(response.text)
    answer = responseJson.answer
    answer = answer.toString()
  } catch (error) {
    console.error('JSON.parseエラーが発生しました。', error)
    answer = 'false'
  }
  console.log('answer:', answer)
  return answer === 'true'
}

/**
 * システムプロンプトとメッセージを受け取り、継続のためのメッセージを取得します。
 *
 * @param {string} systemPrompt - システムプロンプト
 * @param {Message[]} messages - メッセージの配列
 * @returns {Promise<Message[]>} - メッセージの配列
 */
export const getMessagesForContinuation = async (
  systemPrompt: string,
  messages: Message[]
): Promise<Message[]> => {
  console.log('getMessagesForContinuation')
  const lastTenMessages = getLastMessages(messages, 10)
  const systemMessage = getCommonSystemMessage(
    systemPrompt,
    `- 与えられた会話歴に続く自然なコメントを生成してください。ただし、直前と同じ内容は避けてください。`
  )

  return [{ role: 'system', content: systemMessage }, ...lastTenMessages]
}
