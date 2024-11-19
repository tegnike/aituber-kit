import { Talk } from './messages'

const AIVIS_SPEECH_API_URL = 'http://127.0.0.1:10101'

export async function synthesizeVoiceAivisSpeechApi(
  talk: Talk,
  speaker: string,
  speed: number,
  pitch: number,
  intonation: number
): Promise<ArrayBuffer> {
  try {
    console.log('speakerId:', speaker)
    const ttsQueryResponse = await fetch(
      AIVIS_SPEECH_API_URL +
        '/audio_query?speaker=' +
        speaker +
        '&text=' +
        encodeURIComponent(talk.message),
      {
        method: 'POST',
      }
    )
    if (!ttsQueryResponse.ok) {
      throw new Error(
        `Aivis Speechのクエリ生成に失敗しました。ステータスコード: ${ttsQueryResponse.status}`
      )
    }
    const ttsQueryJson = await ttsQueryResponse.json()

    ttsQueryJson['speedScale'] = speed
    ttsQueryJson['pitchScale'] = pitch
    ttsQueryJson['intonationScale'] = intonation
    const synthesisResponse = await fetch(
      AIVIS_SPEECH_API_URL + '/synthesis?speaker=' + speaker,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
        },
        body: JSON.stringify(ttsQueryJson),
      }
    )
    if (!synthesisResponse.ok) {
      throw new Error(
        `Aivis Speechの音声合成に失敗しました。ステータスコード: ${synthesisResponse.status}`
      )
    }
    const blob = await synthesisResponse.blob()
    const buffer = await blob.arrayBuffer()
    return buffer
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Aivis Speechでエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('Aivis Speechで不明なエラーが発生しました')
    }
  }
}
