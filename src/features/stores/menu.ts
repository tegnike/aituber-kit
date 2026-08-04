import { create } from 'zustand'

type SettingsTabKey =
  | 'quickStart'
  | 'description'
  | 'based'
  | 'character'
  | 'ai'
  | 'voice'
  | 'speechInput'
  | 'youtube'
  | 'slide'
  | 'images'
  | 'memory'
  | 'presence'
  | 'idle'
  | 'gameCommentary'
  | 'kiosk'
  | 'other'
interface MenuState {
  showWebcam: boolean
  showCapture: boolean
  fileInput: HTMLInputElement | null
  slideVisible: boolean
  thumbnailVisible: boolean
  activeSettingsTab: SettingsTabKey
  settingsSearchQuery: string
}

const menuStore = create<MenuState>((set, get) => ({
  showWebcam: false,
  showCapture: false,
  fileInput: null,
  slideVisible: false,
  thumbnailVisible: false,
  activeSettingsTab: 'quickStart',
  settingsSearchQuery: '',
}))

export default menuStore
