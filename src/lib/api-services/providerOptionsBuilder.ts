import {
  getReasoningByDefault,
  getReasoningEfforts,
  needsReasoningTokenBudget,
} from '@/features/constants/aiModels'

/**
 * モデルが受け付けないeffort値を、受け付ける値に置き換える
 * （別モデル用に保存されたeffortがそのまま送られるのを防ぐ）
 */
function normalizeEffort(
  supportedEfforts: readonly string[],
  reasoningEffort: string
): string {
  if (
    supportedEfforts.length === 0 ||
    supportedEfforts.includes(reasoningEffort)
  ) {
    return reasoningEffort
  }
  // 推論モードONで'none'に落ちないよう、medium → high → 先頭の有効値の順に選ぶ
  if (supportedEfforts.includes('medium')) return 'medium'
  if (supportedEfforts.includes('high')) return 'high'
  return (
    supportedEfforts.find((effort) => effort !== 'none') ?? supportedEfforts[0]
  )
}

/** gemini-3以降はthinkingLevel、2.5以前はthinkingBudgetで制御する */
function usesGoogleThinkingLevel(model: string): boolean {
  const match = /^gemini-(\d+)/.exec(model)
  return match != null && Number(match[1]) >= 3
}

/**
 * 推論モードのproviderOptionsを組み立てるビルダー
 *
 * 各AIプロバイダーのreasoning関連providerOptionsの構造が異なるため、
 * プロバイダーごとに適切なオブジェクトを生成する。
 */
export function buildReasoningProviderOptions(
  service: string,
  model: string,
  reasoningMode: boolean,
  reasoningEffort: string,
  reasoningTokenBudget: number,
  customModel: boolean = false
): Record<string, Record<string, unknown>> | undefined {
  if (!reasoningMode) {
    // DeepSeekは思考が既定で有効なので、オフのときは明示的に止める
    if (service === 'deepseek') {
      return { deepseek: { thinking: { type: 'disabled' } } }
    }
    // Claude 5系の一部も既定で思考する。無効化できないモデルには送らない
    if (
      service === 'anthropic' &&
      !customModel &&
      getReasoningByDefault('anthropic', model) === 'disableable'
    ) {
      return { anthropic: { thinking: { type: 'disabled' } } }
    }
    return undefined
  }

  switch (service) {
    case 'openai': {
      const supportedEfforts = getReasoningEfforts('openai', model, customModel)
      return {
        openai: {
          reasoningEffort: normalizeEffort(supportedEfforts, reasoningEffort),
          reasoningSummary: 'detailed',
        },
      }
    }

    case 'azure':
      return { azure: { reasoningEffort } }

    case 'deepseek': {
      // 他のモデル向けに保存された値（none等）はDeepSeekでは使えない
      const supportedEfforts: readonly string[] = getReasoningEfforts(
        'deepseek',
        model,
        customModel
      )
      return {
        deepseek: {
          thinking: { type: 'enabled' },
          reasoningEffort: supportedEfforts.includes(reasoningEffort)
            ? reasoningEffort
            : 'high',
        },
      }
    }

    case 'xai': {
      // grok-4.20-0309-reasoning等はreasoningEffortを受け付けない
      const supportedEfforts = getReasoningEfforts('xai', model, customModel)
      if (supportedEfforts.length === 0) return undefined
      return {
        xai: {
          reasoningEffort: normalizeEffort(supportedEfforts, reasoningEffort),
        },
      }
    }

    case 'mistralai': {
      const supportedEfforts = getReasoningEfforts(
        'mistralai',
        model,
        customModel
      )
      if (supportedEfforts.length === 0) return undefined
      return {
        mistral: {
          reasoningEffort: normalizeEffort(supportedEfforts, reasoningEffort),
        },
      }
    }

    case 'groq':
      // GroqはcreateOpenAI互換のため、providerOptionsキーはopenai
      // qwen3系はeffort値として'default'を送信
      if (model.includes('qwen3')) {
        return { openai: { reasoningEffort: 'default' } }
      }
      return { openai: { reasoningEffort } }

    case 'anthropic': {
      const supportedEfforts = getReasoningEfforts(
        'anthropic',
        model,
        customModel
      )
      const usesTokenBudget = needsReasoningTokenBudget(
        'anthropic',
        model,
        customModel
      )
      // claude-sonnet-4-6 / claude-opus-4-6以降はadaptive thinking + effortで制御する
      // claude-opus-4-7以降は思考テキストの既定が'omitted'（空）なので要約を明示する
      if (!usesTokenBudget && supportedEfforts.length > 0) {
        return {
          anthropic: {
            thinking: { type: 'adaptive', display: 'summarized' },
            effort: normalizeEffort(supportedEfforts, reasoningEffort),
          },
        }
      }
      const anthropicOptions: Record<string, unknown> = {
        thinking: { type: 'enabled', budgetTokens: reasoningTokenBudget },
      }
      // claude-opus-4-5はtokenBudgetとeffortを併用できる
      if (supportedEfforts.length > 0) {
        anthropicOptions.effort = normalizeEffort(
          supportedEfforts,
          reasoningEffort
        )
      }
      return { anthropic: anthropicOptions }
    }

    case 'cohere':
      return {
        cohere: {
          thinking: { type: 'enabled', tokenBudget: reasoningTokenBudget },
        },
      }

    case 'fireworks':
      return {
        fireworks: {
          thinking: {
            type: 'enabled',
            budgetTokens: reasoningTokenBudget,
          },
          reasoningHistory: 'interleaved',
        },
      }

    case 'google': {
      if (usesGoogleThinkingLevel(model)) {
        const supportedEfforts = getReasoningEfforts(
          'google',
          model,
          customModel
        )
        return {
          google: {
            thinkingConfig: {
              thinkingLevel: normalizeEffort(supportedEfforts, reasoningEffort),
              includeThoughts: true,
            },
          },
        }
      }
      return {
        google: {
          thinkingConfig: {
            thinkingBudget: reasoningTokenBudget,
            includeThoughts: true,
          },
        },
      }
    }

    case 'ollama':
      return { ollama: { reasoningEffort } }

    default:
      return undefined
  }
}
