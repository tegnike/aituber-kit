import { getDifyChatResponseStream } from '../../../features/chat/difyChat'
import settingsStore from '../../../features/stores/settings'
import toastStore from '../../../features/stores/toast'
import i18next from 'i18next'
import { Message } from '../../../features/messages/messages'

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

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockDecode = jest.fn()
global.TextDecoder = jest.fn().mockImplementation(() => ({
  decode: mockDecode,
}))

describe('difyChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()

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

      const mockController = {
        enqueue: jest.fn(),
        close: jest.fn(),
      }

      const stream = await getDifyChatResponseStream(
        testMessages,
        'test-api-key',
        'https://test-dify-url',
        'old-conversation-id'
      )

      await (stream as any)._startFn(mockController)

      expect(mockController.enqueue).toHaveBeenCalledWith('こんにちは')
      expect(mockController.close).toHaveBeenCalled()
      expect(mockReader.releaseLock).toHaveBeenCalled()

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

      const mockController = {
        enqueue: jest.fn(),
        close: jest.fn(),
      }

      const stream = await getDifyChatResponseStream(
        testMessages,
        'test-api-key',
        'https://test-dify-url',
        'old-conversation-id'
      )

      await (stream as any)._startFn(mockController)

      expect(mockController.enqueue).toHaveBeenCalledWith(
        'エージェントからの応答'
      )
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

      const mockController = {
        enqueue: jest.fn(),
        close: jest.fn(),
      }

      const originalConsoleError = console.error
      console.error = jest.fn()

      const stream = await getDifyChatResponseStream(
        testMessages,
        'test-api-key',
        'https://test-dify-url',
        'old-conversation-id'
      )

      await (stream as any)._startFn(mockController)

      expect(console.error).toHaveBeenCalledWith(
        'Error parsing JSON:',
        expect.any(Error)
      )
      expect(mockController.close).toHaveBeenCalled()

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

      const mockController = {
        enqueue: jest.fn(),
        close: jest.fn(),
      }

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

      await (stream as any)._startFn(mockController)

      expect(i18next.t).toHaveBeenCalledWith('Errors.AIAPIError')
      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'Errors.AIAPIError',
        type: 'error',
        tag: 'dify-api-error',
      })
      expect(mockController.close).toHaveBeenCalled()
      expect(mockReader.releaseLock).toHaveBeenCalled()

      console.error = originalConsoleError
    })

    it('レスポンスが空の場合にエラーをスローする', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: null,
      })

      const mockController = {
        enqueue: jest.fn(),
        close: jest.fn(),
      }

      const stream = await getDifyChatResponseStream(
        testMessages,
        'test-api-key',
        'https://test-dify-url',
        'old-conversation-id'
      )

      await expect(async () => {
        await (stream as any)._startFn(mockController)
      }).rejects.toThrow('API response from Dify is empty')
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

      expect(i18next.t).toHaveBeenCalledWith('Errors.InvalidAPIKey')
      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'Errors.InvalidAPIKey',
        type: 'error',
        tag: 'dify-api-error',
      })
    })
  })
})
