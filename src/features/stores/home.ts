import { create } from 'zustand';

interface HomeState {
  chatProcessing: boolean;
  chatProcessingCount: number;
  incrementChatProcessingCount: () => void;
  decrementChatProcessingCount: () => void;
}

const homeStore = create<HomeState>((set, get) => ({
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
}));
export default homeStore;
