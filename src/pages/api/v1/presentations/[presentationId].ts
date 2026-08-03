import type { NextApiRequest, NextApiResponse } from 'next'
import {
  readPresentation,
  savePresentation,
  toPresentationErrorResponse,
} from '@/features/presentation/presentationRepository'
import { PRESENTATION_ID_PATTERN } from '@/features/presentation/presentationSchema'
import { emitApiEvent } from '@/features/api/messageGateway'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
}

const getPresentationId = (req: NextApiRequest) =>
  typeof req.query.presentationId === 'string' ? req.query.presentationId : ''

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const presentationId = getPresentationId(req)
  if (!PRESENTATION_ID_PATTERN.test(presentationId)) {
    return res.status(422).json({
      error: 'Presentation ID is invalid',
      code: 'VALIDATION_ERROR',
    })
  }

  try {
    if (req.method === 'PUT') {
      if (req.body?.presentationId !== presentationId) {
        return res.status(422).json({
          error: 'URL and manifest presentation IDs must match',
          code: 'VALIDATION_ERROR',
        })
      }
      const result = await savePresentation(req.body)
      emitApiEvent(
        `presentation:${presentationId}`,
        'presentation_registered',
        {
          presentationId,
          revision: result.revision,
          contentHash: result.contentHash,
          noOp: result.noOp,
        }
      )
      return res
        .status(result.created ? 201 : 200)
        .json({ ok: true, ...result })
    }

    const rawRevision = req.query.revision
    const revision =
      typeof rawRevision === 'string' && rawRevision !== ''
        ? Number(rawRevision)
        : undefined
    if (
      revision !== undefined &&
      (!Number.isInteger(revision) || revision < 1)
    ) {
      return res.status(422).json({
        error: 'Revision must be a positive integer',
        code: 'VALIDATION_ERROR',
      })
    }
    const { manifest, metadata } = await readPresentation(
      presentationId,
      revision
    )
    return res.status(200).json({
      ok: true,
      presentation: manifest,
      contentHash: metadata.contentHash,
    })
  } catch (error) {
    const response = toPresentationErrorResponse(error)
    return res.status(response.status).json(response.body)
  }
}

export default withAccessPolicy(
  routePolicies['/api/v1/presentations/[presentationId]'],
  handler
)
