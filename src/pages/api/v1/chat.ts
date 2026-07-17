import type { NextApiRequest, NextApiResponse } from 'next'
import {
  enqueueMessages,
  enqueueStopCommand,
  MessageType,
} from '@/features/api/messageGateway'
import {
  getClientIdFromRequest,
  normalizeImage,
  normalizeMessages,
} from '@/features/api/http'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

const normalizeChatMode = (mode: unknown): MessageType => {
  if (mode === 'ai_generate') return 'ai_generate'
  return 'user_input'
}

const normalizeResponseCallback = (value: unknown) => {
  if (value === undefined || value === null) return undefined
  if (!value || typeof value !== 'object') return null
  const input = value as Record<string, unknown>
  if (
    typeof input.url !== 'string' ||
    typeof input.interactionId !== 'string' ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(input.interactionId) ||
    typeof input.token !== 'string' ||
    input.token.length < 8 ||
    input.token.length > 256
  )
    return null
  try {
    const url = new URL(input.url)
    if (url.protocol !== 'http:') return null
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) return null
    return {
      url: url.toString(),
      interactionId: input.interactionId,
      token: input.token,
    }
  } catch {
    return null
  }
}

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const clientId = getClientIdFromRequest(req, req.body?.clientId)
  if (!clientId) {
    return res.status(400).json({ error: 'Client ID is required' })
  }

  const messages = normalizeMessages(req.body?.messages ?? req.body?.text)
  if (messages.length === 0) {
    return res.status(400).json({ error: 'Text or messages are required' })
  }

  const imageResult = normalizeImage(req.body?.image)
  if (!imageResult.ok) {
    return res.status(imageResult.status).json({ error: imageResult.error })
  }

  const mode = normalizeChatMode(req.body?.mode)
  const useCurrentSystemPrompt =
    typeof req.body?.useCurrentSystemPrompt === 'boolean'
      ? req.body.useCurrentSystemPrompt
      : true

  if (
    req.body?.systemPrompt !== undefined &&
    typeof req.body.systemPrompt !== 'string'
  ) {
    return res.status(400).json({ error: 'System prompt is not a string' })
  }

  const interrupt = req.body?.interrupt === true
  if (interrupt) {
    enqueueStopCommand(clientId, 'all', 'interrupt_before_chat')
  }

  const responseCallback = normalizeResponseCallback(req.body?.responseCallback)
  if (responseCallback === null) {
    return res.status(400).json({ error: 'Invalid response callback' })
  }

  const queuedMessages = enqueueMessages({
    clientId,
    messages,
    type: mode,
    systemPrompt:
      mode === 'ai_generate' && !useCurrentSystemPrompt
        ? req.body?.systemPrompt
        : undefined,
    useCurrentSystemPrompt:
      mode === 'ai_generate' ? useCurrentSystemPrompt : undefined,
    image: imageResult.image,
    priority: req.body?.priority === 'high' ? 'high' : 'normal',
    interrupt,
    source: 'v1',
    responseCallback,
  })

  return res.status(202).json({
    ok: true,
    clientId,
    mode,
    queued: queuedMessages.map((message) => message.id),
    count: queuedMessages.length,
  })
}

export default withAccessPolicy(routePolicies['/api/v1/chat'], handler)
