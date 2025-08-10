import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from './utils/rateLimit'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // レート制限の適用
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResult = rateLimit(request)
    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests', 
          retryAfter: rateLimitResult.retryAfter 
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          },
        }
      )
    }
  }

  // セキュリティヘッダーの追加（nginx設定と重複回避）
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  // APIルートに対する追加の保護
  if (request.nextUrl.pathname.startsWith('/api/upload') || 
      request.nextUrl.pathname.startsWith('/api/delete')) {
    // ファイルアップロード/削除APIへのアクセス制限
    const contentType = request.headers.get('content-type')
    const origin = request.headers.get('origin')
    
    // CSRF保護: Originヘッダーをチェック
    if (!origin || new URL(origin).hostname !== request.nextUrl.hostname) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden: Invalid origin' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}