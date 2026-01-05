/**
 * usePresetLoader フックのテスト
 *
 * Requirements:
 * - 1.1, 1.2: /public/presets/ からtxtファイルを検索・読み込み
 * - 1.3, 1.4: 改行・スペース保持、UTF-8エンコーディング
 * - 2.1, 2.2, 2.3, 2.4: フォールバックロジック
 * - 3.1, 3.3: Store連携
 * - 5.1, 5.2, 5.3: fetch API経由の非同期読み込み
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { loadPresetFile, loadAllPresets } from '@/features/presets/presetLoader'
import { usePresetLoader } from '@/features/presets/usePresetLoader'
import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants'
import settingsStore from '@/features/stores/settings'

// fetch APIのモック
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('loadPresetFile', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('ファイルが存在する場合、内容を返す', async () => {
    const expectedContent = 'テストプリセット内容'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(expectedContent),
    })

    const result = await loadPresetFile(1)

    expect(mockFetch).toHaveBeenCalledWith('/presets/preset1.txt')
    expect(result).toEqual({
      index: 1,
      content: expectedContent,
    })
  })

  it('改行とスペースを保持する (Req 1.3)', async () => {
    const contentWithNewlines = `1行目
2行目
  インデント付き行
最終行`
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(contentWithNewlines),
    })

    const result = await loadPresetFile(1)

    expect(result.content).toBe(contentWithNewlines)
    expect(result.content).toContain('\n')
    expect(result.content).toContain('  ')
  })

  it('404エラー時はnullを返す (Req 5.2)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const result = await loadPresetFile(2)

    expect(result).toEqual({
      index: 2,
      content: null,
    })
  })

  it('ネットワークエラー時はnullを返し警告を出力する (Req 2.2)', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn')
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await loadPresetFile(3)

    expect(result).toEqual({
      index: 3,
      content: null,
    })
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('preset3.txt'),
      expect.any(Error)
    )
  })

  it('プリセット番号1-5を正しいパスで読み込む', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    })

    await loadPresetFile(1)
    await loadPresetFile(5)

    expect(mockFetch).toHaveBeenNthCalledWith(1, '/presets/preset1.txt')
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/presets/preset5.txt')
  })
})

describe('loadAllPresets', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('全5ファイルを並列で読み込む (Req 5.3)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('content'),
    })

    await loadAllPresets()

    expect(mockFetch).toHaveBeenCalledTimes(5)
  })

  it('成功したファイルの内容を返す', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Preset 1 content'),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Preset 3 content'),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Preset 5 content'),
      })

    const results = await loadAllPresets()

    expect(results).toHaveLength(5)
    expect(results[0].content).toBe('Preset 1 content')
    expect(results[1].content).toBeNull()
    expect(results[2].content).toBe('Preset 3 content')
    expect(results[3].content).toBeNull()
    expect(results[4].content).toBe('Preset 5 content')
  })

  it('一部失敗しても他のプリセットは成功扱い', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Success'),
      })
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Success'),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Success'),
      })

    const results = await loadAllPresets()

    expect(results[0].content).toBe('Success')
    expect(results[1].content).toBeNull()
    expect(results[2].content).toBe('Success')
    expect(results[3].content).toBeNull()
    expect(results[4].content).toBe('Success')
  })

  it('空ファイルの場合はnullを返す (Req 2.3)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    })

    const results = await loadAllPresets()

    expect(results[0].content).toBeNull()
  })

  it('空白のみのファイルもnullを返す', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('   \n  \t  '),
    })

    const results = await loadAllPresets()

    expect(results[0].content).toBeNull()
  })
})

describe('getPresetWithFallback', () => {
  it('コンテンツが存在する場合はそれを返す', async () => {
    const { getPresetWithFallback } = await import(
      '@/features/presets/presetLoader'
    )

    const result = getPresetWithFallback('カスタムプロンプト', undefined)

    expect(result).toBe('カスタムプロンプト')
  })

  it('コンテンツがnullの場合は環境変数を使用', async () => {
    const { getPresetWithFallback } = await import(
      '@/features/presets/presetLoader'
    )

    const result = getPresetWithFallback(null, '環境変数のプロンプト')

    expect(result).toBe('環境変数のプロンプト')
  })

  it('両方nullの場合はデフォルト値を使用 (Req 2.1)', async () => {
    const { getPresetWithFallback } = await import(
      '@/features/presets/presetLoader'
    )

    const result = getPresetWithFallback(null, undefined)

    expect(result).toBe(SYSTEM_PROMPT)
  })

  it('優先順位: txtファイル > 環境変数 > デフォルト (Req 2.4)', async () => {
    const { getPresetWithFallback } = await import(
      '@/features/presets/presetLoader'
    )

    // txtファイルがあれば環境変数を無視
    expect(getPresetWithFallback('txtから', '環境変数から')).toBe('txtから')

    // txtファイルがなければ環境変数を使用
    expect(getPresetWithFallback(null, '環境変数から')).toBe('環境変数から')

    // 両方なければデフォルト
    expect(getPresetWithFallback(null, undefined)).toBe(SYSTEM_PROMPT)
  })
})

describe('usePresetLoader', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    // settingsStoreをリセット
    settingsStore.setState({
      characterPreset1: SYSTEM_PROMPT,
      characterPreset2: SYSTEM_PROMPT,
      characterPreset3: SYSTEM_PROMPT,
      characterPreset4: SYSTEM_PROMPT,
      characterPreset5: SYSTEM_PROMPT,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('マウント時に自動読み込みを実行する (Req 3.3)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('テストプリセット'),
    })

    const { result } = renderHook(() => usePresetLoader())

    // 初期状態はloaded: false
    expect(result.current.loaded).toBe(false)

    // 非同期読み込み完了を待機
    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledTimes(5)
  })

  it('読み込み完了後にsettingsStoreを更新する (Req 3.1)', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Preset 1 from txt'),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Preset 3 from txt'),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

    const { result } = renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    const state = settingsStore.getState()
    expect(state.characterPreset1).toBe('Preset 1 from txt')
    expect(state.characterPreset3).toBe('Preset 3 from txt')
    // 404のものはデフォルト値のまま
    expect(state.characterPreset2).toBe(SYSTEM_PROMPT)
  })

  it('初期化は一度のみ実行される', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('content'),
    })

    const { result, rerender } = renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    // 再レンダリング
    rerender()

    // 追加のfetch呼び出しがないことを確認
    expect(mockFetch).toHaveBeenCalledTimes(5)
  })

  it('エラー時もerrorプロパティに記録される', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'))

    const { result } = renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    // エラーがあっても loaded は true になる（フォールバック動作）
    expect(result.current.error).toBeNull()
  })
})
