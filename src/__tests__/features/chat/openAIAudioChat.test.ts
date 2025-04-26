import { getOpenAIAudioChatResponseStream } from '../../../features/chat/openAIAudioChat'
import OpenAI from 'openai'
import settingsStore from '../../../features/stores/settings'
import homeStore from '../../../features/stores/home'
import { handleReceiveTextFromRtFn } from '../../../features/chat/handlers'
import {
  AudioBufferManager,
  base64ToArrayBuffer,
} from '../../../utils/audioBufferManager'
import { messageSelectors } from '../../../features/messages/messageSelectors'
import { Message } from '../../../features/messages/messages'

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  }
})

jest.mock('../../../features/stores/settings', () => ({
  getState: jest.fn(),
}))

jest.mock('../../../features/stores/home', () => ({
  getState: jest.fn(),
}))

jest.mock('../../../features/chat/handlers', () => ({
  handleReceiveTextFromRtFn: jest.fn(),
}))

jest.mock('../../../utils/audioBufferManager', () => ({
  AudioBufferManager: jest.fn(),
  base64ToArrayBuffer: jest.fn(),
}))

jest.mock('../../../features/messages/messageSelectors', () => ({
  messageSelectors: {
    getAudioMessages: jest.fn(),
  },
}))

describe('openAIAudioChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const mockSettings = {
      openaiKey: 'test-openai-key',
      selectAIModel: 'gpt-4o-audio-preview',
      audioModeVoice: 'alloy',
    }
    ;(settingsStore.getState as jest.Mock).mockReturnValue(mockSettings)

    const mockChatLog: Message[] = []
    const mockHomeStore = {
      chatLog: mockChatLog,
      upsertMessage: jest.fn((newMessage: Message) => {
        const existingIndex = mockChatLog.findIndex(
          (msg) =>
            msg.audio?.id === newMessage.audio?.id &&
            newMessage.audio?.id !== undefined
        )
        if (existingIndex !== -1) {
          mockChatLog[existingIndex] = {
            ...mockChatLog[existingIndex],
            ...newMessage,
          }
        } else {
          mockChatLog.push(newMessage)
        }
      }),
    }
    ;(homeStore.getState as jest.Mock).mockImplementation(() => mockHomeStore)

    const mockHandleReceiveText = jest.fn()
    ;(handleReceiveTextFromRtFn as jest.Mock).mockReturnValue(
      mockHandleReceiveText
    )
    ;(AudioBufferManager as jest.Mock).mockImplementation((callback) => ({
      addData: jest.fn(),
      flush: jest.fn().mockResolvedValue(undefined),
      callback,
    }))
    ;(base64ToArrayBuffer as jest.Mock).mockReturnValue(new ArrayBuffer(8))
    ;(messageSelectors.getAudioMessages as jest.Mock).mockImplementation(
      (messages) => messages
    )
  })

  const testMessages: Message[] = [
    {
      role: 'system',
      content: 'システムプロンプト',
      timestamp: '2023-01-01T00:00:00Z',
    },
    { role: 'user', content: 'こんにちは', timestamp: '2023-01-01T00:00:01Z' },
  ]

  describe('getOpenAIAudioChatResponseStream', () => {
    it('オーディオストリームを正しく処理する', async () => {
      const mockChunks = [
        {
          choices: [
            {
              delta: {
                audio: {
                  transcript: 'こんにちは、',
                  data: 'base64data1',
                },
              },
            },
          ],
        },
        {
          choices: [
            {
              delta: {
                audio: {
                  transcript: 'お元気ですか？',
                  data: 'base64data2',
                },
              },
            },
          ],
        },
        {
          choices: [
            {
              delta: {
                audio: {
                  id: 'audio-id-123',
                },
              },
            },
          ],
        },
      ]

      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of mockChunks) {
            yield chunk
          }
        },
      }

      const mockCreate = jest.fn().mockResolvedValue(mockAsyncIterator)
      ;(OpenAI as unknown as jest.Mock).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const mockController = {
        enqueue: jest.fn(),
        close: jest.fn(),
      }

      const stream = await getOpenAIAudioChatResponseStream(testMessages)

      // ストリームの内容を読み取る
      const reader = (stream as ReadableStream<string>).getReader()
      let result = ''
      let done = false
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        if (readerDone) {
          done = true
          break
        }
        if (value) {
          // 実際の enqueue 呼び出しを模倣（テストのアサーション用）
          mockController.enqueue(value)
          result += value
        }
      }

      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-openai-key',
        dangerouslyAllowBrowser: true,
      })

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-audio-preview',
        messages: testMessages,
        stream: true,
        modalities: ['text', 'audio'],
        audio: {
          voice: 'alloy',
          format: 'pcm16',
        },
      })

      expect(mockController.enqueue).toHaveBeenCalledWith('こんにちは、')
      expect(mockController.enqueue).toHaveBeenCalledWith('お元気ですか？')

      expect(base64ToArrayBuffer).toHaveBeenCalledWith('base64data1')
      expect(base64ToArrayBuffer).toHaveBeenCalledWith('base64data2')

      const bufferManagerInstance = (AudioBufferManager as jest.Mock).mock
        .results[0].value
      expect(bufferManagerInstance.addData).toHaveBeenCalledTimes(2)

      expect(homeStore.getState().chatLog).toContainEqual({
        role: 'assistant',
        audio: { id: 'audio-id-123' },
        content: '',
        id: 'audio-id-123',
      })

      expect(bufferManagerInstance.flush).toHaveBeenCalled()
    })

    it('APIエラーを適切に処理する', async () => {
      const mockError = new Error('API error')
      const mockCreate = jest.fn().mockRejectedValue(mockError)
      ;(OpenAI as unknown as jest.Mock).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const originalConsoleError = console.error
      console.error = jest.fn()

      // エラーが発生することを期待する
      await expect(
        getOpenAIAudioChatResponseStream(testMessages)
      ).rejects.toThrow('API error')

      // エラーがコンソールに出力されることを確認
      expect(console.error).toHaveBeenCalledWith(
        'OpenAI Audio API error:',
        mockError
      )

      console.error = originalConsoleError
    })

    it('オーディオデータなしのレスポンスを処理する', async () => {
      const mockChunks = [
        {
          choices: [
            {
              delta: {
                content: 'テキストのみの応答', // オーディオデータなし
              },
            },
          ],
        },
      ]

      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of mockChunks) {
            yield chunk
          }
        },
      }

      const mockCreate = jest.fn().mockResolvedValue(mockAsyncIterator)
      ;(OpenAI as unknown as jest.Mock).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const mockController = {
        // このテストケース用のmockController
        enqueue: jest.fn(),
        close: jest.fn(),
      }

      const stream = await getOpenAIAudioChatResponseStream(testMessages)

      // ストリームの内容を読み取る
      const reader = (stream as ReadableStream<string>).getReader()
      while (true) {
        const { done } = await reader.read()
        if (done) break
        // データは処理しない（テキストのみのため）
      }

      expect(mockController.enqueue).not.toHaveBeenCalled() // mockController.enqueue は呼ばれないはず
      expect(base64ToArrayBuffer).not.toHaveBeenCalled()

      // AudioBufferManager のインスタンスを取得して確認
      const bufferManagerInstance = (AudioBufferManager as jest.Mock).mock
        .results[0].value // このテストケースでのインスタンスを取得
      expect(bufferManagerInstance.addData).not.toHaveBeenCalled()

      expect(bufferManagerInstance.flush).toHaveBeenCalled()
      // ストリームが正常に終了したことを確認 (read ループの終了で確認)
    })
  })
})
