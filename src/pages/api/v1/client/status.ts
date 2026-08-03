import type { NextApiRequest, NextApiResponse } from 'next'
import { updateClientStatus } from '@/features/api/messageGateway'
import { getClientIdFromRequest } from '@/features/api/http'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'
import {
  readAssignment,
  toPresentationErrorResponse,
} from '@/features/presentation/presentationRepository'
import type {
  PresentationActualState,
  PresentationPlaybackState,
} from '@/features/presentation/presentationTypes'

const playbackStates: PresentationPlaybackState[] = [
  'unassigned',
  'loading',
  'ready',
  'playing',
  'paused',
  'section_paused',
  'completed',
  'error',
]

const normalizePresentationStatus = (
  value: unknown
): PresentationActualState | undefined => {
  if (!value || typeof value !== 'object') return undefined
  const status = value as Partial<PresentationActualState>
  if (!playbackStates.includes(status.state as PresentationPlaybackState)) {
    return undefined
  }
  return {
    presentationId:
      typeof status.presentationId === 'string'
        ? status.presentationId
        : undefined,
    revision: typeof status.revision === 'number' ? status.revision : undefined,
    state: status.state as PresentationPlaybackState,
    sectionId:
      typeof status.sectionId === 'string' ? status.sectionId : undefined,
    slideId: typeof status.slideId === 'string' ? status.slideId : undefined,
    slideIndex:
      typeof status.slideIndex === 'number' ? status.slideIndex : undefined,
    isSpeaking: status.isSpeaking === true,
    lastError: typeof status.lastError === 'string' ? status.lastError : null,
    updatedAt:
      typeof status.updatedAt === 'string'
        ? status.updatedAt
        : new Date().toISOString(),
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const clientId = getClientIdFromRequest(req, req.body?.clientId)
  if (!clientId) {
    return res.status(400).json({ error: 'Client ID is required' })
  }

  const status = updateClientStatus(clientId, {
    connected: req.body?.connected === true,
    isSpeaking: req.body?.isSpeaking === true,
    activeSpeech:
      req.body?.activeSpeech &&
      typeof req.body.activeSpeech.id === 'string' &&
      typeof req.body.activeSpeech.text === 'string'
        ? { id: req.body.activeSpeech.id, text: req.body.activeSpeech.text }
        : null,
    chatProcessing: req.body?.chatProcessing === true,
    messageReceiverEnabled: req.body?.messageReceiverEnabled === true,
    modelType:
      typeof req.body?.modelType === 'string' ? req.body.modelType : undefined,
    aiService:
      typeof req.body?.aiService === 'string' ? req.body.aiService : undefined,
    voiceEngine:
      typeof req.body?.voiceEngine === 'string'
        ? req.body.voiceEngine
        : undefined,
    externalLinkageMode: req.body?.externalLinkageMode === true,
    presentation: normalizePresentationStatus(req.body?.presentation),
  })

  try {
    const assignment = await readAssignment(clientId)
    return res.status(200).json({ ok: true, status, assignment })
  } catch (error) {
    const response = toPresentationErrorResponse(error)
    return res.status(200).json({
      ok: true,
      status,
      assignment: null,
      assignmentError: response.body,
    })
  }
}

export default withAccessPolicy(routePolicies['/api/v1/client/status'], handler)
