import type { NextApiRequest, NextApiResponse } from 'next'
import {
  claimResponseCallback,
  completeResponseCallback,
  releaseResponseCallback,
} from '@/features/api/messageGateway'
import { isHttpUrl, isLoopbackHost } from '@/lib/api-services/serverUrlGuard'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const handle = req.body?.handle
  if (typeof handle !== 'string' || !/^callback_[a-zA-Z0-9_]+$/.test(handle)) {
    return res.status(400).json({ error: 'Invalid callback handle' })
  }

  const status = req.body?.status
  if (!['completed', 'empty', 'failed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid callback status' })
  }
  if (status === 'completed' && typeof req.body?.content !== 'string') {
    return res.status(400).json({ error: 'Callback content is required' })
  }
  if (status === 'failed' && typeof req.body?.error !== 'string') {
    return res.status(400).json({ error: 'Callback error is required' })
  }

  const callback = claimResponseCallback(handle)
  if (!callback) {
    return res.status(404).json({ error: 'Callback handle was not found' })
  }

  try {
    const callbackUrl = new URL(callback.url)
    if (!isHttpUrl(callbackUrl) || !isLoopbackHost(callbackUrl.hostname)) {
      completeResponseCallback(handle)
      return res.status(400).json({ error: 'Callback URL is not allowed' })
    }

    const callbackResponse = await fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interactionId: callback.interactionId,
        token: callback.token,
        status,
        ...(status === 'completed' ? { content: req.body.content } : {}),
        ...(status === 'failed' ? { error: req.body.error } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!callbackResponse.ok) {
      throw new Error(`Callback failed (${callbackResponse.status})`)
    }

    completeResponseCallback(handle)
    return res.status(200).json({ ok: true })
  } catch {
    releaseResponseCallback(handle)
    return res.status(502).json({ error: 'Callback delivery failed' })
  }
}

export default withAccessPolicy(routePolicies['/api/v1/chat/callback'], handler)
