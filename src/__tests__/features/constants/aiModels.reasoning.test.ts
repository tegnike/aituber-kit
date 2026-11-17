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

    it('xAI grok-4.6は推論対応', () => {
      expect(isReasoningModel('xai', 'grok-4.6')).toBe(true)
    })

    it('xAI grok-4.20-0309-reasoningは推論対応', () => {
      expect(isReasoningModel('xai', 'grok-4.20-0309-reasoning')).toBe(true)
    })

    it('OpenAI gpt-6-lunaは推論対応', () => {
      expect(isReasoningModel('openai', 'gpt-6-luna')).toBe(true)
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

    it('xAI grok-4.20-0309-non-reasoningは推論非対応', () => {
      expect(isReasoningModel('xai', 'grok-4.20-0309-non-reasoning')).toBe(
        false
      )
    })

    it('一覧から外れたxAI grok-4は推論非対応', () => {
      expect(isReasoningModel('xai', 'grok-4')).toBe(false)
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
  const openAIReasoningEfforts = [
    [
      [
        'gpt-6.1-terra',
        'gpt-6-sol',
        'gpt-6-luna',
        'gpt-5.6',
        'gpt-5.6-sol',
        'gpt-5.6-terra',
        'gpt-5.6-luna',
      ],
      ['none', 'low', 'medium', 'high', 'xhigh', 'max'],
    ],
    [
      ['gpt-6.1-sol', 'gpt-6-astra'],
      ['low', 'medium', 'high', 'xhigh', 'max'],
    ],
    [
      ['gpt-5.5', 'gpt-5.5-2026-04-23'],
      ['none', 'low', 'medium', 'high', 'xhigh'],
    ],
    [
      ['gpt-5.4-pro', 'gpt-5.4-pro-2026-03-05'],
      ['medium', 'high', 'xhigh'],
    ],
    [
      [
        'gpt-5.4',
        'gpt-5.4-2026-03-05',
        'gpt-5.4-mini',
        'gpt-5.4-mini-2026-03-17',
        'gpt-5.4-nano',
        'gpt-5.4-nano-2026-03-17',
        'gpt-5.3-codex',
        'gpt-5.2',
        'gpt-5.2-2025-12-11',
      ],
      ['none', 'low', 'medium', 'high', 'xhigh'],
    ],
    [
      ['gpt-5.2-pro', 'gpt-5.2-pro-2025-12-11'],
      ['medium', 'high', 'xhigh'],
    ],
    [['gpt-5.2-codex'], ['low', 'medium', 'high', 'xhigh']],
    [
      ['gpt-5.1-codex-mini', 'gpt-5.1-codex'],
      ['low', 'medium', 'high'],
    ],
    [['gpt-5.1-codex-max'], ['low', 'medium', 'high', 'xhigh']],
    [
      ['gpt-5.1', 'gpt-5.1-2025-11-13'],
      ['none', 'low', 'medium', 'high'],
    ],
    [['gpt-5-pro', 'gpt-5-pro-2025-10-06'], ['high']],
    [
      [
        'gpt-5',
        'gpt-5-2025-08-07',
        'gpt-5-mini',
        'gpt-5-mini-2025-08-07',
        'gpt-5-nano',
        'gpt-5-nano-2025-08-07',
      ],
      ['minimal', 'low', 'medium', 'high'],
    ],
    [
      [
        'gpt-5-codex',
        'o4-mini',
        'o4-mini-2025-04-16',
        'o3',
        'o3-2025-04-16',
        'o3-mini',
        'o3-mini-2025-01-31',
        'o1',
        'o1-2024-12-17',
      ],
      ['low', 'medium', 'high'],
    ],
  ] as const

  it.each(openAIReasoningEfforts)(
    'OpenAIモデル群 %j は対応するeffortだけを返す',
    (models, expected) => {
      for (const model of models) {
        expect(getReasoningEfforts('openai', model)).toEqual(expected)
      }
    }
  )

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

  it('xAI grok-4.6はlow/medium/high/xhighの4択', () => {
    expect(getReasoningEfforts('xai', 'grok-4.6')).toEqual([
      'low',
      'medium',
      'high',
      'xhigh',
    ])
  })

  it('xAI grok-4.20-0309-reasoningはeffort指定不可', () => {
    expect(getReasoningEfforts('xai', 'grok-4.20-0309-reasoning')).toEqual([])
  })

  it('Anthropic claude-opus-4-8はadaptive thinkingのeffortを持つ', () => {
    expect(getReasoningEfforts('anthropic', 'claude-opus-4-8')).toEqual([
      'low',
      'medium',
      'high',
      'xhigh',
      'max',
    ])
  })

  it('Google gemini-4-hydrogenはxhighまで選べる', () => {
    expect(getReasoningEfforts('google', 'gemini-4-hydrogen')).toEqual([
      'low',
      'medium',
      'high',
      'xhigh',
    ])
  })

  it('Mistral zai-glm-5-3はlow/high/max', () => {
    expect(getReasoningEfforts('mistralai', 'zai-glm-5-3')).toEqual([
      'low',
      'high',
      'max',
    ])
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
        'max',
      ])
    })

    it('xAIカスタムモデルはlow/medium/high', () => {
      expect(getReasoningEfforts('xai', 'custom', true)).toEqual([
        'low',
        'medium',
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

  it('xAI grok-4.6はtokenBudget不要', () => {
    expect(needsReasoningTokenBudget('xai', 'grok-4.6')).toBe(false)
  })

  it('Anthropic claude-sonnet-4-6はadaptive thinkingのためtokenBudget不要', () => {
    expect(needsReasoningTokenBudget('anthropic', 'claude-sonnet-4-6')).toBe(
      false
    )
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
