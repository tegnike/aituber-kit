import { Talk } from './messages'

const VOICE_VOX_API_URL = 'http://localhost:50021'

export async function synthesizeVoiceVoicevoxApi(
  talk: Talk,
  speaker: string,
  speed: number,
  pitch: number,
  intonation: number
): Promise<ArrayBuffer> {
  try {
    console.log('speakerId:', speaker)
    const ttsQueryResponse = await fetch(
      VOICE_VOX_API_URL +
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
        `VOICEVOXのクエリ生成に失敗しました。ステータスコード: ${ttsQueryResponse.status}`
      )
    }
    const ttsQueryJson = await ttsQueryResponse.json()

    ttsQueryJson['speedScale'] = speed
    ttsQueryJson['pitchScale'] = pitch
    ttsQueryJson['intonationScale'] = intonation
    const synthesisResponse = await fetch(
      VOICE_VOX_API_URL + '/synthesis?speaker=' + speaker,
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
        `VOICEVOXの音声合成に失敗しました。ステータスコード: ${synthesisResponse.status}`
      )
    }
    const blob = await synthesisResponse.blob()
    const buffer = await blob.arrayBuffer()
    return buffer
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`VOICEVOXでエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('VOICEVOXで不明なエラーが発生しました')
    }
  }
}
