import { Message } from '@/features/messages/messages'
import { AIService } from '@/features/constants/settings'
import { getDifyChatResponseStream } from './difyChat'
import { getVercelAIChatResponseStream } from './vercelAIChat'
import settingsStore from '@/features/stores/settings'
import { getOpenAIAudioChatResponseStream } from '@/features/chat/openAIAudioChat'

export interface AIChatResponseStreamOptions {
  signal?: AbortSignal
}

export async function getAIChatResponseStream(
  messages: Message[],
  options: AIChatResponseStreamOptions = {}
): Promise<ReadableStream<string> | null> {
  const ss = settingsStore.getState()

  if (ss.selectAIService == 'openai' && ss.audioMode) {
    return options.signal
      ? getOpenAIAudioChatResponseStream(messages, options)
      : getOpenAIAudioChatResponseStream(messages)
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
    case 'orcarouter':
    case 'lmstudio':
    case 'ollama':
    case 'custom-api':
      return options.signal
        ? getVercelAIChatResponseStream(messages, options)
        : getVercelAIChatResponseStream(messages)
    case 'dify':
      return options.signal
        ? getDifyChatResponseStream(
            messages,
            ss.difyKey || '',
            ss.difyUrl || '',
            ss.difyConversationId,
            options
          )
        : getDifyChatResponseStream(
            messages,
            ss.difyKey || '',
            ss.difyUrl || '',
            ss.difyConversationId
          )
    default:
      throw new Error(`Unsupported AI service: ${ss.selectAIService}`)
  }
}
