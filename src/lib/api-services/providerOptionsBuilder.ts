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
  reasoningTokenBudget: number
): Record<string, Record<string, unknown>> | undefined {
  if (!reasoningMode) return undefined

  switch (service) {
    case 'openai':
      return { openai: { reasoningEffort, reasoningSummary: 'detailed' } }

    case 'azure':
      return { azure: { reasoningEffort } }

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

    default:
      return undefined
  }
}
