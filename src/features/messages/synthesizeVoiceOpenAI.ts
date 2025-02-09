import { Talk } from './messages'
import { Language } from '@/features/constants/settings'

export async function synthesizeVoiceOpenAIApi(
  talk: Talk,
  apiKey: string,
  voice: string,
  model: string,
  speed: number
) {
  try {
    const body = {
      message: talk.message,
      voice: voice,
      model: model,
      speed: speed,
      apiKey: apiKey,
    }

    const res = await fetch('/api/openAITTS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(
        `OpenAI APIからの応答が異常です。ステータスコード: ${res.status}`
      )
    }

    const buffer = await res.arrayBuffer()
    return buffer
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OpenAI TTSでエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('OpenAI TTSで不明なエラーが発生しました')
    }
  }
}
