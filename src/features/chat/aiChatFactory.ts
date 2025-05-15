import { Message } from '@/features/messages/messages'
import { AIService } from '@/features/constants/settings'
import { getDifyChatResponseStream } from './difyChat'
import { getVercelAIChatResponseStream } from './vercelAIChat'
import settingsStore from '@/features/stores/settings'
import { getOpenAIAudioChatResponseStream } from '@/features/chat/openAIAudioChat'

export async function getAIChatResponseStream(
  messages: Message[]
): Promise<ReadableStream<string> | null> {
  const ss = settingsStore.getState()

  if (ss.selectAIService == 'openai' && ss.audioMode) {
    return getOpenAIAudioChatResponseStream(messages)
  }

  switch (ss.selectAIService as AIService) {
    case 'openai':
    case 'anthropic':
    case 'google':
    case 'azure':
    case 'xai':
    case 'groq':
    case 'cohere':
    case 'mistralai':
    case 'perplexity':
    case 'fireworks':
    case 'deepseek':
    case 'openrouter':
    case 'lmstudio':
    case 'ollama':
    case 'custom-api':
      return getVercelAIChatResponseStream(messages)
    case 'dify':
      return getDifyChatResponseStream(
        messages,
        ss.difyKey || '',
        ss.difyUrl || '',
        ss.difyConversationId
      )
    default:
      throw new Error(`Unsupported AI service: ${ss.selectAIService}`)
  }
}
