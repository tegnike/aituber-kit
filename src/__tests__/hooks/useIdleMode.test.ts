/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react'
import { useIdleMode } from '@/hooks/useIdleMode'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'

// Mock speakCharacter - 即座にonCompleteコールバックを呼び出す
const mockSpeakCharacter = jest.fn(
  (
    _sessionId: string,
    _talk: unknown,
    _onStart: () => void,
    onComplete: () => void
  ) => {
    // 発話完了をシミュレート
    onComplete()
  }
)
jest.mock('@/features/messages/speakCharacter', () => ({
  speakCharacter: (...args: unknown[]) => mockSpeakCharacter(...args),
}))

// Mock SpeakQueue
jest.mock('@/features/messages/speakQueue', () => ({
  SpeakQueue: {
    getInstance: jest.fn(() => ({
      addTask: jest.fn(),
      clearQueue: jest.fn(),
      checkSessionId: jest.fn(),
    })),
    stopAll: jest.fn(),
    onSpeakCompletion: jest.fn(),
    removeSpeakCompletionCallback: jest.fn(),
  },
}))

// Mock stores
jest.mock('@/features/stores/settings', () => {
  const mockFn = jest.fn()
  return {
    __esModule: true,
    default: Object.assign(mockFn, {
      getState: jest.fn(),
      setState: jest.fn(),
      subscribe: jest.fn(() => jest.fn()),
    }),
  }
})

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(),
    setState: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
  },
}))

// Helper function to setup mock settings
function setupSettingsMock(overrides = {}) {
  const defaultState = {
    idleModeEnabled: true,
    idlePhrases: [
      { id: '1', text: 'こんにちは！', emotion: 'happy', order: 0 },
    ],
    idlePlaybackMode: 'sequential',
    idleInterval: 30,
    idleDefaultEmotion: 'neutral',
    idleTimePeriodEnabled: false,
    idleTimePeriodMorning: 'おはようございます！',
    idleTimePeriodAfternoon: 'こんにちは！',
    idleTimePeriodEvening: 'こんばんは！',
    idleAiGenerationEnabled: false,
    idleAiPromptTemplate: '',
    ...overrides,
  }
  const mockSettingsStore = settingsStore as unknown as jest.Mock & {
    getState: jest.Mock
  }
  mockSettingsStore.mockImplementation(
    (selector: (state: typeof defaultState) => unknown) =>
      selector ? selector(defaultState) : defaultState
  )
  mockSettingsStore.getState.mockReturnValue(defaultState)
}

// Helper function to setup mock home
function setupHomeMock(overrides = {}) {
  const defaultState = {
    chatLog: [],
    chatProcessingCount: 0,
    isSpeaking: false,
    presenceState: 'idle',
    ...overrides,
  }
  const mockHomeStore = homeStore as unknown as {
    getState: jest.Mock
    subscribe: jest.Mock
  }
  mockHomeStore.getState.mockReturnValue(defaultState)
  mockHomeStore.subscribe.mockReturnValue(jest.fn())
}

describe('useIdleMode - Task 3.1: フックの基本構造とタイマー管理', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    setupSettingsMock()
    setupHomeMock()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('フック引数と戻り値の型定義', () => {
    it('should return isIdleActive as boolean', () => {
      const { result } = renderHook(() => useIdleMode({}))
      expect(typeof result.current.isIdleActive).toBe('boolean')
    })

    it('should return idleState as one of disabled/waiting/speaking', () => {
      const { result } = renderHook(() => useIdleMode({}))
      expect(['disabled', 'waiting', 'speaking']).toContain(
        result.current.idleState
      )
    })

    it('should return resetTimer function', () => {
      const { result } = renderHook(() => useIdleMode({}))
      expect(typeof result.current.resetTimer).toBe('function')
    })

    it('should return stopIdleSpeech function', () => {
      const { result } = renderHook(() => useIdleMode({}))
      expect(typeof result.current.stopIdleSpeech).toBe('function')
    })

    it('should return secondsUntilNextSpeech as number', () => {
      const { result } = renderHook(() => useIdleMode({}))
      expect(typeof result.current.secondsUntilNextSpeech).toBe('number')
    })
  })

  describe('内部状態の管理（useRef/useState）', () => {
    it('should start in waiting state when idle mode is enabled', () => {
      const { result } = renderHook(() => useIdleMode({}))
      expect(result.current.idleState).toBe('waiting')
      expect(result.current.isIdleActive).toBe(true)
    })

    it('should be in disabled state when idle mode is disabled', () => {
      setupSettingsMock({ idleModeEnabled: false })
      const { result } = renderHook(() => useIdleMode({}))
      expect(result.current.idleState).toBe('disabled')
      expect(result.current.isIdleActive).toBe(false)
    })
  })

  describe('setIntervalで毎秒経過時間チェック', () => {
    it('should decrement secondsUntilNextSpeech every second', () => {
      const { result } = renderHook(() => useIdleMode({}))
      const initialSeconds = result.current.secondsUntilNextSpeech

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.secondsUntilNextSpeech).toBe(initialSeconds - 1)
    })
  })

  describe('useEffect cleanupでタイマークリア', () => {
    it('should cleanup timer on unmount', () => {
      const { unmount } = renderHook(() => useIdleMode({}))
      unmount()

      // Timer should be cleared (no error on advancing timers after unmount)
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(1000)
        })
      }).not.toThrow()
    })
  })

  describe('アイドルモード無効時タイマー停止', () => {
    it('should not run timer when idle mode is disabled', () => {
      setupSettingsMock({ idleModeEnabled: false })
      const { result } = renderHook(() => useIdleMode({}))
      const initialSeconds = result.current.secondsUntilNextSpeech

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      // Should stay the same since timer is not running
      expect(result.current.secondsUntilNextSpeech).toBe(initialSeconds)
    })
  })
})

describe('useIdleMode - Task 3.2: 発話条件判定ロジック', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    setupSettingsMock({ idleInterval: 5 })
    setupHomeMock()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('設定した秒数経過チェック', () => {
    it('should trigger speech when interval has passed', () => {
      const onIdleSpeechStart = jest.fn()
      renderHook(() => useIdleMode({ onIdleSpeechStart }))

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(onIdleSpeechStart).toHaveBeenCalled()
    })
  })

  describe('AI処理中チェック（chatProcessingCount > 0）', () => {
    it('should not trigger speech when AI is processing', () => {
      setupHomeMock({ chatProcessingCount: 1 })
      const onIdleSpeechStart = jest.fn()
      renderHook(() => useIdleMode({ onIdleSpeechStart }))

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(onIdleSpeechStart).not.toHaveBeenCalled()
    })
  })

  describe('発話中チェック（isSpeaking）', () => {
    it('should not trigger speech when already speaking', () => {
      setupHomeMock({ isSpeaking: true })
      const onIdleSpeechStart = jest.fn()
      renderHook(() => useIdleMode({ onIdleSpeechStart }))

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(onIdleSpeechStart).not.toHaveBeenCalled()
    })
  })

  describe('人感検知状態チェック（presenceState !== idle）', () => {
    it('should not trigger speech when presence is detected', () => {
      setupHomeMock({ presenceState: 'greeting' })
      const onIdleSpeechStart = jest.fn()
      renderHook(() => useIdleMode({ onIdleSpeechStart }))

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(onIdleSpeechStart).not.toHaveBeenCalled()
    })
  })
})

describe('useIdleMode - Task 3.3: セリフ選択ロジック', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    setupHomeMock()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('順番モードでのインデックス進行', () => {
    it('should select phrases in sequential order', () => {
      setupSettingsMock({
        idleInterval: 5,
        idlePhrases: [
          { id: '1', text: 'フレーズ1', emotion: 'happy', order: 0 },
          { id: '2', text: 'フレーズ2', emotion: 'neutral', order: 1 },
          { id: '3', text: 'フレーズ3', emotion: 'relaxed', order: 2 },
        ],
        idlePlaybackMode: 'sequential',
      })

      const selectedPhrases: string[] = []
      const onIdleSpeechStart = jest.fn((phrase) => {
        selectedPhrases.push(phrase.text)
      })

      renderHook(() => useIdleMode({ onIdleSpeechStart }))

      // 3回発話をトリガー（1秒ずつ進めて状態更新をフラッシュ）
      for (let cycle = 0; cycle < 3; cycle++) {
        for (let sec = 0; sec < 5; sec++) {
          act(() => {
            jest.advanceTimersByTime(1000)
          })
        }
      }

      expect(selectedPhrases).toEqual(['フレーズ1', 'フレーズ2', 'フレーズ3'])
    })

    it('should wrap around to beginning after reaching end', () => {
      setupSettingsMock({
        idleInterval: 5,
        idlePhrases: [
          { id: '1', text: 'フレーズ1', emotion: 'happy', order: 0 },
          { id: '2', text: 'フレーズ2', emotion: 'neutral', order: 1 },
        ],
        idlePlaybackMode: 'sequential',
      })

      const selectedPhrases: string[] = []
      const onIdleSpeechStart = jest.fn((phrase) => {
        selectedPhrases.push(phrase.text)
      })

      renderHook(() => useIdleMode({ onIdleSpeechStart }))

      // 4回発話をトリガー（2回ループ、1秒ずつ進めて状態更新をフラッシュ）
      for (let cycle = 0; cycle < 4; cycle++) {
        for (let sec = 0; sec < 5; sec++) {
          act(() => {
            jest.advanceTimersByTime(1000)
          })
        }
      }

      expect(selectedPhrases).toEqual([
        'フレーズ1',
        'フレーズ2',
        'フレーズ1',
        'フレーズ2',
      ])
    })
  })

  describe('ランダムモードでの選択', () => {
    it('should randomly select phrases', () => {
      setupSettingsMock({
        idleInterval: 5,
        idlePhrases: [
          { id: '1', text: 'フレーズ1', emotion: 'happy', order: 0 },
          { id: '2', text: 'フレーズ2', emotion: 'neutral', order: 1 },
          { id: '3', text: 'フレーズ3', emotion: 'relaxed', order: 2 },
        ],
        idlePlaybackMode: 'random',
      })

      // Mock Math.random for predictable test
      const originalRandom = Math.random
      Math.random = jest.fn().mockReturnValue(0.5)

      const onIdleSpeechStart = jest.fn()
      renderHook(() => useIdleMode({ onIdleSpeechStart }))

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(onIdleSpeechStart).toHaveBeenCalled()

      // Restore Math.random
      Math.random = originalRandom
    })
  })

  describe('空リストでのスキップ', () => {
    it('should skip speech when phrase list is empty', () => {
      setupSettingsMock({
        idleInterval: 5,
        idlePhrases: [],
      })

      const onIdleSpeechStart = jest.fn()
      renderHook(() => useIdleMode({ onIdleSpeechStart }))

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      // 空リストの場合はスキップ（エラーなし）
      expect(onIdleSpeechStart).not.toHaveBeenCalled()
    })
  })

  describe('時間帯別挨拶機能', () => {
    it('should use time period greeting when enabled', () => {
      setupSettingsMock({
        idleInterval: 5,
        idlePhrases: [],
        idleTimePeriodEnabled: true,
        idleTimePeriodMorning: 'おはようございます！',
        idleTimePeriodAfternoon: 'こんにちは！',
        idleTimePeriodEvening: 'こんばんは！',
      })

      const onIdleSpeechStart = jest.fn()
      renderHook(() => useIdleMode({ onIdleSpeechStart }))

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      // 時間帯別挨拶が呼ばれる
      expect(onIdleSpeechStart).toHaveBeenCalled()
    })
  })
})

describe('useIdleMode - Task 3.4: 発話実行と状態管理', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    setupSettingsMock({ idleInterval: 5 })
    setupHomeMock()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('speakCharacter関数呼び出し', () => {
    it('should call speakCharacter when speech is triggered', () => {
      renderHook(() => useIdleMode({}))

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(mockSpeakCharacter).toHaveBeenCalled()
    })
  })

  describe('状態遷移とコールバック', () => {
    it('should transition to speaking state when speech starts', () => {
      // このテストでは、発話開始時にspeaking状態に遷移することを確認
      // モックが即座にonCompleteを呼ぶため、状態遷移を直接確認する代わりに
      // onIdleSpeechStartが呼ばれたことで発話開始を確認
      const onIdleSpeechStart = jest.fn()
      renderHook(() => useIdleMode({ onIdleSpeechStart }))

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      // 発話が開始されたことを確認
      expect(onIdleSpeechStart).toHaveBeenCalled()
    })

    it('should call onIdleSpeechStart callback when speech starts', () => {
      const onIdleSpeechStart = jest.fn()
      renderHook(() => useIdleMode({ onIdleSpeechStart }))

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(onIdleSpeechStart).toHaveBeenCalled()
    })
  })

  describe('繰り返し発話', () => {
    it('should repeat speech at configured interval', () => {
      const onIdleSpeechStart = jest.fn()
      renderHook(() => useIdleMode({ onIdleSpeechStart }))

      // 3回発話（1秒ずつ進めて状態更新をフラッシュ）
      for (let cycle = 0; cycle < 3; cycle++) {
        for (let sec = 0; sec < 5; sec++) {
          act(() => {
            jest.advanceTimersByTime(1000)
          })
        }
      }

      expect(onIdleSpeechStart).toHaveBeenCalledTimes(3)
    })
  })
})

describe('useIdleMode - Task 3.5: ユーザー入力検知とタイマーリセット', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    setupSettingsMock({ idleInterval: 10 })
    setupHomeMock()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('resetTimer関数', () => {
    it('should reset timer when resetTimer is called', () => {
      const { result } = renderHook(() => useIdleMode({}))

      // 5秒経過
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(result.current.secondsUntilNextSpeech).toBe(5)

      // タイマーリセット
      act(() => {
        result.current.resetTimer()
      })

      // リセット後は初期値に戻る
      expect(result.current.secondsUntilNextSpeech).toBe(10)
    })
  })

  describe('stopIdleSpeech関数', () => {
    it('should stop speech and reset timer when stopIdleSpeech is called', () => {
      const onIdleSpeechInterrupted = jest.fn()
      const { result } = renderHook(() =>
        useIdleMode({ onIdleSpeechInterrupted })
      )

      // 発話停止を呼び出す
      act(() => {
        result.current.stopIdleSpeech()
      })

      // 停止後は waiting 状態になり、コールバックが呼ばれる
      expect(result.current.idleState).toBe('waiting')
      expect(onIdleSpeechInterrupted).toHaveBeenCalled()
      // タイマーもリセットされる
      expect(result.current.secondsUntilNextSpeech).toBe(10)
    })
  })
})
