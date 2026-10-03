/**
 * Mastraワークフロー/ステップテスト用の共有フィクスチャ
 */

const baseChatLog = [
  { role: 'user', content: 'hello' },
  { role: 'assistant', content: 'hi there' },
]

export const mockModelSettings = {
  languageModel: 'mock-model',
  temperature: 1.0,
  maxTokens: 4096,
}

export const mockRequestContext = {
  all: mockModelSettings,
}

/** ワークフロー/evaluateStateステップへの入力フィクスチャ */
export const buildWorkflowInput = (overrides: any = {}) => ({
  chatLog: baseChatLog,
  systemPrompt: 'You are helpful.',
  youtubeComments: [],
  noCommentCount: 0,
  continuationCount: 0,
  sleepMode: false,
  newTopicThreshold: 3,
  sleepThreshold: 6,
  ...overrides,
})

/** evaluateStateステップの出力（分岐ステップへの入力）フィクスチャ */
export const buildEvaluateOutput = (overrides: any = {}) => ({
  shouldContinue: false,
  hasComments: false,
  newNoCommentCount: 1,
  chatLog: baseChatLog,
  systemPrompt: 'You are helpful.',
  youtubeComments: [],
  continuationCount: 0,
  sleepMode: false,
  ...overrides,
})

/** ステップの execute() に渡す共通パラメータ（inputData のみ各テストで指定する） */
export const baseExecuteParams = {
  requestContext: mockRequestContext,
  mastra: {} as any,
  runId: 'test-run',
  workflowId: 'test',
  resourceId: undefined,
  state: undefined,
  setState: jest.fn(),
  retryCount: 0,
  tracingContext: {} as any,
  getInitData: jest.fn(),
  getStepResult: jest.fn(),
  suspend: jest.fn() as any,
  bail: jest.fn() as any,
  abort: jest.fn(),
  engine: {} as any,
  abortSignal: new AbortController().signal,
  writer: {} as any,
}

/** ステップを共通パラメータで実行し、出力スキーマの型で結果を返す */
export const executeStep = async <TOutput>(
  step: {
    outputSchema: {
      readonly '~standard': { readonly types?: { readonly output: TOutput } }
    }
    execute: (params: any) => unknown
  },
  inputData: unknown
): Promise<TOutput> =>
  (await step.execute({ inputData, ...baseExecuteParams })) as TOutput
