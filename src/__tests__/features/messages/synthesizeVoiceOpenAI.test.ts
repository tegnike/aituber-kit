import { synthesizeVoiceOpenAIApi } from '@/features/messages/synthesizeVoiceOpenAI'
import type { Talk } from '@/features/messages/messages'

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('synthesizeVoiceOpenAIApi', () => {
  const mockTalk: Talk = {
    emotion: 'neutral',
    message: 'Hello world',
  }

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should send correct request to /api/openAITTS', async () => {
    const mockBuffer = new ArrayBuffer(8)
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockBuffer),
    })

    await synthesizeVoiceOpenAIApi(mockTalk, 'test-key', 'alloy', 'tts-1', 1.0)

    expect(mockFetch).toHaveBeenCalledWith('/api/openAITTS', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello world',
        voice: 'alloy',
        model: 'tts-1',
        speed: 1.0,
        apiKey: 'test-key',
      }),
    })
  })

  it('should return ArrayBuffer on success', async () => {
    const mockBuffer = new ArrayBuffer(16)
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockBuffer),
    })

    const result = await synthesizeVoiceOpenAIApi(
      mockTalk,
      'key',
      'alloy',
      'tts-1',
      1.0
    )

    expect(result).toBe(mockBuffer)
  })

  it('should throw with status code on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
    })

    await expect(
      synthesizeVoiceOpenAIApi(mockTalk, 'key', 'alloy', 'tts-1', 1.0)
    ).rejects.toThrow('OpenAI TTSでエラーが発生しました')
  })

  it('should throw wrapped error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    await expect(
      synthesizeVoiceOpenAIApi(mockTalk, 'key', 'alloy', 'tts-1', 1.0)
    ).rejects.toThrow('OpenAI TTSでエラーが発生しました: Network error')
  })

  it('should throw generic error for non-Error exceptions', async () => {
    mockFetch.mockRejectedValue('string error')

    await expect(
      synthesizeVoiceOpenAIApi(mockTalk, 'key', 'alloy', 'tts-1', 1.0)
    ).rejects.toThrow('OpenAI TTSで不明なエラーが発生しました')
  })
})
