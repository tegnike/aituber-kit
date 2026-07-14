import type { NextApiRequest, NextApiResponse } from 'next'
import {
  readPresentation,
  saveAssignment,
  toPresentationErrorResponse,
} from '@/features/presentation/presentationRepository'
import { getClientIdFromRequest } from '@/features/api/http'
import {
  emitApiEvent,
  enqueuePresentationLoadCommand,
} from '@/features/api/messageGateway'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const presentationId =
    typeof req.query.presentationId === 'string' ? req.query.presentationId : ''
  const clientId = getClientIdFromRequest(req, req.body?.clientId)
  if (!clientId) {
    return res.status(400).json({
      error: 'Client ID is required',
      code: 'CLIENT_ID_REQUIRED',
    })
  }
  const revision = req.body?.revision
  if (!Number.isInteger(revision) || revision < 1) {
    return res.status(422).json({
      error: 'Revision must be a positive integer',
      code: 'VALIDATION_ERROR',
    })
  }
  if (
    req.body?.autoStart !== undefined &&
    typeof req.body.autoStart !== 'boolean'
  ) {
    return res.status(422).json({
      error: 'autoStart must be a boolean',
      code: 'VALIDATION_ERROR',
    })
  }

  try {
    await readPresentation(presentationId, revision)
    const assignment = await saveAssignment(clientId, {
      presentationId,
      revision,
      autoStart: req.body?.autoStart === true,
    })
    const command = enqueuePresentationLoadCommand(
      clientId,
      presentationId,
      revision
    )
    emitApiEvent(clientId, 'presentation_assigned', {
      presentationId,
      revision,
      autoStart: assignment.autoStart,
    })
    return res.status(200).json({
      ok: true,
      clientId,
      assignment,
      commandQueued: Boolean(command.id),
    })
  } catch (error) {
    const response = toPresentationErrorResponse(error)
    return res.status(response.status).json(response.body)
  }
}

export default withAccessPolicy(
  routePolicies['/api/v1/presentations/[presentationId]/activate'],
  handler
)
