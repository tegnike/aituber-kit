import settingsStore from '@/features/stores/settings'
import { processAIResponse } from '../chat/handlers'
import homeStore from '@/features/stores/home'
import { messageSelectors } from '../messages/messageSelectors'

// getLiveChatId のキャッシュ（配信中にChat IDは変わらないため）
let liveChatIdCache: { liveId: string; chatId: string } | null = null

// YouTube APIコメント重複排除用
const processedCommentIds = new Set<string>()

export const resetYoutubeState = () => {
  liveChatIdCache = null
  processedCommentIds.clear()
}

export const getLiveChatId = async (
  liveId: string,
  youtubeKey: string
): Promise<string> => {
  if (liveChatIdCache && liveChatIdCache.liveId === liveId) {
    return liveChatIdCache.chatId
  }

  const params = {
    part: 'liveStreamingDetails',
    id: liveId,
    key: youtubeKey,
  }
  const query = new URLSearchParams(params)
  const response = await fetch(
    `https://youtube.googleapis.com/youtube/v3/videos?${query}`,
    {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  if (!response.ok) {
    console.error(
      `YouTube API error (videos): ${response.status} ${response.statusText}`
    )
    return ''
  }
  const json = await response.json()
  if (json.items == undefined || json.items.length == 0) {
    return ''
  }
  const liveChatId = json.items[0].liveStreamingDetails.activeLiveChatId
  liveChatIdCache = { liveId, chatId: liveChatId }
  return liveChatId
}

export type YouTubeComment = {
  userName: string
  userIconUrl: string
  userComment: string
}

export type YouTubeComments = YouTubeComment[]

const retrieveLiveComments = async (
  activeLiveChatId: string,
  youtubeKey: string,
  youtubeNextPageToken: string,
  setYoutubeNextPageToken: (token: string) => void
): Promise<YouTubeComments> => {
  console.log('retrieveLiveComments')
  let url =
    'https://youtube.googleapis.com/youtube/v3/liveChat/messages?liveChatId=' +
    activeLiveChatId +
    '&part=authorDetails%2Csnippet&key=' +
    youtubeKey
  if (youtubeNextPageToken !== '' && youtubeNextPageToken !== undefined) {
    url = url + '&pageToken=' + youtubeNextPageToken
  }
  const response = await fetch(url, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    console.error(
      `YouTube API error (liveChat): ${response.status} ${response.statusText}`
    )
    return []
  }
  const json = await response.json()
  const items = json.items
  if (!Array.isArray(items)) {
    return []
  }
  setYoutubeNextPageToken(json.nextPageToken)

  const comments = items
    .filter((item: any) => {
      const id = item.id
      if (id && processedCommentIds.has(id)) return false
      if (id) processedCommentIds.add(id)
      return true
    })
    .map((item: any) => ({
      userName: item.authorDetails.displayName,
      userIconUrl: item.authorDetails.profileImageUrl,
      userComment:
        item.snippet.textMessageDetails?.messageText ||
        item.snippet.superChatDetails?.userComment ||
        '',
    }))
    .filter(
      (comment: any) =>
        comment.userComment !== '' && !comment.userComment.startsWith('#')
    )

  if (comments.length === 0) {
    return []
  }

  return comments
}

/**
 * AIサービスに応じたAPIキーを取得する
 */
const getApiKey = (ss: ReturnType<typeof settingsStore.getState>): string => {
  const aiService = ss.selectAIService
  if (
    typeof aiService === 'string' &&
    aiService !== 'dify' &&
    aiService !== 'custom-api'
  ) {
    return (ss[`${aiService}Key` as keyof typeof ss] as string) || ''
  }
  return ''
}

/**
 * 会話継続ワークフローAPIを呼び出すヘルパー
 */
const callContinuationApi = async (params: {
  ss: ReturnType<typeof settingsStore.getState>
  chatLog: any[]
  youtubeComments: YouTubeComments
  noCommentCount: number
  continuationCount: number
  sleepMode: boolean
}): Promise<any | null> => {
  const {
    ss,
    chatLog,
    youtubeComments,
    noCommentCount,
    continuationCount,
    sleepMode,
  } = params

  const response = await fetch('/api/youtube/continuation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      aiService: ss.selectAIService,
      model: ss.selectAIModel,
      apiKey: getApiKey(ss),
      localLlmUrl: ss.localLlmUrl,
      azureEndpoint: ss.azureEndpoint,
      temperature: ss.temperature,
      maxTokens: ss.maxTokens,
      chatLog,
      systemPrompt: ss.systemPrompt,
      youtubeComments,
      noCommentCount,
      continuationCount,
      sleepMode,
      newTopicThreshold: ss.conversationContinuityNewTopicThreshold,
      sleepThreshold: ss.conversationContinuitySleepThreshold,
      promptEvaluate: ss.conversationContinuityPromptEvaluate,
      promptContinuation: ss.conversationContinuityPromptContinuation,
      promptSelectComment: ss.conversationContinuityPromptSelectComment,
      promptNewTopic: ss.conversationContinuityPromptNewTopic,
      promptSleep: ss.conversationContinuityPromptSleep,
    }),
  })

  if (!response.ok) {
    try {
      const errorData = await response.json()
      console.error('Continuation API error:', errorData.error)
    } catch {
      const text = await response.text()
      console.error('Continuation API error (non-JSON response):', text)
    }
    return null
  }

  return response.json()
}

export const fetchAndProcessComments = async (
  handleSendChat: (text: string, userName?: string) => Promise<void>,
  externalComments?: YouTubeComment[]
): Promise<void> => {
  const ss = settingsStore.getState()
  const hs = homeStore.getState()
  const chatLog = messageSelectors.getTextAndImageMessages(hs.chatLog)
  const isOneCommeMode = ss.youtubeCommentSource === 'onecomme'

  try {
    // YouTube APIモード時のみliveChatIdを取得
    let liveChatId = ''
    if (!isOneCommeMode) {
      liveChatId = await getLiveChatId(ss.youtubeLiveId, ss.youtubeApiKey)
      if (!liveChatId) return
    }

    // 会話継続モードの場合: 旧コードと同じ順序で処理
    // 1. まず継続チェック（コメント取得前）
    // 2. shouldContinue=true → コメント取得をスキップして return
    // 3. shouldContinue=false → コメント取得 → ワークフローで処理
    if (ss.conversationContinuityMode) {
      // Phase 1: 継続チェック（コメント取得前、空のコメント配列で実行）
      if (!ss.youtubeSleepMode && ss.youtubeContinuationCount < 1) {
        const checkResult = await callContinuationApi({
          ss,
          chatLog,
          youtubeComments: [], // コメント取得前なので空
          noCommentCount: ss.youtubeNoCommentCount,
          continuationCount: ss.youtubeContinuationCount,
          sleepMode: ss.youtubeSleepMode,
        })
        if (!checkResult) return

        // shouldContinueがtrueの場合、buildContinuationが実行される
        if (
          checkResult.action === 'process_messages' &&
          checkResult.stateUpdates.continuationCount >
            ss.youtubeContinuationCount
        ) {
          settingsStore.setState({
            youtubeNoCommentCount: checkResult.stateUpdates.noCommentCount,
            youtubeContinuationCount:
              checkResult.stateUpdates.continuationCount,
            youtubeSleepMode: checkResult.stateUpdates.sleepMode,
          })
          processAIResponse(checkResult.messages)
          return
        }
      }

      // continuationCountをリセット（旧コードの L100 相当）
      settingsStore.setState({ youtubeContinuationCount: 0 })

      // Phase 2: コメント取得
      let youtubeComments: YouTubeComments
      if (isOneCommeMode) {
        youtubeComments = externalComments || []
      } else {
        youtubeComments = await retrieveLiveComments(
          liveChatId,
          ss.youtubeApiKey,
          ss.youtubeNextPageToken,
          (token: string) =>
            settingsStore.setState({ youtubeNextPageToken: token })
        )
      }

      // Phase 3: コメント有無に応じてワークフロー実行
      const result = await callContinuationApi({
        ss,
        chatLog,
        youtubeComments,
        noCommentCount: ss.youtubeNoCommentCount,
        continuationCount: 0, // リセット済み
        sleepMode: ss.youtubeSleepMode,
      })
      if (!result) return

      // 状態更新
      settingsStore.setState({
        youtubeNoCommentCount: result.stateUpdates.noCommentCount,
        youtubeContinuationCount: result.stateUpdates.continuationCount,
        youtubeSleepMode: result.stateUpdates.sleepMode,
      })

      // アクションに応じた処理
      switch (result.action) {
        case 'send_comment':
          console.log(
            'selectedYoutubeComment:',
            result.comment,
            'userName:',
            result.userName
          )
          await handleSendChat(result.comment, result.userName)
          break
        case 'process_messages':
        case 'sleep':
          processAIResponse(result.messages)
          break
        case 'do_nothing':
          break
      }
      return
    }

    // 会話継続モードOFFの場合
    // コメントを取得
    let youtubeComments: YouTubeComments
    if (isOneCommeMode) {
      youtubeComments = externalComments || []
    } else {
      youtubeComments = await retrieveLiveComments(
        liveChatId,
        ss.youtubeApiKey,
        ss.youtubeNextPageToken,
        (token: string) =>
          settingsStore.setState({ youtubeNextPageToken: token })
      )
    }

    // ランダムなコメントを選択して送信
    if (youtubeComments.length > 0) {
      settingsStore.setState({ youtubeNoCommentCount: 0 })
      settingsStore.setState({ youtubeSleepMode: false })
      const randomComment =
        youtubeComments[Math.floor(Math.random() * youtubeComments.length)]
      const selectedComment = randomComment.userComment
      const selectedUserName = randomComment.userName
      console.log(
        'selectedYoutubeComment:',
        selectedComment,
        'userName:',
        selectedUserName
      )

      await handleSendChat(selectedComment, selectedUserName)
    } else {
      const noCommentCount = ss.youtubeNoCommentCount + 1
      console.log('YoutubeNoCommentCount:', noCommentCount)
      settingsStore.setState({ youtubeNoCommentCount: noCommentCount })
    }
  } catch (error) {
    console.error('Error fetching comments:', error)
  }
}
