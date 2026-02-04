import { getVoiceLanguageCode } from '@/utils/voiceLanguage'

describe('getVoiceLanguageCode', () => {
  const mappings: [string, string][] = [
    ['ja', 'ja-JP'],
    ['en', 'en-US'],
    ['ko', 'ko-KR'],
    ['zh', 'zh-TW'],
    ['zh-TW', 'zh-TW'],
    ['zh-CN', 'zh-CN'],
    ['vi', 'vi-VN'],
    ['fr', 'fr-FR'],
    ['es', 'es-ES'],
    ['pt', 'pt-PT'],
    ['de', 'de-DE'],
    ['ru', 'ru-RU'],
    ['it', 'it-IT'],
    ['ar', 'ar-SA'],
    ['hi', 'hi-IN'],
    ['pl', 'pl-PL'],
    ['th', 'th-TH'],
  ]

  it.each(mappings)('should map "%s" to "%s"', (input, expected) => {
    expect(getVoiceLanguageCode(input)).toBe(expected)
  })

  it('should return ja-JP as default for unknown language', () => {
    expect(getVoiceLanguageCode('unknown')).toBe('ja-JP')
  })

  it('should return ja-JP for empty string', () => {
    expect(getVoiceLanguageCode('')).toBe('ja-JP')
  })
})
