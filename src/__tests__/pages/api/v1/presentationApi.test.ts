/** @jest-environment node */

import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { createHash } from 'crypto'
import {
  createMockReq,
  createMockRes,
} from '../../../helpers/apiRouteTestUtils'
import type { PresentationManifestV1 } from '@/features/presentation/presentationTypes'

const originalEnv = { ...process.env }
const authHeaders = { authorization: 'Bearer presentation-test-key' }

const createManifest = (): PresentationManifestV1 => ({
  schemaVersion: 1,
  presentationId: 'api-test',
  revision: 1,
  title: 'API test',
  createdAt: '2026-07-14T20:00:00.000Z',
  sections: [
    {
      id: 'section-1',
      title: 'Section',
      slides: [
        {
          id: 'slide-1',
          markdown: '# Test',
          narration: 'Bunkerkidsを紹介します。',
          speechText: 'バンカーキッズを紹介します。',
        },
      ],
    },
  ],
})

describe('external presentation API', () => {
  let storageDir: string

  beforeEach(async () => {
    jest.resetModules()
    process.env = { ...originalEnv }
    process.env.AITUBERKIT_API_KEY = 'presentation-test-key'
    delete process.env.NEXT_PUBLIC_RESTRICTED_MODE
    storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aituber-api-'))
    process.env.AITUBERKIT_PRESENTATION_STORAGE_DIR = storageDir
    require('@/features/api/messageGateway').__resetMessageGatewayForTests()
  })

  afterEach(async () => {
    await fs.rm(storageDir, { recursive: true, force: true })
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('registers, reads, and no-ops an identical manifest', async () => {
    const handler =
      require('@/pages/api/v1/presentations/[presentationId]').default
    const created = createMockRes()
    await handler(
      createMockReq({
        method: 'PUT',
        headers: authHeaders,
        query: { presentationId: 'api-test' },
        body: createManifest(),
      }),
      created
    )
    expect(created._status).toBe(201)
    expect(created._json).toEqual(
      expect.objectContaining({ ok: true, created: true, noOp: false })
    )

    const noOp = createMockRes()
    await handler(
      createMockReq({
        method: 'PUT',
        headers: authHeaders,
        query: { presentationId: 'api-test' },
        body: createManifest(),
      }),
      noOp
    )
    expect(noOp._status).toBe(200)
    expect(noOp._json).toEqual(expect.objectContaining({ noOp: true }))

    const fetched = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        headers: authHeaders,
        query: { presentationId: 'api-test', revision: '1' },
      }),
      fetched
    )
    expect(fetched._json).toEqual(
      expect.objectContaining({
        ok: true,
        presentation: expect.objectContaining({ presentationId: 'api-test' }),
        contentHash: expect.stringMatching(/^sha256:/),
      })
    )
    expect(fetched._json.presentation.sections[0].slides[0]).toEqual(
      expect.objectContaining({
        narration: 'Bunkerkidsを紹介します。',
        speechText: 'バンカーキッズを紹介します。',
      })
    )
  })

  it.each(['0', '-1'])('rejects non-positive revision %s', async (revision) => {
    const handler =
      require('@/pages/api/v1/presentations/[presentationId]').default
    const response = createMockRes()

    await handler(
      createMockReq({
        method: 'GET',
        headers: authHeaders,
        query: { presentationId: 'api-test', revision },
      }),
      response
    )

    expect(response._status).toBe(422)
    expect(response._json).toEqual({
      error: 'Revision must be a positive integer',
      code: 'VALIDATION_ERROR',
    })
  })

  it('persists assignments and queues commands only for the target client', async () => {
    const presentation =
      require('@/pages/api/v1/presentations/[presentationId]').default
    await presentation(
      createMockReq({
        method: 'PUT',
        headers: authHeaders,
        query: { presentationId: 'api-test' },
        body: createManifest(),
      }),
      createMockRes()
    )

    const activate =
      require('@/pages/api/v1/presentations/[presentationId]/activate').default
    const activated = createMockRes()
    await activate(
      createMockReq({
        method: 'POST',
        headers: authHeaders,
        query: { presentationId: 'api-test' },
        body: { clientId: 'main-stage', revision: 1, autoStart: false },
      }),
      activated
    )
    expect(activated._json).toEqual(
      expect.objectContaining({
        ok: true,
        assignment: expect.objectContaining({ presentationId: 'api-test' }),
        commandQueued: true,
      })
    )

    const gateway = require('@/features/api/messageGateway')
    expect(gateway.dequeueCommands('other-client')).toEqual([])
    expect(gateway.dequeueCommands('main-stage')).toEqual([
      expect.objectContaining({
        command: 'presentation.load',
        presentationId: 'api-test',
        revision: 1,
      }),
    ])
    expect(gateway.getRecentApiEvents('main-stage')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'presentation_assigned',
          payload: expect.objectContaining({ presentationId: 'api-test' }),
        }),
      ])
    )

    const control = require('@/pages/api/v1/presentation/control').default
    const controlled = createMockRes()
    await control(
      createMockReq({
        method: 'POST',
        headers: authHeaders,
        body: { clientId: 'main-stage', action: 'next_section' },
      }),
      controlled
    )
    expect(controlled._status).toBe(202)
    expect(gateway.dequeueCommands('main-stage')).toEqual([
      expect.objectContaining({
        command: 'presentation.control',
        action: 'next_section',
      }),
    ])

    const hidden = createMockRes()
    await control(
      createMockReq({
        method: 'POST',
        headers: authHeaders,
        body: { clientId: 'main-stage', action: 'hide' },
      }),
      hidden
    )
    expect(hidden._status).toBe(202)
    expect(gateway.dequeueCommands('main-stage')).toEqual([
      expect.objectContaining({
        command: 'presentation.control',
        action: 'hide',
      }),
    ])

    const invalidGoto = createMockRes()
    await control(
      createMockReq({
        method: 'POST',
        headers: authHeaders,
        body: {
          clientId: 'main-stage',
          action: 'goto',
          target: { sectionId: '' },
        },
      }),
      invalidGoto
    )
    expect(invalidGoto._status).toBe(422)
  })

  it('returns desired and actual status after client synchronization', async () => {
    const presentation =
      require('@/pages/api/v1/presentations/[presentationId]').default
    await presentation(
      createMockReq({
        method: 'PUT',
        headers: authHeaders,
        query: { presentationId: 'api-test' },
        body: createManifest(),
      }),
      createMockRes()
    )
    const activate =
      require('@/pages/api/v1/presentations/[presentationId]/activate').default
    await activate(
      createMockReq({
        method: 'POST',
        headers: authHeaders,
        query: { presentationId: 'api-test' },
        body: { clientId: 'main-stage', revision: 1 },
      }),
      createMockRes()
    )

    const clientStatus = require('@/pages/api/v1/client/status').default
    const clientResponse = createMockRes()
    await clientStatus(
      createMockReq({
        method: 'POST',
        headers: authHeaders,
        query: { clientId: 'main-stage' },
        body: {
          connected: true,
          presentation: {
            presentationId: 'api-test',
            revision: 1,
            state: 'section_paused',
            sectionId: 'section-1',
            slideId: 'slide-1',
            slideIndex: 0,
            isSpeaking: false,
            lastError: null,
            updatedAt: '2026-07-14T20:01:00.000Z',
          },
        },
      }),
      clientResponse
    )
    expect(clientResponse._json).toEqual(
      expect.objectContaining({
        assignment: expect.objectContaining({ presentationId: 'api-test' }),
      })
    )

    const status = require('@/pages/api/v1/presentation/status').default
    const statusResponse = createMockRes()
    await status(
      createMockReq({
        method: 'GET',
        headers: authHeaders,
        query: { clientId: 'main-stage' },
      }),
      statusResponse
    )
    expect(statusResponse._json).toEqual(
      expect.objectContaining({
        desired: expect.objectContaining({ presentationId: 'api-test' }),
        actual: expect.objectContaining({ state: 'section_paused' }),
        inSync: true,
      })
    )
  })

  it('does not report an unassigned error state as synchronized', async () => {
    const gateway = require('@/features/api/messageGateway')
    gateway.updateClientStatus('main-stage', {
      connected: true,
      isSpeaking: false,
      chatProcessing: false,
      presentation: {
        presentationId: null,
        revision: null,
        state: 'error',
        sectionId: null,
        slideId: null,
        slideIndex: null,
        isSpeaking: false,
        lastError: 'load failed',
        updatedAt: '2026-07-14T20:01:00.000Z',
      },
    })
    const status = require('@/pages/api/v1/presentation/status').default
    const response = createMockRes()

    await status(
      createMockReq({
        method: 'GET',
        headers: authHeaders,
        query: { clientId: 'main-stage' },
      }),
      response
    )

    expect(response._json).toEqual(
      expect.objectContaining({ desired: null, inSync: false })
    )
  })

  it('keeps a successful client heartbeat when assignment data is corrupt', async () => {
    const assignmentHash = createHash('sha256')
      .update('main-stage')
      .digest('hex')
    const assignmentDir = path.join(storageDir, 'assignments')
    await fs.mkdir(assignmentDir, { recursive: true })
    await fs.writeFile(path.join(assignmentDir, `${assignmentHash}.json`), '{')
    const clientStatus = require('@/pages/api/v1/client/status').default
    const response = createMockRes()

    await clientStatus(
      createMockReq({
        method: 'POST',
        headers: authHeaders,
        query: { clientId: 'main-stage' },
        body: { connected: true, isSpeaking: false },
      }),
      response
    )

    expect(response._status).toBe(200)
    expect(response._json).toEqual(
      expect.objectContaining({
        ok: true,
        status: expect.objectContaining({ connected: true }),
        assignment: null,
        assignmentError: expect.objectContaining({
          code: 'PRESENTATION_LOAD_FAILED',
        }),
      })
    )
  })

  it('enforces authentication and restricted mode', async () => {
    const handler =
      require('@/pages/api/v1/presentations/[presentationId]').default
    const unauthenticated = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { presentationId: 'api-test' },
      }),
      unauthenticated
    )
    expect(unauthenticated._status).toBe(401)

    process.env.NEXT_PUBLIC_RESTRICTED_MODE = 'true'
    const restricted = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        headers: authHeaders,
        query: { presentationId: 'api-test' },
      }),
      restricted
    )
    expect(restricted._status).toBe(403)
  })
})
