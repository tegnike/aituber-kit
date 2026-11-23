import {
  synthesizeVoiceWaffleApi,
  toWaffleText,
} from '@/features/messages/synthesizeVoiceWaffle'
import type { Talk } from '@/features/messages/messages'

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('toWaffleText', () => {
  it('wraps the line in the matching Waffle emotion tag', () => {
    expect(toWaffleText({ emotion: 'happy', message: 'やった！' })).toBe(
      '<happy>やった！</happy>'
    )
    expect(toWaffleText({ emotion: 'surprised', message: 'えっ？' })).toBe(
      '<surprised>えっ？</surprised>'
    )
  })

  it('leaves neutral and relaxed lines untagged', () => {
    expect(toWaffleText({ emotion: 'neutral', message: 'こんにちは' })).toBe(
      'こんにちは'
    )
    expect(toWaffleText({ emotion: 'relaxed', message: 'のんびり' })).toBe(
      'のんびり'
    )
  })

  it('keeps Waffle sound tags', () => {
    expect(
      toWaffleText({ emotion: 'happy', message: 'あはは[Laughing]、楽しい！' })
    ).toBe('<happy>あはは[laughing]、楽しい！</happy>')
  })

  it('removes tags Waffle would reject', () => {
    expect(
      toWaffleText({
        emotion: 'neutral',
        message: '[relaxed]面白いね[笑] <whispering>秘密</whispering>',
      })
    ).toBe('面白いね 秘密')
  })

  it('keeps plain angle brackets that are not tags', () => {
    expect(toWaffleText({ emotion: 'neutral', message: 'A < B だよ <3' })).toBe(
      'A < B だよ <3'
    )
  })
})

describe('synthesizeVoiceWaffleApi', () => {
  const mockTalk: Talk = {
    emotion: 'sad',
    message: 'もう帰っちゃうの？',
  }

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should throw when apiKey is missing', async () => {
    await expect(
      synthesizeVoiceWaffleApi(mockTalk, '', 'voice-id')
    ).rejects.toThrow('WaffleのAPIキーが設定されていません')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should throw when voiceId is missing', async () => {
    await expect(synthesizeVoiceWaffleApi(mockTalk, 'key', '')).rejects.toThrow(
      'WaffleのボイスIDが設定されていません'
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should stay silent when nothing is left to speak', async () => {
    await expect(
      synthesizeVoiceWaffleApi(
        { emotion: 'happy', message: '[笑]' },
        'key',
        'voice-id'
      )
    ).resolves.toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should send the emotion-tagged text to /api/tts-waffle', async () => {
    const mockBuffer = new ArrayBuffer(8)
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockBuffer),
    })

    const result = await synthesizeVoiceWaffleApi(mockTalk, 'key', 'voice-id')

    expect(result).toBe(mockBuffer)
    expect(mockFetch).toHaveBeenCalledWith('/api/tts-waffle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '<sad>もう帰っちゃうの？</sad>',
        apiKey: 'key',
        voiceId: 'voice-id',
      }),
    })
  })

  it('should include error detail text on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 402,
      text: () => Promise.resolve('insufficient_credit'),
    })

    await expect(
      synthesizeVoiceWaffleApi(mockTalk, 'key', 'voice-id')
    ).rejects.toThrow(
      'Waffleでエラーが発生しました: Waffle APIからの応答が異常です。ステータスコード: 402, エラー詳細: insufficient_credit'
    )
  })
})
