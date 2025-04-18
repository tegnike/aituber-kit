// THREE.js とその依存関係のモック
jest.mock('three', () => ({
  Object3D: class {},
  AnimationMixer: class {},
  AudioContext: class {},
}))

jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    register() {}
    loadAsync() {
      return Promise.resolve({ userData: { vrm: {} } })
    }
  },
}))

jest.mock('@pixiv/three-vrm', () => ({
  VRM: class {},
  VRMUtils: { rotateVRM0: jest.fn(), deepDispose: jest.fn() },
  VRMExpressionPresetName: {},
  VRMLoaderPlugin: class {},
}))

import settingsStore from '../../../features/stores/settings'
import toastStore from '../../../features/stores/toast'
import i18next from 'i18next'

// preprocessMessage と handleTTSError だけを直接インポート
import {
  preprocessMessage,
  handleTTSError,
} from '../../../features/messages/speakCharacter'

jest.mock('../../../features/stores/settings', () => ({
  getState: jest.fn(),
}))

jest.mock('../../../features/stores/toast', () => ({
  getState: jest.fn(),
}))

jest.mock('i18next', () => ({
  t: jest.fn((key, options) => {
    if (key === 'Errors.TTSServiceError') {
      return `TTS Service Error: ${options.serviceName} - ${options.message}`
    }
    if (key === 'Errors.UnexpectedError') {
      return 'Unexpected Error'
    }
    return key
  }),
}))

// homeStore のモック
jest.mock('../../../features/stores/home', () => ({
  getState: jest.fn(),
  setState: jest.fn(),
}))

describe('speakCharacter', () => {
  describe('preprocessMessage', () => {
    beforeEach(() => {
      jest.clearAllMocks()

      const mockSettings = {
        changeEnglishToJapanese: false,
        selectLanguage: 'en',
      }

      ;(settingsStore.getState as jest.Mock).mockReturnValue(mockSettings)
    })

    it('空の文字列の場合はnullを返す', () => {
      expect(preprocessMessage('', settingsStore.getState())).toBeNull()
    })

    it('空白のみの文字列の場合はnullを返す', () => {
      expect(preprocessMessage('   ', settingsStore.getState())).toBeNull()
    })

    it('前後の空白を削除する', () => {
      expect(preprocessMessage('  テスト  ', settingsStore.getState())).toBe(
        'テスト'
      )
    })

    it('絵文字を削除する', () => {
      expect(preprocessMessage('テスト😊', settingsStore.getState())).toBe(
        'テスト'
      )
      expect(preprocessMessage('😊テスト😊', settingsStore.getState())).toBe(
        'テスト'
      )
      expect(preprocessMessage('テ😊ス😊ト', settingsStore.getState())).toBe(
        'テスト'
      )
    })

    it('記号のみの場合はnullを返す', () => {
      expect(preprocessMessage('!!!', settingsStore.getState())).toBeNull()
      expect(preprocessMessage('...', settingsStore.getState())).toBeNull()
      expect(preprocessMessage('???', settingsStore.getState())).toBeNull()
      expect(preprocessMessage('!?.,', settingsStore.getState())).toBeNull()
      expect(preprocessMessage('(){}[]', settingsStore.getState())).toBeNull()
    })

    it('記号と文字が混在する場合は処理して返す', () => {
      expect(preprocessMessage('テスト!', settingsStore.getState())).toBe(
        'テスト!'
      )
      expect(preprocessMessage('!テスト', settingsStore.getState())).toBe(
        '!テスト'
      )
    })

    it('英語から日本語への変換が無効の場合は元のテキストを返す', () => {
      const text = 'Hello world'
      expect(preprocessMessage(text, settingsStore.getState())).toBe(text)
    })

    it('英語から日本語への変換が有効で言語が日本語の場合は元のテキストを返す（後で非同期処理される）', () => {
      const mockSettings = {
        changeEnglishToJapanese: true,
        selectLanguage: 'ja',
      }
      ;(settingsStore.getState as jest.Mock).mockReturnValue(mockSettings)

      const text = 'Hello world'
      expect(preprocessMessage(text, settingsStore.getState())).toBe(text)
    })

    it('英語から日本語への変換が有効でも言語が日本語でない場合は元のテキストを返す', () => {
      const mockSettings = {
        changeEnglishToJapanese: true,
        selectLanguage: 'en',
      }
      ;(settingsStore.getState as jest.Mock).mockReturnValue(mockSettings)

      const text = 'Hello world'
      expect(preprocessMessage(text, settingsStore.getState())).toBe(text)
    })

    it('英語が含まれていない場合は変換設定に関わらず元のテキストを返す', () => {
      const mockSettings = {
        changeEnglishToJapanese: true,
        selectLanguage: 'ja',
      }
      ;(settingsStore.getState as jest.Mock).mockReturnValue(mockSettings)

      const text = 'こんにちは'
      expect(preprocessMessage(text, settingsStore.getState())).toBe(text)
    })
  })

  describe('handleTTSError', () => {
    const mockAddToast = jest.fn()

    beforeEach(() => {
      jest.clearAllMocks()
      ;(toastStore.getState as jest.Mock).mockReturnValue({
        addToast: mockAddToast,
      })
    })

    it('Errorオブジェクトのエラーを適切に処理する', () => {
      const error = new Error('Test error message')
      const serviceName = 'voicevox'

      handleTTSError(error, serviceName)

      expect(i18next.t).toHaveBeenCalledWith('Errors.TTSServiceError', {
        serviceName,
        message: 'Test error message',
      })

      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'TTS Service Error: voicevox - Test error message',
        type: 'error',
        duration: 5000,
        tag: 'tts-error',
      })
    })

    it('文字列のエラーを適切に処理する', () => {
      const error = 'String error message'
      const serviceName = 'elevenlabs'

      handleTTSError(error, serviceName)

      expect(i18next.t).toHaveBeenCalledWith('Errors.TTSServiceError', {
        serviceName,
        message: 'String error message',
      })

      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'TTS Service Error: elevenlabs - String error message',
        type: 'error',
        duration: 5000,
        tag: 'tts-error',
      })
    })

    it('不明なエラー型を適切に処理する', () => {
      const error = { unknown: 'error' }
      const serviceName = 'openai'

      handleTTSError(error, serviceName)

      expect(i18next.t).toHaveBeenCalledWith('Errors.UnexpectedError')
      expect(i18next.t).toHaveBeenCalledWith('Errors.TTSServiceError', {
        serviceName,
        message: 'Unexpected Error',
      })

      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'TTS Service Error: openai - Unexpected Error',
        type: 'error',
        duration: 5000,
        tag: 'tts-error',
      })
    })
  })
})
