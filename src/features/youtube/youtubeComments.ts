import { Message } from '@/features/messages/messages'
import settingsStore from '@/features/stores/settings'
import {
  getBestComment,
  getMessagesForSleep,
  getAnotherTopic,
  getMessagesForNewTopic,
  checkIfResponseContinuationIsRequired,
  getMessagesForContinuation,
} from '@/features/youtube/conversationContinuityFunctions'

export const getLiveChatId = async (
  liveId: string,
  youtubeKey: string
): Promise<string> => {
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
  const json = await response.json()
  if (json.items == undefined || json.items.length == 0) {
    return ''
  }
  const liveChatId = json.items[0].liveStreamingDetails.activeLiveChatId
  return liveChatId
}

type YouTubeComment = {
  userName: string
  userIconUrl: string
  userComment: string
}

type YouTubeComments = YouTubeComment[]

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
  const json = await response.json()
  const items = json.items
  setYoutubeNextPageToken(json.nextPageToken)

  const comments = items
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

export const fetchAndProcessComments = async (
  messages: Message[],
  aiApiKey: string,
  liveId: string,
  youtubeKey: string,
  youtubeNextPageToken: string,
  setYoutubeNextPageToken: (token: string) => void,
  youtubeNoCommentCount: number,
  setYoutubeNoCommentCount: (count: number) => void,
  youtubeContinuationCount: number,
  setYoutubeContinuationCount: (count: number) => void,
  youtubeSleepMode: boolean,
  setYoutubeSleepMode: (mode: boolean) => void,
  handleSendChat: (text: string, role?: string) => void,
  preProcessAIResponse: (messages: Message[]) => void
): Promise<void> => {
  try {
    const liveChatId = await getLiveChatId(liveId, youtubeKey)
    const ss = settingsStore.getState()

    if (liveChatId) {
      // 会話の継続が必要かどうかを確認
      if (
        !youtubeSleepMode &&
        youtubeContinuationCount < 1 &&
        ss.conversationContinuityMode
      ) {
        const isContinuationNeeded =
          await checkIfResponseContinuationIsRequired(
            messages,
            aiApiKey,
            ss.selectAIService,
            ss.selectAIModel
          )
        if (isContinuationNeeded) {
          const continuationMessage = await getMessagesForContinuation(
            ss.systemPrompt,
            messages
          )
          preProcessAIResponse(continuationMessage)
          setYoutubeContinuationCount(youtubeContinuationCount + 1)
          if (youtubeNoCommentCount < 1) {
            setYoutubeNoCommentCount(1)
          }
          return
        }
      }
      setYoutubeContinuationCount(0)

      // コメントを取得
      const youtubeComments = await retrieveLiveComments(
        liveChatId,
        youtubeKey,
        youtubeNextPageToken,
        setYoutubeNextPageToken
      )
      // ランダムなコメントを選択して送信
      if (youtubeComments.length > 0) {
        setYoutubeNoCommentCount(0)
        setYoutubeSleepMode(false)
        let selectedComment = ''
        if (ss.conversationContinuityMode) {
          if (youtubeComments.length > 1) {
            selectedComment = await getBestComment(
              messages,
              youtubeComments,
              aiApiKey,
              ss.selectAIService,
              ss.selectAIModel
            )
          } else {
            selectedComment = youtubeComments[0].userComment
          }
        } else {
          selectedComment =
            youtubeComments[Math.floor(Math.random() * youtubeComments.length)]
              .userComment
        }
        console.log('selectedYoutubeComment:', selectedComment)

        handleSendChat(selectedComment)
      } else {
        const noCommentCount = youtubeNoCommentCount + 1
        if (ss.conversationContinuityMode) {
          if (
            noCommentCount < 3 ||
            (3 < noCommentCount && noCommentCount < 6)
          ) {
            // 会話の続きを生成
            const continuationMessage = await getMessagesForContinuation(
              ss.systemPrompt,
              messages
            )
            preProcessAIResponse(continuationMessage)
          } else if (noCommentCount === 3) {
            // 新しいトピックを生成
            const anotherTopic = await getAnotherTopic(
              messages,
              aiApiKey,
              ss.selectAIService,
              ss.selectAIModel
            )
            console.log('anotherTopic:', anotherTopic)
            const newTopicMessage = await getMessagesForNewTopic(
              ss.systemPrompt,
              messages,
              anotherTopic
            )
            preProcessAIResponse(newTopicMessage)
          } else if (noCommentCount === 6) {
            // スリープモードにする
            const messagesForSleep = await getMessagesForSleep(
              ss.systemPrompt,
              messages
            )
            preProcessAIResponse(messagesForSleep)
            setYoutubeSleepMode(true)
          }
        }
        console.log('YoutubeNoCommentCount:', noCommentCount)
        setYoutubeNoCommentCount(noCommentCount)
      }
    }
  } catch (error) {
    console.error('Error fetching comments:', error)
  }
}
