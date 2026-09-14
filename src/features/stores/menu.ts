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
  screenLightingCaptureOwned: boolean
  screenLightingPreviousDisplaySettings: {
    hideVideoDisplay: boolean
    useVideoAsBackground: boolean
  } | null
  fileInput: HTMLInputElement | null
  slideVisible: boolean
  thumbnailVisible: boolean
  activeSettingsTab: SettingsTabKey
  settingsSearchQuery: string
}

const menuStore = create<MenuState>((set, get) => ({
  showWebcam: false,
  showCapture: false,
  screenLightingCaptureOwned: false,
  screenLightingPreviousDisplaySettings: null,
  fileInput: null,
  slideVisible: false,
  thumbnailVisible: false,
  activeSettingsTab: 'quickStart',
  settingsSearchQuery: '',
}))

export default menuStore
