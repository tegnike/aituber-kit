import { Message } from '@/features/messages/messages'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createCohere } from '@ai-sdk/cohere'
import { createMistral } from '@ai-sdk/mistral'
import { createAzure } from '@ai-sdk/azure'
import { streamText, generateText, CoreMessage } from 'ai'
import { NextRequest } from 'next/server'

type AIServiceKey =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure'
  | 'groq'
  | 'cohere'
  | 'mistralai'
  | 'perplexity'
  | 'fireworks'
type AIServiceConfig = Record<AIServiceKey, () => any>

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages, apiKey, aiService, model, stream } = await req.json()
  const aiServiceConfig: AIServiceConfig = {
    openai: () => createOpenAI({ apiKey }),
    anthropic: () => createAnthropic({ apiKey }),
    google: () => createGoogleGenerativeAI({ apiKey }),
    azure: () =>
      createAzure({
        resourceName:
          model.match(/https:\/\/(.+?)\.openai\.azure\.com/)?.[1] || '',
        apiKey,
      }),
    groq: () =>
      createOpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey }),
    cohere: () => createCohere({ apiKey }),
    mistralai: () => createMistral({ apiKey }),
    perplexity: () =>
      createOpenAI({ baseURL: 'https://api.perplexity.ai/', apiKey }),
    fireworks: () =>
      createOpenAI({
        baseURL: 'https://api.fireworks.ai/inference/v1',
        apiKey,
      }),
  }
  const aiServiceInstance = aiServiceConfig[aiService as AIServiceKey]

  if (!aiServiceInstance) {
    return new Response(JSON.stringify({ error: 'Invalid AI service' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const instance = aiServiceInstance()
  const modifiedMessages: Message[] = modifyMessages(aiService, messages)
  let modifiedModel = model
  if (aiService === 'azure') {
    modifiedModel =
      model.match(/\/deployments\/(.+?)\/completions/)?.[1] || model
  }

  if (stream) {
    try {
      const result = await streamText({
        model: instance(modifiedModel),
        messages: modifiedMessages as CoreMessage[],
      })

      return result.toDataStreamResponse()
    } catch (error) {
      console.error('Error in OpenAI API call:', error)
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } else {
    const result = await generateText({
      model: instance(model),
      messages: modifiedMessages as CoreMessage[],
    })

    return new Response(JSON.stringify({ text: result.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function modifyMessages(aiService: string, messages: Message[]): Message[] {
  if (aiService === 'anthropic' || aiService === 'perplexity') {
    return modifyAnthropicMessages(messages)
  }
  return messages
}

// Anthropicのメッセージを修正する
function modifyAnthropicMessages(messages: Message[]): Message[] {
  const systemMessage: Message | undefined = messages.find(
    (message) => message.role === 'system'
  )
  let userMessages = messages
    .filter((message) => message.role !== 'system')
    .filter((message) => message.content !== '')

  userMessages = consolidateMessages(userMessages)

  while (userMessages.length > 0 && userMessages[0].role !== 'user') {
    userMessages.shift()
  }

  const result: Message[] = systemMessage
    ? [systemMessage, ...userMessages]
    : userMessages
  return result
}

// 同じroleのメッセージを結合する
function consolidateMessages(messages: Message[]) {
  const consolidated: Message[] = []
  let lastRole: string | null = null
  let combinedContent:
    | string
    | [
        {
          type: 'text'
          text: string
        },
        {
          type: 'image'
          image: string
        },
      ]

  messages.forEach((message, index) => {
    if (message.role === lastRole) {
      if (typeof combinedContent === 'string') {
        combinedContent += '\n' + message.content
      } else {
        combinedContent[0].text += '\n' + message.content
      }
    } else {
      if (lastRole !== null) {
        consolidated.push({ role: lastRole, content: combinedContent })
      }
      lastRole = message.role
      combinedContent = message.content
    }

    if (index === messages.length - 1) {
      consolidated.push({ role: lastRole, content: combinedContent })
    }
  })

  return consolidated
}
