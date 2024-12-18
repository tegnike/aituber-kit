import { Talk } from './messages'

export async function synthesizeVoiceVoicevoxApi(
  talk: Talk,
  speaker: string,
  speed: number,
  pitch: number,
  intonation: number,
  serverUrl: string
): Promise<ArrayBuffer> {
  try {
    const res = await fetch('/api/tts-voicevox', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: talk.message,
        speaker,
        speed,
        pitch,
        intonation,
        serverUrl,
      }),
    })

    if (!res.ok) {
      throw new Error(
        `VOICEVOXからの応答が異常です。ステータスコード: ${res.status}`
      )
    }

    return await res.arrayBuffer()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`VOICEVOXでエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('VOICEVOXで不明なエラーが発生しました')
    }
  }
}
