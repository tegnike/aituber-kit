import {
  handleSendChatFn,
  processAIResponse,
} from '../../../features/chat/handlers'
import { getAIChatResponseStream } from '../../../features/chat/aiChatFactory'
import { speakCharacter } from '../../../features/messages/speakCharacter'
import homeStore from '../../../features/stores/home'
import settingsStore from '../../../features/stores/settings'
import slideStore from '../../../features/stores/slide'
import webSocketStore from '../../../features/stores/websocketStore'
import toastStore from '../../../features/stores/toast'
import i18next from 'i18next'
import { Message } from '../../../features/messages/messages'

jest.mock('../../../features/chat/aiChatFactory', () => ({
  getAIChatResponseStream: jest.fn(),
}))

jest.mock('../../../features/messages/speakCharacter', () => ({
  speakCharacter: jest.fn(),
}))

jest.mock('../../../features/stores/home', () => ({
  getState: jest.fn(),
  setState: jest.fn(),
}))

jest.mock('../../../features/stores/settings', () => ({
  getState: jest.fn(),
}))

jest.mock('../../../features/stores/slide', () => ({
  getState: jest.fn(),
}))

jest.mock('../../../features/stores/websocketStore', () => ({
  getState: jest.fn(),
}))

jest.mock('../../../features/stores/toast', () => ({
  getState: jest.fn(),
}))

jest.mock('i18next', () => ({
  t: jest.fn((key) => key),
}))

describe('handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleSendChatFn', () => {
    it('メッセージが空の場合は処理を行わない', async () => {
      const handleSendChat = handleSendChatFn()
      await handleSendChat(null as unknown as string)

      expect(homeStore.setState).not.toHaveBeenCalled()
    })

    it('externalLinkageModeがtrueの場合、WebSocketを使用してメッセージを送信する', async () => {
      const mockWebSocket = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      }
      const mockWsManager = {
        websocket: mockWebSocket,
      }
      ;(webSocketStore.getState as jest.Mock).mockReturnValue({
        wsManager: mockWsManager,
      })
      ;(settingsStore.getState as jest.Mock).mockReturnValue({
        externalLinkageMode: true,
      })
      ;(homeStore.getState as jest.Mock).mockReturnValue({
        chatLog: [],
      })

      const handleSendChat = handleSendChatFn()
      await handleSendChat('テストメッセージ')

      expect(homeStore.setState).toHaveBeenCalledWith({ chatProcessing: true })
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ content: 'テストメッセージ', type: 'chat' })
      )
      expect(homeStore.setState).toHaveBeenCalledWith({
        chatLog: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'テストメッセージ',
          }),
        ]),
      })
    })

    it('externalLinkageModeがtrueだがWebSocketが接続されていない場合、エラーを表示する', async () => {
      const mockAddToast = jest.fn()
      const mockWebSocket = {
        readyState: WebSocket.CLOSED,
      }
      const mockWsManager = {
        websocket: mockWebSocket,
      }
      ;(webSocketStore.getState as jest.Mock).mockReturnValue({
        wsManager: mockWsManager,
      })
      ;(settingsStore.getState as jest.Mock).mockReturnValue({
        externalLinkageMode: true,
      })
      ;(toastStore.getState as jest.Mock).mockReturnValue({
        addToast: mockAddToast,
      })

      const handleSendChat = handleSendChatFn()
      await handleSendChat('テストメッセージ')

      expect(homeStore.setState).toHaveBeenCalledWith({ chatProcessing: true })
      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'NotConnectedToExternalAssistant',
        type: 'error',
        tag: 'not-connected-to-external-assistant',
      })
      expect(homeStore.setState).toHaveBeenCalledWith({
        chatProcessing: false,
      })
    })

    it('通常モードの場合、AIチャットレスポンスを処理する', async () => {
      const mockChatLog: Message[] = []
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue('テスト応答')
          controller.close()
        },
      })
      ;(getAIChatResponseStream as jest.Mock).mockResolvedValue(mockStream)
      ;(homeStore.getState as jest.Mock).mockReturnValue({
        chatLog: mockChatLog,
        modalImage: '',
        incrementChatProcessingCount: jest.fn(),
        decrementChatProcessingCount: jest.fn(),
      })
      ;(settingsStore.getState as jest.Mock).mockReturnValue({
        externalLinkageMode: false,
        realtimeAPIMode: false,
        slideMode: false,
        systemPrompt: 'テストプロンプト',
        includeTimestampInUserMessage: false,
      })

      const handleSendChat = handleSendChatFn()
      await handleSendChat('テストメッセージ')

      expect(homeStore.setState).toHaveBeenCalledWith({ chatProcessing: true })
      expect(homeStore.setState).toHaveBeenCalledWith({
        chatLog: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'テストメッセージ',
          }),
        ]),
      })
      expect(getAIChatResponseStream).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: 'テストプロンプト',
          }),
        ])
      )
    })
  })

  describe('processAIResponse', () => {
    it('AIレスポンスストリームがnullの場合、処理を終了する', async () => {
      ;(getAIChatResponseStream as jest.Mock).mockResolvedValue(null)

      await processAIResponse([], [])

      expect(homeStore.setState).toHaveBeenCalledWith({ chatProcessing: false })
      expect(speakCharacter).not.toHaveBeenCalled()
    })
  })
})
