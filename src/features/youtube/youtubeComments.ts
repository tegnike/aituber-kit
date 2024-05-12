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

export const retrieveLiveComments = async (activeLiveChatId: string, youtubeKey: string, handleSendChat: (text: string, role?: string) => void): Promise<void> => {
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
  } else {
    const randomNumber = Math.floor(Math.random() * 10) + 1; // 1~10の乱数
    let randomComment = "";

    if (randomNumber === 1) {
      randomComment = "会話の話題をガラッと変えたいです。会話に不自然さがでないように上手に切り替えてください。";
    } else if (randomNumber === 2) {
      randomComment = "この続きを口調を合わせて発言してください";
    } else if (randomNumber === 3) {
      randomComment = "この会話に関連する質問をしてください。";
    } else if (randomNumber === 4) {
      randomComment = "この会話に対する共感や同意を示してください。";
    } else if (randomNumber === 5) {
      randomComment = "この会話に関連する話題や情報を提供してください。";
    } else if (randomNumber === 6) {
      randomComment = "この会話に関連する経験談を共有してください。";
    } else if (randomNumber === 7) {
      randomComment = "この会話に対して、自分の意見を述べてください。";
    } else if (randomNumber === 8) {
      randomComment = "この会話について、もう少し掘り下げて議論を深めてください。";
    } else if (randomNumber === 9) {
      randomComment = "この会話を別の角度からとらえて、新しい視点を提示してください。";
    } else if (randomNumber === 10) {
      randomComment = "新しい話題を提案し、ユーザーの意見を聞いてください。";
    }
    handleSendChat(randomComment, "assistant");
  }
}

export const fetchAndProcessComments = async (liveId: string, youtubeKey: string, handleSendChat: (text: string, role?: string) => void): Promise<void> => {
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
