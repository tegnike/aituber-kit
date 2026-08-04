import type { NextApiRequest, NextApiResponse } from 'next'
import {
  ApiEvent,
  getRecentApiEvents,
  subscribeApiEvents,
} from '@/features/api/messageGateway'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

const writeSseEvent = (res: NextApiResponse, event: ApiEvent) => {
  res.write(`id: ${event.id}\n`)
  res.write(`event: ${event.type}\n`)
  res.write(`data: ${JSON.stringify(event)}\n\n`)
}

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const clientId =
    typeof req.query.receiverId === 'string'
      ? req.query.receiverId
      : typeof req.query.clientId === 'string'
        ? req.query.clientId
        : undefined
  const snapshot = req.query.snapshot === 'true'

  if (snapshot) {
    return res.status(200).json({
      ok: true,
      events: getRecentApiEvents(clientId),
    })
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })

  res.write(': connected\n\n')

  getRecentApiEvents(clientId).forEach((event) => writeSseEvent(res, event))

  const unsubscribe = subscribeApiEvents((event) => {
    if (!clientId || event.clientId === clientId) {
      writeSseEvent(res, event)
    }
  })

  req.socket.on('close', unsubscribe)
}

export default withAccessPolicy(routePolicies['/api/v1/events'], handler)
