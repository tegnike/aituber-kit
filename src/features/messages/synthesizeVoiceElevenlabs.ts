import { Talk } from './messages'
import { Language } from '@/features/constants/settings'

export async function synthesizeVoiceElevenlabsApi(
  talk: Talk,
  apiKey: string,
  voiceId: string,
  language: Language
) {
  try {
    const body = {
      message: talk.message,
      voiceId,
      apiKey,
      language,
    }

    const res = await fetch('/api/elevenLabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(
        `ElevenLabs APIからの応答が異常です。ステータスコード: ${res.status}`
      )
    }

    const buffer = await res.arrayBuffer()

    return buffer
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`ElevenLabsでエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('ElevenLabsで不明なエラーが発生しました')
    }
  }
}
