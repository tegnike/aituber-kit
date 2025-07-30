import {
  getVercelAIChatResponse,
  getVercelAIChatResponseStream,
} from '../../../features/chat/vercelAIChat'
import settingsStore from '../../../features/stores/settings'
import toastStore from '../../../features/stores/toast'
import i18next from 'i18next'
import { Message } from '../../../features/messages/messages'

jest.mock('../../../features/stores/settings', () => ({
  getState: jest.fn(),
}))

jest.mock('../../../features/stores/toast', () => ({
  getState: jest.fn(),
}))

jest.mock('i18next', () => ({
  t: jest.fn((key) => key),
  changeLanguage: jest.fn(),
}))

// Preserve original global objects to avoid side-effects across test suites
const originalFetch = global.fetch
// TextDecoder may be undefined in some Node versions, so we keep the current value as is
// (could be `undefined` as well, which is fine for restoration later)
// @ts-ignore – Node 20 provides TextDecoder globally; ignore for earlier versions in typings
const originalTextDecoder =
  global.TextDecoder as unknown as typeof global.TextDecoder

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockDecode = jest.fn()
global.TextDecoder = jest.fn().mockImplementation(() => ({
  decode: mockDecode,
}))

describe('vercelAIChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const mockSettings = {
      selectAIService: 'openai',
      openaiKey: 'test-openai-key',
      selectAIModel: 'gpt-4.1',
      localLlmUrl: '',
      azureEndpoint: '',
      useSearchGrounding: false,
      temperature: 0.7,
      maxTokens: 1000,
      customApiUrl: '',
      customApiHeaders: '',
      customApiBody: '',
      customApiStream: true,
      includeSystemMessagesInCustomApi: true,
      selectLanguage: 'ja',
    }
    ;(settingsStore.getState as jest.Mock).mockReturnValue(mockSettings)

    const mockAddToast = jest.fn()
    ;(toastStore.getState as jest.Mock).mockReturnValue({
      addToast: mockAddToast,
    })
  })

  const testMessages: Message[] = [
    {
      role: 'system',
      content: 'システムプロンプト',
      timestamp: '2023-01-01T00:00:00Z',
    },
    { role: 'user', content: 'こんにちは', timestamp: '2023-01-01T00:00:01Z' },
  ]

  describe('getVercelAIChatResponse', () => {
    it('正常なレスポンスを処理する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ text: 'AIからの応答' }),
      })

      const result = await getVercelAIChatResponse(testMessages)

      expect(mockFetch).toHaveBeenCalledWith('/api/ai/vercel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: testMessages,
          stream: false,
          apiKey: 'test-openai-key',
          aiService: 'openai',
          model: 'gpt-4.1',
          localLlmUrl: '',
          azureEndpoint: '',
          useSearchGrounding: false,
          temperature: 0.7,
          maxTokens: 1000,
        }),
      })

      expect(result).toEqual({ text: 'AIからの応答' })
    })

    it('エラーレスポンスを適切に処理する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: 'Bad Request',
          errorCode: 'InvalidAPIKey',
        }),
      })

      const result = await getVercelAIChatResponse(testMessages)

      expect(i18next.changeLanguage).toHaveBeenCalledWith('ja')
      expect(i18next.t).toHaveBeenCalledWith('Errors.InvalidAPIKey')

      expect(result.text).toBe('Errors.InvalidAPIKey')
    })

    it('カスタムAPIモードでシステムメッセージをフィルタリングする', async () => {
      ;(settingsStore.getState as jest.Mock).mockReturnValue({
        selectAIService: 'custom-api',
        customApiUrl: 'https://custom-api.example.com',
        customApiHeaders: '{"Authorization": "Bearer test-token"}',
        customApiBody: '{"format": "json"}',
        temperature: 0.5,
        maxTokens: 500,
        includeSystemMessagesInCustomApi: false,
        selectLanguage: 'ja',
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ text: 'カスタムAPIからの応答' }),
      })

      await getVercelAIChatResponse(testMessages)

      const fetchCall = mockFetch.mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.messages.length).toBe(1)
      expect(requestBody.messages[0].role).toBe('user')
      expect(requestBody.customApiUrl).toBe('https://custom-api.example.com')
    })
  })

  describe('getVercelAIChatResponseStream', () => {
    it('ストリーミングレスポンスを正しく処理する', async () => {
      const mockReader = {
        read: jest.fn(),
        releaseLock: jest.fn(),
      }

      mockReader.read
        .mockResolvedValueOnce({
          done: false,
          value: new Uint8Array([1, 2, 3]),
        })
        .mockResolvedValueOnce({
          done: true,
          value: undefined,
        })

      mockDecode.mockReturnValueOnce(
        'data: {"choices":[{"delta":{"content":"こんにちは"}}]}\n\n'
      )

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const stream = await getVercelAIChatResponseStream(testMessages)

      // ストリームの内容を読み取る
      const reader = (stream as ReadableStream<string>).getReader()
      let result = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) {
          result += value
        }
      }

      expect(result).toBe('こんにちは')
    })

    it('ストリーミング中のエラーを適切に処理する', async () => {
      const mockReader = {
        read: jest.fn().mockRejectedValue(new Error('Stream error')),
        releaseLock: jest.fn(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const mockAddToast = jest.fn()
      ;(toastStore.getState as jest.Mock).mockReturnValue({
        addToast: mockAddToast,
      })

      const stream = await getVercelAIChatResponseStream(testMessages)

      // ストリームの内容を読み取る（エラーケースなので最後まで読み取る）
      const reader = (stream as ReadableStream<string>).getReader()
      try {
        while (true) {
          const { done } = await reader.read()
          if (done) break
        }
      } catch (error) {
        // エラーはここでキャッチされる可能性があるが、テストのアサーションで確認するため無視
      }

      expect(i18next.t).toHaveBeenCalledWith('Errors.AIAPIError')
      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'Errors.AIAPIError',
        type: 'error',
        tag: 'vercel-api-error',
      })
    })

    it('レスポンスが空の場合にエラーをスローする', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: null,
      })

      const stream = await getVercelAIChatResponseStream(testMessages)

      await expect(async () => {
        // ストリームの内容を読み取る
        const reader = (stream as ReadableStream<string>).getReader()
        while (true) {
          const { done } = await reader.read()
          if (done) break
        }
        // 空のレスポンスの場合、この後に getVercelAIChatResponseStream 内でエラーが throw されることを期待
      }).rejects.toThrow('API response from openai is empty, status 200')
    })

    it('APIエラーレスポンスを適切に処理する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({
          error: 'Unauthorized',
          errorCode: 'InvalidAPIKey',
        }),
      })

      const mockAddToast = jest.fn()
      ;(toastStore.getState as jest.Mock).mockReturnValue({
        addToast: mockAddToast,
      })

      await expect(getVercelAIChatResponseStream(testMessages)).rejects.toThrow(
        'API request to openai failed with status 401 and body Unauthorized'
      )

      expect(i18next.t).toHaveBeenCalledWith('Errors.InvalidAPIKey')
      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'Errors.InvalidAPIKey',
        type: 'error',
        tag: 'vercel-api-error',
      })
    })
  })
})

// Restore the original implementations after all tests in this file have finished
afterAll(() => {
  global.fetch = originalFetch
  // @ts-ignore – restore possibly undefined original value safely
  global.TextDecoder = originalTextDecoder
})
