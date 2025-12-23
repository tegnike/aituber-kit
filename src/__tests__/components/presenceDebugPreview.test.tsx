/**
 * PresenceDebugPreview Component Tests
 *
 * デバッグ用カメラプレビューコンポーネントのテスト
 * Requirements: 5.3
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import PresenceDebugPreview from '@/components/presenceDebugPreview'
import settingsStore from '@/features/stores/settings'
import { DetectionResult } from '@/features/presence/presenceTypes'

// Mock stores
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockSettingsStore = settingsStore as jest.MockedFunction<
  typeof settingsStore
>

describe('PresenceDebugPreview', () => {
  const mockVideoRef = { current: document.createElement('video') }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('visibility', () => {
    it('should not render when debug mode is disabled', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = { presenceDebugMode: false }
        return selector(state as any)
      })

      const { container } = render(
        <PresenceDebugPreview videoRef={mockVideoRef} detectionResult={null} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('should render when debug mode is enabled', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = { presenceDebugMode: true }
        return selector(state as any)
      })

      const { container } = render(
        <PresenceDebugPreview videoRef={mockVideoRef} detectionResult={null} />
      )
      expect(container.firstChild).not.toBeNull()
    })
  })

  describe('video element', () => {
    beforeEach(() => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = { presenceDebugMode: true }
        return selector(state as any)
      })
    })

    it('should render video element', () => {
      const { container } = render(
        <PresenceDebugPreview videoRef={mockVideoRef} detectionResult={null} />
      )
      const video = container.querySelector('video')
      expect(video).toBeInTheDocument()
    })
  })

  describe('bounding box', () => {
    beforeEach(() => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = { presenceDebugMode: true }
        return selector(state as any)
      })
    })

    it('should not render bounding box when no face detected', () => {
      const detectionResult: DetectionResult = {
        faceDetected: false,
        confidence: 0,
      }

      const { container } = render(
        <PresenceDebugPreview
          videoRef={mockVideoRef}
          detectionResult={detectionResult}
        />
      )
      const boundingBox = container.querySelector(
        '[data-testid="bounding-box"]'
      )
      expect(boundingBox).not.toBeInTheDocument()
    })

    it('should render bounding box when face detected with boundingBox data', () => {
      const detectionResult: DetectionResult = {
        faceDetected: true,
        confidence: 0.9,
        boundingBox: { x: 10, y: 20, width: 100, height: 100 },
      }

      const { container } = render(
        <PresenceDebugPreview
          videoRef={mockVideoRef}
          detectionResult={detectionResult}
        />
      )
      const boundingBox = container.querySelector(
        '[data-testid="bounding-box"]'
      )
      expect(boundingBox).toBeInTheDocument()
    })

    it('should apply correct position and size to bounding box', () => {
      const detectionResult: DetectionResult = {
        faceDetected: true,
        confidence: 0.9,
        boundingBox: { x: 10, y: 20, width: 100, height: 150 },
      }

      const { container } = render(
        <PresenceDebugPreview
          videoRef={mockVideoRef}
          detectionResult={detectionResult}
        />
      )
      const boundingBox = container.querySelector(
        '[data-testid="bounding-box"]'
      )
      expect(boundingBox).toHaveStyle({
        left: '10px',
        top: '20px',
        width: '100px',
        height: '150px',
      })
    })
  })

  describe('className prop', () => {
    it('should apply custom className', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = { presenceDebugMode: true }
        return selector(state as any)
      })

      const { container } = render(
        <PresenceDebugPreview
          videoRef={mockVideoRef}
          detectionResult={null}
          className="custom-class"
        />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
