import {
  getLastMessages,
  buildCharacterSystemMessage,
  continuationCheckSystemPrompt,
  buildBestCommentSelectionMessages,
  buildNewTopicGenerationMessages,
} from '@/lib/mastra/prompts'
import { Message } from '@/features/messages/messages'

describe('mastra prompts', () => {
  describe('getLastMessages', () => {
    it('filters to user and assistant messages only', () => {
      const messages: Message[] = [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi there' },
      ]

      const result = getLastMessages(messages, 10)
      expect(result.every((m) => m.role !== 'system')).toBe(true)
    })

    it('returns only the last N messages', () => {
      const messages: Message[] = [
        { role: 'user', content: 'msg1' },
        { role: 'assistant', content: 'msg2' },
        { role: 'user', content: 'msg3' },
        { role: 'assistant', content: 'msg4' },
        { role: 'user', content: 'msg5' },
        { role: 'assistant', content: 'msg6' },
      ]

      const result = getLastMessages(messages, 2)
      // last 2 messages: user msg5, assistant msg6
      // starts with user, ends with assistant → dummy user added
      expect(result.length).toBe(3)
      expect(result[0].content).toBe('msg5')
      expect(result[1].content).toBe('msg6')
    })

    it('merges consecutive messages with the same role', () => {
      const messages: Message[] = [
        { role: 'user', content: 'part1' },
        { role: 'user', content: 'part2' },
        { role: 'assistant', content: 'response' },
      ]

      const result = getLastMessages(messages, 10)
      expect(result[0].role).toBe('user')
      expect(result[0].content).toBe('part1\npart2')
      expect(result[1].role).toBe('assistant')
    })

    it('removes leading non-user messages', () => {
      const messages: Message[] = [
        { role: 'assistant', content: 'stale' },
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
      ]

      const result = getLastMessages(messages, 10)
      expect(result[0].role).toBe('user')
      expect(result[0].content).toBe('hello')
    })

    it('appends dummy user message when last message is assistant', () => {
      const messages: Message[] = [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi there' },
      ]

      const result = getLastMessages(messages, 10)
      expect(result[result.length - 1].role).toBe('user')
      expect(result[result.length - 1].content).toBe('CONTINUE')
    })

    it('appends dummy user message when messages array is empty', () => {
      const result = getLastMessages([], 10)
      expect(result.length).toBe(1)
      expect(result[0].role).toBe('user')
    })

    it('does not append dummy user message when last message is user', () => {
      const messages: Message[] = [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
        { role: 'user', content: 'bye' },
      ]

      const result = getLastMessages(messages, 10)
      expect(result[result.length - 1].role).toBe('user')
      expect(result[result.length - 1].content).toBe('bye')
    })

    it('handles multimodal content by extracting text', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'look at this' },
            { type: 'image', image: 'data:image/png;base64,...' },
          ],
        },
        { role: 'assistant', content: 'nice image' },
      ]

      const result = getLastMessages(messages, 10)
      expect(result[0].content).toBe('look at this')
    })
  })

  describe('buildCharacterSystemMessage', () => {
    it('includes system prompt and additional guidelines', () => {
      const result = buildCharacterSystemMessage(
        'あなたは元気なキャラクターです。',
        '- テスト用のガイドライン'
      )

      expect(result).toContain('あなたは元気なキャラクターです。')
      expect(result).toContain('テスト用のガイドライン')
      expect(result).toContain('キャラクター情報')
    })
  })

  describe('continuationCheckSystemPrompt', () => {
    it('returns a prompt containing example conversations', () => {
      const result = continuationCheckSystemPrompt()

      expect(result).toContain('配信者が自発的に話を続けるべきか')
      expect(result).toContain('"answer"')
      expect(result).toContain('"reason"')
      // 配信コンテキストの例が含まれている
      expect(result).toContain('user:')
      expect(result).toContain('assistant:')
    })
  })

  describe('buildBestCommentSelectionMessages', () => {
    it('returns system and user messages for comment selection', () => {
      const chatLog: Message[] = [
        { role: 'user', content: '今日の天気は？' },
        { role: 'assistant', content: '晴れですよ' },
      ]
      const comments = [
        { userComment: 'いい天気だね', userName: 'user1' },
        { userComment: '明日は雨？', userName: 'user2' },
      ]

      const result = buildBestCommentSelectionMessages(chatLog, comments)

      expect(result.length).toBe(2)
      expect(result[0].role).toBe('system')
      expect(result[0].content).toContain('コメント選択タスク')
      expect(result[1].role).toBe('user')
      expect(result[1].content).toContain('いい天気だね')
      expect(result[1].content).toContain('明日は雨？')
    })
  })

  describe('buildNewTopicGenerationMessages', () => {
    it('returns system message and conversation messages', () => {
      const chatLog: Message[] = [
        { role: 'user', content: '映画好き？' },
        { role: 'assistant', content: 'はい、大好きです' },
      ]

      const result = buildNewTopicGenerationMessages(chatLog)

      expect(result.length).toBeGreaterThanOrEqual(2)
      expect(result[0].role).toBe('system')
      expect(result[0].content).toContain('新しい話題を1つ提案してください')
    })
  })
})
