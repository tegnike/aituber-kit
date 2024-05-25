import { Message } from "@/features/messages/messages";
import { 
  getBestComment,
  getMessagesForSleep,
  getAnotherTopic,
  getMessagesForNewTopic,
  checkIfResponseContinuationIsRequired,
  getMessagesForContinuation
} from "@/features/youtube/selfTalkFunctions";

export const getLiveChatId = async (liveId: string, youtubeKey: string): Promise<string> => {
  const params = {
    part: 'liveStreamingDetails',
    id: liveId,
    key: youtubeKey,
  }
  const query = new URLSearchParams(params)
  const response = await fetch(`https://youtube.googleapis.com/youtube/v3/videos?${query}`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json'
    },
  })
  const json = await response.json();
  if (json.items.length == 0) {
    return "";
  }
  const liveChatId = json.items[0].liveStreamingDetails.activeLiveChatId
  return liveChatId;
}

const retrieveLiveComments = async (
  activeLiveChatId: string, 
  youtubeKey: string, 
  youtubeNextPageToken: string,
  setYoutubeNextPageToken: (token: string) => void
): Promise<[]> => {
  let url = "https://youtube.googleapis.com/youtube/v3/liveChat/messages?liveChatId=" + activeLiveChatId + '&part=authorDetails%2Csnippet&key=' + youtubeKey
  if (youtubeNextPageToken !== "") {
    url = url + "&pageToken=" + youtubeNextPageToken
  }
  const response = await fetch(url, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  const json = await response.json()
  const items = json.items;
  setYoutubeNextPageToken(json.nextPageToken);

  const comments = items.map((item: any) => ({
    userName: item.authorDetails.displayName,
    userIconUrl: item.authorDetails.profileImageUrl,
    userComment: item.snippet.textMessageDetails?.messageText || item.snippet.superChatDetails?.userComment || ""
  })).filter((comment: any) => comment.userComment !== "" && !comment.userComment.startsWith("#"));

  return comments;
}

export const fetchAndProcessComments = async (
  messages: Message[],
  liveId: string,
  youtubeKey: string,
  youtubeNextPageToken: string,
  setYoutubeNextPageToken: (token: string) => void,
  youtubeNoCommentCount: number,
  setYoutubeNoCommentCount: (count: number) => void,
  handleSendChat: (text: string, role?: string) => void,
  preProcessAIResponse: (messages: Message[]) => void
): Promise<void> => {
  if (liveId && youtubeKey) {
    try {
      const liveChatId = await getLiveChatId(liveId, youtubeKey);

      if (liveChatId) {
        const isContinuationNeeded = await checkIfResponseContinuationIsRequired(messages);
        if (isContinuationNeeded) {
          const continuationMessage = await getMessagesForContinuation(messages);
          preProcessAIResponse(continuationMessage);
          return;
        }

        const youtubeComments = await retrieveLiveComments(liveChatId, youtubeKey, youtubeNextPageToken, setYoutubeNextPageToken);

        // ランダムなコメントを選択して送信
        if (youtubeComments.length > 0) {
          let selectedComment = "";
          if (youtubeComments.length > 1) {
            selectedComment = await getBestComment(messages, youtubeComments);
          } else {
            selectedComment = youtubeComments[0].userComment;
          }

          handleSendChat(selectedComment);
        } else {
          setYoutubeNoCommentCount(youtubeNoCommentCount + 1);
          if (youtubeNoCommentCount < 3 || 3 < youtubeNoCommentCount && youtubeNoCommentCount < 6) {
            const continuationMessage = await getMessagesForContinuation(messages);
            preProcessAIResponse(continuationMessage);
          } else {
            if (youtubeNoCommentCount === 3) {
              const anotherTopic = await getAnotherTopic(messages);
              const newTopicMessage = await getMessagesForNewTopic(messages, anotherTopic);
              preProcessAIResponse(newTopicMessage);
            } else {
              const messagesForSleep = await getMessagesForSleep(messages);
              preProcessAIResponse(messagesForSleep);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }
}
