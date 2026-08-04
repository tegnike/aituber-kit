import type { NextApiRequest, NextApiResponse } from 'next'
import {
  enqueueMessages,
  enqueueStopCommand,
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

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const clientId = getClientIdFromRequest(req, req.body?.clientId)
  if (!clientId) {
    return res.status(400).json({ error: 'Client ID is required' })
  }

  const normalizedFromMessages = normalizeMessages(req.body?.messages)
  const messages =
    normalizedFromMessages.length > 0
      ? normalizedFromMessages
      : normalizeMessages(req.body?.text)
  if (messages.length === 0) {
    return res.status(400).json({ error: 'Text or messages are required' })
  }

  const speechSessionIdInput = req.body?.speechSessionId
  if (
    speechSessionIdInput !== undefined &&
    (typeof speechSessionIdInput !== 'string' ||
      speechSessionIdInput.trim().length === 0 ||
      speechSessionIdInput.trim().length > 200)
  ) {
    return res.status(400).json({ error: 'Invalid speech session ID' })
  }
  const speechSessionId =
    typeof speechSessionIdInput === 'string'
      ? speechSessionIdInput.trim()
      : undefined

  const imageResult = normalizeImage(req.body?.image)
  if (!imageResult.ok) {
    return res.status(imageResult.status).json({ error: imageResult.error })
  }

  const interrupt = req.body?.interrupt === true
  if (interrupt) {
    enqueueStopCommand(clientId, 'all', 'interrupt_before_speak')
  }

  const queuedMessages = enqueueMessages({
    clientId,
    messages,
    type: 'direct_send',
    image: imageResult.image,
    emotion:
      typeof req.body?.emotion === 'string' ? req.body.emotion : undefined,
    speechSessionId,
    priority: req.body?.priority === 'high' ? 'high' : 'normal',
    interrupt,
    source: 'v1',
  })

  return res.status(202).json({
    ok: true,
    clientId,
    queued: queuedMessages.map((message) => message.id),
    count: queuedMessages.length,
  })
}

export default withAccessPolicy(routePolicies['/api/v1/speak'], handler)
