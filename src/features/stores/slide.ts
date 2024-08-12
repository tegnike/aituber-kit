import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SlideState {
  isPlaying: boolean
  currentSlide: number
  selectedSlideDocs: string
}

const slideStore = create<SlideState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      currentSlide: 0,
      selectedSlideDocs: '',
    }),
    {
      name: 'aitube-kit-slide',
      partialize: (state) => ({ selectedSlideDocs: state.selectedSlideDocs }),
    }
  )
)

export default slideStore
