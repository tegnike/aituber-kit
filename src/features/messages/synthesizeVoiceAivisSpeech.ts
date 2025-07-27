import { Talk } from './messages'

export async function synthesizeVoiceAivisSpeechApi(
  talk: Talk,
  speaker: string,
  speed: number,
  pitch: number,
  intonationScale: number,
  serverUrl: string,
  tempoDynamics?: number,
  prePhonemeLength?: number,
  postPhonemeLength?: number
): Promise<ArrayBuffer> {
  try {
    const res = await fetch('/api/tts-aivisspeech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: talk.message,
        speaker,
        speed,
        pitch,
        intonationScale,
        serverUrl,
        tempoDynamics,
        prePhonemeLength,
        postPhonemeLength,
      }),
    })

    if (!res.ok) {
      throw new Error(
        `AivisSpeechからの応答が異常です。ステータスコード: ${res.status}`
      )
    }

    return await res.arrayBuffer()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`AivisSpeechでエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('AivisSpeechで不明なエラーが発生しました')
    }
  }
}
