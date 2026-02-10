import { renderHook } from '@testing-library/react'
import { useLive2DEnabled } from '@/hooks/useLive2DEnabled'

describe('useLive2DEnabled', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should return isLive2DEnabled as true when NEXT_PUBLIC_LIVE2D_ENABLED is "true"', () => {
    process.env.NEXT_PUBLIC_LIVE2D_ENABLED = 'true'
    const { result } = renderHook(() => useLive2DEnabled())
    expect(result.current.isLive2DEnabled).toBe(true)
  })

  it('should return isLive2DEnabled as false when NEXT_PUBLIC_LIVE2D_ENABLED is "false"', () => {
    process.env.NEXT_PUBLIC_LIVE2D_ENABLED = 'false'
    const { result } = renderHook(() => useLive2DEnabled())
    expect(result.current.isLive2DEnabled).toBe(false)
  })

  it('should return isLive2DEnabled as false when NEXT_PUBLIC_LIVE2D_ENABLED is undefined', () => {
    delete process.env.NEXT_PUBLIC_LIVE2D_ENABLED
    const { result } = renderHook(() => useLive2DEnabled())
    expect(result.current.isLive2DEnabled).toBe(false)
  })

  it('should return isLive2DEnabled as false when NEXT_PUBLIC_LIVE2D_ENABLED is empty string', () => {
    process.env.NEXT_PUBLIC_LIVE2D_ENABLED = ''
    const { result } = renderHook(() => useLive2DEnabled())
    expect(result.current.isLive2DEnabled).toBe(false)
  })

  it('should memoize the result', () => {
    process.env.NEXT_PUBLIC_LIVE2D_ENABLED = 'true'
    const { result, rerender } = renderHook(() => useLive2DEnabled())
    const firstResult = result.current

    rerender()
    expect(result.current).toBe(firstResult)
  })
})
