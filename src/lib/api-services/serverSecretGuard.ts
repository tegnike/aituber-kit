import type { NextApiRequest, NextApiResponse } from 'next'

export type ServerSecretAccessMode =
  | 'disabled'
  | 'protected'
  | 'demo'
  | 'unprotected'

export type ServerSecretGuardOptions = {
  featureName: string
}

const DEFAULT_ACCESS_MODE: ServerSecretAccessMode = 'disabled'
const DEFAULT_DEMO_RATE_LIMIT_PER_MINUTE = 20

type RateLimitEntry = {
  windowStart: number
  count: number
}

function getAccessMode(): ServerSecretAccessMode {
  const mode =
    process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE || DEFAULT_ACCESS_MODE

  if (
    mode === 'disabled' ||
    mode === 'protected' ||
    mode === 'demo' ||
    mode === 'unprotected'
  ) {
    return mode
  }

  return DEFAULT_ACCESS_MODE
}

function getHeaderValue(req: NextApiRequest, name: string): string {
  const value = req.headers?.[name.toLowerCase()]
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function parseAllowedOrigins(): string[] {
  return (process.env.AITUBERKIT_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function getRequestOrigin(req: NextApiRequest): string {
  const origin = getHeaderValue(req, 'origin')
  if (origin) return origin

  const referer = getHeaderValue(req, 'referer')
  if (!referer) return ''

  try {
    return new URL(referer).origin
  } catch {
    return ''
  }
}

function isSameHostOrigin(req: NextApiRequest, origin: string): boolean {
  if (!origin) return false

  const host = getHeaderValue(req, 'host')
  if (!host) return false

  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

function isAllowedDemoOrigin(req: NextApiRequest): boolean {
  const origin = getRequestOrigin(req)
  const allowedOrigins = parseAllowedOrigins()

  if (allowedOrigins.length > 0) {
    return allowedOrigins.includes(origin)
  }

  return isSameHostOrigin(req, origin)
}

function hasValidBearerToken(req: NextApiRequest): boolean {
  const expectedToken = process.env.AITUBERKIT_SERVER_SECRET_TOKEN
  if (!expectedToken) return false

  const authorization = getHeaderValue(req, 'authorization')
  const expectedAuthorization = `Bearer ${expectedToken}`
  return authorization === expectedAuthorization
}

function getClientIp(req: NextApiRequest): string {
  const forwardedFor = getHeaderValue(req, 'x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = getHeaderValue(req, 'cf-connecting-ip')
  if (realIp) return realIp

  return req.socket?.remoteAddress || 'unknown'
}

function getDemoRateLimitPerMinute(): number {
  const parsed = Number(process.env.AITUBERKIT_DEMO_RATE_LIMIT_PER_MINUTE)
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed)
  }

  return DEFAULT_DEMO_RATE_LIMIT_PER_MINUTE
}

function isDemoRateLimited(req: NextApiRequest, featureName: string): boolean {
  const limit = getDemoRateLimitPerMinute()
  const now = Date.now()
  const windowMs = 60_000
  const key = `${featureName}:${getClientIp(req)}`
  const globalStore = globalThis as typeof globalThis & {
    __aituberKitServerSecretRateLimit?: Map<string, RateLimitEntry>
  }
  const store =
    globalStore.__aituberKitServerSecretRateLimit ||
    new Map<string, RateLimitEntry>()
  globalStore.__aituberKitServerSecretRateLimit = store

  const current = store.get(key)
  if (!current || now - current.windowStart >= windowMs) {
    store.set(key, { windowStart: now, count: 1 })
    return false
  }

  current.count += 1
  return current.count > limit
}

export function rejectServerSecretAccess(
  res: NextApiResponse,
  options: ServerSecretGuardOptions,
  message?: string
) {
  return res.status(403).json({
    error: 'Server secret/resource access is not allowed',
    errorCode: 'ServerSecretAccessDenied',
    feature: options.featureName,
    message:
      message ||
      'Server-side secret or resource settings require AITUBERKIT_SERVER_SECRET_ACCESS_MODE to be configured.',
  })
}

export function guardServerSecretAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  options: ServerSecretGuardOptions
): boolean {
  const mode = getAccessMode()

  if (mode === 'unprotected') {
    return true
  }

  if (mode === 'protected') {
    if (hasValidBearerToken(req)) {
      return true
    }

    rejectServerSecretAccess(
      res,
      options,
      'Server-side secret settings require a valid Authorization bearer token.'
    )
    return false
  }

  if (mode === 'demo') {
    const fetchSite = getHeaderValue(req, 'sec-fetch-site')
    const fetchSiteAllowed =
      !fetchSite || fetchSite === 'same-origin' || fetchSite === 'none'

    if (fetchSiteAllowed && isAllowedDemoOrigin(req)) {
      if (isDemoRateLimited(req, options.featureName)) {
        res.status(429).json({
          error: 'Server secret demo rate limit exceeded',
          errorCode: 'ServerSecretRateLimited',
          feature: options.featureName,
          message:
            'Demo mode server-side secret requests are rate limited. Configure AITUBERKIT_DEMO_RATE_LIMIT_PER_MINUTE or add deployment-level rate limits.',
        })
        return false
      }

      return true
    }

    rejectServerSecretAccess(
      res,
      options,
      'Server-side secret settings in demo mode require an allowed same-origin request.'
    )
    return false
  }

  rejectServerSecretAccess(res, options)
  return false
}
