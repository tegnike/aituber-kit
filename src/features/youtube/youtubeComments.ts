import { Message } from "@/features/messages/messages";

// YouTube LIVEのコメント取得のページング
let nextPageToken = "";

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

export const retrieveLiveComments = async (activeLiveChatId: string, youtubeKey: string, handleSendChat: (text: string) => void): Promise<void> => {
  let url = "https://youtube.googleapis.com/youtube/v3/liveChat/messages?liveChatId=" + activeLiveChatId + '&part=authorDetails%2Csnippet&key=' + youtubeKey
  if (nextPageToken !== "") {
    url = url + "&pageToken=" + nextPageToken
  }
  const response = await fetch(url, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  const json = await response.json()
  const items = json.items;
  nextPageToken = json.nextPageToken;

  const comments = items.map((item: any) => ({
    userName: item.authorDetails.displayName,
    userIconUrl: item.authorDetails.profileImageUrl,
    userComment: item.snippet.textMessageDetails?.messageText || item.snippet.superChatDetails?.userComment || ""
  })).filter((comment: any) => comment.userComment !== "" && !comment.userComment.startsWith("#"));

  console.log(comments);

  // ランダムなコメントを選択して送信
  if (comments.length > 0) {
    const randomComment = comments[Math.floor(Math.random() * comments.length)].userComment;
    handleSendChat(randomComment);
  }
}

export const fetchAndProcessComments = async (liveId: string, youtubeKey: string, handleSendChat: (text: string) => void): Promise<void> => {
  if (youtubeKey && liveId) {
    try {
      const liveChatId = await getLiveChatId(liveId, youtubeKey);
      if (liveChatId) {
        await retrieveLiveComments(liveChatId, youtubeKey, handleSendChat);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }
}
