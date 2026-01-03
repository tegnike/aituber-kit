import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SlideState {
  isPlaying: boolean
  isReverse: boolean
  currentSlide: number
  selectedSlideDocs: string
  autoPlay: boolean
}

const slideStore = create<SlideState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      isReverse: false,
      currentSlide: 0,
      selectedSlideDocs: '',
      autoPlay: true,
    }),
    {
      name: 'aitube-kit-slide',
      partialize: (state) => ({ selectedSlideDocs: state.selectedSlideDocs }),
    }
  )
)

export default slideStore
