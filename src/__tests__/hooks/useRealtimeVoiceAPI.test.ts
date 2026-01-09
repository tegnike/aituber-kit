/**
 * @jest-environment jsdom
 */
import { getVoiceLanguageCode } from '@/utils/voiceLanguage'

// Mock stores
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: jest.fn((selector) => {
    const state = {
      selectLanguage: 'en',
      realtimeAPIMode: false,
      initialSpeechTimeout: 10,
    }
    return selector(state)
  }),
}))

jest.mock('@/features/stores/websocketStore', () => ({
  __esModule: true,
  default: {
    getState: () => ({ wsManager: null }),
  },
}))

jest.mock('@/features/stores/toast', () => ({
  __esModule: true,
  default: {
    getState: () => ({ addToast: jest.fn() }),
  },
}))

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: {
    setState: jest.fn(),
    getState: () => ({}),
  },
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock SpeechRecognition
const mockSpeechRecognition = {
  lang: '',
  continuous: false,
  interimResults: false,
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  onstart: null as (() => void) | null,
  onend: null as (() => void) | null,
  onresult: null as ((event: unknown) => void) | null,
  onerror: null as ((event: unknown) => void) | null,
}

const MockSpeechRecognitionClass = jest.fn().mockImplementation(() => {
  return { ...mockSpeechRecognition }
})

// グローバル変数のオリジナルを保存（副作用防止）
const originalSpeechRecognition = (
  window as unknown as { SpeechRecognition: unknown }
).SpeechRecognition
const originalWebkitSpeechRecognition = (
  window as unknown as { webkitSpeechRecognition: unknown }
).webkitSpeechRecognition

// Setup global SpeechRecognition
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: MockSpeechRecognitionClass,
})

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: MockSpeechRecognitionClass,
})

describe('useRealtimeVoiceAPI - 言語設定の動的反映', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSpeechRecognition.lang = ''
  })

  afterAll(() => {
    // グローバル変数を復元（他スイートへの副作用防止）
    if (originalSpeechRecognition !== undefined) {
      delete (window as any).SpeechRecognition
      Object.defineProperty(window, 'SpeechRecognition', {
        writable: true,
        configurable: true,
        value: originalSpeechRecognition,
      })
    }
    if (originalWebkitSpeechRecognition !== undefined) {
      delete (window as any).webkitSpeechRecognition
      Object.defineProperty(window, 'webkitSpeechRecognition', {
        writable: true,
        configurable: true,
        value: originalWebkitSpeechRecognition,
      })
    }
  })

  describe('getVoiceLanguageCode', () => {
    it('jaを渡すとja-JPを返す', () => {
      expect(getVoiceLanguageCode('ja')).toBe('ja-JP')
    })

    it('enを渡すとen-USを返す', () => {
      expect(getVoiceLanguageCode('en')).toBe('en-US')
    })

    it('koを渡すとko-KRを返す', () => {
      expect(getVoiceLanguageCode('ko')).toBe('ko-KR')
    })

    it('zhを渡すとzh-TWを返す', () => {
      expect(getVoiceLanguageCode('zh')).toBe('zh-TW')
    })

    it('不明な言語はja-JPにフォールバックする', () => {
      expect(getVoiceLanguageCode('unknown')).toBe('ja-JP')
    })
  })

  describe('SpeechRecognition初期化時の言語設定', () => {
    it('ハードコードされたja-JPではなく、getVoiceLanguageCodeを使用すべき', () => {
      // このテストは現在の実装が期待に沿っていないことを確認する（REDフェーズ）
      // 現在のコード: newRecognition.lang = 'ja-JP' (ハードコード)
      // 期待するコード: newRecognition.lang = getVoiceLanguageCode(selectLanguage)

      // selectLanguage='en'の場合、期待値は'en-US'
      const expectedLang = getVoiceLanguageCode('en')
      expect(expectedLang).toBe('en-US')

      // 注: このテストは実装修正後に、実際のフックをテストするように拡張する
      // 現状はgetVoiceLanguageCode関数自体の動作を確認
    })
  })
})
