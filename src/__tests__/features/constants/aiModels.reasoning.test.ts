/**
 * @jest-environment node
 */
import {
  isReasoningModel,
  getReasoningEfforts,
  needsReasoningTokenBudget,
} from '@/features/constants/aiModels'

describe('isReasoningModel', () => {
  describe('推論対応モデル', () => {
    it('OpenAI GPT-5は推論対応', () => {
      expect(isReasoningModel('openai', 'gpt-5')).toBe(true)
    })

    it('OpenAI GPT-5.1は推論対応', () => {
      expect(isReasoningModel('openai', 'gpt-5.1')).toBe(true)
    })

    it('OpenAI GPT-5.2-proは推論対応', () => {
      expect(isReasoningModel('openai', 'gpt-5.2-pro')).toBe(true)
    })

    it('Anthropic claude-sonnet-4-5は推論対応', () => {
      expect(isReasoningModel('anthropic', 'claude-sonnet-4-5')).toBe(true)
    })

    it('Google gemini-3-pro-previewは推論対応', () => {
      expect(isReasoningModel('google', 'gemini-3-pro-preview')).toBe(true)
    })

    it('Google gemini-2.5-flashは推論対応', () => {
      expect(isReasoningModel('google', 'gemini-2.5-flash')).toBe(true)
    })

    it('xAI grok-4は推論対応', () => {
      expect(isReasoningModel('xai', 'grok-4')).toBe(true)
    })

    it('xAI grok-3は推論対応', () => {
      expect(isReasoningModel('xai', 'grok-3')).toBe(true)
    })

    it('Groq openai/gpt-oss-20bは推論対応', () => {
      expect(isReasoningModel('groq', 'openai/gpt-oss-20b')).toBe(true)
    })

    it('Groq qwen/qwen3-32bは推論対応', () => {
      expect(isReasoningModel('groq', 'qwen/qwen3-32b')).toBe(true)
    })

    it('Cohere command-a-reasoning-08-2025は推論対応', () => {
      expect(isReasoningModel('cohere', 'command-a-reasoning-08-2025')).toBe(
        true
      )
    })
  })

  describe('推論非対応モデル', () => {
    it('OpenAI GPT-4.1は推論非対応', () => {
      expect(isReasoningModel('openai', 'gpt-4.1')).toBe(false)
    })

    it('OpenAI GPT-4oは推論非対応', () => {
      expect(isReasoningModel('openai', 'gpt-4o')).toBe(false)
    })

    it('Anthropic claude-3-5-haiku-latestは推論非対応', () => {
      expect(isReasoningModel('anthropic', 'claude-3-5-haiku-latest')).toBe(
        false
      )
    })

    it('Google gemini-2.0-flashは推論非対応', () => {
      expect(isReasoningModel('google', 'gemini-2.0-flash')).toBe(false)
    })

    it('xAI grok-2は推論非対応', () => {
      expect(isReasoningModel('xai', 'grok-2')).toBe(false)
    })

    it('xAI grok-4-fast-non-reasoningは推論非対応', () => {
      expect(isReasoningModel('xai', 'grok-4-fast-non-reasoning')).toBe(false)
    })

    it('Groq llama-3.3-70b-versatileは推論非対応', () => {
      expect(isReasoningModel('groq', 'llama-3.3-70b-versatile')).toBe(false)
    })

    it('Cohere command-a-03-2025は推論非対応', () => {
      expect(isReasoningModel('cohere', 'command-a-03-2025')).toBe(false)
    })

    it('difyは推論非対応', () => {
      expect(isReasoningModel('dify', 'any-model')).toBe(false)
    })
  })

  describe('カスタムモデル', () => {
    it('OpenAIカスタムモデルはサービスデフォルトで推論対応', () => {
      expect(isReasoningModel('openai', 'custom-model', true)).toBe(true)
    })

    it('Anthropicカスタムモデルはサービスデフォルトで推論対応', () => {
      expect(isReasoningModel('anthropic', 'custom-model', true)).toBe(true)
    })

    it('difyカスタムモデルは推論非対応', () => {
      expect(isReasoningModel('dify', 'custom-model', true)).toBe(false)
    })
  })

  describe('Azure（空モデルリスト）フォールバック', () => {
    it('Azureはモデルリストが空だがフォールバックで推論対応', () => {
      expect(isReasoningModel('azure', 'any-model')).toBe(true)
    })
  })
})

describe('getReasoningEfforts', () => {
  it('OpenAI GPT-5はminimal/low/medium/highの4択', () => {
    expect(getReasoningEfforts('openai', 'gpt-5')).toEqual([
      'minimal',
      'low',
      'medium',
      'high',
    ])
  })

  it('OpenAI GPT-5.1はnone/minimal/low/medium/highの5択', () => {
    expect(getReasoningEfforts('openai', 'gpt-5.1')).toEqual([
      'none',
      'minimal',
      'low',
      'medium',
      'high',
    ])
  })

  it('OpenAI GPT-5.2-proはminimal/low/medium/highの4択', () => {
    expect(getReasoningEfforts('openai', 'gpt-5.2-pro')).toEqual([
      'minimal',
      'low',
      'medium',
      'high',
    ])
  })

  it('OpenAI GPT-4.1は空配列（推論非対応）', () => {
    expect(getReasoningEfforts('openai', 'gpt-4.1')).toEqual([])
  })

  it('Anthropic claude-sonnet-4-5は空配列（effortセレクタ不要、tokenBudgetのみ）', () => {
    expect(getReasoningEfforts('anthropic', 'claude-sonnet-4-5')).toEqual([])
  })

  it('Anthropic claude-opus-4-5はlow/medium/highの3択', () => {
    expect(getReasoningEfforts('anthropic', 'claude-opus-4-5')).toEqual([
      'low',
      'medium',
      'high',
    ])
  })

  it('Google gemini-3-pro-previewはlow/highの2択', () => {
    expect(getReasoningEfforts('google', 'gemini-3-pro-preview')).toEqual([
      'low',
      'high',
    ])
  })

  it('Google gemini-2.5-flashは空配列（effortセレクタ不要）', () => {
    expect(getReasoningEfforts('google', 'gemini-2.5-flash')).toEqual([])
  })

  it('xAI grok-4はlow/highの2択', () => {
    expect(getReasoningEfforts('xai', 'grok-4')).toEqual(['low', 'high'])
  })

  it('xAI grok-2は空配列（推論非対応）', () => {
    expect(getReasoningEfforts('xai', 'grok-2')).toEqual([])
  })

  it('Groq openai/gpt-oss-20bはlow/medium/highの3択', () => {
    expect(getReasoningEfforts('groq', 'openai/gpt-oss-20b')).toEqual([
      'low',
      'medium',
      'high',
    ])
  })

  it('Groq qwen/qwen3-32bは空配列（トグルのみ）', () => {
    expect(getReasoningEfforts('groq', 'qwen/qwen3-32b')).toEqual([])
  })

  it('Cohere command-a-reasoning-08-2025は空配列（tokenBudgetのみ）', () => {
    expect(
      getReasoningEfforts('cohere', 'command-a-reasoning-08-2025')
    ).toEqual([])
  })

  describe('カスタムモデルのフォールバック', () => {
    it('OpenAIカスタムモデルは全effort', () => {
      const efforts = getReasoningEfforts('openai', 'custom', true)
      expect(efforts).toEqual([
        'none',
        'minimal',
        'low',
        'medium',
        'high',
        'xhigh',
      ])
    })

    it('xAIカスタムモデルはlow/high', () => {
      expect(getReasoningEfforts('xai', 'custom', true)).toEqual([
        'low',
        'high',
      ])
    })
  })

  describe('Azure（空モデルリスト）フォールバック', () => {
    it('Azureはlow/medium/highの3択', () => {
      expect(getReasoningEfforts('azure', 'any-model')).toEqual([
        'low',
        'medium',
        'high',
      ])
    })
  })
})

describe('needsReasoningTokenBudget', () => {
  it('Anthropic claude-sonnet-4-5はtokenBudget必要', () => {
    expect(needsReasoningTokenBudget('anthropic', 'claude-sonnet-4-5')).toBe(
      true
    )
  })

  it('Anthropic claude-3-5-haiku-latestはtokenBudget不要', () => {
    expect(
      needsReasoningTokenBudget('anthropic', 'claude-3-5-haiku-latest')
    ).toBe(false)
  })

  it('Google gemini-2.5-flashはtokenBudget必要', () => {
    expect(needsReasoningTokenBudget('google', 'gemini-2.5-flash')).toBe(true)
  })

  it('Google gemini-3-pro-previewはtokenBudget不要', () => {
    expect(needsReasoningTokenBudget('google', 'gemini-3-pro-preview')).toBe(
      false
    )
  })

  it('Cohere command-a-reasoning-08-2025はtokenBudget必要', () => {
    expect(
      needsReasoningTokenBudget('cohere', 'command-a-reasoning-08-2025')
    ).toBe(true)
  })

  it('OpenAI gpt-5はtokenBudget不要', () => {
    expect(needsReasoningTokenBudget('openai', 'gpt-5')).toBe(false)
  })

  it('xAI grok-4はtokenBudget不要', () => {
    expect(needsReasoningTokenBudget('xai', 'grok-4')).toBe(false)
  })

  describe('カスタムモデルのフォールバック', () => {
    it('Anthropicカスタムモデルはtrue', () => {
      expect(needsReasoningTokenBudget('anthropic', 'custom', true)).toBe(true)
    })

    it('OpenAIカスタムモデルはfalse', () => {
      expect(needsReasoningTokenBudget('openai', 'custom', true)).toBe(false)
    })
  })

  describe('Azure（空モデルリスト）フォールバック', () => {
    it('Azureはfalse', () => {
      expect(needsReasoningTokenBudget('azure', 'any-model')).toBe(false)
    })
  })
})
