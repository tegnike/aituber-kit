import { renderHook, act } from '@testing-library/react'
import settingsStore from '@/features/stores/settings'
import { useAIServiceHandlers } from '@/components/settings/modelProvider/hooks/useAIServiceHandlers'

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(),
    setState: jest.fn(),
  },
}))

jest.mock('@/features/constants/aiModels', () => ({
  isMultiModalModel: jest.fn((service: string, model: string) => {
    return service === 'openai' && model === 'gpt-4o'
  }),
  defaultModels: {
    openai: 'gpt-4o',
    openrouter: '',
  },
}))

describe('useAIServiceHandlers', () => {
  const mockedSettingsStore = settingsStore as unknown as {
    getState: jest.Mock
    setState: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockedSettingsStore.getState.mockReturnValue({
      customModel: false,
      enableMultiModal: true,
    })
  })

  it.each(['openrouter', 'apiroute'] as const)(
    'preserves the multimodal toggle for %s',
    (service) => {
      const { result } = renderHook(() => useAIServiceHandlers())

      act(() => {
        result.current.updateMultiModalModeForModel(service, 'custom-model')
      })

      expect(mockedSettingsStore.setState).not.toHaveBeenCalled()
    }
  )

  it('disables multimodal for unsupported predefined models', () => {
    const { result } = renderHook(() => useAIServiceHandlers())

    act(() => {
      result.current.updateMultiModalModeForModel('openai', 'gpt-3.5-turbo')
    })

    expect(mockedSettingsStore.setState).toHaveBeenCalledWith({
      enableMultiModal: false,
    })
    expect(mockedSettingsStore.setState).toHaveBeenCalledTimes(1)
  })
})
