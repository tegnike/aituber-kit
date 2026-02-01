import { createWorkflow } from '@mastra/core/workflows'
import {
  workflowInputSchema,
  workflowOutputSchema,
  requestContextSchema,
} from './schemas'
import { evaluateStateStep } from './steps/evaluateState'
import { buildContinuationStep } from './steps/buildContinuation'
import { selectBestCommentStep } from './steps/selectBestComment'
import { generateNewTopicStep } from './steps/generateNewTopic'
import { buildSleepStep } from './steps/buildSleep'
import { buildContinueNoCommentStep } from './steps/buildContinueNoComment'
import { buildDoNothingStep } from './steps/buildDoNothing'

/**
 * YouTube会話継続ワークフロー
 *
 * 決定木:
 *   evaluateState → 状況を判定（AI呼び出し：継続チェック）
 *   Branch:
 *     [shouldContinue]                     → buildContinuation（メッセージ構築）
 *     [hasComments]                        → selectBestComment（AI呼び出し：最適コメント選択）
 *     [noComments, count>sleepThreshold]    → doNothing（スリープ中は何もしない）
 *     [noComments, count==newTopicThreshold] → generateNewTopic（AI呼び出し：新トピック生成）
 *     [noComments, count==sleepThreshold]   → buildSleep（メッセージ構築）
 *     [default]                             → buildContinueNoComment（メッセージ構築）
 */
export const conversationWorkflow = createWorkflow({
  id: 'youtube-conversation',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  requestContextSchema: requestContextSchema,
})
  .then(evaluateStateStep)
  .branch([
    // 1. 継続判定がtrue → 前の話題を自動継続
    [
      async ({ inputData }) => inputData.shouldContinue === true,
      buildContinuationStep,
    ],
    // 2. コメントあり → 最適コメントをAIで選択
    [
      async ({ inputData }) => inputData.hasComments === true,
      selectBestCommentStep,
    ],
    // 3. スリープ中（count>sleepThreshold）→ 何もしない
    [
      async ({ inputData }) =>
        inputData.newNoCommentCount > inputData.sleepThreshold,
      buildDoNothingStep,
    ],
    // 4. コメントなし, count===newTopicThreshold → 新トピック生成
    [
      async ({ inputData }) =>
        inputData.newNoCommentCount === inputData.newTopicThreshold,
      generateNewTopicStep,
    ],
    // 5. コメントなし, count===sleepThreshold → スリープ突入（1回だけ）
    [
      async ({ inputData }) =>
        inputData.newNoCommentCount === inputData.sleepThreshold,
      buildSleepStep,
    ],
    // 6. デフォルト（count<newTopicThreshold or 中間値）→ 会話継続
    [async () => true, buildContinueNoCommentStep],
  ])
  .map(async ({ inputData }) => {
    // 実行されたブランチの結果を抽出
    const result =
      inputData['build-continuation'] ||
      inputData['select-best-comment'] ||
      inputData['generate-new-topic'] ||
      inputData['build-sleep'] ||
      inputData['build-do-nothing'] ||
      inputData['build-continue-no-comment']
    return result
  })
  .commit()
