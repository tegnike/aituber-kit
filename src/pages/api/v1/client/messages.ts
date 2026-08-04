import type { NextApiRequest, NextApiResponse } from 'next'
import { dequeueMessages } from '@/features/api/messageGateway'
import { getClientIdFromRequest } from '@/features/api/http'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const clientId = getClientIdFromRequest(req)
  if (!clientId) {
    return res.status(400).json({ error: 'Client ID is required' })
  }

  return res.status(200).json({ messages: dequeueMessages(clientId) })
}

export default withAccessPolicy(
  routePolicies['/api/v1/client/messages'],
  handler
)
