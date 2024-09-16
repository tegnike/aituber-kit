import { create } from 'zustand'

interface MenuState {
  showWebcam: boolean
  showCapture: boolean
  fileInput: HTMLInputElement | null
  bgFileInput: HTMLInputElement | null
  slideVisible: boolean
}

const menuStore = create<MenuState>((set, get) => ({
  showWebcam: false,
  showCapture: false,
  fileInput: null,
  bgFileInput: null,
  slideVisible: true,
}))
export default menuStore
