import { getAIChatResponseStream } from '@/features/chat/aiChatFactory'
import { THINKING_MARKER } from '@/features/chat/vercelAIChat'
import { Message, EmotionType, EMOTIONS } from '@/features/messages/messages'

const IDLE_AI_SYSTEM_PROMPT_SUFFIX = `

感情の種類にはneutral, happy, angry, sad, relaxed, surprisedの6つがあります。
回答は以下の書式で返してください。
[{感情}]{セリフ}

例: [happy]こんにちは！元気ですか？

セリフを一つだけ返してください。`

/**
 * アイドルモード用のAI自動生成発話を生成する
 *
 * キャラクタープロンプトは使用せず、idleAiPromptTemplateのみを
 * システムプロンプトとして利用する。
 */
export async function generateIdleAIPhrase(
  promptTemplate: string
): Promise<{ text: string; emotion: EmotionType } | null> {
  const systemPrompt = promptTemplate + IDLE_AI_SYSTEM_PROMPT_SUFFIX

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'セリフを一つ生成してください。' },
  ]

  try {
    const stream = await getAIChatResponseStream(messages)
    if (!stream) return null

    const reader = stream.getReader()
    let fullText = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value && !value.startsWith(THINKING_MARKER)) {
          fullText += value
        }
      }
    } finally {
      reader.releaseLock()
    }

    fullText = fullText.trim()
    if (!fullText) return null

    return parseEmotionAndText(fullText)
  } catch (error) {
    console.error('アイドルAI発話生成エラー:', error)
    return null
  }
}

/**
 * AI応答から感情タグとテキストを解析する
 * 例: "[happy]こんにちは！" → { text: "こんにちは！", emotion: "happy" }
 */
function parseEmotionAndText(rawText: string): {
  text: string
  emotion: EmotionType
} {
  const emotionMatch = rawText.match(/^\s*\[(.*?)\]/)

  if (emotionMatch?.[1]) {
    const emotionStr = emotionMatch[1].toLowerCase()
    const emotion: EmotionType = (EMOTIONS as readonly string[]).includes(
      emotionStr
    )
      ? (emotionStr as EmotionType)
      : 'neutral'
    const text = rawText
      .slice(rawText.indexOf(emotionMatch[0]) + emotionMatch[0].length)
      .replace(/\[.*?\]/g, '') // 途中の感情タグも除去
      .trim()

    return { text: text || rawText.replace(/\[.*?\]/g, '').trim(), emotion }
  }

  return { text: rawText.replace(/\[.*?\]/g, '').trim(), emotion: 'neutral' }
}
