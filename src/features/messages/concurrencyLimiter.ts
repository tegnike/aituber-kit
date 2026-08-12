export const createConcurrencyLimiter = (limit: number) => {
  let active = 0
  const waiters: (() => void)[] = []

  const release = () => {
    active -= 1
    waiters.shift()?.()
  }

  return async () => {
    if (active >= limit) {
      await new Promise<void>((resolve) => waiters.push(resolve))
    }
    active += 1
    let released = false
    return () => {
      if (released) return
      released = true
      release()
    }
  }
}
