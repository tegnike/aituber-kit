import {
  extractEmotion,
  extractMotionTag,
  extractSentence,
  isSpeakableText,
} from '@/features/chat/speechPipeline/tagExtractors'

describe('tagExtractors（handlers.tsから移設した既存挙動の固定）', () => {
  describe('extractEmotion', () => {
    it('先頭の感情タグを抽出する', () => {
      expect(extractEmotion('[happy]こんにちは')).toEqual({
        emotionTag: '[happy]',
        remainingText: 'こんにちは',
      })
    })

    it('先頭の空白を無視してタグを検出する', () => {
      expect(extractEmotion('  [sad] つらい')).toEqual({
        emotionTag: '[sad]',
        remainingText: 'つらい',
      })
    })

    it('モーションタグは感情タグとして扱わない', () => {
      expect(extractEmotion('[motion:think]うーん')).toEqual({
        emotionTag: '',
        remainingText: '[motion:think]うーん',
      })
    })

    it('タグがなければ入力をそのまま返す', () => {
      expect(extractEmotion('タグなし')).toEqual({
        emotionTag: '',
        remainingText: 'タグなし',
      })
    })
  })

  describe('extractMotionTag', () => {
    it('先頭のモーションタグを抽出する', () => {
      expect(extractMotionTag('[motion:cheer]やった')).toEqual({
        motionTag: 'cheer',
        remainingText: 'やった',
      })
    })

    it('大文字小文字を区別しない', () => {
      expect(extractMotionTag('[Motion:think]うーん').motionTag).toBe('think')
    })

    it('モーションタグ以外のタグには反応しない', () => {
      expect(extractMotionTag('[happy]うれしい')).toEqual({
        motionTag: '',
        remainingText: '[happy]うれしい',
      })
    })
  })

  describe('extractSentence', () => {
    it('句点までを文として抽出する', () => {
      expect(extractSentence('こんにちは。続き')).toEqual({
        sentence: 'こんにちは。',
        remainingText: '続き',
      })
    })

    it('10文字以上なら読点でも区切る', () => {
      const { sentence } = extractSentence(
        'これは十文字以上あるテキスト、続きです'
      )
      expect(sentence).toBe('これは十文字以上あるテキスト、')
    })

    it('9文字以下では読点で区切らない', () => {
      expect(extractSentence('短い、文').sentence).toBe('')
    })

    it('タグの直前で文を区切る', () => {
      expect(extractSentence('文のあと[happy]続き').sentence).toBe('文のあと')
    })

    it('小数点を文末として分割しない', () => {
      expect(extractSentence('価格は1分0.10から0.37ドル。')).toEqual({
        sentence: '価格は1分0.10から0.37ドル。',
        remainingText: '',
      })
    })

    it('数字直後のピリオドが末尾なら次のチャンクまで保留する', () => {
      expect(extractSentence('価格は1分0.')).toEqual({
        sentence: '',
        remainingText: '価格は1分0.',
      })
    })

    it('桁区切りのカンマを文の区切りとして扱わない', () => {
      expect(extractSentence('再生回数は5,200万回です。')).toEqual({
        sentence: '再生回数は5,200万回です。',
        remainingText: '',
      })
    })

    it('数字直後のカンマが末尾なら次のチャンクまで保留する', () => {
      expect(extractSentence('累計再生回数は5,')).toEqual({
        sentence: '',
        remainingText: '累計再生回数は5,',
      })
    })

    it('区切りがなければ空文を返す', () => {
      expect(extractSentence('区切りなし')).toEqual({
        sentence: '',
        remainingText: '区切りなし',
      })
    })
  })

  describe('isSpeakableText', () => {
    it('通常のテキストはtrue', () => {
      expect(isSpeakableText('こんにちは')).toBe(true)
    })

    it('空文字はfalse', () => {
      expect(isSpeakableText('')).toBe(false)
    })

    it('記号・空白のみはfalse', () => {
      expect(isSpeakableText('、。！？')).toBe(false)
      expect(isSpeakableText('   \n\t')).toBe(false)
      expect(isSpeakableText('（）「」')).toBe(false)
    })

    it('記号に挟まれたテキストはtrue', () => {
      expect(isSpeakableText('「こんにちは」')).toBe(true)
    })
  })
})
