import { NextRequest } from 'next/server'

interface RateLimitResult {
  success: boolean
  retryAfter?: number
}

// インメモリストア（本番環境ではRedisを推奨）
const requests = new Map<string, { count: number; resetTime: number }>()

// レート制限設定
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1分
  maxRequests: 100,     // 1分間に100リクエスト
  apiSpecificLimits: {
    '/api/upload': { windowMs: 60 * 1000, maxRequests: 10 },
    '/api/delete': { windowMs: 60 * 1000, maxRequests: 5 },
    '/api/ai': { windowMs: 60 * 1000, maxRequests: 30 },
    '/api/tts': { windowMs: 60 * 1000, maxRequests: 50 },
  }
}

export function rateLimit(request: NextRequest): RateLimitResult {
  // 開発環境では制限なし
  if (process.env.NODE_ENV === 'development') {
    return { success: true }
  }

  const clientIP = getClientIP(request)
  const now = Date.now()
  
  // API固有の制限を取得
  let config = { ...RATE_LIMIT_CONFIG }
  for (const [path, limit] of Object.entries(RATE_LIMIT_CONFIG.apiSpecificLimits)) {
    if (request.nextUrl.pathname.startsWith(path)) {
      config.windowMs = limit.windowMs
      config.maxRequests = limit.maxRequests
      break
    }
  }

  const key = `${clientIP}:${request.nextUrl.pathname}`
  const requestData = requests.get(key)

  if (!requestData || now > requestData.resetTime) {
    // 新しいウィンドウの開始
    requests.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return { success: true }
  }

  if (requestData.count >= config.maxRequests) {
    // レート制限に達した
    const retryAfter = Math.ceil((requestData.resetTime - now) / 1000)
    return { 
      success: false, 
      retryAfter 
    }
  }

  // リクエストカウントを増加
  requestData.count++
  return { success: true }
}

function getClientIP(request: NextRequest): string {
  // プロキシ経由のIPを取得
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddress = request.ip

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }

  return remoteAddress || 'unknown'
}

// 古いエントリをクリーンアップ（メモリリーク防止）
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of requests.entries()) {
    if (now > data.resetTime) {
      requests.delete(key)
    }
  }
}, 60 * 1000) // 1分ごとにクリーンアップ