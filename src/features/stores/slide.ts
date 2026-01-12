import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AudioPreloadState {
  isLoading: boolean
  progress: number // 0-100
  loadedPages: Set<number>
  error: string | null
}

interface SlideState {
  isPlaying: boolean
  isReverse: boolean
  currentSlide: number
  selectedSlideDocs: string
  autoPlay: boolean
  audioPreload: AudioPreloadState
  freeConversationMode: boolean // プレゼン終了後の自由会話モード
}

const defaultSlideDocs =
  process.env.NEXT_PUBLIC_DEFAULT_SLIDE_DOCS || 'DHGSVR25-3'

const slideStore = create<SlideState>()(
  persist(
    (): SlideState => ({
      isPlaying: false,
      isReverse: false,
      currentSlide: 0,
      selectedSlideDocs: defaultSlideDocs,
      autoPlay: true,
      audioPreload: {
        isLoading: false,
        progress: 0,
        loadedPages: new Set<number>(),
        error: null,
      },
      freeConversationMode: false,
    }),
    {
      name: 'aitube-kit-slide',
      partialize: (state) => ({ selectedSlideDocs: state.selectedSlideDocs }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SlideState>
        return {
          ...currentState,
          // 空の場合はデフォルト値を使用
          selectedSlideDocs: persisted?.selectedSlideDocs || defaultSlideDocs,
        }
      },
    }
  )
)

export default slideStore
