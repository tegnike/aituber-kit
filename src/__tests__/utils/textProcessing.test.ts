import {
  convertEnglishToJapaneseReading,
  asyncConvertEnglishToJapaneseReading,
  containsEnglish,
} from '../../../src/utils/textProcessing'
import { migrateOpenAIModelName } from '../../../src/utils/modelMigration'

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

  describe('migrateOpenAIModelName', () => {
    it('should migrate legacy OpenAI model names with date suffixes', () => {
      expect(migrateOpenAIModelName('gpt-4o-mini-2024-07-18')).toBe(
        'gpt-4o-mini'
      )
      expect(migrateOpenAIModelName('gpt-4o-2024-11-20')).toBe('gpt-4o')
      expect(migrateOpenAIModelName('gpt-4.5-preview-2025-02-27')).toBe(
        'gpt-4.5-preview'
      )
      expect(migrateOpenAIModelName('gpt-4.1-nano-2025-04-14')).toBe(
        'gpt-4.1-nano'
      )
      expect(migrateOpenAIModelName('gpt-4.1-mini-2025-04-14')).toBe(
        'gpt-4.1-mini'
      )
      expect(migrateOpenAIModelName('gpt-4.1-2025-04-14')).toBe('gpt-4.1')
    })

    it('should return the same model name if not in legacy list', () => {
      expect(migrateOpenAIModelName('gpt-4o-mini')).toBe('gpt-4o-mini')
      expect(migrateOpenAIModelName('gpt-4o')).toBe('gpt-4o')
      expect(migrateOpenAIModelName('gpt-4.5-preview')).toBe('gpt-4.5-preview')
      expect(migrateOpenAIModelName('gpt-4')).toBe('gpt-4')
      expect(migrateOpenAIModelName('gpt-3.5-turbo')).toBe('gpt-3.5-turbo')
      expect(migrateOpenAIModelName('custom-model')).toBe('custom-model')
    })
  })
})
