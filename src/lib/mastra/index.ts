import { Mastra } from '@mastra/core'
import { conversationWorkflow } from './youtubeWorkflow'

export const mastra = new Mastra({
  workflows: {
    conversationWorkflow: conversationWorkflow as any,
  },
})
