export interface ClientTabLease {
  tabId: string
  expiresAt: number
}

export const createClientTabId = (
  cryptoApi: Pick<Crypto, 'randomUUID'> | null = typeof globalThis.crypto !==
  'undefined'
    ? globalThis.crypto
    : null,
  now = Date.now(),
  randomValue = Math.random()
) =>
  typeof cryptoApi?.randomUUID === 'function'
    ? cryptoApi.randomUUID()
    : `tab-${now}-${randomValue.toString(36).slice(2)}`

export const parseClientTabLease = (
  value: string | null
): ClientTabLease | null => {
  if (!value) return null
  try {
    const lease = JSON.parse(value) as Partial<ClientTabLease>
    if (
      typeof lease.tabId !== 'string' ||
      !lease.tabId ||
      typeof lease.expiresAt !== 'number' ||
      !Number.isFinite(lease.expiresAt)
    ) {
      return null
    }
    return { tabId: lease.tabId, expiresAt: lease.expiresAt }
  } catch {
    return null
  }
}

export const canClaimClientTabLease = (
  lease: ClientTabLease | null,
  tabId: string,
  now: number
) => !lease || lease.tabId === tabId || lease.expiresAt <= now
