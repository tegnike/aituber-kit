import { create } from 'zustand'

type SettingsTabKey =
  | 'description'
  | 'based'
  | 'character'
  | 'ai'
  | 'voice'
  | 'speechInput'
  | 'youtube'
  | 'slide'
  | 'log'
  | 'other'
interface MenuState {
  showWebcam: boolean
  showCapture: boolean
  fileInput: HTMLInputElement | null
  bgFileInput: HTMLInputElement | null
  slideVisible: boolean
  activeSettingsTab: SettingsTabKey
}

const menuStore = create<MenuState>((set, get) => ({
  showWebcam: false,
  showCapture: false,
  fileInput: null,
  bgFileInput: null,
  slideVisible: false,
  activeSettingsTab: 'description',
}))

export default menuStore
