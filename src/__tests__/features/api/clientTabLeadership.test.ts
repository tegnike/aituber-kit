import {
  canClaimClientTabLease,
  parseClientTabLease,
} from '@/features/api/clientTabLeadership'

describe('clientTabLeadership', () => {
  it('壊れたLeaseを無効として扱う', () => {
    expect(parseClientTabLease(null)).toBeNull()
    expect(parseClientTabLease('{invalid')).toBeNull()
    expect(parseClientTabLease('{"tabId":"tab-1"}')).toBeNull()
  })

  it('有効なLeaseを読み取る', () => {
    expect(parseClientTabLease('{"tabId":"tab-1","expiresAt":1000}')).toEqual({
      tabId: 'tab-1',
      expiresAt: 1000,
    })
  })

  it('所有中または期限切れの場合だけLeaseを取得できる', () => {
    expect(canClaimClientTabLease(null, 'tab-1', 100)).toBe(true)
    expect(
      canClaimClientTabLease({ tabId: 'tab-1', expiresAt: 200 }, 'tab-1', 100)
    ).toBe(true)
    expect(
      canClaimClientTabLease({ tabId: 'tab-2', expiresAt: 200 }, 'tab-1', 100)
    ).toBe(false)
    expect(
      canClaimClientTabLease({ tabId: 'tab-2', expiresAt: 100 }, 'tab-1', 100)
    ).toBe(true)
  })
})
