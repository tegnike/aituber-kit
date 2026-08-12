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
      'Bunkerkidsを紹介します。'
    )
    expect(speakCharacter).toHaveBeenNthCalledWith(
      2,
      'presentation-1',
      expect.objectContaining({ message: '次はウィフです。' }),
      expect.any(Function),
      expect.any(Function),
      '次はWHIFです。'
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
      ''
    )
    expect(speakCharacter).toHaveBeenNthCalledWith(
      2,
      'presentation-empty-display',
      expect.objectContaining({ message: '二文目です。' }),
      expect.any(Function),
      expect.any(Function),
      ''
    )
  })
})
