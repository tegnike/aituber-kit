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
    })
    homeStore.setState({ webcamStatus: true, captureStatus: false })
    settingsStore.setState({
      screenLightingEnabled: false,
      screenLightingStrength: 1,
      hideVideoDisplay: true,
      useVideoAsBackground: true,
    })
  })

  it('starts a dedicated capture when enabled without an active share', () => {
    render(<ScreenLightingSettings enabled={false} strength={1} />)

    fireEvent.click(screen.getByTestId('screen-lighting-toggle'))

    expect(settingsStore.getState().screenLightingEnabled).toBe(true)
    expect(menuStore.getState()).toMatchObject({
      showCapture: true,
      showWebcam: false,
      screenLightingCaptureOwned: true,
    })
    expect(homeStore.getState().webcamStatus).toBe(false)
  })

  it('keeps an existing capture open when lighting is disabled', () => {
    menuStore.setState({
      showCapture: true,
      screenLightingCaptureOwned: false,
    })
    settingsStore.setState({ screenLightingEnabled: true })

    render(<ScreenLightingSettings enabled={true} strength={1} />)

    fireEvent.click(screen.getByTestId('screen-lighting-toggle'))

    expect(settingsStore.getState().screenLightingEnabled).toBe(false)
    expect(menuStore.getState().showCapture).toBe(true)
    expect(menuStore.getState().screenLightingCaptureOwned).toBe(false)
  })
})
