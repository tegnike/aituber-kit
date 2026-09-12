import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Capture from '@/components/capture'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'

jest.mock('@/components/common/VideoDisplay', () => ({
  VideoDisplay: ({
    onStopSource,
    integrateIntoScene,
  }: {
    onStopSource?: () => void
    integrateIntoScene?: boolean
  }) => (
    <>
      <button type="button" onClick={onStopSource}>
        stop source
      </button>
      <span data-testid="scene-integration">
        {integrateIntoScene ? 'yes' : 'no'}
      </span>
    </>
  ),
}))

const createMediaStreamMock = () => {
  const track = {
    stop: jest.fn(),
    addEventListener: jest.fn(),
  }

  return {
    track,
    stream: {
      getTracks: () => [track],
      getVideoTracks: () => [track],
    },
  }
}

describe('Capture lifecycle', () => {
  let mediaTrack: ReturnType<typeof createMediaStreamMock>['track']

  beforeEach(() => {
    jest.clearAllMocks()
    homeStore.setState({ captureStatus: false })
    menuStore.setState({
      showCapture: true,
      screenLightingCaptureOwned: false,
      screenLightingPreviousDisplaySettings: null,
    })
    settingsStore.setState({
      hideVideoDisplay: true,
      useVideoAsBackground: true,
      modelType: 'vrm',
    })

    const { stream, track } = createMediaStreamMock()
    mediaTrack = track
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getDisplayMedia: jest.fn().mockResolvedValue(stream),
      },
    })
  })

  it('does not hide the capture panel during component cleanup', async () => {
    const { unmount } = render(<Capture />)

    await waitFor(() => {
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled()
    })
    expect(homeStore.getState().captureStatus).toBe(true)

    unmount()

    expect(mediaTrack.stop).toHaveBeenCalledTimes(1)
    expect(homeStore.getState().captureStatus).toBe(false)
    expect(menuStore.getState().showCapture).toBe(true)
    expect(settingsStore.getState().hideVideoDisplay).toBe(true)
    expect(settingsStore.getState().useVideoAsBackground).toBe(true)
  })

  it('hides the capture panel only when screen sharing is explicitly stopped', async () => {
    render(<Capture />)

    await waitFor(() => {
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled()
    })
    expect(homeStore.getState().captureStatus).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'stop source' }))

    expect(mediaTrack.stop).toHaveBeenCalledTimes(1)
    expect(homeStore.getState().captureStatus).toBe(false)
    expect(menuStore.getState().showCapture).toBe(false)
    expect(settingsStore.getState().hideVideoDisplay).toBe(false)
    expect(settingsStore.getState().useVideoAsBackground).toBe(false)
  })

  it('integrates lighting-owned capture into the scene', async () => {
    menuStore.setState({
      screenLightingCaptureOwned: true,
      screenLightingPreviousDisplaySettings: {
        hideVideoDisplay: true,
        useVideoAsBackground: true,
      },
    })
    settingsStore.setState({ screenLightingEnabled: true })

    render(<Capture />)

    await waitFor(() => {
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled()
    })
    expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        selfBrowserSurface: 'exclude',
        monitorTypeSurfaces: 'exclude',
      })
    )
    expect(screen.getByTestId('scene-integration')).toHaveTextContent('yes')
  })

  it('does not integrate lighting capture for a non-VRM model', async () => {
    menuStore.setState({
      screenLightingCaptureOwned: true,
      screenLightingPreviousDisplaySettings: {
        hideVideoDisplay: true,
        useVideoAsBackground: true,
      },
    })
    settingsStore.setState({
      screenLightingEnabled: true,
      modelType: 'live2d',
    })

    render(<Capture />)

    await waitFor(() => {
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled()
    })
    expect(screen.getByTestId('scene-integration')).toHaveTextContent('no')
  })

  it('restores display settings when a lighting-owned capture is stopped', async () => {
    menuStore.setState({
      screenLightingCaptureOwned: true,
      screenLightingPreviousDisplaySettings: {
        hideVideoDisplay: true,
        useVideoAsBackground: true,
      },
    })
    settingsStore.setState({
      screenLightingEnabled: true,
      hideVideoDisplay: false,
      useVideoAsBackground: false,
    })
    render(<Capture />)

    await waitFor(() => {
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled()
    })
    fireEvent.click(screen.getByRole('button', { name: 'stop source' }))

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

  it('restores display settings when lighting capture permission is denied', async () => {
    menuStore.setState({
      screenLightingCaptureOwned: true,
      screenLightingPreviousDisplaySettings: {
        hideVideoDisplay: true,
        useVideoAsBackground: true,
      },
    })
    settingsStore.setState({
      screenLightingEnabled: true,
      hideVideoDisplay: false,
      useVideoAsBackground: false,
    })
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getDisplayMedia: jest.fn().mockRejectedValue(new Error('denied')),
      },
    })

    render(<Capture />)

    await waitFor(() => {
      expect(settingsStore.getState()).toMatchObject({
        screenLightingEnabled: false,
        hideVideoDisplay: true,
        useVideoAsBackground: true,
      })
    })
    expect(menuStore.getState()).toMatchObject({
      showCapture: false,
      screenLightingCaptureOwned: false,
      screenLightingPreviousDisplaySettings: null,
    })
  })
})
