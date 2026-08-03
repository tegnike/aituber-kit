import type { NextApiRequest, NextApiResponse } from 'next'
import { getClientIdFromRequest } from '@/features/api/http'
import { getClientStatus } from '@/features/api/messageGateway'
import {
  readAssignment,
  toPresentationErrorResponse,
} from '@/features/presentation/presentationRepository'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const clientId = getClientIdFromRequest(req)
  if (!clientId) {
    return res.status(400).json({
      error: 'Client ID is required',
      code: 'CLIENT_ID_REQUIRED',
    })
  }

  try {
    const desired = await readAssignment(clientId)
    const actual = getClientStatus(clientId)?.presentation ?? null
    const inSync = desired
      ? Boolean(
          actual &&
          desired.presentationId === actual.presentationId &&
          desired.revision === actual.revision &&
          actual.state !== 'loading' &&
          actual.state !== 'error'
        )
      : !actual?.presentationId &&
        actual?.state !== 'loading' &&
        actual?.state !== 'error'
    return res.status(200).json({ ok: true, clientId, desired, actual, inSync })
  } catch (error) {
    const response = toPresentationErrorResponse(error)
    return res.status(response.status).json(response.body)
  }
}

export default withAccessPolicy(
  routePolicies['/api/v1/presentation/status'],
  handler
)
