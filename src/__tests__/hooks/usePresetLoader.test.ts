import { renderHook, waitFor } from '@testing-library/react'
import settingsStore from '@/features/stores/settings'

// Mock presetLoader module
const mockLoadPreset = jest.fn()
jest.mock('@/features/presets/presetLoader', () => ({
  loadPreset: (...args: unknown[]) => mockLoadPreset(...args),
}))

// Import after mock setup
import { usePresetLoader } from '@/features/presets/usePresetLoader'

describe('usePresetLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    settingsStore.setState({
      characterPreset1: '',
      characterPreset2: '',
      characterPreset3: '',
      characterPreset4: '',
      characterPreset5: '',
    })
  })

  it('should load presets from files when store values are empty', async () => {
    mockLoadPreset.mockImplementation((filename: string) => {
      const presets: Record<string, string> = {
        'preset1.txt': 'Preset content 1',
        'preset2.txt': 'Preset content 2',
        'preset3.txt': 'Preset content 3',
        'preset4.txt': 'Preset content 4',
        'preset5.txt': 'Preset content 5',
      }
      return Promise.resolve(presets[filename] || null)
    })

    renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(mockLoadPreset).toHaveBeenCalledTimes(5)
    })

    expect(mockLoadPreset).toHaveBeenCalledWith('preset1.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset2.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset3.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset4.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset5.txt')

    const state = settingsStore.getState()
    expect(state.characterPreset1).toBe('Preset content 1')
    expect(state.characterPreset2).toBe('Preset content 2')
    expect(state.characterPreset3).toBe('Preset content 3')
    expect(state.characterPreset4).toBe('Preset content 4')
    expect(state.characterPreset5).toBe('Preset content 5')
  })

  it('should not overwrite existing store values', async () => {
    settingsStore.setState({
      characterPreset1: 'Existing custom preset',
      characterPreset3: 'Another custom preset',
    })

    mockLoadPreset.mockResolvedValue('File content')

    renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(mockLoadPreset).toHaveBeenCalledTimes(3)
    })

    // Should skip preset1 and preset3 since they have existing values
    expect(mockLoadPreset).not.toHaveBeenCalledWith('preset1.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset2.txt')
    expect(mockLoadPreset).not.toHaveBeenCalledWith('preset3.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset4.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset5.txt')

    const state = settingsStore.getState()
    expect(state.characterPreset1).toBe('Existing custom preset')
    expect(state.characterPreset3).toBe('Another custom preset')
  })

  it('should handle null responses from loadPreset gracefully', async () => {
    mockLoadPreset.mockResolvedValue(null)

    renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(mockLoadPreset).toHaveBeenCalledTimes(5)
    })

    const state = settingsStore.getState()
    expect(state.characterPreset1).toBe('')
    expect(state.characterPreset2).toBe('')
    expect(state.characterPreset3).toBe('')
    expect(state.characterPreset4).toBe('')
    expect(state.characterPreset5).toBe('')
  })

  it('should handle partial file availability', async () => {
    mockLoadPreset.mockImplementation((filename: string) => {
      if (filename === 'preset1.txt') return Promise.resolve('Only preset 1')
      return Promise.resolve(null)
    })

    renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(mockLoadPreset).toHaveBeenCalledTimes(5)
    })

    const state = settingsStore.getState()
    expect(state.characterPreset1).toBe('Only preset 1')
    expect(state.characterPreset2).toBe('')
    expect(state.characterPreset3).toBe('')
    expect(state.characterPreset4).toBe('')
    expect(state.characterPreset5).toBe('')
  })

  it('should not set store state for empty string content', async () => {
    mockLoadPreset.mockResolvedValue('')

    renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(mockLoadPreset).toHaveBeenCalledTimes(5)
    })

    // Empty string is falsy, so setState should not be called
    const state = settingsStore.getState()
    expect(state.characterPreset1).toBe('')
  })

  it('should only run once on mount', async () => {
    mockLoadPreset.mockResolvedValue('Content')

    const { rerender } = renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(mockLoadPreset).toHaveBeenCalledTimes(5)
    })

    rerender()

    // Should still be 5 calls total, not 10
    expect(mockLoadPreset).toHaveBeenCalledTimes(5)
  })
})
