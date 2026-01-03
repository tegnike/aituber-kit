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
}

const slideStore = create<SlideState>()(
  persist(
    (): SlideState => ({
      isPlaying: false,
      isReverse: false,
      currentSlide: 0,
      selectedSlideDocs: '',
      autoPlay: true,
      audioPreload: {
        isLoading: false,
        progress: 0,
        loadedPages: new Set<number>(),
        error: null,
      },
    }),
    {
      name: 'aitube-kit-slide',
      partialize: (state) => ({ selectedSlideDocs: state.selectedSlideDocs }),
    }
  )
)

export default slideStore
