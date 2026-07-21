import { isIP } from 'node:net'
import { hostname as getHostname, networkInterfaces } from 'node:os'

const PRIVATE_IPV4_RANGES = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
]

export function isHttpUrl(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:'
}

function getIpv4MappedAddress(normalizedHost: string): string | undefined {
  const ipv4MappedMatch = normalizedHost.match(
    /^(?:::ffff:|0:0:0:0:0:ffff:)(.+)$/
  )
  if (!ipv4MappedMatch) return undefined

  const mappedAddress = ipv4MappedMatch[1]
  if (mappedAddress.includes('.')) return mappedAddress

  const hexParts = mappedAddress.split(':')
  if (hexParts.length !== 2) return mappedAddress

  const high = Number.parseInt(hexParts[0], 16)
  const low = Number.parseInt(hexParts[1], 16)
  if (
    !Number.isFinite(high) ||
    !Number.isFinite(low) ||
    high < 0 ||
    high > 0xffff ||
    low < 0 ||
    low > 0xffff
  ) {
    return mappedAddress
  }

  return [(high >> 8) & 0xff, high & 0xff, (low >> 8) & 0xff, low & 0xff].join(
    '.'
  )
}

export function isLoopbackHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (normalized === 'localhost' || normalized.endsWith('.localhost')) {
    return true
  }

  const addressKind = isIP(normalized)
  if (addressKind === 0) return false

  const ipv4MappedAddress = getIpv4MappedAddress(normalized)

  if (ipv4MappedAddress) {
    return isIP(ipv4MappedAddress) === 4 && /^127\./.test(ipv4MappedAddress)
  }

  return (
    (addressKind === 4 && /^127\./.test(normalized)) ||
    normalized === '::1' ||
    normalized === '0:0:0:0:0:0:0:1'
  )
}

export function isLocalOrPrivateHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (isLoopbackHost(normalized)) return true

  const addressKind = isIP(normalized)
  if (addressKind === 0) return false

  const ipv4MappedAddress = getIpv4MappedAddress(normalized)
  if (ipv4MappedAddress) {
    return (
      PRIVATE_IPV4_RANGES.some((range) => range.test(ipv4MappedAddress)) ||
      ipv4MappedAddress.includes(':')
    )
  }

  if (
    addressKind === 4 &&
    PRIVATE_IPV4_RANGES.some((range) => range.test(normalized))
  ) {
    return true
  }

  if (addressKind !== 6) return false

  const firstHextet = Number.parseInt(normalized.split(':')[0], 16)
  if (!Number.isFinite(firstHextet)) return false

  return (firstHextet & 0xfe00) === 0xfc00 || (firstHextet & 0xffc0) === 0xfe80
}

/**
 * LM Studio / Ollamaで使われるLAN内のホスト名を判定する。
 *
 * 単一ラベル名はOSのDNS検索サフィックスやNetBIOSで解決されるマシン名、
 * `.local` はmDNS名として扱う。公開FQDNは許可しない。
 */
export function isLocalLlmHost(hostname: string): boolean {
  const normalized = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')

  if (!normalized) return false
  if (isLocalOrPrivateHost(normalized)) return true
  if (isIP(normalized) !== 0) return false

  return !normalized.includes('.') || normalized.endsWith('.local')
}

function getLocalInterfaceAddresses(): string[] {
  return Object.values(networkInterfaces()).flatMap((addresses) =>
    (addresses || []).map(({ address }) => address.toLowerCase())
  )
}

/** 同一マシンを指すループバック、NICのIPアドレス、OSホスト名を判定する。 */
export function isSameMachineHost(
  hostname: string,
  machineHostname = getHostname(),
  localInterfaceAddresses = getLocalInterfaceAddresses()
): boolean {
  const normalized = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
  if (!normalized) return false
  if (isLoopbackHost(normalized)) return true

  if (isIP(normalized) !== 0) {
    return localInterfaceAddresses.includes(normalized)
  }

  const normalizedMachineHostname = machineHostname
    .toLowerCase()
    .replace(/\.$/, '')
  if (!normalizedMachineHostname) return false

  const machineLabel = normalizedMachineHostname.split('.')[0]
  return (
    normalized === normalizedMachineHostname ||
    normalized === machineLabel ||
    normalized === `${machineLabel}.local`
  )
}

export function isAllowedConfiguredOrListedUrl(
  parsedUrl: URL,
  configuredUrl?: URL,
  allowedOriginsValue = process.env.AITUBERKIT_ALLOWED_TTS_SERVER_ORIGINS || ''
): {
  isProtectedServerResource: boolean
  isAllowedPublicUrl: boolean
} {
  const isProtectedServerResource =
    (configuredUrl ? parsedUrl.origin === configuredUrl.origin : false) ||
    isLocalOrPrivateHost(parsedUrl.hostname)
  const allowedOrigins = allowedOriginsValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return {
    isProtectedServerResource,
    isAllowedPublicUrl: allowedOrigins.includes(parsedUrl.origin),
  }
}
