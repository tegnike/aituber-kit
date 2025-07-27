import { Talk } from './messages'

export async function synthesizeVoiceAivisCloudApi(
  talk: Talk,
  apiKey: string,
  modelUuid: string,
  styleId: number,
  styleName: string,
  useStyleName: boolean,
  speed: number,
  pitch: number,
  emotionalIntensity: number,
  tempoDynamics: number,
  prePhonemeLength: number,
  postPhonemeLength: number
): Promise<ArrayBuffer> {
  try {
    const res = await fetch('/api/tts-aivis-cloud-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: talk.message,
        apiKey,
        modelUuid,
        styleId,
        styleName,
        useStyleName,
        speed,
        pitch,
        emotionalIntensity,
        tempoDynamics,
        prePhonemeLength,
        postPhonemeLength,
        outputFormat: 'mp3',
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const errorMessage = errorData.error || `HTTP ${res.status}`
      throw new Error(`Aivis Cloud APIからの応答が異常です: ${errorMessage}`)
    }

    return await res.arrayBuffer()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Aivis Cloud APIでエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('Aivis Cloud APIで不明なエラーが発生しました')
    }
  }
}
