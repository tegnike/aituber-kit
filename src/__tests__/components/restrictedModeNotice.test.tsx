/**
 * RestrictedModeNotice Component Tests
 *
 * 制限モード通知の表示/非表示テスト
 * Note: restrictedModeNotice.tsx が存在しないため、
 * useRestrictedMode フックと関連する制限モード表示ロジックのテスト
 */

import { renderHook } from '@testing-library/react'
import { useRestrictedMode } from '@/hooks/useRestrictedMode'

// Mock restrictedMode utility
jest.mock('@/utils/restrictedMode', () => ({
  isRestrictedMode: jest.fn(() => false),
}))

import { isRestrictedMode } from '@/utils/restrictedMode'
const mockIsRestrictedMode = isRestrictedMode as jest.MockedFunction<
  typeof isRestrictedMode
>

describe('RestrictedModeNotice', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('useRestrictedMode hook', () => {
    it('should return isRestrictedMode as true when restricted mode is active', () => {
      mockIsRestrictedMode.mockReturnValue(true)

      const { result } = renderHook(() => useRestrictedMode())
      expect(result.current.isRestrictedMode).toBe(true)
    })

    it('should return isRestrictedMode as false when restricted mode is inactive', () => {
      mockIsRestrictedMode.mockReturnValue(false)

      const { result } = renderHook(() => useRestrictedMode())
      expect(result.current.isRestrictedMode).toBe(false)
    })

    it('should memoize the result across re-renders', () => {
      mockIsRestrictedMode.mockReturnValue(true)

      const { result, rerender } = renderHook(() => useRestrictedMode())
      const firstResult = result.current

      rerender()
      expect(result.current).toBe(firstResult)
    })
  })

  describe('isRestrictedMode utility', () => {
    it('should be called by useRestrictedMode', () => {
      mockIsRestrictedMode.mockReturnValue(false)

      renderHook(() => useRestrictedMode())
      expect(mockIsRestrictedMode).toHaveBeenCalled()
    })
  })
})
