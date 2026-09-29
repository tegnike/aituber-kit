import { synthesizeVoiceVoicevoxApi } from '@/features/messages/synthesizeVoiceVoicevox'
import type { Talk } from '@/features/messages/messages'
import { synthesizeVoicevoxInBrowser } from '@/features/messages/voicevoxBrowserClient'

jest.mock('@/features/messages/voicevoxBrowserClient', () => ({
  synthesizeVoicevoxInBrowser: jest.fn(),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('synthesizeVoiceVoicevoxApi', () => {
  const mockTalk: Talk = {
    emotion: 'neutral',
    message: 'Hello world',
  }

  beforeEach(() => {
    mockFetch.mockReset()
    ;(synthesizeVoicevoxInBrowser as jest.Mock).mockReset()
  })

  it('should send correct request to /api/tts-voicevox', async () => {
    const mockBuffer = new ArrayBuffer(8)
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockBuffer),
    })

    await synthesizeVoiceVoicevoxApi(
      mockTalk,
      '1',
      1.0,
      0.0,
      1.0,
      'http://localhost:50021'
    )

    expect(mockFetch).toHaveBeenCalledWith('/api/tts-voicevox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello world',
        speaker: '1',
        speed: 1.0,
        pitch: 0.0,
        intonation: 1.0,
        serverUrl: 'http://localhost:50021',
      }),
    })
  })

  it('should return ArrayBuffer on success', async () => {
    const mockBuffer = new ArrayBuffer(16)
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockBuffer),
    })

    const result = await synthesizeVoiceVoicevoxApi(
      mockTalk,
      '1',
      1.0,
      0.0,
      1.0,
      'http://localhost:50021'
    )

    expect(result).toBe(mockBuffer)
  })

  it('uses the browser client only when browser connection mode is selected', async () => {
    const mockBuffer = new ArrayBuffer(16)
    ;(synthesizeVoicevoxInBrowser as jest.Mock).mockResolvedValue(mockBuffer)

    await expect(
      synthesizeVoiceVoicevoxApi(mockTalk, '46', 1.2, 0.1, 1.1, '', 'browser')
    ).resolves.toBe(mockBuffer)

    expect(synthesizeVoicevoxInBrowser).toHaveBeenCalledWith(
      'Hello world',
      '46',
      1.2,
      0.1,
      1.1,
      ''
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should throw with status code on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    })

    await expect(
      synthesizeVoiceVoicevoxApi(
        mockTalk,
        '1',
        1.0,
        0.0,
        1.0,
        'http://localhost:50021'
      )
    ).rejects.toThrow(
      'VOICEVOXでエラーが発生しました: VOICEVOXからの応答が異常です。ステータスコード: 500'
    )
  })

  it('should throw wrapped error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    await expect(
      synthesizeVoiceVoicevoxApi(
        mockTalk,
        '1',
        1.0,
        0.0,
        1.0,
        'http://localhost:50021'
      )
    ).rejects.toThrow('VOICEVOXでエラーが発生しました: Network error')
  })
})
