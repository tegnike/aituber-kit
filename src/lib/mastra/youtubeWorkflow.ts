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
 *     [shouldContinue]        → buildContinuation（メッセージ構築）
 *     [hasComments]           → selectBestComment（AI呼び出し：最適コメント選択）
 *     [noComments, count==3]  → generateNewTopic（AI呼び出し：新トピック生成）
 *     [noComments, count==6]  → buildSleep（メッセージ構築）
 *     [noComments, count>6]   → doNothing（スリープ後は何もしない）
 *     [default]               → buildContinueNoComment（メッセージ構築）
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
    // 3. コメントなし, count===3 → 新トピック生成
    [
      async ({ inputData }) => inputData.newNoCommentCount === 3,
      generateNewTopicStep,
    ],
    // 4. コメントなし, count===6 → スリープ突入（1回だけ）
    [
      async ({ inputData }) => inputData.newNoCommentCount === 6,
      buildSleepStep,
    ],
    // 5. コメントなし, count>6 → スリープ中は何もしない
    [
      async ({ inputData }) => inputData.newNoCommentCount > 6,
      buildDoNothingStep,
    ],
    // 6. デフォルト（count<3 or 4-5）→ 会話継続
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
