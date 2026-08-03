import type { NextApiRequest, NextApiResponse } from 'next'
import {
  claimResponseCallback,
  completeResponseCallback,
  releaseResponseCallback,
} from '@/features/api/messageGateway'
import { isAllowedLoopbackHttpUrl } from '@/lib/api-services/serverUrlGuard'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const handle = req.body?.handle
  if (typeof handle !== 'string' || !/^callback_[a-zA-Z0-9_]+$/.test(handle)) {
    return res
      .status(400)
      .json({ error: 'Invalid callback handle', code: 'VALIDATION_ERROR' })
  }

  const status = req.body?.status
  if (!['completed', 'empty', 'failed'].includes(status)) {
    return res
      .status(400)
      .json({ error: 'Invalid callback status', code: 'VALIDATION_ERROR' })
  }
  if (status === 'completed' && typeof req.body?.content !== 'string') {
    return res
      .status(400)
      .json({ error: 'Callback content is required', code: 'VALIDATION_ERROR' })
  }
  if (status === 'failed' && typeof req.body?.error !== 'string') {
    return res
      .status(400)
      .json({ error: 'Callback error is required', code: 'VALIDATION_ERROR' })
  }

  const callback = claimResponseCallback(handle)
  if (!callback) {
    return res.status(404).json({
      error: 'Callback handle was not found',
      code: 'CALLBACK_NOT_FOUND',
    })
  }

  try {
    const callbackUrl = new URL(callback.url)
    if (!isAllowedLoopbackHttpUrl(callbackUrl)) {
      completeResponseCallback(handle)
      return res.status(400).json({
        error: 'Callback URL is not allowed',
        code: 'CALLBACK_URL_NOT_ALLOWED',
      })
    }

    const callbackResponse = await fetch(callbackUrl, {
      method: 'POST',
      redirect: 'error',
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
    return res.status(502).json({
      error: 'Callback delivery failed',
      code: 'CALLBACK_DELIVERY_FAILED',
    })
  }
}

export default withAccessPolicy(routePolicies['/api/v1/chat/callback'], handler)
