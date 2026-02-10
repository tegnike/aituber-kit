/**
 * PresenceDebugPreview Component Tests
 *
 * デバッグ用カメラプレビューコンポーネントのテスト
 * Requirements: 5.3
 */

// Mock ResizeObserver for jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

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
  let mockVideoElement: HTMLVideoElement
  let mockVideoRef: { current: HTMLVideoElement }

  beforeEach(() => {
    jest.clearAllMocks()
    mockVideoElement = document.createElement('video')
    // Mock videoWidth property
    Object.defineProperty(mockVideoElement, 'videoWidth', {
      value: 640,
      writable: true,
    })
    Object.defineProperty(mockVideoElement, 'clientWidth', {
      value: 640,
      writable: true,
    })
    mockVideoRef = { current: mockVideoElement }
  })

  describe('visibility', () => {
    it('should render video even when debug mode is disabled', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = { presenceDebugMode: false }
        return selector(state as any)
      })

      const { container } = render(
        <PresenceDebugPreview videoRef={mockVideoRef} detectionResult={null} />
      )
      // Video element is always rendered for camera preview
      expect(container.querySelector('video')).toBeInTheDocument()
      // But debug overlay should not be rendered
      expect(
        container.querySelector('[data-testid="bounding-box"]')
      ).not.toBeInTheDocument()
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
      // Mirrored x coordinate: videoWidth(640) - x(10) - width(100) = 530
      expect(boundingBox).toHaveStyle({
        left: '530px',
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
