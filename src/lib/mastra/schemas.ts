import { z } from 'zod'

// Message schema (simplified for workflow use)
export const messageSchema = z.object({
  role: z.string(),
  content: z
    .union([
      z.string(),
      z.tuple([
        z.object({ type: z.literal('text'), text: z.string() }),
        z.object({ type: z.literal('image'), image: z.string() }),
      ]),
    ])
    .optional(),
  audio: z.object({ id: z.string() }).optional(),
  timestamp: z.string().optional(),
  userName: z.string().optional(),
})

export const commentSchema = z.object({
  userName: z.string(),
  userIconUrl: z.string(),
  userComment: z.string(),
})

// Workflow input schema
export const workflowInputSchema = z.object({
  chatLog: z.array(messageSchema),
  systemPrompt: z.string(),
  youtubeComments: z.array(commentSchema),
  noCommentCount: z.number(),
  continuationCount: z.number(),
  sleepMode: z.boolean(),
  newTopicThreshold: z.number(),
  sleepThreshold: z.number(),
  promptEvaluate: z.string().optional(),
  promptContinuation: z.string().optional(),
  promptSelectComment: z.string().optional(),
  promptNewTopic: z.string().optional(),
  promptSleep: z.string().optional(),
})

export type WorkflowInput = z.infer<typeof workflowInputSchema>

// State updates schema
export const stateUpdatesSchema = z.object({
  noCommentCount: z.number(),
  continuationCount: z.number(),
  sleepMode: z.boolean(),
})

// Workflow output schema (common for all branches)
export const workflowOutputSchema = z.object({
  action: z.enum(['send_comment', 'process_messages', 'sleep', 'do_nothing']),
  comment: z.string().optional(),
  userName: z.string().optional(),
  messages: z.array(messageSchema).optional(),
  stateUpdates: stateUpdatesSchema,
})

export type WorkflowOutput = z.infer<typeof workflowOutputSchema>

// evaluateState output schema
export const evaluateStateOutputSchema = z.object({
  shouldContinue: z.boolean(),
  hasComments: z.boolean(),
  newNoCommentCount: z.number(),
  // Pass-through data
  chatLog: z.array(messageSchema),
  systemPrompt: z.string(),
  youtubeComments: z.array(commentSchema),
  continuationCount: z.number(),
  sleepMode: z.boolean(),
  newTopicThreshold: z.number(),
  sleepThreshold: z.number(),
  promptContinuation: z.string().optional(),
  promptSelectComment: z.string().optional(),
  promptNewTopic: z.string().optional(),
  promptSleep: z.string().optional(),
})

export type EvaluateStateOutput = z.infer<typeof evaluateStateOutputSchema>

// Request context schema for injecting LanguageModel
export const requestContextSchema = z.object({
  languageModel: z.any(), // LanguageModel from Vercel AI SDK
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
})
