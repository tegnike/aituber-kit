import {
  mergeProviderOptions,
  preparePromptCache,
  PROMPT_CACHE_BREAKPOINT,
} from '@/lib/api-services/promptCache'

describe('prompt cache preparation', () => {
  const prompt = (dynamic: string) =>
    `固定人格と共通ルール${PROMPT_CACHE_BREAKPOINT}${dynamic}`

  it('configures an explicit GPT-5.6 cache breakpoint and removes the marker', () => {
    const result = preparePromptCache('openai', 'gpt-5.6-terra', [
      { role: 'system', content: prompt('直近の会話') },
      { role: 'user', content: '質問' },
    ])

    expect(result.messages).toHaveLength(3)
    expect(result.messages[0]).toEqual(
      expect.objectContaining({
        role: 'system',
        content: '固定人格と共通ルール',
        providerOptions: {
          openai: {
            promptCacheBreakpoint: { mode: 'explicit' },
          },
        },
      })
    )
    expect(result.messages[1]).toEqual({
      role: 'system',
      content: '直近の会話',
    })
    expect(result.providerOptions).toEqual({
      openai: {
        promptCacheKey: expect.stringMatching(/^aituberkit:[a-f0-9]{32}$/),
        promptCacheOptions: { mode: 'explicit', ttl: '30m' },
      },
    })
    expect(JSON.stringify(result.messages)).not.toContain(
      PROMPT_CACHE_BREAKPOINT
    )
  })

  it('uses the same cache key when only the dynamic suffix changes', () => {
    const first = preparePromptCache('openai', 'gpt-5.6-terra', [
      { role: 'system', content: prompt('会話1') },
    ])
    const second = preparePromptCache('openai', 'gpt-5.6-terra', [
      { role: 'system', content: prompt('会話2') },
    ])

    expect(first.providerOptions).toEqual(second.providerOptions)
  })

  it('removes the marker without enabling explicit caching for older models', () => {
    const result = preparePromptCache('openai', 'gpt-4.1', [
      { role: 'system', content: prompt('動的文脈') },
    ])

    expect(result.providerOptions).toBeUndefined()
    expect(result.messages).toEqual([
      { role: 'system', content: '固定人格と共通ルール\n動的文脈' },
    ])
  })

  it('merges reasoning and prompt cache provider options', () => {
    expect(
      mergeProviderOptions(
        { openai: { reasoningEffort: 'none' } },
        {
          openai: {
            promptCacheKey: 'cache-key',
            promptCacheOptions: { mode: 'explicit', ttl: '30m' },
          },
        }
      )
    ).toEqual({
      openai: {
        reasoningEffort: 'none',
        promptCacheKey: 'cache-key',
        promptCacheOptions: { mode: 'explicit', ttl: '30m' },
      },
    })
  })
})
