import { EmotionType, Talk } from './messages'
import { KoeiroParam } from '@/features/constants/koeiroParam'

export async function synthesizeVoiceKoeiromapApi(
  talk: Talk,
  apiKey: string,
  koeiroParam: KoeiroParam
) {
  try {
    const reducedStyle = emotionToTalkStyle(talk.emotion)

    const body = {
      message: talk.message,
      speakerX: koeiroParam.speakerX,
      speakerY: koeiroParam.speakerY,
      style: reducedStyle,
      apiKey: apiKey,
    }

    const res = await fetch('/api/tts-koeiromap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(
        `Koeiromap APIからの応答が異常です。ステータスコード: ${res.status}`
      )
    }

    const data = await res.json()
    const url = data.audio

    if (url == null) {
      throw new Error('Koeiromap APIから音声URLが返されませんでした')
    }

    const resAudio = await fetch(url)
    if (!resAudio.ok) {
      throw new Error(
        `Koeiromap音声ファイルの取得に失敗しました。ステータスコード: ${resAudio.status}`
      )
    }

    const buffer = await resAudio.arrayBuffer()
    return buffer
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Koeiromapでエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('Koeiromapで不明なエラーが発生しました')
    }
  }
}

const emotionToTalkStyle = (emotion: EmotionType): string => {
  switch (emotion) {
    case 'angry':
      return 'angry'
    case 'happy':
      return 'happy'
    case 'sad':
      return 'sad'
    default:
      return 'talk'
  }
}
