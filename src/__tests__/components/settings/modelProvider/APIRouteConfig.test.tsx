import { fireEvent, render, screen } from '@testing-library/react'
import { APIRouteConfig } from '@/components/settings/modelProvider/APIRouteConfig'
import settingsStore from '@/features/stores/settings'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: { setState: jest.fn() },
}))

describe('APIRouteConfig', () => {
  beforeEach(() => jest.clearAllMocks())

  const renderConfig = () =>
    render(
      <APIRouteConfig
        apirouteKey="route-key"
        selectAIModel="gpt-6.1-sol"
        enableMultiModal={false}
      />
    )

  it('updates the provider key independently and masks it in the input', () => {
    renderConfig()
    const keyInput = screen.getByDisplayValue('route-key')
    expect(keyInput).toHaveAttribute('type', 'password')
    fireEvent.change(keyInput, { target: { value: 'new-route-key' } })
    expect(settingsStore.setState).toHaveBeenCalledWith({
      apirouteKey: 'new-route-key',
    })
    expect(
      screen.getByRole('link', { name: 'API Route Dashboard' })
    ).toHaveAttribute('href', 'https://www.api-route.com/api-keys')
  })

  it('preserves user-entered model IDs without adding a provider prefix', () => {
    renderConfig()
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'my-model-id' },
    })
    expect(settingsStore.setState).toHaveBeenCalledWith({
      selectAIModel: 'my-model-id',
    })
  })

  it('allows the user to enable multimodal for an image-capable model', () => {
    renderConfig()
    fireEvent.click(screen.getByRole('switch'))
    expect(settingsStore.setState).toHaveBeenCalledWith({
      enableMultiModal: true,
    })
  })
})
