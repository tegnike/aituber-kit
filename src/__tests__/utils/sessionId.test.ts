import { getSessionId, resetSessionId } from '@/utils/sessionId'

describe('getSessionId', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('UUID v4形式を返す', () => {
    const id = getSessionId()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
  })

  it('同一セッションで同じ値を返す', () => {
    const id1 = getSessionId()
    const id2 = getSessionId()
    expect(id1).toBe(id2)
  })

  it('localStorageクリア後に新しい値を返す', () => {
    const id1 = getSessionId()
    localStorage.clear()
    const id2 = getSessionId()
    expect(id1).not.toBe(id2)
  })
})

describe('resetSessionId', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('リセット後に新しいIDが生成される', () => {
    const id1 = getSessionId()
    resetSessionId()
    const id2 = getSessionId()
    expect(id1).not.toBe(id2)
  })
})
