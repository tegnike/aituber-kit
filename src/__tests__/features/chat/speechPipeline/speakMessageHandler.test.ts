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
    await speakMessageHandler('バンカーキッズを紹介します。', {
      speechSessionId: 'presentation-1',
      displayMessage: 'Bunkerkidsを紹介します。',
    })

    expect(upsertMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: 'Bunkerkidsを紹介します。',
      })
    )
    expect(speakCharacter).toHaveBeenCalledWith(
      'presentation-1',
      expect.objectContaining({ message: 'バンカーキッズを紹介します。' }),
      expect.any(Function),
      expect.any(Function)
    )
  })
})
