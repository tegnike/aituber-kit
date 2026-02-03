import { useCallback, useEffect, useRef } from 'react'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import {
  fetchAndProcessComments,
  resetYoutubeState,
  YouTubeComment,
} from '@/features/youtube/youtubeComments'
import { useOneComme } from '@/features/youtube/useOneComme'

interface Params {
  handleSendChat: (text: string, userName?: string) => Promise<void>
}

interface UseYoutubeReturn {
  oneCommeStatus: {
    isConnected: boolean
    isLoading: boolean
    error: string | null
  }
}

const useYoutube = ({ handleSendChat }: Params): UseYoutubeReturn => {
  const youtubePlaying = settingsStore((s) => s.youtubePlaying)
  const youtubeCommentInterval = settingsStore((s) => s.youtubeCommentInterval)
  const youtubeCommentSource = settingsStore((s) => s.youtubeCommentSource)
  const onecommePort = settingsStore((s) => s.onecommePort)

  // わんコメコメント用バッファ
  const commentBufferRef = useRef<YouTubeComment[]>([])

  // handleSendChat をrefで保持し、useCallbackの依存から外す
  const handleSendChatRef = useRef(handleSendChat)
  handleSendChatRef.current = handleSendChat

  // 多重実行防止用ref
  const isProcessingRef = useRef(false)

  // わんコメ接続
  const {
    isConnected: oneCommeConnected,
    isLoading: oneCommeLoading,
    error: oneCommeError,
  } = useOneComme({
    enabled: youtubeCommentSource === 'onecomme' && youtubePlaying,
    port: onecommePort,
    commentBufferRef,
  })

  const fetchAndProcessCommentsCallback = useCallback(async () => {
    const ss = settingsStore.getState()
    const hs = homeStore.getState()

    if (
      isProcessingRef.current ||
      hs.chatProcessing ||
      hs.chatProcessingCount > 0 ||
      !ss.youtubeMode ||
      !ss.youtubePlaying
    ) {
      return
    }

    isProcessingRef.current = true
    try {
      if (ss.youtubeCommentSource === 'youtube-api') {
        // YouTube APIモード: 従来通り
        if (!ss.youtubeLiveId || !ss.youtubeApiKey) return
        console.log('Call fetchAndProcessComments !!!')
        await fetchAndProcessComments(handleSendChatRef.current)
      } else {
        // わんコメモード: バッファをドレインして渡す
        const bufferedComments = [...commentBufferRef.current]
        commentBufferRef.current = []
        console.log(
          'Call fetchAndProcessComments (OneComme) !!!',
          'buffered:',
          bufferedComments.length
        )
        await fetchAndProcessComments(
          handleSendChatRef.current,
          bufferedComments
        )
      }
    } finally {
      isProcessingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!youtubePlaying) return
    fetchAndProcessCommentsCallback()

    const intervalId = setInterval(() => {
      fetchAndProcessCommentsCallback()
    }, youtubeCommentInterval * 1000)

    return () => {
      clearInterval(intervalId)
      resetYoutubeState()
    }
  }, [youtubePlaying, youtubeCommentInterval, fetchAndProcessCommentsCallback])

  return {
    oneCommeStatus: {
      isConnected: oneCommeConnected,
      isLoading: oneCommeLoading,
      error: oneCommeError,
    },
  }
}

export default useYoutube
