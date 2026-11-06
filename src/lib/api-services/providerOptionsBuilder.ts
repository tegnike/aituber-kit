import { getReasoningEfforts } from '@/features/constants/aiModels'

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
    return service === 'deepseek'
      ? { deepseek: { thinking: { type: 'disabled' } } }
      : undefined
  }

  switch (service) {
    case 'openai': {
      const supportedEfforts = getReasoningEfforts('openai', model, customModel)
      const normalizedEffort =
        supportedEfforts.length > 0 &&
        !(supportedEfforts as readonly string[]).includes(reasoningEffort)
          ? supportedEfforts.includes('medium')
            ? 'medium'
            : supportedEfforts[0]
          : reasoningEffort

      return {
        openai: {
          reasoningEffort: normalizedEffort,
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

    case 'xai':
      return { xai: { reasoningEffort } }

    case 'groq':
      // GroqはcreateOpenAI互換のため、providerOptionsキーはopenai
      // qwen3系はeffort値として'default'を送信
      if (model.includes('qwen3')) {
        return { openai: { reasoningEffort: 'default' } }
      }
      return { openai: { reasoningEffort } }

    case 'anthropic': {
      const anthropicOptions: Record<string, unknown> = {
        thinking: { type: 'enabled', budgetTokens: reasoningTokenBudget },
      }
      // effort parameter is only supported by Claude Opus 4.5
      if (model.includes('opus-4-5')) {
        anthropicOptions.effort = reasoningEffort
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
      const isGoogle3Series = model.startsWith('gemini-3')
      if (isGoogle3Series) {
        return {
          google: {
            thinkingConfig: {
              thinkingLevel: reasoningEffort,
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
