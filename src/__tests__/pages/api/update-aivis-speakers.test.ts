/**
 * @jest-environment node
 */

const mockWriteFile = jest.fn()
jest.mock('fs/promises', () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}))

const mockIsRestrictedMode = jest.fn(() => false)
jest.mock('@/utils/restrictedMode', () => ({
  isRestrictedMode: () => mockIsRestrictedMode(),
  createRestrictedModeErrorResponse: (feature: string) => ({
    error: 'feature_disabled_in_restricted_mode',
    message: `The feature "${feature}" is disabled in restricted mode.`,
  }),
}))

import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/update-aivis-speakers'

const originalEnv = { ...process.env }

describe('/api/update-aivis-speakers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    mockIsRestrictedMode.mockReturnValue(false)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          name: 'Speaker',
          speaker_uuid: 'speaker-id',
          styles: [{ name: 'Normal', id: 1, type: 'talk' }],
        },
      ],
    }) as jest.Mock
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('rejects speaker file updates by default', async () => {
    delete process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE
    const { req, res } = createMocks({ method: 'POST' })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(403)
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        errorCode: 'ServerSecretAccessDenied',
        feature: 'update-aivis-speakers',
      })
    )
    expect(global.fetch).not.toHaveBeenCalled()
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('updates speaker file when server resource access is allowed', async () => {
    process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE = 'unprotected'
    const { req, res } = createMocks({ method: 'POST' })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(200)
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:10101/speakers')
    expect(mockWriteFile).toHaveBeenCalled()
  })
})
