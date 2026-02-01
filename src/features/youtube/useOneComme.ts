import {
  useEffect,
  useRef,
  useState,
  useCallback,
  MutableRefObject,
} from 'react'
import { YouTubeComment } from './youtubeComments'

// OneSDKの型定義
// @see https://onecomme.com/docs/developer/onesdk-js
interface OneSDKConfig {
  mode?: 'all' | 'diff'
  permissions?: string[]
}

declare global {
  interface Window {
    OneSDK?: {
      setup: (config: OneSDKConfig) => void
      ready: () => Promise<void>
      connect: () => Promise<void>
      subscribe: (options: {
        action: string
        callback: (data: unknown) => void
      }) => void
    }
  }
}

interface UseOneCommeParams {
  enabled: boolean
  port: number
  commentBufferRef: MutableRefObject<YouTubeComment[]>
}

interface UseOneCommeReturn {
  isConnected: boolean
  isLoading: boolean
  error: string | null
}

export const useOneComme = ({
  enabled,
  port,
  commentBufferRef,
}: UseOneCommeParams): UseOneCommeReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processedIdsRef = useRef<Set<string>>(new Set())

  const handleComments = useCallback(
    (data: unknown) => {
      if (!Array.isArray(data)) return

      for (const item of data) {
        const commentData = (item as any)?.data || item
        const id = (commentData as any)?.id || crypto.randomUUID()

        if (processedIdsRef.current.has(id)) continue
        processedIdsRef.current.add(id)

        const rawComment =
          (commentData as any)?.comment || (commentData as any)?.message || ''
        if (!rawComment || rawComment.startsWith('#')) continue

        const userName =
          (commentData as any)?.nickname ||
          (commentData as any)?.name ||
          (commentData as any)?.author?.name ||
          (commentData as any)?.displayName ||
          'Unknown'
        const userIconUrl =
          (commentData as any)?.profileImage ||
          (commentData as any)?.author?.profileImage ||
          ''

        const comment: YouTubeComment = {
          userName,
          userIconUrl,
          userComment: rawComment,
        }

        commentBufferRef.current.push(comment)
      }
    },
    [commentBufferRef]
  )

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false)
      setIsLoading(false)
      setError(null)
      return
    }

    let mounted = true

    const initOneSDK = async () => {
      setIsLoading(true)
      setError(null)
      processedIdsRef.current.clear()

      try {
        const scriptUrl = `http://localhost:${port}/templates/preset/__origin/js/onesdk.js`

        const existingScript = document.querySelector(
          `script[src="${scriptUrl}"]`
        )

        if (!existingScript) {
          const script = document.createElement('script')
          script.src = scriptUrl
          script.async = true

          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve()
            script.onerror = () =>
              reject(new Error('OneSDKの読み込みに失敗しました'))
            document.head.appendChild(script)
          })
        }

        let attempts = 0
        while (!window.OneSDK && attempts < 50) {
          await new Promise((r) => setTimeout(r, 100))
          attempts++
        }

        if (!window.OneSDK) {
          throw new Error('OneSDKが見つかりません')
        }

        if (!mounted) return

        window.OneSDK.setup({
          mode: 'diff',
          permissions: ['comments'],
        })

        await window.OneSDK.ready()
        await window.OneSDK.connect()

        if (!mounted) return

        window.OneSDK.subscribe({
          action: 'comments',
          callback: handleComments,
        })

        setIsConnected(true)
        setIsLoading(false)
      } catch (err) {
        if (!mounted) return
        const message =
          err instanceof Error ? err.message : 'わんコメへの接続に失敗しました'
        setError(message)
        setIsLoading(false)
        console.error('OneSDK initialization error:', err)
      }
    }

    initOneSDK()

    return () => {
      mounted = false
      const scriptUrl = `http://localhost:${port}/templates/preset/__origin/js/onesdk.js`
      const existingScript = document.querySelector(
        `script[src="${scriptUrl}"]`
      )
      if (existingScript) {
        existingScript.remove()
      }
      window.OneSDK = undefined
    }
  }, [enabled, port, handleComments])

  return {
    isConnected,
    isLoading,
    error,
  }
}
