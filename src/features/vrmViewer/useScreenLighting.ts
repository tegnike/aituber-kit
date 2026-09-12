import { RefObject, useEffect } from 'react'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { analyzeScreenLighting } from '@/features/vrmViewer/screenLighting'

const SAMPLE_WIDTH = 16
const SAMPLE_HEIGHT = 9
const SAMPLE_INTERVAL_MS = 125

export const useScreenLighting = (
  videoRef: RefObject<HTMLVideoElement>,
  enabled: boolean
) => {
  useEffect(() => {
    if (!enabled) {
      homeStore.getState().viewer.resetScreenLighting()
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE_WIDTH
    canvas.height = SAMPLE_HEIGHT
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return

    let animationFrameId = 0
    let lastSampleAt = 0

    const sampleFrame = (now: number) => {
      const video = videoRef.current
      if (
        now - lastSampleAt >= SAMPLE_INTERVAL_MS &&
        video &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        lastSampleAt = now
        try {
          context.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)
          const pixels = context.getImageData(
            0,
            0,
            SAMPLE_WIDTH,
            SAMPLE_HEIGHT
          ).data
          const sample = analyzeScreenLighting(
            pixels,
            SAMPLE_WIDTH,
            SAMPLE_HEIGHT
          )
          const { screenLightingStrength } = settingsStore.getState()
          homeStore
            .getState()
            .viewer.updateScreenLighting(sample, screenLightingStrength)
        } catch {
          // The video can be between frames while its source is changing.
        }
      }

      animationFrameId = requestAnimationFrame(sampleFrame)
    }

    animationFrameId = requestAnimationFrame(sampleFrame)

    return () => {
      cancelAnimationFrame(animationFrameId)
      homeStore.getState().viewer.resetScreenLighting()
    }
  }, [enabled, videoRef])
}
