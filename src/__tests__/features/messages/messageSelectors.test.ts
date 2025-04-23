import { messageSelectors } from '../../../features/messages/messageSelectors'
import settingsStore from '../../../features/stores/settings'
import { Message } from '../../../features/messages/messages'

jest.mock('../../../features/stores/settings', () => ({
  getState: jest.fn(),
}))

describe('messageSelectors', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(settingsStore.getState as jest.Mock).mockReturnValue({
      maxPastMessages: 10,
    })
  })

  describe('getTextAndImageMessages', () => {
    it('テキストメッセージをフィルタリングする', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'テキストメッセージ',
          timestamp: '2023-01-01T00:00:00Z',
        },
        {
          role: 'assistant',
          content: undefined,
          timestamp: '2023-01-01T00:00:01Z',
        },
        { role: 'user', content: undefined, timestamp: '2023-01-01T00:00:02Z' },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'テキストと画像' },
            { type: 'image', image: 'image-url' },
          ],
          timestamp: '2023-01-01T00:00:03Z',
        },
      ]

      const result = messageSelectors.getTextAndImageMessages(messages)
      expect(result).toHaveLength(2)
      expect(result[0].content).toBe('テキストメッセージ')
      expect(result[1].content).toEqual([
        { type: 'text', text: 'テキストと画像' },
        { type: 'image', image: 'image-url' },
      ])
    })
  })

  describe('getAudioMessages', () => {
    it('音声メッセージをフィルタリングする', () => {
      const messages: Message[] = [
        {
          role: 'system',
          content: 'システムプロンプト',
          timestamp: '2023-01-01T00:00:00Z',
        },
        {
          role: 'user',
          content: 'ユーザーメッセージ',
          timestamp: '2023-01-01T00:00:01Z',
        },
        {
          role: 'assistant',
          audio: { id: 'audio-id' },
          timestamp: '2023-01-01T00:00:02Z',
        },
        {
          role: 'assistant',
          content: 'テキスト応答',
          timestamp: '2023-01-01T00:00:03Z',
        },
        {
          role: 'user',
          content: 'マルチモーダル',
          timestamp: '2023-01-01T00:00:04Z',
        },
        {
          role: 'function',
          content: '関数呼び出し',
          timestamp: '2023-01-01T00:00:05Z',
        },
      ]

      const result = messageSelectors.getAudioMessages(messages)
      expect(result).toHaveLength(4)
      expect(result[0].role).toBe('system')
      expect(result[1].role).toBe('user')
      expect(result[2].role).toBe('assistant')
      expect(result[2].audio).toEqual({ id: 'audio-id' })
    })
  })

  describe('getProcessedMessages', () => {
    it('タイムスタンプを含めてメッセージを処理する', () => {
      const messages: Message[] = [
        {
          role: 'system',
          content: 'システムプロンプト',
          timestamp: '2023-01-01T00:00:00Z',
        },
        {
          role: 'user',
          content: 'ユーザーメッセージ',
          timestamp: '2023-01-01T00:00:01Z',
        },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'テキストと画像' },
            { type: 'image', image: 'image-url' },
          ],
          timestamp: '2023-01-01T00:00:02Z',
        },
      ]

      const result = messageSelectors.getProcessedMessages(messages, true)
      expect(result).toHaveLength(3)
      expect(result[0].content).toBe(
        '[2023-01-01T00:00:00Z] システムプロンプト'
      )
      expect(result[1].content).toBe(
        '[2023-01-01T00:00:01Z] ユーザーメッセージ'
      )
      expect(result[2].content).toEqual([
        { type: 'text', text: '[2023-01-01T00:00:02Z] テキストと画像' },
        { type: 'image', image: 'image-url' },
      ])
    })

    it('タイムスタンプなしでメッセージを処理する', () => {
      const messages: Message[] = [
        {
          role: 'system',
          content: 'システムプロンプト',
          timestamp: '2023-01-01T00:00:00Z',
        },
        {
          role: 'user',
          content: 'ユーザーメッセージ',
          timestamp: '2023-01-01T00:00:01Z',
        },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'テキストと画像' },
            { type: 'image', image: 'image-url' },
          ],
          timestamp: '2023-01-01T00:00:02Z',
        },
      ]

      const result = messageSelectors.getProcessedMessages(messages, false)
      expect(result).toHaveLength(3)
      expect(result[0].content).toBe('システムプロンプト')
      expect(result[1].content).toBe('ユーザーメッセージ')
      expect(result[2].content).toEqual([
        { type: 'text', text: 'テキストと画像' },
        { type: 'image', image: 'image-url' },
      ])
    })

    it('maxPastMessagesに基づいてメッセージを制限する', () => {
      const messages: Message[] = Array(15)
        .fill(0)
        .map((_, i) => ({
          role: 'user',
          content: `メッセージ${i}`,
          timestamp: `2023-01-01T00:00:${i.toString().padStart(2, '0')}Z`,
        }))

      ;(settingsStore.getState as jest.Mock).mockReturnValue({
        maxPastMessages: 5,
      })

      const result = messageSelectors.getProcessedMessages(messages, false)
      expect(result).toHaveLength(5)
      expect(result[0].content).toBe('メッセージ10')
      expect(result[4].content).toBe('メッセージ14')
    })
  })

  describe('normalizeMessages', () => {
    it('同じロールの連続メッセージを結合する', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'こんにちは',
          timestamp: '2023-01-01T00:00:00Z',
        },
        {
          role: 'user',
          content: 'お元気ですか？',
          timestamp: '2023-01-01T00:00:01Z',
        },
        {
          role: 'assistant',
          content: 'はい、',
          timestamp: '2023-01-01T00:00:02Z',
        },
        {
          role: 'assistant',
          content: '元気です！',
          timestamp: '2023-01-01T00:00:03Z',
        },
      ]

      const result = messageSelectors.normalizeMessages(messages)
      expect(result).toHaveLength(4)
      expect(result[0].role).toBe('user')
      expect(result[0].content).toBe('こんにちは')
      expect(result[1].role).toBe('user')
      expect(result[1].content).toBe('お元気ですか？')
      expect(result[2].role).toBe('assistant')
      expect(result[2].content).toBe('はい、')
      expect(result[3].role).toBe('assistant')
      expect(result[3].content).toBe('元気です！')
    })

    it('画像を含むメッセージを正しく処理する', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'こんにちは',
          timestamp: '2023-01-01T00:00:00Z',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'この画像について教えて' },
            { type: 'image', image: 'image-url-1' },
          ],
          timestamp: '2023-01-01T00:00:01Z',
        },
        {
          role: 'assistant',
          content: '素敵な画像ですね',
          timestamp: '2023-01-01T00:00:02Z',
        },
      ]

      const result = messageSelectors.normalizeMessages(messages)
      expect(result).toHaveLength(3)
      expect(result[0].role).toBe('user')
      expect(result[0].content).toBe('こんにちは')
      expect(result[1].role).toBe('user')
      expect(result[1].content).toEqual([
        { type: 'text', text: 'この画像について教えて' },
        { type: 'image', image: 'image-url-1' },
      ])
      expect(result[2].role).toBe('assistant')
      expect(result[2].content).toBe('素敵な画像ですね')
    })

    it('空のコンテンツを持つメッセージをフィルタリングする', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'こんにちは',
          timestamp: '2023-01-01T00:00:00Z',
        },
        { role: 'user', content: '', timestamp: '2023-01-01T00:00:01Z' },
        { role: 'assistant', content: ' ', timestamp: '2023-01-01T00:00:02Z' },
      ]

      const result = messageSelectors.normalizeMessages(messages)
      expect(result).toHaveLength(1)
      expect(result[0].role).toBe('user')
      expect(result[0].content).toBe('こんにちは')
    })

    test('空のメッセージ配列を正しく処理する', () => {
      const messages: Message[] = []

      const result = messageSelectors.normalizeMessages(messages)
      expect(result).toHaveLength(0)
    })
  })

  describe('cutImageMessage', () => {
    it('画像メッセージをテキストのみに変換する', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'テキストのみ',
          timestamp: '2023-01-01T00:00:00Z',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'テキストと画像' },
            { type: 'image', image: 'image-url' },
          ],
          timestamp: '2023-01-01T00:00:01Z',
        },
        {
          role: 'assistant',
          content: undefined,
          timestamp: '2023-01-01T00:00:02Z',
        },
      ]

      const result = messageSelectors.cutImageMessage(messages)
      expect(result).toHaveLength(3)
      expect(result[0].content).toBe('テキストのみ')
      expect(result[1].content).toBe('テキストと画像')
      expect(result[2].content).toBe('')
    })
  })

  describe('sanitizeMessageForStorage', () => {
    it('音声データを省略する', () => {
      const message: Message = {
        role: 'assistant',
        audio: { id: 'audio-id' },
        timestamp: '2023-01-01T00:00:00Z',
      }

      const result = messageSelectors.sanitizeMessageForStorage(message)
      expect(result.audio).toBe('[audio data omitted]')
    })

    it('画像データを省略する', () => {
      const message: Message = {
        role: 'user',
        content: [
          { type: 'text', text: 'テキストと画像' },
          {
            type: 'image',
            image: 'data:image/png;base64,VERY_LONG_BASE64_STRING',
          },
        ],
        timestamp: '2023-01-01T00:00:00Z',
      }

      const result = messageSelectors.sanitizeMessageForStorage(message)
      expect(result.content[0].text).toBe('テキストと画像')
      expect(result.content[1].image).toBe('[image data omitted]')
    })

    it('通常のテキストメッセージはそのまま返す', () => {
      const message: Message = {
        role: 'user',
        content: 'テキストのみ',
        timestamp: '2023-01-01T00:00:00Z',
      }

      const result = messageSelectors.sanitizeMessageForStorage(message)
      expect(result).toEqual(message)
    })
  })
})
