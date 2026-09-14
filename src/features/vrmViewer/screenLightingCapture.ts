import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'

export const enableScreenLighting = () => {
  const { captureStatus } = homeStore.getState()
  const { hideVideoDisplay, useVideoAsBackground } = settingsStore.getState()

  settingsStore.setState({
    screenLightingEnabled: true,
    ...(captureStatus
      ? {}
      : {
          hideVideoDisplay: false,
          useVideoAsBackground: false,
        }),
  })
  menuStore.setState({
    showCapture: true,
    showWebcam: false,
    screenLightingCaptureOwned: !captureStatus,
    screenLightingPreviousDisplaySettings: captureStatus
      ? null
      : { hideVideoDisplay, useVideoAsBackground },
  })
  homeStore.setState({ webcamStatus: false })
}

export const disableScreenLighting = () => {
  const { screenLightingCaptureOwned, screenLightingPreviousDisplaySettings } =
    menuStore.getState()

  settingsStore.setState({
    screenLightingEnabled: false,
    ...(screenLightingCaptureOwned && screenLightingPreviousDisplaySettings
      ? screenLightingPreviousDisplaySettings
      : {}),
  })
  menuStore.setState({
    ...(screenLightingCaptureOwned ? { showCapture: false } : {}),
    screenLightingCaptureOwned: false,
    screenLightingPreviousDisplaySettings: null,
  })
  homeStore.getState().viewer.resetScreenLighting()
}
