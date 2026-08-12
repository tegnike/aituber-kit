export const createConcurrencyLimiter = (limit: number) => {
  let active = 0
  const waiters: (() => void)[] = []

  const release = () => {
    const next = waiters.shift()
    if (next) {
      next()
      return
    }
    active -= 1
  }

  return async () => {
    if (active >= limit) {
      await new Promise<void>((resolve) => waiters.push(resolve))
    } else {
      active += 1
    }
    let released = false
    return () => {
      if (released) return
      released = true
      release()
    }
  }
}
