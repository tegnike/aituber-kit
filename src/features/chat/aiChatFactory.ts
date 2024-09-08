import { Message } from '@/features/messages/messages'
import { AIService } from '@/features/constants/settings'
import { getLocalLLMChatResponseStream } from './localLLMChat'
import { getDifyChatResponseStream } from './difyChat'
import { getVercelAIChatResponseStream } from './vercelAIChat'
import settingsStore from '@/features/stores/settings'

export async function getAIChatResponseStream(
  service: AIService,
  messages: Message[]
): Promise<ReadableStream<string> | null> {
  const ss = settingsStore.getState()

  switch (service) {
    case 'openai':
    case 'anthropic':
    case 'google':
    case 'azure':
    case 'groq':
    case 'cohere':
    case 'mistralai':
    case 'perplexity':
    case 'fireworks':
      return getVercelAIChatResponseStream(
        messages,
        ss[`${service}Key`] ||
          process.env[`NEXT_PUBLIC_${service.toUpperCase()}_KEY`] ||
          '',
        service,
        ss.selectAIModel
      )
    case 'localLlm':
      return getLocalLLMChatResponseStream(
        messages,
        ss.localLlmUrl || process.env.NEXT_PUBLIC_LOCAL_LLM_URL || '',
        ss.selectAIModel || process.env.NEXT_PUBLIC_LOCAL_LLM_MODEL || ''
      )
    case 'dify':
      return getDifyChatResponseStream(
        messages,
        ss.difyKey || process.env.NEXT_PUBLIC_DIFY_KEY || '',
        ss.difyUrl || process.env.NEXT_PUBLIC_DIFY_URL || '',
        ss.difyConversationId
      )
    default:
      throw new Error(`Unsupported AI service: ${service}`)
  }
}
