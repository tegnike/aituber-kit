import { useCallback, useEffect, useRef } from 'react'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import {
  fetchAndProcessComments,
  YouTubeComment,
} from '@/features/youtube/youtubeComments'
import { useOneComme } from '@/features/youtube/useOneComme'

const INTERVAL_MILL_SECONDS_RETRIEVING_COMMENTS = 10000 // 10秒

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
  const youtubeCommentSource = settingsStore((s) => s.youtubeCommentSource)
  const onecommePort = settingsStore((s) => s.onecommePort)

  // わんコメコメント用バッファ
  const commentBufferRef = useRef<YouTubeComment[]>([])

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
      hs.chatProcessing ||
      hs.chatProcessingCount > 0 ||
      !ss.youtubeMode ||
      !ss.youtubePlaying
    ) {
      return
    }

    if (ss.youtubeCommentSource === 'youtube-api') {
      // YouTube APIモード: 従来通り
      if (!ss.youtubeLiveId || !ss.youtubeApiKey) return
      console.log('Call fetchAndProcessComments !!!')
      await fetchAndProcessComments(handleSendChat)
    } else {
      // わんコメモード: バッファをドレインして渡す
      const bufferedComments = [...commentBufferRef.current]
      commentBufferRef.current = []
      console.log(
        'Call fetchAndProcessComments (OneComme) !!!',
        'buffered:',
        bufferedComments.length
      )
      await fetchAndProcessComments(handleSendChat, bufferedComments)
    }
  }, [handleSendChat])

  useEffect(() => {
    if (!youtubePlaying) return
    fetchAndProcessCommentsCallback()

    const intervalId = setInterval(() => {
      fetchAndProcessCommentsCallback()
    }, INTERVAL_MILL_SECONDS_RETRIEVING_COMMENTS)

    return () => clearInterval(intervalId)
  }, [youtubePlaying, fetchAndProcessCommentsCallback])

  return {
    oneCommeStatus: {
      isConnected: oneCommeConnected,
      isLoading: oneCommeLoading,
      error: oneCommeError,
    },
  }
}

export default useYoutube
