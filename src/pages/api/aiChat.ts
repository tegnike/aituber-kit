import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, generateText } from 'ai'
import { NextRequest } from 'next/server'

type AIServiceKey = 'openai' | 'anthropic' | 'google' | 'groq'
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
    groq: () =>
      createOpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey }),
  }
  const aiServiceInstance = aiServiceConfig[aiService as AIServiceKey]

  if (!aiServiceInstance) {
    return new Response(JSON.stringify({ error: 'Invalid AI service' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const instance = aiServiceInstance()

  const modifiedMessages = modifyMessages(aiService, messages)

  if (stream) {
    try {
      const result = await streamText({
        model: instance(model),
        messages: modifiedMessages,
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
      messages: modifiedMessages,
    })

    return result
  }
}

function modifyMessages(aiService: string, messages: any[]) {
  if (aiService === 'anthropic') {
    return modifyAnthropicMessages(messages)
  }
  return messages
}

// Anthropicのメッセージを修正する
function modifyAnthropicMessages(messages: any[]) {
  const systemMessage = messages.find((message) => message.role === 'system')
  let userMessages = messages
    .filter((message) => message.role !== 'system')
    .filter((message) => message.content !== '')

  userMessages = consolidateMessages(userMessages)

  while (userMessages.length > 0 && userMessages[0].role !== 'user') {
    userMessages.shift()
  }

  return [systemMessage, ...userMessages]
}

// 同じroleのメッセージを結合する
function consolidateMessages(messages: any[]) {
  const consolidated: any[] = []
  let lastRole: string | null = null
  let combinedContent = ''

  messages.forEach((message, index) => {
    if (message.role === lastRole) {
      combinedContent += '\n' + message.content
    } else {
      if (lastRole !== null) {
        consolidated.push({ role: lastRole, content: combinedContent })
      }
      lastRole = message.role
      combinedContent =
        typeof message.content === 'string'
          ? message.content
          : message.content[0].text
    }

    if (index === messages.length - 1) {
      consolidated.push({ role: lastRole, content: combinedContent })
    }
  })

  return consolidated
}
