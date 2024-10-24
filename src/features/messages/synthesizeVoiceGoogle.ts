import { Talk } from './messages'
import { Language } from '@/features/constants/settings'

export async function synthesizeVoiceGoogleApi(
  talk: Talk,
  googleTtsType: string,
  selectLanguage: Language
) {
  try {
    const googleTtsTypeByLang = getGoogleTtsType(googleTtsType, selectLanguage)

    const body = {
      message: talk.message,
      googleTtsTypeByLang,
    }

    const res = await fetch('/api/tts-google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(
        `Google TTS APIからの応答が異常です。ステータスコード: ${res.status}`
      )
    }

    const data = await res.json()

    const uint8Array = new Uint8Array(data.audio.data)
    const arrayBuffer: ArrayBuffer = uint8Array.buffer

    return arrayBuffer
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Google TTSでエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('Google TTSで不明なエラーが発生しました')
    }
  }
}

function getGoogleTtsType(
  googleTtsType: string,
  selectLanguage: Language
): string {
  if (googleTtsType) return googleTtsType

  switch (selectLanguage) {
    case 'ja':
      return 'ja-JP-Standard-B'
    case 'en':
      return 'en-US-Neural2-F'
    case 'zh':
      return 'cmn-TW-Standard-A'
    default:
      return 'en-US-Neural2-F'
  }
}
