import { getLatestAssistantMessage } from '@/utils/assistantMessageUtils'
import type { Message } from '@/features/messages/messages'

describe('getLatestAssistantMessage', () => {
  it('should return empty string for null input', () => {
    expect(getLatestAssistantMessage(null)).toBe('')
  })

  it('should return empty string for undefined input', () => {
    expect(getLatestAssistantMessage(undefined)).toBe('')
  })

  it('should return empty string for empty array', () => {
    expect(getLatestAssistantMessage([])).toBe('')
  })

  it('should return empty string when no assistant messages exist', () => {
    const chatLog: Message[] = [
      { role: 'user', content: 'hello' },
      { role: 'system', content: 'system prompt' },
    ]
    expect(getLatestAssistantMessage(chatLog)).toBe('')
  })

  it('should return the latest assistant message with string content', () => {
    const chatLog: Message[] = [
      { role: 'assistant', content: 'first reply' },
      { role: 'user', content: 'question' },
      { role: 'assistant', content: 'second reply' },
    ]
    expect(getLatestAssistantMessage(chatLog)).toBe('second reply')
  })

  it('should return text from multimodal content array', () => {
    const chatLog: Message[] = [
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'multimodal response' },
          { type: 'image', image: 'data:image/png;base64,...' },
        ],
      },
    ]
    expect(getLatestAssistantMessage(chatLog)).toBe('multimodal response')
  })

  it('should return empty string for array content without text type', () => {
    const chatLog: Message[] = [
      {
        role: 'assistant',
        content: [{ type: 'image', image: 'data:image/png;base64,...' }] as any,
      },
    ]
    expect(getLatestAssistantMessage(chatLog)).toBe('')
  })

  it('should return empty string for assistant with undefined content', () => {
    const chatLog: Message[] = [{ role: 'assistant' }]
    expect(getLatestAssistantMessage(chatLog)).toBe('')
  })

  it('should skip user messages and find last assistant', () => {
    const chatLog: Message[] = [
      { role: 'assistant', content: 'old reply' },
      { role: 'user', content: 'follow up' },
      { role: 'user', content: 'another question' },
    ]
    expect(getLatestAssistantMessage(chatLog)).toBe('old reply')
  })
})
