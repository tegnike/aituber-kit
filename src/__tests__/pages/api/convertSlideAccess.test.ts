/** @jest-environment node */

import { createMocks } from 'node-mocks-http'
import formidable from 'formidable'
import fs from 'fs'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createOpenAI } from '@ai-sdk/openai'
import handler from '@/pages/api/convertSlide'

jest.mock('formidable', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('fs', () => ({
  readFileSync: jest.fn(() => Buffer.from('pdf')),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}))
jest.mock('canvas', () => ({
  createCanvas: jest.fn(() => ({
    getContext: jest.fn(),
    toBuffer: jest.fn(() => Buffer.from('image')),
  })),
}))
jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn().mockResolvedValue({
        getViewport: jest.fn(() => ({ width: 1, height: 1 })),
        render: jest.fn(() => ({ promise: Promise.resolve() })),
      }),
    }),
  })),
}))
jest.mock('ai', () => ({
  generateObject: jest
    .fn()
    .mockResolvedValue({ object: { line: 'line', notes: 'notes' } }),
}))
jest.mock('@ai-sdk/openai-compatible', () => ({
  createOpenAICompatible: jest.fn(() => jest.fn(() => 'vision-model')),
}))
jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(() => jest.fn(() => 'openai-model')),
}))
jest.mock('@ai-sdk/anthropic', () => ({ createAnthropic: jest.fn() }))
jest.mock('@ai-sdk/google', () => ({ createGoogleGenerativeAI: jest.fn() }))
jest.mock('@/lib/logger', () => ({
  logger: { log: jest.fn(), error: jest.fn() },
}))

describe('API Route slide conversion access', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.APIROUTE_KEY
    delete process.env.APIROUTE_API_KEY
    process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE = 'disabled'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  const convert = async (
    apiKey = '',
    aiService = 'apiroute',
    authorization = ''
  ) => {
    let parsed: Promise<unknown> = Promise.resolve()
    jest.mocked(formidable).mockReturnValue({
      parse: (_req: unknown, callback: (...args: any[]) => unknown) => {
        parsed = Promise.resolve(
          callback(
            null,
            {
              folderName: ['slides'],
              aiService: [aiService],
              apiKey: [apiKey],
              model: ['gpt-4o'],
              selectLanguage: ['en'],
              enableMultiModal: ['true'],
            },
            { file: [{ filepath: 'test.pdf' }] }
          )
        )
      },
    } as any)
    const { req, res } = createMocks({
      method: 'POST',
      headers: { host: 'example.test', authorization },
    })
    await handler(req as any, res as any)
    await parsed
    return res
  }

  it.each(['APIROUTE_API_KEY', 'APIROUTE_KEY'])(
    'resolves %s only on the server',
    async (envName) => {
      process.env[envName] = 'server-only-test-key'
      process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE = 'unprotected'
      const res = await convert()
      expect(res._getStatusCode()).toBe(200)
      expect(createOpenAICompatible).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'server-only-test-key' })
      )
      expect(JSON.stringify(res._getJSONData())).not.toContain(
        'server-only-test-key'
      )
    }
  )

  it.each(['apiroute', 'openai'])(
    'preserves client-key requests for %s when server secrets are disabled',
    async (service) => {
      process.env.APIROUTE_API_KEY = 'unused-server-key'
      const res = await convert('client-test-key', service)
      expect(res._getStatusCode()).toBe(200)
      expect(
        service === 'apiroute' ? createOpenAICompatible : createOpenAI
      ).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'client-test-key' })
      )
    }
  )

  it.each(['disabled', 'protected'])(
    'blocks unauthorized server-key use in %s mode before reading the PDF',
    async (mode) => {
      process.env.APIROUTE_API_KEY = 'server-only-test-key'
      process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE = mode
      process.env.AITUBERKIT_SERVER_SECRET_TOKEN = 'access-token'
      const res = await convert()
      expect(res._getStatusCode()).toBe(403)
      expect(fs.readFileSync).not.toHaveBeenCalled()
      expect(createOpenAICompatible).not.toHaveBeenCalled()
    }
  )

  it('allows authorized server-key requests in protected mode', async () => {
    process.env.APIROUTE_API_KEY = 'server-only-test-key'
    process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE = 'protected'
    process.env.AITUBERKIT_SERVER_SECRET_TOKEN = 'access-token'
    const res = await convert('', 'apiroute', 'Bearer access-token')
    expect(res._getStatusCode()).toBe(200)
  })

  it('returns a clear error when neither a browser nor server key exists', async () => {
    const res = await convert()
    expect(res._getStatusCode()).toBe(400)
    expect(res._getJSONData()).toEqual({
      error: 'Empty API Key',
      errorCode: 'EmptyAPIKey',
    })
    expect(fs.readFileSync).not.toHaveBeenCalled()
  })
})
