import { createStep } from '@mastra/core/workflows'
import { evaluateStateOutputSchema, workflowOutputSchema } from '../schemas'

/**
 * 何もしないステップ
 * sleepMode=true かつ noCommentCount > 6 の場合に実行される
 * 旧コードと同様、スリープ突入後は何もアクションを起こさない
 */
export const buildDoNothingStep = createStep({
  id: 'build-do-nothing',
  inputSchema: evaluateStateOutputSchema,
  outputSchema: workflowOutputSchema,
  execute: async ({ inputData }) => {
    return {
      action: 'do_nothing' as const,
      stateUpdates: {
        noCommentCount: inputData.newNoCommentCount,
        continuationCount: 0,
        sleepMode: inputData.sleepMode,
      },
    }
  },
})
