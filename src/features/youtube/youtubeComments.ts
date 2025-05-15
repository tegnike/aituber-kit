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
import { processAIResponse } from '../chat/handlers'
import homeStore from '@/features/stores/home'
import { messageSelectors } from '../messages/messageSelectors'

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
  handleSendChat: (text: string) => void
): Promise<void> => {
  const ss = settingsStore.getState()
  const hs = homeStore.getState()
  const chatLog = messageSelectors.getTextAndImageMessages(hs.chatLog)

  try {
    const liveChatId = await getLiveChatId(ss.youtubeLiveId, ss.youtubeApiKey)

    if (liveChatId) {
      // 会話の継続が必要かどうかを確認
      if (
        !ss.youtubeSleepMode &&
        ss.youtubeContinuationCount < 1 &&
        ss.conversationContinuityMode
      ) {
        const isContinuationNeeded =
          await checkIfResponseContinuationIsRequired(chatLog)
        if (isContinuationNeeded) {
          const continuationMessage = await getMessagesForContinuation(
            ss.systemPrompt,
            chatLog
          )
          processAIResponse(continuationMessage)
          settingsStore.setState({
            youtubeContinuationCount: ss.youtubeContinuationCount + 1,
          })
          if (ss.youtubeNoCommentCount < 1) {
            settingsStore.setState({ youtubeNoCommentCount: 1 })
          }
          return
        }
      }
      settingsStore.setState({ youtubeContinuationCount: 0 })

      // コメントを取得
      const youtubeComments = await retrieveLiveComments(
        liveChatId,
        ss.youtubeApiKey,
        ss.youtubeNextPageToken,
        (token: string) =>
          settingsStore.setState({ youtubeNextPageToken: token })
      )
      // ランダムなコメントを選択して送信
      if (youtubeComments.length > 0) {
        settingsStore.setState({ youtubeNoCommentCount: 0 })
        settingsStore.setState({ youtubeSleepMode: false })
        let selectedComment = ''
        if (ss.conversationContinuityMode) {
          selectedComment = await getBestComment(chatLog, youtubeComments)
        } else {
          selectedComment =
            youtubeComments[Math.floor(Math.random() * youtubeComments.length)]
              .userComment
        }
        console.log('selectedYoutubeComment:', selectedComment)

        handleSendChat(selectedComment)
      } else {
        const noCommentCount = ss.youtubeNoCommentCount + 1
        if (ss.conversationContinuityMode) {
          if (
            noCommentCount < 3 ||
            (3 < noCommentCount && noCommentCount < 6)
          ) {
            // 会話の続きを生成
            const continuationMessage = await getMessagesForContinuation(
              ss.systemPrompt,
              chatLog
            )
            processAIResponse(continuationMessage)
          } else if (noCommentCount === 3) {
            // 新しいトピックを生成
            const anotherTopic = await getAnotherTopic(chatLog)
            console.log('anotherTopic:', anotherTopic)
            const newTopicMessage = await getMessagesForNewTopic(
              ss.systemPrompt,
              chatLog,
              anotherTopic
            )
            processAIResponse(newTopicMessage)
          } else if (noCommentCount === 6) {
            // スリープモードにする
            const messagesForSleep = await getMessagesForSleep(
              ss.systemPrompt,
              chatLog
            )
            processAIResponse(messagesForSleep)
            settingsStore.setState({ youtubeSleepMode: true })
          }
        }
        console.log('YoutubeNoCommentCount:', noCommentCount)
        settingsStore.setState({ youtubeNoCommentCount: noCommentCount })
      }
    }
  } catch (error) {
    console.error('Error fetching comments:', error)
  }
}
