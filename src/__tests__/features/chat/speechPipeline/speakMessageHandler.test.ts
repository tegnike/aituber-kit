import { speakMessageHandler } from '@/features/chat/speechPipeline/speakMessageHandler'
import { speakCharacter } from '@/features/messages/speakCharacter'
import homeStore from '@/features/stores/home'

jest.mock('@/features/messages/speakCharacter', () => ({
  speakCharacter: jest.fn(),
}))

jest.mock('@/features/stores/home', () => ({
  getState: jest.fn(),
  setState: jest.fn(),
}))

jest.mock('@/features/stores/settings', () => ({
  getState: jest.fn(() => ({ selectVoice: 'voicevox' })),
}))

describe('speakMessageHandler', () => {
  const upsertMessage = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(homeStore.getState as jest.Mock).mockReturnValue({
      upsertMessage,
      incrementChatProcessingCount: jest.fn(),
      decrementChatProcessingCount: jest.fn(),
    })
  })

  it('表示文をchatLogへ残し、発話文だけをTTSへ渡す', async () => {
    await speakMessageHandler('バンカーキッズを紹介します。次はウィフです。', {
      speechSessionId: 'presentation-1',
      displayMessage: 'Bunkerkidsを紹介します。次はWHIFです。',
    })

    expect(upsertMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: 'Bunkerkidsを紹介します。 次はWHIFです。',
      })
    )
    expect(speakCharacter).toHaveBeenCalledTimes(2)
    expect(speakCharacter).toHaveBeenNthCalledWith(
      1,
      'presentation-1',
      expect.objectContaining({ message: 'バンカーキッズを紹介します。' }),
      expect.any(Function),
      expect.any(Function),
      'Bunkerkidsを紹介します。',
      expect.any(Function)
    )
    expect(speakCharacter).toHaveBeenNthCalledWith(
      2,
      'presentation-1',
      expect.objectContaining({ message: '次はウィフです。' }),
      expect.any(Function),
      expect.any(Function),
      '次はWHIFです。',
      expect.any(Function)
    )
  })

  it('空の表示文を複数の発話セグメントでも維持する', async () => {
    await speakMessageHandler('一文目です。二文目です。', {
      speechSessionId: 'presentation-empty-display',
      displayMessage: '',
    })

    expect(speakCharacter).toHaveBeenCalledTimes(2)
    expect(speakCharacter).toHaveBeenNthCalledWith(
      1,
      'presentation-empty-display',
      expect.objectContaining({ message: '一文目です。' }),
      expect.any(Function),
      expect.any(Function),
      '',
      expect.any(Function)
    )
    expect(speakCharacter).toHaveBeenNthCalledWith(
      2,
      'presentation-empty-display',
      expect.objectContaining({ message: '二文目です。' }),
      expect.any(Function),
      expect.any(Function),
      '',
      expect.any(Function)
    )
  })

  it('読み置換で読点分割が増えても表示文を同じ句読点位置へ割り当てる', async () => {
    await speakMessageHandler(
      '最初に見た目を分けます。ピーエヌジーチューバーは、声に合わせてピーエヌジー画像を動かす表示方法で、これだけではコメントを理解して返事を作ることはできません。',
      {
        speechSessionId: 'presentation-pngtuber',
        displayMessage:
          '最初に見た目を分けます。PNGtuberは、声に合わせてPNG画像を動かす表示方法で、これだけではコメントを理解して返事を作ることはできません。',
      }
    )

    expect(
      (speakCharacter as jest.Mock).mock.calls.map((call) => ({
        speech: call[1].message,
        display: call[4],
      }))
    ).toEqual([
      {
        speech: '最初に見た目を分けます。',
        display: '最初に見た目を分けます。',
      },
      {
        speech: 'ピーエヌジーチューバーは、',
        display: 'PNGtuberは、',
      },
      {
        speech: '声に合わせてピーエヌジー画像を動かす表示方法で、',
        display: '声に合わせてPNG画像を動かす表示方法で、',
      },
      {
        speech: 'これだけではコメントを理解して返事を作ることはできません。',
        display: 'これだけではコメントを理解して返事を作ることはできません。',
      },
    ])
  })
})
