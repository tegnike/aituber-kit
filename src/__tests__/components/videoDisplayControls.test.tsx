import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { VideoDisplay } from '@/components/common/VideoDisplay'
import settingsStore from '@/features/stores/settings'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const renderVideoDisplay = (
  props: Partial<React.ComponentProps<typeof VideoDisplay>> = {}
) => {
  const videoRef = React.createRef<HTMLVideoElement>()
  return render(<VideoDisplay videoRef={videoRef} {...props} />)
}

describe('VideoDisplay controls', () => {
  beforeEach(() => {
    settingsStore.setState({
      hideVideoDisplay: false,
      useVideoAsBackground: false,
    })
  })

  it('uses eye icons for display visibility', () => {
    renderVideoDisplay()

    const hideButton = screen.getByLabelText('HideVideoPreview')
    expect(hideButton.querySelector('[data-icon="24/Hide"]')).not.toBeNull()

    fireEvent.click(hideButton)

    const showButton = screen.getByLabelText('ShowVideoDisplay')
    expect(showButton.querySelector('[data-icon="24/Show"]')).not.toBeNull()
  })

  it('uses stop button for the provided stop source handler', () => {
    const onStopSource = jest.fn()
    renderVideoDisplay({ onStopSource })

    fireEvent.click(screen.getByLabelText('StopScreenShare'))

    expect(onStopSource).toHaveBeenCalledTimes(1)
  })
})
