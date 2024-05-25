import { Message } from "@/features/messages/messages";
import { getOpenAIChatResponse } from "@/features/chat/openAiChat";

const getSystemMessage = async (messages: Message[]): Promise<string> => {
  const systemMessage = messages.find((message: any) => message.role === "system");
  if (!systemMessage) {
    throw new Error("System message not found in the messages.");
  }
  return systemMessage.content;
}

const getLastMessages = (messages: Message[], numberOfMessages: number): string => {
  return messages
    .filter(message => message.role === "user" || message.role === "assistant")
    .slice(-numberOfMessages)
    .map(message => `${message.role}: ${message.content}`)
    .join("\n");
}

const getModifiedSystemMessage = async (systemMessage: string): Promise<string> => {
  const modifiedSystemMessage = `これからあなたには下記のキャラになりきって、次に与えられた状況になったときのコメントを生成してもらいます。

## キャラクター設定

\`\`\`
${systemMessage}
\`\`\`

## 状況
`;
  return modifiedSystemMessage;
}

export const getBestComment = async (messages: Message[], youtubeComments: any[]): Promise<string> => {
  const lastSixMessages = getLastMessages(messages, 6);
  const systemMessage = `これからあなたに複数ターンの会話歴と2つ以上のコメントを与えます。
与えられたコメントから、会話歴の続きとして最も適したコメントを選択してください。`

  const queryMessages = [
    { role: "system", content: systemMessage },
    { role: "user", content: "## 会話歴\n" + lastSixMessages + "\n\n## コメント\n" + youtubeComments.map(comment => comment.userComment).join("\n") }
  ]

  const response = await getOpenAIChatResponse(queryMessages, "", "gpt-4o");

  return response.message;
}

export const getMessagesForSleep = async (messages: Message[]): Promise<Message[]> => {
  const systemMessageContent = await getSystemMessage(messages);
  const modifiedSystemMessage = await getModifiedSystemMessage(systemMessageContent);
  const userMessage = `- あなたはYoutubeの配信者です。
- ただしコメントにあまり人が来ていません。
- 人が来るまで別の作業をしている、という旨のセリフが欲しいです。`
  return [
    { role: "system", content: modifiedSystemMessage },
    { role: "user", content: userMessage }
  ];
}

export const getAnotherTopic = async (messages: Message[]): Promise<string> => {
  const lastFourMessages = getLastMessages(messages, 4);
  const queryMessages = [
    { role: "system", content: "次に渡される会話文から関連するが別の話題を1つ考えてください。結果は単語か非口語の短文で返すこと。" },
    { role: "user", content: "## 会話文\n" + lastFourMessages }
  ]

  const response = await getOpenAIChatResponse(queryMessages, "", "gpt-4o");

  return response.message;
}

export const getMessagesForNewTopic = async (messages: Message[], topic: string): Promise<Message[]> => {
  const systemMessage = await getSystemMessage(messages);
  const modifiedSystemMessage = await getModifiedSystemMessage(systemMessage);
  const lastFourMessages = getLastMessages(messages, 4);
  const userMessage = `- 話題を切り替えたいと思います。
- 次の話題は「${topic}」です。
- 以下の会話文から話を切り替えるとして、キャラになりきって発言してください。

## 会話歴
${lastFourMessages}`

  return [
    { role: "system", content: modifiedSystemMessage },
    { role: "user", content: userMessage }
  ];
}

export const checkIfResponseContinuationIsRequired = async (messages: Message[]): Promise<boolean> => {
  const lastFourMessages = getLastMessages(messages, 4);
  if (!lastFourMessages.includes("assistant:")) {
    return false;
  }

  const systemMessage = `次に渡される会話文から最後の話者が話を続ける必要があるかどうかを判定してください。
最後の話者が話続ける必要がある場合はtrue、もう一方の話者が話す必要があると感じる場合はfalseを返してください。

## 例

1.
A: 今日の天気はどうかな？
B: 朝のうちは晴れるみたいだけど、午後から雨が降るって予報があるよ。
A: そうなんだ。じゃあ、朝のうちに買い物に行こうかな。
B: うん、それがいいと思う。
{
  "answer": false,
  "reason": "Bの同意で一旦区切りがついており、次はAが話す番だと判断できる。"
}

2.
A: 新しいレストランができたって聞いたんだけど、知ってる？
B: ああ、イタリアンのお店でしょ？メニューを見たら美味しそうだったよ。
A: 良かったら今度一緒に行ってみない？
B: ぜひ行きたいな。
{
  "answer": true,
  "reason": "Bの発言では会話が完結しておらず、予定の詳細などを話す必要があると判断できる。"
}

3.
A: 最近、仕事がなかなか忙しくて大変だ。
B: 私も同じだよ。プロジェクトの締め切りが近くて残業ばかりしてる。
A: 体調管理に気を付けないとね。
B: そうだね。お互い頑張ろう。
{
  "answer": false,
  "reason": "Bの励ましで一旦区切りがついており、次はAが話す番だと判断できる。"
}

4.
A: 今年の夏休みはどこか旅行に行きたいんだけど、おすすめの場所ある？
B: 国内だったら、京都とか北海道はどうかな。
A: そうだね。自然も豊かだし、食べ物も美味しそう。
B: 海外だと、ヨーロッパとかも楽しいよ。
{
  "answer": true,
  "reason": "Bの発言で新しい提案があり、続けて旅行の話を深める必要があると判断できる。"
}

5.
A: 昨日、友達から面白い動画が送られてきたんだ。
B: どんな動画だったの？
A: 犬と猫が一緒に遊んでる動画で、すごく仲良しなんだよ。
B: 見てみたいな。送ってくれない？
{
  "answer": false,
  "reason": "Bの要求で一旦区切りがついており、次はAが動画を送信するなどの行動を取る番だと判断できる。"
}`

  const queryMessages = [
    { role: "system", content: systemMessage },
    { role: "user", content: "## 会話文\n" + lastFourMessages }
  ]

  const response = await getOpenAIChatResponse(queryMessages, "", "gpt-4o");

  const responseJson = JSON.parse(response.message);
  const isContinuationNeeded = responseJson.answer === "true";

  return isContinuationNeeded;
}

export const getMessagesForContinuation = async (messages: Message[]): Promise<Message[]> => {
  const systemMessage = await getSystemMessage(messages);
  const modifiedSystemMessage = await getModifiedSystemMessage(systemMessage);
  const lastFourMessages = getLastMessages(messages, 4);
  const userMessage = `- あなたの発言はassistantです。下記の会話に続くコメントを生成してください。\n${lastFourMessages}`
  return [
    { role: "system", content: modifiedSystemMessage },
    { role: "user", content: userMessage }
  ];
}
