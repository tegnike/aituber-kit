import { getAIChatResponseStream } from '../../../features/chat/aiChatFactory'
import { getVercelAIChatResponseStream } from '../../../features/chat/vercelAIChat'
import { getDifyChatResponseStream } from '../../../features/chat/difyChat'
import { getOpenAIAudioChatResponseStream } from '../../../features/chat/openAIAudioChat'
import settingsStore from '../../../features/stores/settings'
import { Message } from '../../../features/messages/messages'

jest.mock('../../../features/chat/vercelAIChat', () => ({
  getVercelAIChatResponseStream: jest.fn(),
}))

jest.mock('../../../features/chat/difyChat', () => ({
  getDifyChatResponseStream: jest.fn(),
}))

jest.mock('../../../features/chat/openAIAudioChat', () => ({
  getOpenAIAudioChatResponseStream: jest.fn(),
}))

jest.mock('../../../features/stores/settings', () => ({
  getState: jest.fn(),
}))

describe('aiChatFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const testMessages: Message[] = [
    { role: 'user', content: 'こんにちは', timestamp: '2023-01-01T00:00:00Z' },
  ]

  const createMockStream = () => {
    return new ReadableStream({
      start(controller) {
        controller.enqueue('テスト応答')
        controller.close()
      },
    })
  }

  it('OpenAIオーディオモードの場合、getOpenAIAudioChatResponseStreamを呼び出す', async () => {
    const mockStream = createMockStream()
    ;(getOpenAIAudioChatResponseStream as jest.Mock).mockResolvedValue(
      mockStream
    )
    ;(settingsStore.getState as jest.Mock).mockReturnValue({
      selectAIService: 'openai',
      audioMode: true,
    })

    const result = await getAIChatResponseStream(testMessages)

    expect(getOpenAIAudioChatResponseStream).toHaveBeenCalledWith(testMessages)
    expect(result).toBe(mockStream)
  })

  it('Vercel AI SDKをサポートするサービスの場合、getVercelAIChatResponseStreamを呼び出す', async () => {
    const aiServices = [
      'openai',
      'anthropic',
      'google',
      'azure',
      'xai',
      'groq',
      'cohere',
      'mistralai',
      'perplexity',
      'fireworks',
      'deepseek',
      'openrouter',
      'lmstudio',
      'ollama',
      'custom-api',
    ]

    for (const service of aiServices) {
      jest.clearAllMocks()

      const mockStream = createMockStream()
      ;(getVercelAIChatResponseStream as jest.Mock).mockResolvedValue(
        mockStream
      )
      ;(settingsStore.getState as jest.Mock).mockReturnValue({
        selectAIService: service,
        audioMode: false,
      })

      const result = await getAIChatResponseStream(testMessages)

      expect(getVercelAIChatResponseStream).toHaveBeenCalledWith(testMessages)
      expect(result).toBe(mockStream)
    }
  })

  it('Difyサービスの場合、getDifyChatResponseStreamを呼び出す', async () => {
    const mockStream = createMockStream()
    ;(getDifyChatResponseStream as jest.Mock).mockResolvedValue(mockStream)
    ;(settingsStore.getState as jest.Mock).mockReturnValue({
      selectAIService: 'dify',
      audioMode: false,
      difyKey: 'test-key',
      difyUrl: 'https://test-url',
      difyConversationId: 'test-conversation-id',
    })

    const result = await getAIChatResponseStream(testMessages)

    expect(getDifyChatResponseStream).toHaveBeenCalledWith(
      testMessages,
      'test-key',
      'https://test-url',
      'test-conversation-id'
    )
    expect(result).toBe(mockStream)
  })

  it('サポートされていないAIサービスの場合、エラーをスローする', async () => {
    ;(settingsStore.getState as jest.Mock).mockReturnValue({
      selectAIService: 'unsupported-service',
      audioMode: false,
    })

    await expect(getAIChatResponseStream(testMessages)).rejects.toThrow(
      'Unsupported AI service: unsupported-service'
    )
  })
})
