import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { ScreenLightingSettings } from '@/components/settings/character/ScreenLightingSettings'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('ScreenLightingSettings', () => {
  beforeEach(() => {
    menuStore.setState({
      showCapture: false,
      showWebcam: true,
      screenLightingCaptureOwned: false,
      screenLightingPreviousDisplaySettings: null,
    })
    homeStore.setState({ webcamStatus: true, captureStatus: false })
    settingsStore.setState({
      screenLightingEnabled: false,
      screenLightingStrength: 1,
      hideVideoDisplay: true,
      useVideoAsBackground: true,
    })
  })

  it('starts a dedicated capture and remembers the display settings', () => {
    render(<ScreenLightingSettings enabled={false} strength={1} />)

    fireEvent.click(screen.getByTestId('screen-lighting-toggle'))

    expect(settingsStore.getState()).toMatchObject({
      screenLightingEnabled: true,
      hideVideoDisplay: false,
      useVideoAsBackground: false,
    })
    expect(menuStore.getState()).toMatchObject({
      showCapture: true,
      showWebcam: false,
      screenLightingCaptureOwned: true,
      screenLightingPreviousDisplaySettings: {
        hideVideoDisplay: true,
        useVideoAsBackground: true,
      },
    })
    expect(homeStore.getState().webcamStatus).toBe(false)
  })

  it('restores the display settings when its dedicated capture is disabled', () => {
    const { rerender } = render(
      <ScreenLightingSettings enabled={false} strength={1} />
    )
    fireEvent.click(screen.getByTestId('screen-lighting-toggle'))
    rerender(<ScreenLightingSettings enabled={true} strength={1} />)

    fireEvent.click(screen.getByTestId('screen-lighting-toggle'))

    expect(settingsStore.getState()).toMatchObject({
      screenLightingEnabled: false,
      hideVideoDisplay: true,
      useVideoAsBackground: true,
    })
    expect(menuStore.getState()).toMatchObject({
      showCapture: false,
      screenLightingCaptureOwned: false,
      screenLightingPreviousDisplaySettings: null,
    })
  })

  it('keeps an existing capture and its display settings when disabled', () => {
    homeStore.setState({ captureStatus: true })
    menuStore.setState({ showCapture: true })
    settingsStore.setState({ screenLightingEnabled: true })

    render(<ScreenLightingSettings enabled={true} strength={1} />)

    fireEvent.click(screen.getByTestId('screen-lighting-toggle'))

    expect(settingsStore.getState()).toMatchObject({
      screenLightingEnabled: false,
      hideVideoDisplay: true,
      useVideoAsBackground: true,
    })
    expect(menuStore.getState()).toMatchObject({
      showCapture: true,
      screenLightingCaptureOwned: false,
      screenLightingPreviousDisplaySettings: null,
    })
  })

  it('gives the strength slider an accessible name', () => {
    render(<ScreenLightingSettings enabled={true} strength={1} />)

    expect(
      screen.getByRole('slider', { name: 'ScreenLightingStrength' })
    ).toBeInTheDocument()
  })
})
