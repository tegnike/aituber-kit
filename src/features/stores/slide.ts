import { create } from 'zustand'

interface SlideState {
  isPlaying: boolean
  currentSlide: number
  selectedSlideDocs: string
}

const slideStore = create<SlideState>((set, get) => ({
  isPlaying: false,
  currentSlide: 0,
  selectedSlideDocs: '',
}))

export default slideStore
