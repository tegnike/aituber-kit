import { createHash } from 'node:crypto'
import type { Message } from '@/features/messages/messages'

export const PROMPT_CACHE_BREAKPOINT = '<prompt_cache_breakpoint />'

type ProviderOptions = Record<string, Record<string, unknown>>
type CacheableMessage = Message & { providerOptions?: ProviderOptions }

export type PromptCachePreparation = {
  messages: Message[]
  providerOptions?: ProviderOptions
}

const supportsExplicitPromptCaching = (service: string, model: string) =>
  service === 'openai' && model.startsWith('gpt-5.6')

const cacheKeyForPrefix = (model: string, prefix: string) =>
  `aituberkit:${createHash('sha256')
    .update(`${model}\0${prefix}`)
    .digest('hex')
    .slice(0, 32)}`

export function preparePromptCache(
  service: string,
  model: string,
  messages: Message[]
): PromptCachePreparation {
  const canCache = supportsExplicitPromptCaching(service, model)
  let cachePrefix: string | null = null

  const preparedMessages = messages.flatMap((message): Message[] => {
    if (
      message.role !== 'system' ||
      typeof message.content !== 'string' ||
      !message.content.includes(PROMPT_CACHE_BREAKPOINT)
    ) {
      return [message]
    }

    const markerIndex = message.content.indexOf(PROMPT_CACHE_BREAKPOINT)
    const prefix = message.content.slice(0, markerIndex).trimEnd()
    const suffix = message.content
      .slice(markerIndex + PROMPT_CACHE_BREAKPOINT.length)
      .replaceAll(PROMPT_CACHE_BREAKPOINT, '')
      .trimStart()

    if (!canCache || cachePrefix !== null || !prefix) {
      return [{ ...message, content: `${prefix}\n${suffix}`.trim() }]
    }

    cachePrefix = prefix
    const prefixMessage: CacheableMessage = {
      ...message,
      content: prefix,
      providerOptions: {
        openai: {
          promptCacheBreakpoint: { mode: 'explicit' },
        },
      },
    }

    return suffix
      ? [prefixMessage as Message, { ...message, content: suffix }]
      : [prefixMessage as Message]
  })

  if (cachePrefix === null) return { messages: preparedMessages }

  return {
    messages: preparedMessages,
    providerOptions: {
      openai: {
        promptCacheKey: cacheKeyForPrefix(model, cachePrefix),
        promptCacheOptions: { mode: 'explicit', ttl: '30m' },
      },
    },
  }
}

export function mergeProviderOptions(
  ...options: Array<ProviderOptions | undefined>
): ProviderOptions | undefined {
  const merged: ProviderOptions = {}
  for (const option of options) {
    if (!option) continue
    for (const [provider, values] of Object.entries(option)) {
      merged[provider] = { ...merged[provider], ...values }
    }
  }
  return Object.keys(merged).length > 0 ? merged : undefined
}
