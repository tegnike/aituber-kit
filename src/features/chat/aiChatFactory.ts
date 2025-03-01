import { Message } from '@/features/messages/messages'
import { AIService } from '@/features/constants/settings'
import { getLocalLLMChatResponseStream } from './localLLMChat'
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
    case 'groq':
    case 'cohere':
    case 'mistralai':
    case 'perplexity':
    case 'fireworks':
    case 'deepseek':
      return getVercelAIChatResponseStream(messages)
    case 'localLlm':
      return getLocalLLMChatResponseStream(
        messages,
        ss.localLlmUrl,
        ss.selectAIModel
      )
    case 'dify':
      return getDifyChatResponseStream(
        messages,
        ss.difyKey || '',
        ss.difyUrl || '',
        ss.difyConversationId,
        ss.userId
      )
    default:
      throw new Error(`Unsupported AI service: ${ss.selectAIService}`)
  }
}
