import { renderHook } from '@testing-library/react'
import { useDemoMode } from '@/hooks/useDemoMode'

describe('useDemoMode', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should return isDemoMode as true when NEXT_PUBLIC_DEMO_MODE is "true"', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
    const { result } = renderHook(() => useDemoMode())
    expect(result.current.isDemoMode).toBe(true)
  })

  it('should return isDemoMode as false when NEXT_PUBLIC_DEMO_MODE is "false"', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'false'
    const { result } = renderHook(() => useDemoMode())
    expect(result.current.isDemoMode).toBe(false)
  })

  it('should return isDemoMode as false when NEXT_PUBLIC_DEMO_MODE is undefined', () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE
    const { result } = renderHook(() => useDemoMode())
    expect(result.current.isDemoMode).toBe(false)
  })

  it('should return isDemoMode as false when NEXT_PUBLIC_DEMO_MODE is empty string', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = ''
    const { result } = renderHook(() => useDemoMode())
    expect(result.current.isDemoMode).toBe(false)
  })

  it('should memoize the result', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
    const { result, rerender } = renderHook(() => useDemoMode())
    const firstResult = result.current

    rerender()
    expect(result.current).toBe(firstResult)
  })
})
