import { Message } from '@/features/messages/messages'
import { AIService, AIServiceConfig } from '@/features/constants/settings'
import { getAnthropicChatResponseStream } from './anthropicChat'
import { getDifyChatResponseStream } from './difyChat'
import { getGoogleChatResponseStream } from './googleChat'
import { getGroqChatResponseStream } from './groqChat'
import { getLocalLLMChatResponseStream } from './localLLMChat'
import { getOpenAIChatResponseStream } from './openAiChat'

export async function getAIChatResponseStream(
  service: AIService,
  messages: Message[],
  config: AIServiceConfig
): Promise<ReadableStream<string> | null> {
  switch (service) {
    case 'openai':
      return getOpenAIChatResponseStream(
        messages,
        config.openai.key,
        config.openai.model
      )
    case 'anthropic':
      return getAnthropicChatResponseStream(
        messages,
        config.anthropic.key,
        config.anthropic.model
      )
    case 'google':
      return getGoogleChatResponseStream(
        messages,
        config.google.key,
        config.google.model
      )
    case 'localLlm':
      return getLocalLLMChatResponseStream(
        messages,
        config.localLlm.url,
        config.localLlm.model
      )
    case 'groq':
      return getGroqChatResponseStream(
        messages,
        config.groq.key,
        config.groq.model
      )
    case 'dify':
      return getDifyChatResponseStream(
        messages,
        config.dify.key,
        config.dify.url,
        config.dify.conversationId
      )
    default:
      throw new Error(`Unsupported AI service: ${service}`)
  }
}
