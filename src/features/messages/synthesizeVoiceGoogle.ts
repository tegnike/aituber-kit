import { Talk } from './messages'
import { Language, VoiceLanguage } from '@/features/constants/settings'

export async function synthesizeVoiceGoogleApi(
  talk: Talk,
  googleTtsType: string,
  selectLanguage: Language
) {
  try {
    const googleTtsTypeByLang = getGoogleTtsType(googleTtsType, selectLanguage)
    const languageCode = getVoiceLanguageCode(selectLanguage)

    const body = {
      message: talk.message,
      ttsType: googleTtsTypeByLang,
      languageCode,
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
        `Google Text-to-Speech APIからの応答が異常です。ステータスコード: ${res.status}`
      )
    }

    const data = await res.json()

    // Base64文字列をデコードしてArrayBufferに変換
    const binaryStr = atob(data.audio)
    const uint8Array = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      uint8Array[i] = binaryStr.charCodeAt(i)
    }
    const arrayBuffer: ArrayBuffer = uint8Array.buffer

    return arrayBuffer
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Google Text-to-Speechでエラーが発生しました: ${error.message}`
      )
    } else {
      throw new Error('Google Text-to-Speechで不明なエラーが発生しました')
    }
  }
}

function getGoogleTtsType(
  googleTtsType: string,
  selectLanguage: Language
): string {
  if (googleTtsType && googleTtsType.trim()) return googleTtsType

  switch (selectLanguage) {
    case 'ja':
      return 'ja-JP-Standard-B'
    case 'en':
      return 'en-US-Neural2-F'
    case 'ko':
      return 'ko-KR-Neural2-A'
    case 'zh':
      return 'cmn-TW-Standard-A'
    case 'vi':
      return 'vi-VN-Standard-A'
    case 'fr':
      return 'fr-FR-Standard-A'
    case 'es':
      return 'es-ES-Standard-A'
    case 'pt':
      return 'pt-PT-Standard-A'
    case 'de':
      return 'de-DE-Standard-A'
    case 'ru':
      return 'ru-RU-Standard-A'
    case 'it':
      return 'it-IT-Standard-A'
    case 'ar':
      return 'ar-XA-Standard-A'
    case 'hi':
      return 'hi-IN-Standard-A'
    case 'pl':
      return 'pl-PL-Standard-A'
    case 'th':
      return 'th-TH-Standard-A'
    default:
      return 'en-US-Neural2-F'
  }
}

function getVoiceLanguageCode(selectLanguage: Language): VoiceLanguage {
  switch (selectLanguage) {
    case 'ja':
      return 'ja-JP'
    case 'en':
      return 'en-US'
    case 'ko':
      return 'ko-KR'
    case 'zh':
      return 'zh-TW'
    case 'vi':
      return 'vi-VN'
    case 'fr':
      return 'fr-FR'
    case 'es':
      return 'es-ES'
    case 'pt':
      return 'pt-PT'
    case 'de':
      return 'de-DE'
    case 'ru':
      return 'ru-RU'
    case 'it':
      return 'it-IT'
    case 'ar':
      return 'ar-SA'
    case 'hi':
      return 'hi-IN'
    case 'pl':
      return 'pl-PL'
    case 'th':
      return 'th-TH'
    default:
      return 'en-US'
  }
}
