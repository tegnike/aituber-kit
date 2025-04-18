import settingsStore from '../../../features/stores/settings'
import { preprocessMessage } from '../../../features/messages/speakCharacter'

jest.mock('../../../features/stores/settings', () => ({
  getState: jest.fn(),
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
      expect(preprocessMessage('  テスト  ', settingsStore.getState())).toBe('テスト')
    })

    it('絵文字を削除する', () => {
      expect(preprocessMessage('テスト😊', settingsStore.getState())).toBe('テスト')
      expect(preprocessMessage('😊テスト😊', settingsStore.getState())).toBe('テスト')
      expect(preprocessMessage('テ😊ス😊ト', settingsStore.getState())).toBe('テスト')
    })

    it('記号のみの場合はnullを返す', () => {
      expect(preprocessMessage('!!!', settingsStore.getState())).toBeNull()
      expect(preprocessMessage('...', settingsStore.getState())).toBeNull()
      expect(preprocessMessage('???', settingsStore.getState())).toBeNull()
      expect(preprocessMessage('!?.,', settingsStore.getState())).toBeNull()
      expect(preprocessMessage('(){}[]', settingsStore.getState())).toBeNull()
    })

    it('記号と文字が混在する場合は処理して返す', () => {
      expect(preprocessMessage('テスト!', settingsStore.getState())).toBe('テスト!')
      expect(preprocessMessage('!テスト', settingsStore.getState())).toBe('!テスト')
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
})
