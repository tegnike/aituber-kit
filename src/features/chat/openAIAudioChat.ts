import { Message } from '@/features/messages/messages'
import OpenAI from 'openai'
import settingsStore from '@/features/stores/settings'

export async function getOpenAIAudioChatResponseStream(
  messages: Message[]
): Promise<ReadableStream<string>> {
  const ss = settingsStore.getState()
  const openai = new OpenAI({
    apiKey: ss.openaiKey,
    dangerouslyAllowBrowser: true,
  })

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-audio-preview',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
      modalities: ['text', 'audio'],
      audio: {
        voice: ss.audioModeVoice,
        format: 'pcm16',
      },
    })

    // ストリームをReadableStreamに変換
    return new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          console.log(chunk.choices[0])
          const content = chunk.choices[0]?.delta?.audio?.transcript
          if (content) {
            controller.enqueue(content)
          }
        }
        controller.close()
      },
    })
  } catch (error) {
    console.error('OpenAI Audio API error:', error)
    throw error
  }
}
