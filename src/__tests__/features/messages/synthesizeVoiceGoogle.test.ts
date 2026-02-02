import { synthesizeVoiceGoogleApi } from '@/features/messages/synthesizeVoiceGoogle'
import type { Talk } from '@/features/messages/messages'

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('synthesizeVoiceGoogleApi', () => {
  const mockTalk: Talk = {
    emotion: 'neutral',
    message: 'Hello',
  }

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should send correct request to /api/tts-google', async () => {
    const fakeAudio = btoa('audio-data-here')
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ audio: fakeAudio }),
    })

    await synthesizeVoiceGoogleApi(mockTalk, '', 'ja')

    expect(mockFetch).toHaveBeenCalledWith('/api/tts-google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        ttsType: 'ja-JP-Standard-B',
        languageCode: 'ja-JP',
      }),
    })
  })

  it('should use custom ttsType when provided', async () => {
    const fakeAudio = btoa('audio-data')
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ audio: fakeAudio }),
    })

    await synthesizeVoiceGoogleApi(mockTalk, 'custom-voice-type', 'en')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.ttsType).toBe('custom-voice-type')
  })

  it('should use default ttsType for English when none provided', async () => {
    const fakeAudio = btoa('data')
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ audio: fakeAudio }),
    })

    await synthesizeVoiceGoogleApi(mockTalk, '', 'en')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.ttsType).toBe('en-US-Neural2-F')
    expect(body.languageCode).toBe('en-US')
  })

  it('should return ArrayBuffer from base64 response', async () => {
    const fakeAudio = btoa('test audio content')
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ audio: fakeAudio }),
    })

    const result = await synthesizeVoiceGoogleApi(mockTalk, '', 'ja')

    expect(result).toBeInstanceOf(ArrayBuffer)
    expect(result.byteLength).toBeGreaterThan(0)
  })

  it('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    })

    await expect(synthesizeVoiceGoogleApi(mockTalk, '', 'ja')).rejects.toThrow(
      'Google Text-to-Speechでエラーが発生しました'
    )
  })

  it('should throw wrapped error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'))

    await expect(synthesizeVoiceGoogleApi(mockTalk, '', 'ja')).rejects.toThrow(
      'Google Text-to-Speechでエラーが発生しました: Network failure'
    )
  })

  it('should throw generic error for non-Error exceptions', async () => {
    mockFetch.mockRejectedValue(42)

    await expect(synthesizeVoiceGoogleApi(mockTalk, '', 'ja')).rejects.toThrow(
      'Google Text-to-Speechで不明なエラーが発生しました'
    )
  })

  describe('language mappings', () => {
    const languageMappings: [string, string, string][] = [
      ['ko', 'ko-KR-Neural2-A', 'ko-KR'],
      ['zh-CN', 'cmn-CN-Standard-A', 'zh-CN'],
      ['zh-TW', 'cmn-TW-Standard-A', 'zh-TW'],
      ['fr', 'fr-FR-Standard-A', 'fr-FR'],
      ['de', 'de-DE-Standard-A', 'de-DE'],
    ]

    it.each(languageMappings)(
      'should use correct defaults for %s',
      async (lang, expectedTtsType, expectedLangCode) => {
        const fakeAudio = btoa('data')
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ audio: fakeAudio }),
        })

        await synthesizeVoiceGoogleApi(mockTalk, '', lang as any)

        const body = JSON.parse(mockFetch.mock.calls[0][1].body)
        expect(body.ttsType).toBe(expectedTtsType)
        expect(body.languageCode).toBe(expectedLangCode)
      }
    )
  })
})
