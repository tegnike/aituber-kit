import {
  convertEnglishToJapaneseReading,
  asyncConvertEnglishToJapaneseReading,
  containsEnglish,
} from '../../../src/utils/textProcessing'

jest.mock('../../../src/utils/englishToJapanese.json', () => ({
  hello: 'ハロー',
  world: 'ワールド',
  test: 'テスト',
  mastra: 'マストラ',
}))

describe('textProcessing', () => {
  describe('convertEnglishToJapaneseReading', () => {
    it('英語を日本語読みに変換する', () => {
      const result = convertEnglishToJapaneseReading('hello world')
      expect(result).toContain('ハロー')
      expect(result).toContain('ワールド')
    })

    it('英語が含まれていない場合は元のテキストを返す', () => {
      const text = 'こんにちは'
      expect(convertEnglishToJapaneseReading(text)).toBe(text)
    })

    it('重要な単語を変換する', () => {
      const result = convertEnglishToJapaneseReading('This is Mastra')
      expect(result).toContain('マストラ')
    })
  })

  describe('asyncConvertEnglishToJapaneseReading', () => {
    it('非同期で英語を日本語読みに変換する', async () => {
      const result = await asyncConvertEnglishToJapaneseReading('hello test')
      expect(result).toContain('ハロー')
      expect(result).toContain('テスト')
    })
  })

  describe('containsEnglish', () => {
    it('英語が含まれている場合はtrueを返す', () => {
      expect(containsEnglish('Hello, world!')).toBe(true)
      expect(containsEnglish('こんにちはworld')).toBe(true)
    })

    it('英語が含まれていない場合はfalseを返す', () => {
      expect(containsEnglish('こんにちは、世界！')).toBe(false)
      expect(containsEnglish('１２３４５')).toBe(false)
    })
  })
})
