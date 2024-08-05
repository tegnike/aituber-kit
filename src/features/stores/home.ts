import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Message } from '@/features/messages/messages';
import { Viewer } from '../vrmViewer/viewer';

interface HomeState {
  // persisted states
  chatLog: Message[];
  codeLog: Message[];
  dontShowIntroduction: boolean;

  // transient states
  viewer: Viewer;
  assistantMessage: string;
  chatProcessing: boolean;
  chatProcessingCount: number;
  incrementChatProcessingCount: () => void;
  decrementChatProcessingCount: () => void;
  backgroundImageUrl: string;
  modalImage: string;
  triggerShutter: boolean;
  webcamStatus: boolean;
  ws: WebSocket | null;
  voicePlaying: boolean; // WebSocketモード用の設定
}

const homeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      // persisted states
      chatLog: [],
      codeLog: [],
      dontShowIntroduction: false,

      // transient states
      viewer: new Viewer(),
      assistantMessage: '',
      chatProcessing: false,
      chatProcessingCount: 0,
      incrementChatProcessingCount: () => {
        set(({ chatProcessingCount }) => ({
          chatProcessingCount: chatProcessingCount + 1,
        }));
      },
      decrementChatProcessingCount: () => {
        set(({ chatProcessingCount }) => ({
          chatProcessingCount: chatProcessingCount - 1,
        }));
      },
      backgroundImageUrl:
        process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_PATH ?? '/bg-c.png',
      modalImage: '',
      triggerShutter: false,
      webcamStatus: false,
      ws: null,
      voicePlaying: false,
    }),
    {
      name: 'home',
      partialize: ({ chatLog, codeLog, dontShowIntroduction }) => ({
        chatLog,
        codeLog,
        dontShowIntroduction,
      }),
    },
  ),
);
export default homeStore;
