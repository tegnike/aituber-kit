import { splitSentence } from '@/features/messages/messages'

describe('splitSentence', () => {
  it('should split on Japanese period (。)', () => {
    expect(splitSentence('こんにちは。元気ですか。')).toEqual([
      'こんにちは。',
      '元気ですか。',
    ])
  })

  it('should split on fullwidth period (．)', () => {
    expect(splitSentence('テスト．OK．')).toEqual(['テスト．', 'OK．'])
  })

  it('should split on fullwidth exclamation (！)', () => {
    expect(splitSentence('すごい！やった！')).toEqual(['すごい！', 'やった！'])
  })

  it('should split on fullwidth question mark (？)', () => {
    expect(splitSentence('本当？なぜ？')).toEqual(['本当？', 'なぜ？'])
  })

  it('should split on newlines', () => {
    expect(splitSentence('line1\nline2\nline3')).toEqual([
      'line1\n',
      'line2\n',
      'line3',
    ])
  })

  it('should filter out empty strings', () => {
    expect(splitSentence('')).toEqual([])
  })

  it('should return single element for text without split points', () => {
    expect(splitSentence('hello world')).toEqual(['hello world'])
  })

  it('should handle mixed punctuation', () => {
    const result = splitSentence('こんにちは。元気？はい！')
    expect(result).toEqual(['こんにちは。', '元気？', 'はい！'])
  })

  it('should keep punctuation at end of each segment', () => {
    const result = splitSentence('A。B。')
    result.forEach((segment, i) => {
      if (i < result.length - 1 || segment.endsWith('。')) {
        expect(segment).toMatch(/[。．！？\n]$/)
      }
    })
  })
})
