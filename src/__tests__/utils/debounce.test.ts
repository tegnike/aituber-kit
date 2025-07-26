import { debounce } from '@/utils/debounce'

jest.useFakeTimers()

describe('debounce', () => {
  beforeEach(() => {
    jest.clearAllTimers()
  })

  it('should delay function execution', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn('test')
    expect(mockFn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledWith('test')
  })

  it('should cancel previous calls when called repeatedly', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn('first')
    debouncedFn('second')
    debouncedFn('third')

    jest.advanceTimersByTime(100)

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('third')
  })

  it('should preserve function arguments', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn('arg1', 'arg2', 'arg3')
    jest.advanceTimersByTime(100)

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
  })

  it('should allow multiple executions after delay period', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn('first')
    jest.advanceTimersByTime(100)

    debouncedFn('second')
    jest.advanceTimersByTime(100)

    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenNthCalledWith(1, 'first')
    expect(mockFn).toHaveBeenNthCalledWith(2, 'second')
  })

  it('should handle zero delay', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 0)

    debouncedFn('test')
    jest.advanceTimersByTime(0)

    expect(mockFn).toHaveBeenCalledWith('test')
  })
})
