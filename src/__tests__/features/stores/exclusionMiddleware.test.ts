/**
 * @jest-environment node
 */

// Mock computeExclusions
const mockComputeExclusions = jest.fn()
jest.mock('@/features/stores/exclusionEngine', () => ({
  computeExclusions: (...args: unknown[]) => mockComputeExclusions(...args),
}))

// Mock cross-store targets
const mockMenuSetState = jest.fn()
const mockHomeSetState = jest.fn()
const mockSlideSetState = jest.fn()
jest.mock('@/features/stores/menu', () => ({
  default: { setState: (...args: unknown[]) => mockMenuSetState(...args) },
}))
jest.mock('@/features/stores/home', () => ({
  default: { setState: (...args: unknown[]) => mockHomeSetState(...args) },
}))
jest.mock('@/features/stores/slide', () => ({
  default: { setState: (...args: unknown[]) => mockSlideSetState(...args) },
}))

// Mock three.js dependencies required by home store
jest.mock('three', () => ({}))
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({}))
jest.mock('@pixiv/three-vrm', () => ({}))

import { exclusivityMiddleware } from '@/features/stores/exclusionMiddleware'
import type { SettingsState } from '@/features/stores/settings'

function createMockState(
  overrides: Partial<SettingsState> = {}
): SettingsState {
  return {
    selectAIService: 'openai',
    selectAIModel: 'gpt-4.1-mini',
    selectVoice: 'voicevox',
    selectLanguage: 'ja',
    realtimeAPIMode: false,
    audioMode: false,
    externalLinkageMode: false,
    conversationContinuityMode: false,
    slideMode: false,
    youtubeMode: false,
    speechRecognitionMode: 'browser',
    initialSpeechTimeout: 5.0,
    noSpeechTimeout: 5.0,
    showSilenceProgressBar: true,
    continuousMicListeningMode: true,
    useSearchGrounding: false,
    multiModalMode: 'ai-decide',
    enableMultiModal: true,
    customModel: false,
    ...overrides,
  } as SettingsState
}

describe('exclusivityMiddleware', () => {
  let mockSet: jest.Mock
  let mockGet: jest.Mock
  let mockApi: { setState: jest.Mock; getState: jest.Mock }
  let currentState: SettingsState

  beforeEach(() => {
    jest.clearAllMocks()
    currentState = createMockState()
    mockSet = jest.fn()
    mockGet = jest.fn(() => currentState)
    mockApi = {
      setState: jest.fn(),
      getState: jest.fn(() => currentState),
    }

    mockComputeExclusions.mockReturnValue({
      corrections: {},
      crossStoreEffects: [],
    })
  })

  function setupMiddleware() {
    const config = jest.fn((set: unknown, get: unknown) => {
      return { wrappedSet: set, wrappedGet: get }
    })

    const wrapped = exclusivityMiddleware(config as never)
    const result = wrapped(mockSet, mockGet, mockApi as never)

    return { config, result }
  }

  describe('applyRules with object partial', () => {
    it('should pass object partial to computeExclusions', () => {
      const { config } = setupMiddleware()
      const wrappedSet = config.mock.calls[0][0]

      const partial = { realtimeAPIMode: true }
      wrappedSet(partial)

      expect(mockComputeExclusions).toHaveBeenCalledWith(partial, currentState)
    })

    it('should merge corrections into the resolved partial', () => {
      mockComputeExclusions.mockReturnValue({
        corrections: { audioMode: false },
        crossStoreEffects: [],
      })

      const { config } = setupMiddleware()
      const wrappedSet = config.mock.calls[0][0]

      wrappedSet({ realtimeAPIMode: true })

      expect(mockSet).toHaveBeenCalledWith(
        { realtimeAPIMode: true, audioMode: false },
        undefined
      )
    })
  })

  describe('applyRules with function partial', () => {
    it('should resolve function partial before passing to computeExclusions', () => {
      const { config } = setupMiddleware()
      const wrappedSet = config.mock.calls[0][0]

      const partialFn = (state: SettingsState) => ({
        selectAIModel: state.selectAIModel + '-updated',
      })

      wrappedSet(partialFn)

      expect(mockComputeExclusions).toHaveBeenCalledWith(
        { selectAIModel: 'gpt-4.1-mini-updated' },
        currentState
      )
    })
  })

  describe('cross-store effects', () => {
    it('should schedule menu store effects via queueMicrotask', async () => {
      mockComputeExclusions.mockReturnValue({
        corrections: {},
        crossStoreEffects: [{ store: 'menu', state: { showWebcam: false } }],
      })

      const { config } = setupMiddleware()
      const wrappedSet = config.mock.calls[0][0]

      wrappedSet({ youtubeMode: true })

      // Effects are scheduled via queueMicrotask
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockMenuSetState).toHaveBeenCalledWith({ showWebcam: false })
    })

    it('should schedule home store effects', async () => {
      mockComputeExclusions.mockReturnValue({
        corrections: {},
        crossStoreEffects: [{ store: 'home', state: { modalImage: '' } }],
      })

      const { config } = setupMiddleware()
      const wrappedSet = config.mock.calls[0][0]

      wrappedSet({ youtubeMode: true })

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockHomeSetState).toHaveBeenCalledWith({ modalImage: '' })
    })

    it('should schedule slide store effects', async () => {
      mockComputeExclusions.mockReturnValue({
        corrections: {},
        crossStoreEffects: [{ store: 'slide', state: { isPlaying: false } }],
      })

      const { config } = setupMiddleware()
      const wrappedSet = config.mock.calls[0][0]

      wrappedSet({ youtubeMode: true })

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockSlideSetState).toHaveBeenCalledWith({ isPlaying: false })
    })

    it('should handle multiple cross-store effects', async () => {
      mockComputeExclusions.mockReturnValue({
        corrections: {},
        crossStoreEffects: [
          { store: 'menu', state: { showWebcam: false } },
          { store: 'home', state: { modalImage: '' } },
          { store: 'slide', state: { isPlaying: false } },
        ],
      })

      const { config } = setupMiddleware()
      const wrappedSet = config.mock.calls[0][0]

      wrappedSet({ youtubeMode: true })

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockMenuSetState).toHaveBeenCalledWith({ showWebcam: false })
      expect(mockHomeSetState).toHaveBeenCalledWith({ modalImage: '' })
      expect(mockSlideSetState).toHaveBeenCalledWith({ isPlaying: false })
    })

    it('should not schedule effects when crossStoreEffects is empty', async () => {
      mockComputeExclusions.mockReturnValue({
        corrections: {},
        crossStoreEffects: [],
      })

      const { config } = setupMiddleware()
      const wrappedSet = config.mock.calls[0][0]

      wrappedSet({ selectAIModel: 'new-model' })

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockMenuSetState).not.toHaveBeenCalled()
      expect(mockHomeSetState).not.toHaveBeenCalled()
      expect(mockSlideSetState).not.toHaveBeenCalled()
    })
  })

  describe('persist rehydration (api.setState)', () => {
    it('should apply rules when api.setState is called', () => {
      mockComputeExclusions.mockReturnValue({
        corrections: { audioMode: false },
        crossStoreEffects: [],
      })

      setupMiddleware()

      // api.setState is now overridden by the middleware
      mockApi.setState({ realtimeAPIMode: true })

      expect(mockComputeExclusions).toHaveBeenCalled()
    })

    it('should pass corrected state through persist setState', () => {
      const originalPersistSetState = mockApi.setState

      mockComputeExclusions.mockReturnValue({
        corrections: { audioMode: false },
        crossStoreEffects: [],
      })

      setupMiddleware()

      // The middleware overrides api.setState, so we call the new one
      mockApi.setState({ realtimeAPIMode: true })

      // The original persistSetState should have been called with merged state
      expect(originalPersistSetState).toHaveBeenCalledWith(
        { realtimeAPIMode: true, audioMode: false },
        undefined
      )
    })
  })

  describe('edge cases', () => {
    it('should handle null/undefined partial gracefully', () => {
      const { config } = setupMiddleware()
      const wrappedSet = config.mock.calls[0][0]

      // null partial
      expect(() => wrappedSet(null)).not.toThrow()
    })

    it('should pass replace flag through', () => {
      const { config } = setupMiddleware()
      const wrappedSet = config.mock.calls[0][0]

      wrappedSet({ selectAIModel: 'new' }, true)

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ selectAIModel: 'new' }),
        true
      )
    })
  })
})
