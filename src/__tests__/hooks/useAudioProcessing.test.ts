/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAudioProcessing } from '@/hooks/useAudioProcessing'

// Store original values for cleanup
const originalAudioContext = (window as any).AudioContext
const originalWebkitAudioContext = (window as any).webkitAudioContext
const originalMediaRecorder = (window as any).MediaRecorder
const originalMediaDevices = (navigator as any).mediaDevices

// Mock AudioContext
const mockAudioContextClose = jest.fn().mockResolvedValue(undefined)
const mockDecodeAudioData = jest.fn().mockResolvedValue({
  duration: 1.0,
  sampleRate: 16000,
  numberOfChannels: 1,
})

const mockAudioContextInstance = {
  close: mockAudioContextClose,
  decodeAudioData: mockDecodeAudioData,
}

const MockAudioContext = jest.fn().mockImplementation(() => {
  return mockAudioContextInstance
})

// Setup global AudioContext
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: MockAudioContext,
})

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: MockAudioContext,
})

// Mock MediaRecorder
const mockMediaRecorderStop = jest.fn()
const mockMediaRecorderStart = jest.fn()

const mockMediaRecorderInstance = {
  state: 'inactive',
  stop: mockMediaRecorderStop,
  start: mockMediaRecorderStart,
  stream: {
    getTracks: () => [{ stop: jest.fn(), id: '1', kind: 'audio' }],
  },
  mimeType: 'audio/webm',
  ondataavailable: null as ((event: { data: Blob }) => void) | null,
  onstop: null as (() => void) | null,
}

const MockMediaRecorder = jest.fn().mockImplementation(() => {
  return { ...mockMediaRecorderInstance, state: 'recording' }
})

Object.defineProperty(window, 'MediaRecorder', {
  writable: true,
  value: MockMediaRecorder,
})

// Mock MediaRecorder.isTypeSupported
;(MockMediaRecorder as any).isTypeSupported = jest.fn((mimeType: string) => {
  const supportedTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4']
  return supportedTypes.includes(mimeType)
})

// Mock navigator.mediaDevices.getUserMedia
const mockGetUserMedia = jest.fn().mockResolvedValue({
  getTracks: () => [{ stop: jest.fn() }],
})

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: { getUserMedia: mockGetUserMedia },
})

describe('useAudioProcessing', () => {
  afterAll(() => {
    // Restore original values
    ;(window as any).AudioContext = originalAudioContext
    ;(window as any).webkitAudioContext = originalWebkitAudioContext
    ;(window as any).MediaRecorder = originalMediaRecorder
    ;(navigator as any).mediaDevices = originalMediaDevices
  })

  beforeEach(() => {
    jest.clearAllMocks()
    MockAudioContext.mockClear()
  })

  describe('AudioContext初期化の分離 (Requirement 2)', () => {
    it('マウント時にAudioContextが1回だけ初期化される', async () => {
      const { result, unmount } = renderHook(() => useAudioProcessing())

      // AudioContextが作成されるまで待機
      await waitFor(() => {
        expect(result.current.audioContext).not.toBeNull()
      })

      // AudioContextが1回だけ初期化されていることを確認
      expect(MockAudioContext).toHaveBeenCalledTimes(1)

      unmount()
    })

    it('mediaRecorderの状態が変化してもAudioContextは再作成されない', async () => {
      const { result, unmount } = renderHook(() => useAudioProcessing())

      // AudioContextが作成されるまで待機
      await waitFor(() => {
        expect(result.current.audioContext).not.toBeNull()
      })

      const initialCallCount = MockAudioContext.mock.calls.length
      expect(initialCallCount).toBe(1)

      // 録音を開始してmediaRecorderの状態を変化させる
      await act(async () => {
        await result.current.startRecording()
      })

      // AudioContextが再作成されていないことを確認
      expect(MockAudioContext).toHaveBeenCalledTimes(1)

      unmount()
    })

    it('アンマウント時にAudioContextがクローズされる', async () => {
      const { result, unmount } = renderHook(() => useAudioProcessing())

      // AudioContextが作成されるまで待機
      await waitFor(() => {
        expect(result.current.audioContext).not.toBeNull()
      })

      // アンマウント
      unmount()

      // AudioContextがクローズされたことを確認
      expect(mockAudioContextClose).toHaveBeenCalled()
    })

    it('MediaRecorderのクリーンアップはAudioContext初期化と独立している', async () => {
      const { result, unmount } = renderHook(() => useAudioProcessing())

      // AudioContextが作成されるまで待機
      await waitFor(() => {
        expect(result.current.audioContext).not.toBeNull()
      })

      // 録音を開始
      await act(async () => {
        await result.current.startRecording()
      })

      // この時点でもAudioContextは1回のみ作成されている
      expect(MockAudioContext).toHaveBeenCalledTimes(1)

      unmount()
    })
  })

  describe('MIMEタイプ選択の最適化 (Requirement 9)', () => {
    beforeEach(() => {
      // isTypeSupportedのモックをリセット
      ;(MockMediaRecorder as any).isTypeSupported = jest.fn(
        (mimeType: string) => {
          const supportedTypes = [
            'audio/webm',
            'audio/webm;codecs=opus',
            'audio/mp4',
          ]
          return supportedTypes.includes(mimeType)
        }
      )
    })

    it('audio/webm;codecs=opusが優先的に選択される（Chrome/Edge）', async () => {
      const { result } = renderHook(() => useAudioProcessing())

      // AudioContextが作成されるまで待機
      await waitFor(() => {
        expect(result.current.audioContext).not.toBeNull()
      })

      // 録音を開始
      await act(async () => {
        await result.current.startRecording()
      })

      // MediaRecorderがaudio/webm;codecs=opusで作成されていることを確認
      const calls = MockMediaRecorder.mock.calls
      expect(calls.length).toBeGreaterThan(0)

      const options = calls[calls.length - 1][1]
      // audio/webm;codecs=opusが優先的に選択されることを確認
      expect(options.mimeType).toBe('audio/webm;codecs=opus')
    })

    it('audio/mp3は低優先度として扱われる', async () => {
      // mp3のみサポートするブラウザをシミュレート
      ;(MockMediaRecorder as any).isTypeSupported = jest.fn(
        (mimeType: string) => {
          return mimeType === 'audio/mp3'
        }
      )

      const { result } = renderHook(() => useAudioProcessing())

      // AudioContextが作成されるまで待機
      await waitFor(() => {
        expect(result.current.audioContext).not.toBeNull()
      })

      // 録音を開始
      await act(async () => {
        await result.current.startRecording()
      })

      // mp3がサポートされている場合は選択される（フォールバック）
      const calls = MockMediaRecorder.mock.calls
      expect(calls.length).toBeGreaterThan(0)
      const options = calls[calls.length - 1][1]
      expect(options.mimeType).toBe('audio/mp3')
    })

    it('Safari環境ではaudio/mp4が選択される', async () => {
      // Safari環境をシミュレート（audio/mp4のみサポート）
      ;(MockMediaRecorder as any).isTypeSupported = jest.fn(
        (mimeType: string) => {
          return mimeType === 'audio/mp4'
        }
      )

      const { result } = renderHook(() => useAudioProcessing())

      // AudioContextが作成されるまで待機
      await waitFor(() => {
        expect(result.current.audioContext).not.toBeNull()
      })

      // 録音を開始
      await act(async () => {
        await result.current.startRecording()
      })

      // Safari環境ではaudio/mp4が選択される
      const calls = MockMediaRecorder.mock.calls
      expect(calls.length).toBeGreaterThan(0)
      const options = calls[calls.length - 1][1]
      expect(options.mimeType).toBe('audio/mp4')
    })
  })
})
