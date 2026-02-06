import { buildReasoningProviderOptions } from '@/lib/api-services/providerOptionsBuilder'

describe('buildReasoningProviderOptions', () => {
  it('returns undefined when reasoningMode is false', () => {
    const result = buildReasoningProviderOptions(
      'openai',
      'gpt-5',
      false,
      'medium',
      8192
    )
    expect(result).toBeUndefined()
  })

  it('returns undefined for unsupported service', () => {
    const result = buildReasoningProviderOptions(
      'dify',
      'some-model',
      true,
      'medium',
      8192
    )
    expect(result).toBeUndefined()
  })

  describe('OpenAI', () => {
    it('returns openai providerOptions with reasoningEffort and reasoningSummary', () => {
      const result = buildReasoningProviderOptions(
        'openai',
        'gpt-5',
        true,
        'high',
        8192
      )
      expect(result).toEqual({
        openai: { reasoningEffort: 'high', reasoningSummary: 'detailed' },
      })
    })
  })

  describe('Azure', () => {
    it('returns azure providerOptions with reasoningEffort', () => {
      const result = buildReasoningProviderOptions(
        'azure',
        'gpt-5',
        true,
        'low',
        8192
      )
      expect(result).toEqual({
        azure: { reasoningEffort: 'low' },
      })
    })
  })

  describe('xAI', () => {
    it('returns xai providerOptions with reasoningEffort', () => {
      const result = buildReasoningProviderOptions(
        'xai',
        'grok-3-mini',
        true,
        'medium',
        8192
      )
      expect(result).toEqual({
        xai: { reasoningEffort: 'medium' },
      })
    })
  })

  describe('Groq', () => {
    it('returns openai-namespaced providerOptions (OpenAI compatible)', () => {
      const result = buildReasoningProviderOptions(
        'groq',
        'qwen-qwq-32b',
        true,
        'high',
        8192
      )
      expect(result).toEqual({
        openai: { reasoningEffort: 'high' },
      })
    })

    it('returns default effort for qwen3 models', () => {
      const result = buildReasoningProviderOptions(
        'groq',
        'qwen/qwen3-32b',
        true,
        'medium',
        8192
      )
      expect(result).toEqual({
        openai: { reasoningEffort: 'default' },
      })
    })
  })

  describe('Anthropic', () => {
    it('returns anthropic providerOptions with thinking only for non-opus models', () => {
      const result = buildReasoningProviderOptions(
        'anthropic',
        'claude-sonnet-4-5',
        true,
        'medium',
        12000
      )
      expect(result).toEqual({
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 12000 },
        },
      })
    })

    it('returns anthropic providerOptions with thinking and effort for opus-4-5', () => {
      const result = buildReasoningProviderOptions(
        'anthropic',
        'claude-opus-4-5',
        true,
        'medium',
        12000
      )
      expect(result).toEqual({
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 12000 },
          effort: 'medium',
        },
      })
    })
  })

  describe('Cohere', () => {
    it('returns cohere providerOptions with thinking', () => {
      const result = buildReasoningProviderOptions(
        'cohere',
        'command-a-reasoning-08-2025',
        true,
        'high',
        5000
      )
      expect(result).toEqual({
        cohere: {
          thinking: { type: 'enabled', tokenBudget: 5000 },
        },
      })
    })
  })

  describe('Google', () => {
    it('returns thinkingBudget for Gemini 2.5 series', () => {
      const result = buildReasoningProviderOptions(
        'google',
        'gemini-2.5-flash',
        true,
        'medium',
        8192
      )
      expect(result).toEqual({
        google: {
          thinkingConfig: {
            thinkingBudget: 8192,
            includeThoughts: true,
          },
        },
      })
    })

    it('returns thinkingLevel for Gemini 3 series', () => {
      const result = buildReasoningProviderOptions(
        'google',
        'gemini-3-pro-preview',
        true,
        'high',
        8192
      )
      expect(result).toEqual({
        google: {
          thinkingConfig: {
            thinkingLevel: 'high',
            includeThoughts: true,
          },
        },
      })
    })

    it('returns thinkingBudget for non-3 series models', () => {
      const result = buildReasoningProviderOptions(
        'google',
        'gemini-2.0-flash',
        true,
        'low',
        4096
      )
      expect(result).toEqual({
        google: {
          thinkingConfig: {
            thinkingBudget: 4096,
            includeThoughts: true,
          },
        },
      })
    })
  })
})
