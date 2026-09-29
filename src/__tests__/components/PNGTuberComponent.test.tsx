import { act, render, screen } from '@testing-library/react'
import PNGTuberComponent from '@/components/PNGTuberComponent'
import settingsStore from '@/features/stores/settings'
import { PNGTuberEngine } from '@/features/pngTuber/pngTuberEngine'

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: { setState: jest.fn() },
}))
jest.mock('@/features/pngTuber/pngTuberEngine')
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn() } }))
jest.mock('@/components/modelLoadingOverlay', () => ({
  __esModule: true,
  default: () => <div>読み込み中</div>,
}))

function pendingLoad() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((success, failure) => {
    resolve = success
    reject = failure
  })
  return { promise, resolve, reject }
}

const mockEngine = {
  loadAsset: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  stopAudio: jest.fn(),
  destroy: jest.fn(),
  setSensitivity: jest.fn(),
  setChromaKeySettings: jest.fn(),
}
let selectedPath: string

beforeEach(() => {
  jest.clearAllMocks()
  selectedPath = '/pngtuber/a'
  ;(settingsStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({
      selectedPNGTuberPath: selectedPath,
      pngTuberSensitivity: 50,
      pngTuberChromaKeyEnabled: false,
      pngTuberChromaKeyColor: '#00FF00',
      pngTuberChromaKeyTolerance: 150,
      pngTuberScale: 1,
      pngTuberOffsetX: 0,
      pngTuberOffsetY: 0,
    })
  )
  jest
    .mocked(PNGTuberEngine)
    .mockImplementation(() => mockEngine as unknown as PNGTuberEngine)
})

describe('PNGTuberの表情切り替え', () => {
  it('別の表情の読み込み失敗後も、元の表情を読み直して再開する', async () => {
    mockEngine.loadAsset
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('一時的な通信失敗'))
      .mockResolvedValueOnce(undefined)
    const view = render(<PNGTuberComponent />)
    await act(async () => {})
    expect(mockEngine.start).toHaveBeenCalledTimes(1)
    expect(mockEngine.loadAsset).toHaveBeenCalledTimes(1)

    selectedPath = '/pngtuber/b'
    view.rerender(<PNGTuberComponent />)
    await act(async () => {})
    expect(
      screen.getByText('PNGTuberアセットの読み込みに失敗しました')
    ).toBeInTheDocument()

    selectedPath = '/pngtuber/a'
    view.rerender(<PNGTuberComponent />)
    await act(async () => {})
    expect(mockEngine.loadAsset.mock.calls.map(([path]) => path)).toEqual([
      '/pngtuber/a',
      '/pngtuber/b',
      '/pngtuber/a',
    ])
    expect(mockEngine.start).toHaveBeenCalledTimes(2)
    expect(
      screen.queryByText('PNGTuberアセットの読み込みに失敗しました')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('読み込み中')).not.toBeInTheDocument()
  })

  it('読み込み途中で元の表情へ戻しても、古い完了処理で再開しない', async () => {
    const second = pendingLoad()
    const returned = pendingLoad()
    mockEngine.loadAsset
      .mockResolvedValueOnce(undefined)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(returned.promise)
    const view = render(<PNGTuberComponent />)
    await act(async () => {})

    selectedPath = '/pngtuber/b'
    view.rerender(<PNGTuberComponent />)
    selectedPath = '/pngtuber/a'
    view.rerender(<PNGTuberComponent />)
    expect(mockEngine.loadAsset).toHaveBeenNthCalledWith(3, '/pngtuber/a')

    await act(async () => second.resolve())
    expect(mockEngine.start).toHaveBeenCalledTimes(1)
    expect(screen.getByText('読み込み中')).toBeInTheDocument()

    await act(async () => returned.resolve())
    expect(mockEngine.start).toHaveBeenCalledTimes(2)
    expect(screen.queryByText('読み込み中')).not.toBeInTheDocument()
  })
})
