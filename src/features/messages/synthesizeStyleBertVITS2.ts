import { Talk } from './messages'
import { Language } from '@/features/constants/settings'

export async function synthesizeStyleBertVITS2Api(
  talk: Talk,
  stylebertvits2ServerUrl: string,
  stylebertvits2ApiKey: string,
  stylebertvits2ModelId: string,
  stylebertvits2Style: string,
  stylebertvits2SdpRatio: number,
  stylebertvits2Length: number,
  selectLanguage: Language
) {
  try {
    const body = {
      message: talk.message,
      stylebertvits2ServerUrl: stylebertvits2ServerUrl,
      stylebertvits2ApiKey: stylebertvits2ApiKey,
      stylebertvits2ModelId: stylebertvits2ModelId,
      stylebertvits2Style: stylebertvits2Style,
      stylebertvits2SdpRatio: stylebertvits2SdpRatio,
      stylebertvits2Length: stylebertvits2Length,
      selectLanguage: selectLanguage,
      type: 'stylebertvits2',
    }

    const res = await fetch('/api/stylebertvits2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(
        `StyleBertVITS2 APIからの応答が異常です。ステータスコード: ${res.status}`
      )
    }

    const buffer = await res.arrayBuffer()
    return buffer
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`StyleBertVITS2でエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('StyleBertVITS2で不明なエラーが発生しました')
    }
  }
}
