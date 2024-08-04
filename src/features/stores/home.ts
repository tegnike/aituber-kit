import { create } from 'zustand';

interface HomeState {
  assistantMessage: string;
  chatProcessing: boolean;
  chatProcessingCount: number;
  incrementChatProcessingCount: () => void;
  decrementChatProcessingCount: () => void;
  backgroundImageUrl: string;
  modalImage: string;
  triggerShutter: boolean;
  webcamStatus: boolean;
}

const homeStore = create<HomeState>((set, get) => ({
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
}));
export default homeStore;
