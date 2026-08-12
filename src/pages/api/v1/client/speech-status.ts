import type { NextApiRequest, NextApiResponse } from 'next'
import { updateClientActiveSpeech } from '@/features/api/messageGateway'
import { getClientIdFromRequest } from '@/features/api/http'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const clientId = getClientIdFromRequest(req, req.body?.clientId)
  if (!clientId) {
    return res.status(400).json({ error: 'Client ID is required' })
  }

  if (!Object.prototype.hasOwnProperty.call(req.body ?? {}, 'activeSpeech')) {
    return res.status(400).json({ error: 'activeSpeech is required' })
  }
  const value = req.body.activeSpeech
  if (
    value !== null &&
    (!value || typeof value.id !== 'string' || typeof value.text !== 'string')
  ) {
    return res.status(400).json({ error: 'activeSpeech is invalid' })
  }
  const activeSpeech =
    value && typeof value.id === 'string' && typeof value.text === 'string'
      ? { id: value.id, text: value.text }
      : null
  const version = req.body?.version
  if (
    version !== undefined &&
    (!Number.isSafeInteger(version) || version < 0)
  ) {
    return res.status(400).json({ error: 'version is invalid' })
  }
  const status = updateClientActiveSpeech(clientId, activeSpeech, version)
  if (!status) {
    return res.status(409).json({ error: 'Client status is not initialized' })
  }
  return res.status(200).json({ ok: true })
}

export default withAccessPolicy(
  routePolicies['/api/v1/client/speech-status'],
  handler
)
