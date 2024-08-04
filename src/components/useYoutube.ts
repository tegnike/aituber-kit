import { useCallback, useEffect, useState } from 'react';

import { Message } from '@/features/messages/messages';
import store from '@/features/stores/app';
import homeStore from '@/features/stores/home';
import { fetchAndProcessComments } from '@/features/youtube/youtubeComments';
import { processAIResponse } from './handlers';

const INTERVAL_MILL_SECONDS_RETRIEVING_COMMENTS = 5000; // 5秒

interface Params {
  handleSendChat: (text: string, role?: string) => Promise<void>;
}

const useYoutube = async ({ handleSendChat }: Params) => {
  const conversationContinuityMode = store((s) => s.conversationContinuityMode);
  const chatProcessingCount = homeStore((s) => s.chatProcessingCount);

  const [youtubeNextPageToken, setYoutubeNextPageToken] = useState('');
  const [youtubeContinuationCount, setYoutubeContinuationCount] = useState(0);
  const [youtubeNoCommentCount, setYoutubeNoCommentCount] = useState(0);
  const [youtubeSleepMode, setYoutubeSleepMode] = useState(false);

  const preProcessAIResponse = useCallback(async (messages: Message[]) => {
    const s = store.getState();
    await processAIResponse(s.chatLog, messages);
  }, []);

  // YouTubeコメントを取得する処理
  const fetchAndProcessCommentsCallback = useCallback(async () => {
    const s = store.getState();
    const hs = homeStore.getState();

    if (
      !s.openAiKey ||
      !s.youtubeLiveId ||
      !s.youtubeApiKey ||
      hs.chatProcessing ||
      hs.chatProcessingCount > 0
    ) {
      return;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, INTERVAL_MILL_SECONDS_RETRIEVING_COMMENTS),
    );
    console.log('Call fetchAndProcessComments !!!');

    fetchAndProcessComments(
      s.chatLog,
      s.selectAIService === 'anthropic' ? s.anthropicKey : s.openAiKey,
      s.youtubeLiveId,
      s.youtubeApiKey,
      youtubeNextPageToken,
      setYoutubeNextPageToken,
      youtubeNoCommentCount,
      setYoutubeNoCommentCount,
      youtubeContinuationCount,
      setYoutubeContinuationCount,
      youtubeSleepMode,
      setYoutubeSleepMode,
      handleSendChat,
      preProcessAIResponse,
    );
  }, [
    youtubeNextPageToken,
    youtubeNoCommentCount,
    youtubeContinuationCount,
    youtubeSleepMode,
    handleSendChat,
    preProcessAIResponse,
  ]);

  useEffect(() => {
    console.log('chatProcessingCount:', chatProcessingCount);
    fetchAndProcessCommentsCallback();
  }, [
    chatProcessingCount,
    fetchAndProcessCommentsCallback,
    conversationContinuityMode,
  ]);

  useEffect(() => {
    if (youtubeNoCommentCount < 1) return;
    // console.log('youtubeSleepMode:', youtubeSleepMode);
    setTimeout(() => {
      fetchAndProcessCommentsCallback();
    }, INTERVAL_MILL_SECONDS_RETRIEVING_COMMENTS);
  }, [
    youtubeNoCommentCount,
    fetchAndProcessCommentsCallback,
    conversationContinuityMode,
  ]);
};
export default useYoutube;
