import { Talk } from './messages'
import { Language } from '@/features/constants/settings'

export async function synthesizeVoiceCartesiaApi(
  talk: Talk,
  apiKey: string,
  voiceId: string,
  language: Language
) {
  if (!apiKey.trim()) {
    throw new Error('CartesiaのAPIキーが設定されていません')
  }
  if (!voiceId.trim()) {
    throw new Error('CartesiaのVoice IDが設定されていません')
  }
  if (!talk.message.trim()) {
    throw new Error('合成するメッセージが空です')
  }
  try {
    const body = {
      message: talk.message,
      voiceId,
      apiKey,
      language,
    }

    const res = await fetch('/api/cartesia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorText = await res
        .text()
        .catch(() => 'エラー詳細を取得できませんでした')
      throw new Error(
        `Cartesia APIからの応答が異常です。ステータスコード: ${res.status}, エラー詳細: ${errorText}`
      )
    }

    const buffer = await res.arrayBuffer()

    return buffer
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Cartesiaでエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('Cartesiaで不明なエラーが発生しました')
    }
  }
}
