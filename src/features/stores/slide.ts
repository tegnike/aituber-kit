import { create } from 'zustand'

interface SlideState {
  isPlaying: boolean
  currentSlide: number
}

const slideStore = create<SlideState>((set, get) => ({
  isPlaying: false,
  currentSlide: 0,
}))
export default slideStore
