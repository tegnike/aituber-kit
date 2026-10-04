import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'

// 画面融合中の背景表示は VideoDisplay の integrateIntoScene で上書きするため、
// 永続化される useVideoAsBackground / hideVideoDisplay はここでは変更しない。
export const enableScreenLighting = () => {
  const { captureStatus } = homeStore.getState()

  settingsStore.setState({ screenLightingEnabled: true })
  menuStore.setState({
    showCapture: true,
    showWebcam: false,
    screenLightingCaptureOwned: !captureStatus,
  })
  homeStore.setState({ webcamStatus: false })
}

export const disableScreenLighting = () => {
  const { screenLightingCaptureOwned } = menuStore.getState()
  // ゲーム実況がキャプチャを使っている間は、画面融合用に開始したキャプチャでも閉じない
  const closeCapture =
    screenLightingCaptureOwned &&
    !settingsStore.getState().gameCommentaryPlaying

  settingsStore.setState({ screenLightingEnabled: false })
  menuStore.setState({
    ...(closeCapture ? { showCapture: false } : {}),
    screenLightingCaptureOwned: false,
  })
  homeStore.getState().viewer.resetScreenLighting()
}
