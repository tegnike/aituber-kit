import type { NextApiRequest, NextApiResponse } from 'next'
import { listActiveReceivers } from '@/features/api/messageGateway'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

const handler = (_req: NextApiRequest, res: NextApiResponse) =>
  res.status(200).json({ ok: true, receivers: listActiveReceivers() })

export default withAccessPolicy(routePolicies['/api/v1/receivers'], handler)
