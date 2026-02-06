/**
 * DemoModeNotice Component Tests
 *
 * デモモード通知の表示/非表示テスト
 * Note: demoModeNotice.tsx が存在しないため、
 * useDemoMode フックと関連するデモモード表示ロジックのテスト
 */

import { renderHook } from '@testing-library/react'
import { useDemoMode } from '@/hooks/useDemoMode'

// Mock demoMode utility
jest.mock('@/utils/demoMode', () => ({
  isDemoMode: jest.fn(() => false),
}))

import { isDemoMode } from '@/utils/demoMode'
const mockIsDemoMode = isDemoMode as jest.MockedFunction<typeof isDemoMode>

describe('DemoModeNotice', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('useDemoMode hook', () => {
    it('should return isDemoMode as true when demo mode is active', () => {
      mockIsDemoMode.mockReturnValue(true)

      const { result } = renderHook(() => useDemoMode())
      expect(result.current.isDemoMode).toBe(true)
    })

    it('should return isDemoMode as false when demo mode is inactive', () => {
      mockIsDemoMode.mockReturnValue(false)

      const { result } = renderHook(() => useDemoMode())
      expect(result.current.isDemoMode).toBe(false)
    })

    it('should memoize the result across re-renders', () => {
      mockIsDemoMode.mockReturnValue(true)

      const { result, rerender } = renderHook(() => useDemoMode())
      const firstResult = result.current

      rerender()
      expect(result.current).toBe(firstResult)
    })
  })

  describe('isDemoMode utility', () => {
    it('should be called by useDemoMode', () => {
      mockIsDemoMode.mockReturnValue(false)

      renderHook(() => useDemoMode())
      expect(mockIsDemoMode).toHaveBeenCalled()
    })
  })
})
