export interface ClientTabLease {
  tabId: string
  expiresAt: number
}

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
