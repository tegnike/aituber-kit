import { Talk } from './messages'
import { Language } from '@/features/constants/settings'

export async function synthesizeVoiceElevenlabsApi(
  talk: Talk,
  apiKey: string,
  voiceId: string,
  language: Language
) {
  const body = {
    message: talk.message,
    voiceId,
    apiKey,
    language,
  }

  try {
    const res = await fetch('/api/elevenLabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(
        `APIからの応答が異常です。ステータスコード: ${res.status}`
      )
    }

    const buffer = await res.arrayBuffer()
    const audio = new Uint8Array(buffer)
    const arrayBuffer: ArrayBuffer = audio.buffer

    return arrayBuffer
  } catch (error: any) {
    throw new Error(`APIリクエスト中にエラーが発生しました: ${error.message}`)
  }
}
