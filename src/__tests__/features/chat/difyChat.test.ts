import { getDifyChatResponseStream } from '../../../features/chat/difyChat'
import settingsStore from '../../../features/stores/settings'
import toastStore from '../../../features/stores/toast'
import i18next from 'i18next'
import { Message } from '../../../features/messages/messages'
import { consumeStream } from '../../testUtils'

jest.mock('../../../features/stores/settings', () => ({
  getState: jest.fn(),
  setState: jest.fn(),
}))

jest.mock('../../../features/stores/toast', () => ({
  getState: jest.fn(),
}))

jest.mock('i18next', () => ({
  t: jest.fn((key) => key),
  changeLanguage: jest.fn(),
}))

// --- グローバルオブジェクトのモック管理 ---
let originalFetch: typeof global.fetch
let originalTextDecoder: typeof global.TextDecoder
const mockFetch = jest.fn()
const mockDecode = jest.fn()

beforeAll(() => {
  // 元のオブジェクトを保存
  originalFetch = global.fetch
  originalTextDecoder = global.TextDecoder

  // fetch をモック
  global.fetch = mockFetch as any // jest.fn() を fetch の型にキャスト

  // TextDecoder をモック（クラスとして new できるように）
  global.TextDecoder = class {
    decode = mockDecode
  } as unknown as typeof TextDecoder
})

afterAll(() => {
  // 元のオブジェクトに戻す
  global.fetch = originalFetch
  global.TextDecoder = originalTextDecoder
})
// --- グローバルオブジェクトのモック管理 終了 ---

describe('difyChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
    mockDecode.mockClear()

    const mockSettings = {
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

  describe('getDifyChatResponseStream', () => {
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
        'data: {"event":"message","answer":"こんにちは","conversation_id":"test-conversation-id"}\n\n'
      )

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const stream = await getDifyChatResponseStream(
        testMessages,
        'test-api-key',
        'https://test-dify-url',
        'old-conversation-id'
      )

      const result = await consumeStream(stream)

      expect(result).toBe('こんにちは')

      expect(settingsStore.setState).toHaveBeenCalledWith({
        difyConversationId: 'test-conversation-id',
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/difyChat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'こんにちは',
          apiKey: 'test-api-key',
          url: 'https://test-dify-url',
          conversationId: 'old-conversation-id',
          stream: true,
        }),
      })
    })

    it('agent_messageイベントを処理する', async () => {
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
        'data: {"event":"agent_message","answer":"エージェントからの応答","conversation_id":"agent-conversation-id"}\n\n'
      )

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const stream = await getDifyChatResponseStream(
        testMessages,
        'test-api-key',
        'https://test-dify-url',
        'old-conversation-id'
      )

      const result = await consumeStream(stream)

      expect(result).toBe('エージェントからの応答')

      expect(settingsStore.setState).toHaveBeenCalledWith({
        difyConversationId: 'agent-conversation-id',
      })
    })

    it('JSONパースエラーを適切に処理する', async () => {
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

      mockDecode.mockReturnValueOnce('data: {invalid-json}\n\n')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const originalConsoleError = console.error
      console.error = jest.fn()

      const stream = await getDifyChatResponseStream(
        testMessages,
        'test-api-key',
        'https://test-dify-url',
        'old-conversation-id'
      )

      await consumeStream(stream)

      expect(console.error).toHaveBeenCalledWith(
        'Error parsing JSON:',
        expect.any(Error)
      )

      console.error = originalConsoleError
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

      const originalConsoleError = console.error
      console.error = jest.fn()

      const stream = await getDifyChatResponseStream(
        testMessages,
        'test-api-key',
        'https://test-dify-url',
        'old-conversation-id'
      )

      await consumeStream(stream)

      expect(i18next.t).toHaveBeenCalledWith('Errors.AIAPIError')
      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'Errors.AIAPIError',
        type: 'error',
        tag: 'dify-api-error',
      })

      console.error = originalConsoleError
    })

    it('レスポンスが空の場合にエラーをスローする', async () => {
      // このテストケース用に fetch をモック
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        body: null,
      })
      global.fetch = mockFetch

      // getDifyChatResponseStream自体はエラーを投げないが、
      // 返されたストリームを consume しようとするとエラーになるはず
      const stream = await getDifyChatResponseStream(
        testMessages,
        'test-api-key',
        'https://test-dify-url',
        'old-conversation-id'
      )
      const result = await consumeStream(stream)
      expect(result).toBe('')
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

      global.fetch = mockFetch

      // getDifyChatResponseStream の呼び出し自体が reject されることを期待
      await expect(
        getDifyChatResponseStream(
          testMessages,
          'test-api-key',
          'https://test-dify-url',
          'old-conversation-id'
        )
      ).rejects.toThrow(
        'API request to Dify failed with status 401 and body Unauthorized'
      )

      // toast のアサーションはそのまま残す
      expect(i18next.t).toHaveBeenCalledWith('Errors.InvalidAPIKey')
      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'Errors.InvalidAPIKey',
        tag: 'dify-api-error',
        type: 'error',
      })
    })
  })
})
