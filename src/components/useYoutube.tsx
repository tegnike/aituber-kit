import { useCallback, useEffect, useState } from 'react'

import { Message } from '@/features/messages/messages'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { fetchAndProcessComments } from '@/features/youtube/youtubeComments'
import { processAIResponse } from '../features/chat/handlers'

const INTERVAL_MILL_SECONDS_RETRIEVING_COMMENTS = 5000 // 5秒

interface Params {
  handleSendChat: (text: string, role?: string) => Promise<void>
}

const useYoutube = async ({ handleSendChat }: Params) => {
  const conversationContinuityMode = settingsStore(
    (s) => s.conversationContinuityMode
  )
  const chatProcessingCount = homeStore((s) => s.chatProcessingCount)

  const [youtubeNextPageToken, setYoutubeNextPageToken] = useState('')
  const [youtubeContinuationCount, setYoutubeContinuationCount] = useState(0)
  const [youtubeNoCommentCount, setYoutubeNoCommentCount] = useState(0)
  const [youtubeSleepMode, setYoutubeSleepMode] = useState(false)

  const preProcessAIResponse = useCallback(async (messages: Message[]) => {
    const hs = homeStore.getState()
    await processAIResponse(hs.chatLog, messages)
  }, [])

  // YouTubeコメントを取得する処理
  const fetchAndProcessCommentsCallback = useCallback(async () => {
    const ss = settingsStore.getState()
    const hs = homeStore.getState()

    if (
      !ss.openAiKey ||
      !ss.youtubeLiveId ||
      !ss.youtubeApiKey ||
      hs.chatProcessing ||
      hs.chatProcessingCount > 0 ||
      !ss.youtubeMode
    ) {
      return
    }
    await new Promise((resolve) =>
      setTimeout(resolve, INTERVAL_MILL_SECONDS_RETRIEVING_COMMENTS)
    )
    console.log('Call fetchAndProcessComments !!!')

    fetchAndProcessComments(
      hs.chatLog,
      ss.selectAIService === 'anthropic' ? ss.anthropicKey : ss.openAiKey,
      ss.youtubeLiveId,
      ss.youtubeApiKey,
      youtubeNextPageToken,
      setYoutubeNextPageToken,
      youtubeNoCommentCount,
      setYoutubeNoCommentCount,
      youtubeContinuationCount,
      setYoutubeContinuationCount,
      youtubeSleepMode,
      setYoutubeSleepMode,
      handleSendChat,
      preProcessAIResponse
    )
  }, [
    youtubeNextPageToken,
    youtubeNoCommentCount,
    youtubeContinuationCount,
    youtubeSleepMode,
    handleSendChat,
    preProcessAIResponse,
  ])

  // fetchAndProcessCommentsCallback は依存配列に含めない
  useEffect(() => {
    console.log('chatProcessingCount:', chatProcessingCount)
    fetchAndProcessCommentsCallback()
  }, [chatProcessingCount, conversationContinuityMode])

  // fetchAndProcessCommentsCallback は依存配列に含めない
  useEffect(() => {
    if (youtubeNoCommentCount < 1) return
    // console.log('youtubeSleepMode:', youtubeSleepMode);
    setTimeout(() => {
      fetchAndProcessCommentsCallback()
    }, INTERVAL_MILL_SECONDS_RETRIEVING_COMMENTS)
  }, [youtubeNoCommentCount, conversationContinuityMode])
}
export default useYoutube
