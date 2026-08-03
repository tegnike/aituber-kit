import {
  getFirstSpeechCommaMinChars,
  SpeechSegmenter,
} from '@/features/chat/speechPipeline/speechSegmenter'
import { SegmenterEvent } from '@/features/chat/speechPipeline/types'

const pushAll = (segmenter: SpeechSegmenter, chunks: string[]) => {
  const events: SegmenterEvent[] = []
  for (const chunk of chunks) {
    events.push(...segmenter.push(chunk))
  }
  return events
}

const speeches = (events: SegmenterEvent[]) =>
  events.filter((e) => e.kind === 'speech')
const displays = (events: SegmenterEvent[]) =>
  events
    .filter((e) => e.kind === 'display')
    .map((e) => (e.kind === 'display' ? e.text : ''))
    .join('')
const codes = (events: SegmenterEvent[]) =>
  events.filter((e) => e.kind === 'code')

describe('SpeechSegmenter', () => {
  describe('低遅延TTS設定', () => {
    it.each([
      'voicevox',
      'aivis_speech',
      'google',
      'openai',
      'aivis_cloud_api',
    ])('%sは初回の短い読点区切りを使う', (voice) => {
      expect(getFirstSpeechCommaMinChars(voice)).toBe(5)
    })

    it('その他のTTSは通常の閾値を維持する', () => {
      expect(getFirstSpeechCommaMinChars('azure')).toBe(10)
    })
  })

  describe('文分割', () => {
    it('句点で文を確定する', () => {
      const seg = new SpeechSegmenter()
      const events = [...seg.push('こんにちは。元気ですか。'), ...seg.flush()]
      expect(
        speeches(events).map((e) => e.kind === 'speech' && e.text)
      ).toEqual(['こんにちは。', '元気ですか。'])
    })

    it('チャンク跨ぎの文を結合して確定する', () => {
      const seg = new SpeechSegmenter()
      const events = pushAll(seg, ['こんに', 'ちは。元気', 'ですか。'])
      expect(
        speeches(events).map((e) => e.kind === 'speech' && e.text)
      ).toEqual(['こんにちは。', '元気ですか。'])
    })

    it('1文字ずつのチャンクでも正しく分割する', () => {
      const seg = new SpeechSegmenter()
      const events = pushAll(seg, 'やあ。元気？'.split(''))
      expect(
        speeches(events).map((e) => e.kind === 'speech' && e.text)
      ).toEqual(['やあ。', '元気？'])
    })

    it('最初の発話だけ6文字以上の読点で早期確定する', () => {
      const seg = new SpeechSegmenter({ firstSpeechCommaMinChars: 5 })
      const events = seg.push('こんにちは、マスター。')
      expect(
        speeches(events).map((e) => e.kind === 'speech' && e.text)
      ).toEqual(['こんにちは、', 'マスター。'])
    })

    it('短すぎる読点では初回発話を分割しない', () => {
      const seg = new SpeechSegmenter({ firstSpeechCommaMinChars: 5 })
      const events = seg.push('はい、承知しました。')
      expect(
        speeches(events).map((e) => e.kind === 'speech' && e.text)
      ).toEqual(['はい、承知しました。'])
    })

    it('2発話目以降は従来どおり10文字未満の読点で分割しない', () => {
      const seg = new SpeechSegmenter({ firstSpeechCommaMinChars: 5 })
      const events = seg.push('最初です。こんにちは、マスター。')
      expect(
        speeches(events).map((e) => e.kind === 'speech' && e.text)
      ).toEqual(['最初です。', 'こんにちは、マスター。'])
    })

    it('早期確定する読点がチャンクを跨いでも一度だけ発話する', () => {
      const seg = new SpeechSegmenter({ firstSpeechCommaMinChars: 5 })
      const events = pushAll(seg, ['こんに', 'ちは、', 'マスター。'])
      expect(
        speeches(events).map((e) => e.kind === 'speech' && e.text)
      ).toEqual(['こんにちは、', 'マスター。'])
    })

    it('オプション未指定では従来の10文字閾値を維持する', () => {
      const seg = new SpeechSegmenter()
      const events = seg.push('こんにちは、マスター。')
      expect(
        speeches(events).map((e) => e.kind === 'speech' && e.text)
      ).toEqual(['こんにちは、マスター。'])
    })

    it('flushで文として未確定の残余を発話として確定する', () => {
      const seg = new SpeechSegmenter()
      const pushed = seg.push('句点のないテキスト')
      expect(speeches(pushed)).toHaveLength(0)
      const flushed = seg.flush()
      expect(
        speeches(flushed).map((e) => e.kind === 'speech' && e.text)
      ).toEqual(['句点のないテキスト'])
    })

    it('チャンク境界にある小数点で発話を分割しない', () => {
      const seg = new SpeechSegmenter()
      const events = [
        ...pushAll(seg, [
          '価格も、外部サービスの利用が1分0.',
          '10から0.',
          '37ドル、自前構成の計算費用が0.',
          '06から0.',
          '12ドルという記事上の目安があります。',
        ]),
        ...seg.flush(),
      ]
      const spoken = speeches(events).map(
        (event) => event.kind === 'speech' && event.text
      )

      expect(spoken.join('')).toBe(
        '価格も、外部サービスの利用が1分0.10から0.37ドル、自前構成の計算費用が0.06から0.12ドルという記事上の目安があります。'
      )
      expect(
        spoken.some((text) => typeof text === 'string' && /\d\.$/.test(text))
      ).toBe(false)
    })

    it('チャンク境界にある桁区切りのカンマで発話を分割しない', () => {
      const seg = new SpeechSegmenter()
      const events = [
        ...pushAll(seg, ['動画の累計再生回数は5,', '200万回でした。']),
        ...seg.flush(),
      ]
      const spoken = speeches(events).map(
        (event) => event.kind === 'speech' && event.text
      )

      expect(spoken.join('')).toBe('動画の累計再生回数は5,200万回でした。')
      expect(spoken).not.toContain('動画の累計再生回数は5,')
    })
  })

  describe('感情タグ・モーションタグ', () => {
    it('感情タグを抽出して発話イベントに付与する', () => {
      const seg = new SpeechSegmenter()
      const events = seg.push('[happy]やったね。')
      const s = speeches(events)[0]
      expect(s.kind === 'speech' && s.text).toBe('やったね。')
      expect(s.kind === 'speech' && s.emotionTag).toBe('[happy]')
    })

    it('チャンク跨ぎのタグを結合して抽出する', () => {
      const seg = new SpeechSegmenter()
      const events = pushAll(seg, ['[hap', 'py]やあ。'])
      const s = speeches(events)[0]
      expect(s.kind === 'speech' && s.emotionTag).toBe('[happy]')
      expect(s.kind === 'speech' && s.text).toBe('やあ。')
    })

    it('モーションタグを抽出して発話イベントに付与する', () => {
      const seg = new SpeechSegmenter()
      const events = seg.push('[happy][motion:cheer]やったー！')
      const s = speeches(events)[0]
      expect(s.kind === 'speech' && s.emotionTag).toBe('[happy]')
      expect(s.kind === 'speech' && s.motionTag).toBe('cheer')
    })

    it('タグは同一行内の後続の文へ持ち越される', () => {
      const seg = new SpeechSegmenter()
      const events = seg.push('[happy]一文目。二文目。')
      const all = speeches(events)
      expect(all).toHaveLength(2)
      expect(all[1].kind === 'speech' && all[1].emotionTag).toBe('[happy]')
    })

    it('明示タグの文のみemotionTagExplicitがtrueになる', () => {
      const seg = new SpeechSegmenter()
      const events = seg.push('[happy]一文目。二文目。[sad]三文目。')
      const all = speeches(events)
      expect(
        all.map((e) => e.kind === 'speech' && e.emotionTagExplicit)
      ).toEqual([true, false, true])
    })

    it('改行を跨ぐとタグの持ち越しがリセットされる', () => {
      const seg = new SpeechSegmenter()
      const events = [...seg.push('[happy]一文目。\n二文目。'), ...seg.flush()]
      const all = speeches(events)
      expect(all).toHaveLength(2)
      expect(all[0].kind === 'speech' && all[0].emotionTag).toBe('[happy]')
      expect(all[1].kind === 'speech' && all[1].emotionTag).toBe('')
    })

    it('新しいタグが出現したら持ち越しを上書きする', () => {
      const seg = new SpeechSegmenter()
      const events = seg.push('[happy]嬉しい。[sad]悲しい。')
      const all = speeches(events)
      expect(all[0].kind === 'speech' && all[0].emotionTag).toBe('[happy]')
      expect(all[1].kind === 'speech' && all[1].emotionTag).toBe('[sad]')
    })

    it('タグは表示イベントには残る（現行踏襲）', () => {
      const seg = new SpeechSegmenter()
      const events = seg.push('[happy]やったね。')
      expect(displays(events)).toBe('[happy]やったね。')
    })
  })

  describe('コードブロック', () => {
    it('コードブロックをcodeイベントとして分離する', () => {
      const seg = new SpeechSegmenter()
      const events = seg.push('コードです。\n```js\nconst a = 1\n```以上です。')
      const c = codes(events)
      expect(c).toHaveLength(1)
      expect(c[0].kind === 'code' && c[0].content).toBe('const a = 1\n')
      expect(displays(events)).toBe('コードです。\n以上です。')
      expect(
        speeches(events).map((e) => e.kind === 'speech' && e.text)
      ).toEqual(['コードです。', '以上です。'])
    })

    it('チャンク跨ぎで分割された```を正しく検出する（D5）', () => {
      const seg = new SpeechSegmenter()
      const events = [
        ...pushAll(seg, [
          'コード。\n``',
          '`js\nconst a',
          ' = 1\n``',
          '`後続。',
        ]),
        ...seg.flush(),
      ]
      const c = codes(events)
      expect(c).toHaveLength(1)
      expect(c[0].kind === 'code' && c[0].content).toBe('const a = 1\n')
      expect(displays(events)).toBe('コード。\n後続。')
    })

    it('コードブロック直前の未確定文は発話として確定する（D2）', () => {
      const seg = new SpeechSegmenter()
      const events = pushAll(seg, ['未完の文``', '`\ncode\n```'])
      expect(
        speeches(events).map((e) => e.kind === 'speech' && e.text)
      ).toEqual(['未完の文'])
      const c = codes(events)
      expect(c[0].kind === 'code' && c[0].content).toBe('code\n')
    })

    it('言語指定行がチャンク跨ぎでも除去される（C9）', () => {
      const seg = new SpeechSegmenter()
      const events = pushAll(seg, ['```j', 's\nabc\n```'])
      const c = codes(events)
      expect(c[0].kind === 'code' && c[0].content).toBe('abc\n')
    })

    it('閉じられないコードブロックはflushでcodeイベントとして確定する（D6）', () => {
      const seg = new SpeechSegmenter()
      const pushed = seg.push('テキスト。```\nabc')
      const flushed = seg.flush()
      const c = codes([...pushed, ...flushed])
      expect(c).toHaveLength(1)
      expect(c[0].kind === 'code' && c[0].content).toBe('abc')
    })

    it('応答が```で始まる場合もコードとして分離される（C8）', () => {
      const seg = new SpeechSegmenter()
      const events = seg.push('```\nonly code\n```')
      expect(codes(events)).toHaveLength(1)
      expect(displays(events)).toBe('')
    })

    it('空のコードブロックはcodeイベントを発行しない', () => {
      const seg = new SpeechSegmenter()
      const events = [...seg.push('```\n```あと。'), ...seg.flush()]
      expect(codes(events)).toHaveLength(0)
      expect(
        speeches(events).map((e) => e.kind === 'speech' && e.text)
      ).toEqual(['あと。'])
    })

    it('コードブロック境界でタグ持ち越しがリセットされる', () => {
      const seg = new SpeechSegmenter()
      const events = [
        ...seg.push('[happy]コード。\n```\nabc\n```続き。'),
        ...seg.flush(),
      ]
      const all = speeches(events)
      expect(all[0].kind === 'speech' && all[0].emotionTag).toBe('[happy]')
      const last = all[all.length - 1]
      expect(last.kind === 'speech' && last.text).toBe('続き。')
      expect(last.kind === 'speech' && last.emotionTag).toBe('')
    })
  })

  describe('表示カーソル', () => {
    it('チャンク末尾のバッククォート断片は次チャンクまで表示を保留する', () => {
      const seg = new SpeechSegmenter()
      const first = seg.push('インライン`')
      expect(displays(first)).toBe('インライン')
      const second = seg.push('code`です。')
      expect(displays(second)).toBe('`code`です。')
    })

    it('保留されたバッククォートはflushで表示・発話に確定する', () => {
      const seg = new SpeechSegmenter()
      const pushed = seg.push('記号``')
      const flushed = seg.flush()
      expect(displays([...pushed, ...flushed])).toBe('記号``')
    })

    it('flushは表示済みテキストを二重に発行しない', () => {
      const seg = new SpeechSegmenter()
      const pushed = seg.push('未確定のテキスト')
      expect(displays(pushed)).toBe('未確定のテキスト')
      const flushed = seg.flush()
      expect(flushed.filter((e) => e.kind === 'display')).toHaveLength(0)
    })

    it('表示イベントの合計はコード内容を除く全文と一致する', () => {
      const seg = new SpeechSegmenter()
      const events = [
        ...pushAll(seg, ['前半。', '```\ncode\n``', '`後半。']),
        ...seg.flush(),
      ]
      expect(displays(events)).toBe('前半。後半。')
    })
  })
})
