const mockHomeGetState = jest.fn()
jest.mock('@/features/stores/home', () => ({
  getState: (...args: unknown[]) => mockHomeGetState(...args),
}))

const mockSettingsGetState = jest.fn()
jest.mock('@/features/stores/settings', () => ({
  getState: (...args: unknown[]) => mockSettingsGetState(...args),
}))

const mockLive2DSpeak = jest.fn().mockResolvedValue(undefined)
const mockLive2DStopSpeaking = jest.fn()
const mockLive2DResetToIdle = jest.fn().mockResolvedValue(undefined)
jest.mock('@/features/messages/live2dHandler', () => ({
  Live2DHandler: {
    speak: (...args: unknown[]) => mockLive2DSpeak(...args),
    stopSpeaking: (...args: unknown[]) => mockLive2DStopSpeaking(...args),
    resetToIdle: (...args: unknown[]) => mockLive2DResetToIdle(...args),
  },
}))

const mockPNGSpeak = jest.fn().mockResolvedValue(undefined)
const mockPNGStopSpeaking = jest.fn()
const mockPNGResetToIdle = jest.fn().mockResolvedValue(undefined)
jest.mock('@/features/pngTuber/pngTuberHandler', () => ({
  PNGTuberHandler: {
    speak: (...args: unknown[]) => mockPNGSpeak(...args),
    stopSpeaking: (...args: unknown[]) => mockPNGStopSpeaking(...args),
    resetToIdle: (...args: unknown[]) => mockPNGResetToIdle(...args),
  },
}))

import { livlivRenderer } from '@/features/livliv/livlivRuntime'
import { getCharacterRenderer } from '@/features/messages/characterRenderer'
import type { Talk } from '@/features/messages/messages'

describe('getCharacterRenderer', () => {
  const talk: Talk = { emotion: 'neutral', message: 'hi' }
  const buffer = new ArrayBuffer(8)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('dispatches to Live2DHandler when modelType is live2d', async () => {
    mockSettingsGetState.mockReturnValue({ modelType: 'live2d' })
    const renderer = getCharacterRenderer()

    await renderer?.speak(buffer, talk, false)
    await renderer?.stopSpeaking()
    await renderer?.resetToIdle()

    expect(mockLive2DSpeak).toHaveBeenCalledWith(buffer, talk, false)
    expect(mockLive2DStopSpeaking).toHaveBeenCalled()
    expect(mockLive2DResetToIdle).toHaveBeenCalled()
  })

  it('dispatches to PNGTuberHandler when modelType is pngtuber', async () => {
    mockSettingsGetState.mockReturnValue({ modelType: 'pngtuber' })
    const renderer = getCharacterRenderer()

    await renderer?.speak(buffer, talk, true)
    await renderer?.stopSpeaking()
    await renderer?.resetToIdle()

    expect(mockPNGSpeak).toHaveBeenCalledWith(buffer, talk, true)
    expect(mockPNGStopSpeaking).toHaveBeenCalled()
    expect(mockPNGResetToIdle).toHaveBeenCalled()
  })

  it('selects the LivLiv speech renderer before a canvas is ready', () => {
    mockSettingsGetState.mockReturnValue({ modelType: 'livliv' })
    expect(getCharacterRenderer()).toBe(livlivRenderer)
  })

  it('dispatches to the VRM viewer model when modelType is vrm', async () => {
    const mockSpeak = jest.fn().mockResolvedValue(undefined)
    const mockStopSpeaking = jest.fn()
    const mockPlayEmotion = jest.fn().mockResolvedValue(undefined)
    const mockResetToIdle = jest.fn()
    const model = {
      speak: mockSpeak,
      stopSpeaking: mockStopSpeaking,
      playEmotion: mockPlayEmotion,
      poseManager: { isActive: true, resetToIdle: mockResetToIdle },
    }
    mockSettingsGetState.mockReturnValue({ modelType: 'vrm' })
    mockHomeGetState.mockReturnValue({ viewer: { model } })

    const renderer = getCharacterRenderer()
    await renderer?.speak(buffer, talk, false)
    await renderer?.stopSpeaking()
    await renderer?.resetToIdle()

    expect(mockSpeak).toHaveBeenCalledWith(buffer, talk, false)
    expect(mockStopSpeaking).toHaveBeenCalled()
    expect(mockResetToIdle).toHaveBeenCalledWith(model)
    expect(mockPlayEmotion).toHaveBeenCalledWith('neutral')
  })

  it('returns null when modelType is vrm but no model is loaded', () => {
    mockSettingsGetState.mockReturnValue({ modelType: 'vrm' })
    mockHomeGetState.mockReturnValue({ viewer: { model: undefined } })

    expect(getCharacterRenderer()).toBeNull()
  })

  it('does not reset the VRM pose when poseManager is inactive', async () => {
    const mockResetToIdle = jest.fn()
    const model = {
      speak: jest.fn(),
      stopSpeaking: jest.fn(),
      playEmotion: jest.fn().mockResolvedValue(undefined),
      poseManager: { isActive: false, resetToIdle: mockResetToIdle },
    }
    mockSettingsGetState.mockReturnValue({ modelType: 'vrm' })
    mockHomeGetState.mockReturnValue({ viewer: { model } })

    const renderer = getCharacterRenderer()
    await renderer?.stopSpeaking()
    await renderer?.resetToIdle()

    expect(mockResetToIdle).not.toHaveBeenCalled()
  })
})
