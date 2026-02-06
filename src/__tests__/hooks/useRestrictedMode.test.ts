import { renderHook } from '@testing-library/react'
import { useRestrictedMode } from '@/hooks/useRestrictedMode'

describe('useRestrictedMode', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should return isRestrictedMode as true when NEXT_PUBLIC_RESTRICTED_MODE is "true"', () => {
    process.env.NEXT_PUBLIC_RESTRICTED_MODE = 'true'
    const { result } = renderHook(() => useRestrictedMode())
    expect(result.current.isRestrictedMode).toBe(true)
  })

  it('should return isRestrictedMode as false when NEXT_PUBLIC_RESTRICTED_MODE is "false"', () => {
    process.env.NEXT_PUBLIC_RESTRICTED_MODE = 'false'
    const { result } = renderHook(() => useRestrictedMode())
    expect(result.current.isRestrictedMode).toBe(false)
  })

  it('should return isRestrictedMode as false when NEXT_PUBLIC_RESTRICTED_MODE is undefined', () => {
    delete process.env.NEXT_PUBLIC_RESTRICTED_MODE
    const { result } = renderHook(() => useRestrictedMode())
    expect(result.current.isRestrictedMode).toBe(false)
  })

  it('should return isRestrictedMode as false when NEXT_PUBLIC_RESTRICTED_MODE is empty string', () => {
    process.env.NEXT_PUBLIC_RESTRICTED_MODE = ''
    const { result } = renderHook(() => useRestrictedMode())
    expect(result.current.isRestrictedMode).toBe(false)
  })

  it('should memoize the result', () => {
    process.env.NEXT_PUBLIC_RESTRICTED_MODE = 'true'
    const { result, rerender } = renderHook(() => useRestrictedMode())
    const firstResult = result.current

    rerender()
    expect(result.current).toBe(firstResult)
  })
})
