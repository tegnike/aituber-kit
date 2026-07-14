import type { NextApiRequest, NextApiResponse } from 'next'
import { getClientIdFromRequest } from '@/features/api/http'
import {
  emitApiEvent,
  enqueuePresentationControlCommand,
} from '@/features/api/messageGateway'
import {
  deleteAssignment,
  readAssignment,
  toPresentationErrorResponse,
} from '@/features/presentation/presentationRepository'
import type {
  PresentationControlAction,
  PresentationControlTarget,
} from '@/features/presentation/presentationTypes'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

const actions: PresentationControlAction[] = [
  'start',
  'pause',
  'resume',
  'next_slide',
  'previous_slide',
  'next_section',
  'previous_section',
  'goto',
  'reset',
  'unload',
]

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const clientId = getClientIdFromRequest(req, req.body?.clientId)
  if (!clientId) {
    return res.status(400).json({
      error: 'Client ID is required',
      code: 'CLIENT_ID_REQUIRED',
    })
  }
  const action = req.body?.action as PresentationControlAction
  if (!actions.includes(action)) {
    return res.status(422).json({
      error: 'Presentation control action is invalid',
      code: 'INVALID_CONTROL_ACTION',
    })
  }
  const target = req.body?.target as PresentationControlTarget | undefined
  if (
    action === 'goto' &&
    (!target ||
      (target.sectionId !== undefined &&
        typeof target.sectionId !== 'string') ||
      (target.slideId !== undefined && typeof target.slideId !== 'string') ||
      (typeof target.sectionId !== 'string' &&
        typeof target.slideId !== 'string'))
  ) {
    return res.status(422).json({
      error: 'goto requires a sectionId or slideId target',
      code: 'VALIDATION_ERROR',
    })
  }
  if (req.body?.speak !== undefined && typeof req.body.speak !== 'boolean') {
    return res.status(422).json({
      error: 'speak must be a boolean',
      code: 'VALIDATION_ERROR',
    })
  }

  try {
    const assignment = await readAssignment(clientId)
    if (!assignment) {
      return res.status(409).json({
        error: 'Client has no assigned presentation',
        code: 'INVALID_CONTROL_STATE',
      })
    }
    if (action === 'unload') {
      await deleteAssignment(clientId)
      emitApiEvent(clientId, 'presentation_unloaded', {
        presentationId: assignment.presentationId,
        revision: assignment.revision,
      })
    }
    const command = enqueuePresentationControlCommand(
      clientId,
      action,
      target,
      req.body?.speak
    )
    return res.status(202).json({
      ok: true,
      clientId,
      commandId: command.id,
      action,
    })
  } catch (error) {
    const response = toPresentationErrorResponse(error)
    return res.status(response.status).json(response.body)
  }
}

export default withAccessPolicy(
  routePolicies['/api/v1/presentation/control'],
  handler
)
