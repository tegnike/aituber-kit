import { Message } from '@/features/messages/messages'

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
      content:
        'これはシステムメッセージです。回答を作成してください。このコメントは無視してください。',
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

以下の対話に続くコメントを生成してください。`
}

/**
 * 継続チェック用システムプロンプト
 */
export function continuationCheckSystemPrompt(): string {
  return `与えられた会話文の文脈から、次にどの話者が発言すべきかを判断してください。
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
}

/**
 * ベストコメント選択用プロンプトメッセージを構築する
 */
export function buildBestCommentSelectionMessages(
  chatLog: Message[],
  youtubeComments: { userComment: string; userName: string }[]
): Message[] {
  const lastTenMessages = getLastMessages(chatLog, 10)
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
export function buildNewTopicGenerationMessages(chatLog: Message[]): Message[] {
  const lastTenMessages = getLastMessages(chatLog, 10)
  return [
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
}
