import { generateObject } from 'ai'
import { isMultiModalModel } from '@/features/constants/aiModels'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { TextDecoder, TextEncoder } from 'util'

if (typeof global.TextEncoder === 'undefined') {
  // @ts-expect-error – polyfill TextEncoder required by formidable dependencies
  global.TextEncoder = TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  // @ts-expect-error – polyfill TextDecoder required by formidable dependencies
  global.TextDecoder = TextDecoder
}

let createSlideLine: typeof import('@/pages/api/convertSlide').createSlideLine

jest.mock('ai', () => {
  const actual = jest.requireActual('ai')
  return {
    ...actual,
    generateObject: jest.fn(),
  }
})

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(),
}))

jest.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: jest.fn(),
}))

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn(),
}))

jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({}))

jest.mock('@/features/constants/aiModels', () => ({
  ...(jest.requireActual('@/features/constants/aiModels') as object),
  isMultiModalModel: jest.fn(),
}))

const mockGenerateObject = generateObject as jest.MockedFunction<
  typeof generateObject
>
const mockIsMultiModalModel = isMultiModalModel as jest.MockedFunction<
  typeof isMultiModalModel
>
const mockCreateOpenAI = createOpenAI as jest.MockedFunction<
  typeof createOpenAI
>
const mockCreateAnthropic = createAnthropic as jest.MockedFunction<
  typeof createAnthropic
>
const mockCreateGoogle = createGoogleGenerativeAI as jest.MockedFunction<
  typeof createGoogleGenerativeAI
>

beforeAll(async () => {
  ;({ createSlideLine } = await import('@/pages/api/convertSlide'))
})

describe('createSlideLine', () => {
  const baseImage = 'data:image/png;base64,AAA'

  beforeEach(() => {
    jest.clearAllMocks()
    mockIsMultiModalModel.mockReturnValue(true)
  })

  it('invokes OpenAI models and returns parsed object', async () => {
    const modelFactory = jest.fn().mockReturnValue('openai-model')
    mockCreateOpenAI.mockReturnValue(modelFactory)
    mockGenerateObject.mockResolvedValue({
      object: { line: 'line', notes: 'notes' },
    } as any)

    const result = await createSlideLine(
      baseImage,
      'openai-key',
      'openai',
      'gpt-4o',
      'Japanese',
      null
    )

    expect(mockCreateOpenAI).toHaveBeenCalledWith({ apiKey: 'openai-key' })
    expect(modelFactory).toHaveBeenCalledWith('gpt-4o')
    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'openai-model',
        output: 'no-schema',
      })
    )
    expect(result).toEqual({ line: 'line', notes: 'notes' })
  })

  it('uses schema output for Anthropic requests', async () => {
    const anthropicFactory = jest
      .fn()
      .mockReturnValue('anthropic-model-instance')
    mockCreateAnthropic.mockReturnValue(anthropicFactory)
    mockGenerateObject.mockResolvedValue({
      object: { line: 'a', notes: 'b' },
    } as any)

    const result = await createSlideLine(
      baseImage,
      'anthropic-key',
      'anthropic',
      'claude-3',
      'English',
      'Previous'
    )

    const call = mockGenerateObject.mock.calls[0][0]
    expect(call).toHaveProperty('schema')
    expect(call).not.toHaveProperty('output')
    expect(call.model).toBe('anthropic-model-instance')
    expect(result).toEqual({ line: 'a', notes: 'b' })
  })

  it('throws when model is not multimodal', async () => {
    mockIsMultiModalModel.mockReturnValue(false)

    await expect(
      createSlideLine(baseImage, 'key', 'google', 'gemini', 'English', null)
    ).rejects.toThrow('does not support multimodal features')
  })
})
