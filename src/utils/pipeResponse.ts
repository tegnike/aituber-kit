import { NextApiResponse } from 'next'

/**
 * Web API の Response オブジェクトを Next.js の NextApiResponse にパイプする
 * Edge Runtime から Node.js Runtime への変換に使用
 */
export async function pipeResponse(
  response: Response,
  res: NextApiResponse
): Promise<void> {
  res.status(response.status)
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  // SSEの場合、圧縮によるバッファリングを防ぐ
  const contentType = response.headers.get('content-type') || ''
  const isSSE = contentType.includes('text/event-stream')
  if (isSSE) {
    res.setHeader('Content-Encoding', 'none')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()
  }

  if (response.body) {
    const reader = response.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
        // SSEではチャンクを即座にクライアントに送信する
        if (isSSE && typeof (res as any).flush === 'function') {
          ;(res as any).flush()
        }
      }
    } catch (error) {
      console.error('Error while piping response body:', error)
    } finally {
      reader.releaseLock()
      res.end()
    }
  } else {
    res.end()
  }
}
