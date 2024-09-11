import { create } from 'zustand'

interface MenuState {
  showWebcam: boolean
  showCapture: boolean
  showControlPanel: boolean
  fileInput: HTMLInputElement | null
  bgFileInput: HTMLInputElement | null
  slideVisible: boolean
}

const menuStore = create<MenuState>((set, get) => ({
  showWebcam: false,
  showCapture: false,
  showControlPanel: true,
  fileInput: null,
  bgFileInput: null,
  slideVisible: true,
}))
export default menuStore
