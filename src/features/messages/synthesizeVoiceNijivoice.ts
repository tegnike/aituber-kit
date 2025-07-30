import { Talk } from './messages'

export async function synthesizeVoiceNijivoiceApi(
  talk: Talk,
  apiKey: string,
  voiceActorId: string,
  speed: number,
  emotionalLevel: number,
  soundDuration: number
) {
  try {
    const res = await fetch('/api/tts-nijivoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: talk.message,
        speed,
        voiceActorId,
        apiKey,
        emotionalLevel,
        soundDuration,
      }),
    })

    if (!res.ok) {
      throw new Error(
        `Nijivoice APIからの応答が異常です。ステータスコード: ${res.status}`
      )
    }

    return await res.arrayBuffer()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Nijivoiceでエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('Nijivoiceで不明なエラーが発生しました')
    }
  }
}
