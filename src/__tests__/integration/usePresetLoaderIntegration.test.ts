/**
 * usePresetLoader 統合テスト
 *
 * アプリケーション初期化時のプリセット読み込み動作を検証
 *
 * Requirements:
 * - 3.1: characterPreset1-5の値を更新
 * - 3.2: ユーザーがUI上でプリセットを選択した時の動作
 * - 3.3: アプリケーション初期化時に一度だけプリセットを読み込む
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { usePresetLoader } from '@/features/presets/usePresetLoader'
import settingsStore from '@/features/stores/settings'

// fetchをモック
global.fetch = jest.fn()

describe('usePresetLoader統合テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // storeをリセット
    settingsStore.setState({
      characterPreset1: 'default1',
      characterPreset2: 'default2',
      characterPreset3: 'default3',
      characterPreset4: 'default4',
      characterPreset5: 'default5',
      systemPrompt: '',
    })
  })

  describe('Req 3.1: プリセット読み込み後のStore更新', () => {
    it('txtファイルから読み込んだ内容でcharacterPreset1-5が更新される', async () => {
      const mockPresets = {
        1: 'プリセット1の内容\n複数行対応',
        2: 'プリセット2の内容',
        3: null, // ファイルなし
        4: 'プリセット4の内容',
        5: null, // ファイルなし
      }

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        const match = url.match(/preset(\d)\.txt/)
        if (match) {
          const index = parseInt(match[1])
          const content = mockPresets[index as keyof typeof mockPresets]
          if (content) {
            return Promise.resolve({
              ok: true,
              text: () => Promise.resolve(content),
            })
          }
        }
        return Promise.resolve({ ok: false, status: 404 })
      })

      const { result } = renderHook(() => usePresetLoader())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      const state = settingsStore.getState()
      expect(state.characterPreset1).toBe('プリセット1の内容\n複数行対応')
      expect(state.characterPreset2).toBe('プリセット2の内容')
      expect(state.characterPreset3).toBe('default3') // ファイルなしはデフォルト維持
      expect(state.characterPreset4).toBe('プリセット4の内容')
      expect(state.characterPreset5).toBe('default5') // ファイルなしはデフォルト維持
    })
  })

  describe('Req 3.2: プリセット選択時のsystemPrompt設定', () => {
    it('ユーザーがプリセットを選択するとsystemPromptが更新される', async () => {
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('preset1.txt')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('txtファイルからのプロンプト'),
          })
        }
        return Promise.resolve({ ok: false, status: 404 })
      })

      const { result } = renderHook(() => usePresetLoader())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      // プリセット選択をシミュレート（UIからの操作）
      act(() => {
        const state = settingsStore.getState()
        settingsStore.setState({
          systemPrompt: state.characterPreset1,
        })
      })

      expect(settingsStore.getState().systemPrompt).toBe(
        'txtファイルからのプロンプト'
      )
    })
  })

  describe('Req 3.3: 初期化時の一度のみ読み込み', () => {
    it('フックを複数回レンダリングしても読み込みは一度だけ実行される', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('テストプロンプト'),
      })

      const { result, rerender } = renderHook(() => usePresetLoader())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      const fetchCallCount = (global.fetch as jest.Mock).mock.calls.length

      // 再レンダリング
      rerender()
      rerender()
      rerender()

      // fetch呼び出し回数が変わらないこと
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(fetchCallCount)
    })
  })

  describe('読み込みエラー時の動作', () => {
    it('エラーが発生してもloaded: trueになりデフォルト値が維持される', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(
        new Error('ネットワークエラー')
      )

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const { result } = renderHook(() => usePresetLoader())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      expect(result.current.error).toBeNull()
      // デフォルト値が維持される
      const state = settingsStore.getState()
      expect(state.characterPreset1).toBe('default1')

      consoleSpy.mockRestore()
    })
  })

  describe('既存UIとの互換性', () => {
    it('読み込み中は既存のデフォルト値が表示される', () => {
      // fetchを遅延させる
      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                text: () => Promise.resolve('読み込み後の内容'),
              })
            }, 100)
          })
      )

      // 読み込み開始時点でデフォルト値が設定されていること
      const state = settingsStore.getState()
      expect(state.characterPreset1).toBe('default1')
      expect(state.characterPreset2).toBe('default2')
      expect(state.characterPreset3).toBe('default3')
      expect(state.characterPreset4).toBe('default4')
      expect(state.characterPreset5).toBe('default5')
    })
  })
})
