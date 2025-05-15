import { VoiceLanguage } from '@/features/constants/settings'

// 言語コードから音声認識用の言語コードに変換する関数
export const getVoiceLanguageCode = (selectLanguage: string): VoiceLanguage => {
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
      return 'ja-JP'
  }
}
