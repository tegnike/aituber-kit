import { createConcurrencyLimiter } from '@/features/messages/concurrencyLimiter'

describe('createConcurrencyLimiter', () => {
  it('keeps later work waiting until a slot is released', async () => {
    const acquire = createConcurrencyLimiter(2)
    const releaseFirst = await acquire()
    const releaseSecond = await acquire()
    let thirdAcquired = false
    const third = acquire().then((release) => {
      thirdAcquired = true
      return release
    })

    await Promise.resolve()
    expect(thirdAcquired).toBe(false)
    releaseFirst()
    const releaseThird = await third
    expect(thirdAcquired).toBe(true)

    releaseSecond()
    releaseThird()
  })
})
