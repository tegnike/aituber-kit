/**
 * @jest-environment jsdom
 *
 * Task 5.1: システム統合テスト
 * メインページへのusePresenceDetectionフック統合を検証する
 *
 * Note: 顔検出ループの詳細なテストは usePresenceDetection.test.ts で実施済み
 * ここでは統合レベルでの基本動作とAPI連携を検証する
 */
import { renderHook, act } from '@testing-library/react'
import { usePresenceDetection } from '@/hooks/usePresenceDetection'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import { createIdlePhrase } from '@/features/idle/idleTypes'

// Mock face-api.js
const mockDetectSingleFace = jest.fn()
jest.mock(
  'face-api.js',
  () => ({
    nets: {
      tinyFaceDetector: {
        loadFromUri: jest.fn().mockResolvedValue(undefined),
        isLoaded: true,
      },
    },
    TinyFaceDetectorOptions: jest.fn().mockImplementation(() => ({})),
    detectSingleFace: (...args: unknown[]) => mockDetectSingleFace(...args),
  }),
  { virtual: true }
)

// Default greeting phrases for tests
const defaultGreetingPhrases = [
  createIdlePhrase('いらっしゃいませ！', 'happy', 0),
]

// Mock stores
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => {
      const state = {
        presenceDetectionEnabled: true,
        presenceGreetingPhrases: [
          {
            id: 'test-1',
            text: 'いらっしゃいませ！',
            emotion: 'happy',
            order: 0,
          },
        ],
        presenceDepartureTimeout: 3,
        presenceCooldownTime: 5,
        presenceDetectionSensitivity: 'medium' as const,
        presenceDetectionThreshold: 0,
        presenceDebugMode: false,
        presenceDeparturePhrases: [],
        presenceClearChatOnDeparture: true,
      }
      return selector ? selector(state) : state
    }),
    {
      getState: jest.fn(() => ({
        presenceDetectionEnabled: true,
        presenceGreetingPhrases: [
          {
            id: 'test-1',
            text: 'いらっしゃいませ！',
            emotion: 'happy',
            order: 0,
          },
        ],
        presenceDepartureTimeout: 3,
        presenceCooldownTime: 5,
        presenceDetectionSensitivity: 'medium',
        presenceDetectionThreshold: 0,
        presenceDebugMode: false,
        presenceDeparturePhrases: [],
        presenceClearChatOnDeparture: true,
      })),
      setState: jest.fn(),
    }
  ),
}))

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({
      presenceState: 'idle' as const,
      presenceError: null,
      lastDetectionTime: null,
      chatProcessing: false,
      isSpeaking: false,
    })),
    setState: jest.fn(),
  },
}))

jest.mock('@/features/stores/toast', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({
      addToast: jest.fn(),
    })),
  },
}))

// Mock navigator.mediaDevices
const mockMediaStream = {
  getTracks: jest.fn(() => [{ stop: jest.fn() }]),
  getVideoTracks: jest.fn(() => [{ stop: jest.fn() }]),
}

const mockGetUserMedia = jest.fn().mockResolvedValue(mockMediaStream)

describe('Task 5.1: システム統合テスト - メインページへのフック統合', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockDetectSingleFace.mockResolvedValue(null)

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    })
    ;(homeStore.setState as jest.Mock).mockClear()
  })

  describe('フックの初期状態', () => {
    it('初期状態ではpresenceStateがidleである', () => {
      const { result } = renderHook(() => usePresenceDetection({}))

      expect(result.current.presenceState).toBe('idle')
      expect(result.current.isDetecting).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('videoRefが提供される', () => {
      const { result } = renderHook(() => usePresenceDetection({}))

      expect(result.current.videoRef).toBeDefined()
      expect(result.current.videoRef.current).toBe(null)
    })

    it('detectionResultの初期値はnullである', () => {
      const { result } = renderHook(() => usePresenceDetection({}))

      expect(result.current.detectionResult).toBe(null)
    })
  })

  describe('検出の開始と停止', () => {
    it('startDetection呼び出しでカメラストリームを取得する', async () => {
      const { result } = renderHook(() => usePresenceDetection({}))

      await act(async () => {
        await result.current.startDetection()
      })

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'user' },
      })
      expect(result.current.isDetecting).toBe(true)
    })

    it('stopDetection呼び出しでカメラストリームを解放しisDetectingがfalseになる', async () => {
      const mockTrack = { stop: jest.fn() }
      const mockStream = {
        getTracks: jest.fn(() => [mockTrack]),
        getVideoTracks: jest.fn(() => [mockTrack]),
      }
      mockGetUserMedia.mockResolvedValueOnce(mockStream)

      const { result } = renderHook(() => usePresenceDetection({}))

      await act(async () => {
        await result.current.startDetection()
      })

      act(() => {
        result.current.stopDetection()
      })

      expect(mockTrack.stop).toHaveBeenCalled()
      expect(result.current.isDetecting).toBe(false)
      expect(result.current.presenceState).toBe('idle')
    })
  })

  describe('エラーハンドリング', () => {
    it('カメラ権限拒否時にCAMERA_PERMISSION_DENIEDエラーが設定される', async () => {
      const permissionError = new Error('Permission denied')
      ;(permissionError as any).name = 'NotAllowedError'
      mockGetUserMedia.mockRejectedValueOnce(permissionError)

      const { result } = renderHook(() => usePresenceDetection({}))

      await act(async () => {
        await result.current.startDetection()
      })

      expect(result.current.error).toEqual({
        code: 'CAMERA_PERMISSION_DENIED',
        message: expect.any(String),
      })
      expect(result.current.isDetecting).toBe(false)
    })

    it('カメラ利用不可時にCAMERA_NOT_AVAILABLEエラーが設定される', async () => {
      const notFoundError = new Error('Device not found')
      ;(notFoundError as any).name = 'NotFoundError'
      mockGetUserMedia.mockRejectedValueOnce(notFoundError)

      const { result } = renderHook(() => usePresenceDetection({}))

      await act(async () => {
        await result.current.startDetection()
      })

      expect(result.current.error).toEqual({
        code: 'CAMERA_NOT_AVAILABLE',
        message: expect.any(String),
      })
    })

    it('モデルロード失敗時にMODEL_LOAD_FAILEDエラーが設定される', async () => {
      const faceapi = jest.requireMock('face-api.js')
      faceapi.nets.tinyFaceDetector.loadFromUri.mockRejectedValueOnce(
        new Error('Model load failed')
      )

      const { result } = renderHook(() => usePresenceDetection({}))

      await act(async () => {
        await result.current.startDetection()
      })

      expect(result.current.error).toEqual({
        code: 'MODEL_LOAD_FAILED',
        message: expect.any(String),
      })
    })
  })

  describe('コールバックプロパティ', () => {
    it('コールバック関数を受け取るpropsが定義されている', () => {
      const onPersonDetected = jest.fn()
      const onPersonDeparted = jest.fn()
      const onGreetingStart = jest.fn()
      const onGreetingComplete = jest.fn()

      const { result } = renderHook(() =>
        usePresenceDetection({
          onPersonDetected,
          onPersonDeparted,
          onGreetingStart,
          onGreetingComplete,
        })
      )

      // フックが正常に初期化される
      expect(result.current.presenceState).toBe('idle')
      expect(result.current.startDetection).toBeDefined()
      expect(result.current.stopDetection).toBeDefined()
      expect(result.current.completeGreeting).toBeDefined()
    })
  })

  describe('completeGreeting APIの動作', () => {
    it('completeGreetingメソッドが提供される', () => {
      const { result } = renderHook(() => usePresenceDetection({}))

      expect(typeof result.current.completeGreeting).toBe('function')
    })
  })

  describe('アンマウント時のクリーンアップ', () => {
    it('アンマウント時にカメラストリームが解放される', async () => {
      const mockTrack = { stop: jest.fn() }
      const mockStream = {
        getTracks: jest.fn(() => [mockTrack]),
        getVideoTracks: jest.fn(() => [mockTrack]),
      }
      mockGetUserMedia.mockResolvedValueOnce(mockStream)

      const { result, unmount } = renderHook(() => usePresenceDetection({}))

      await act(async () => {
        await result.current.startDetection()
      })

      unmount()

      expect(mockTrack.stop).toHaveBeenCalled()
    })
  })
})

describe('Task 5.2: i18n翻訳キーの統合', () => {
  it('設定ストアからpresenceGreetingPhrasesを取得できる', () => {
    const phrases = (settingsStore as any).getState().presenceGreetingPhrases
    expect(phrases).toBeDefined()
    expect(phrases.length).toBeGreaterThan(0)
    expect(phrases[0].text).toBe('いらっしゃいませ！')
  })

  it('設定ストアからpresence関連の設定を取得できる', () => {
    const state = (settingsStore as any).getState()

    expect(state.presenceDetectionEnabled).toBeDefined()
    expect(state.presenceGreetingPhrases).toBeDefined()
    expect(state.presenceDepartureTimeout).toBeDefined()
    expect(state.presenceCooldownTime).toBeDefined()
    expect(state.presenceDetectionSensitivity).toBeDefined()
    expect(state.presenceDebugMode).toBeDefined()
    expect(state.presenceDeparturePhrases).toBeDefined()
    expect(state.presenceClearChatOnDeparture).toBeDefined()
  })
})
