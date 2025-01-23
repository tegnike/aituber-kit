import { create } from 'zustand'

type SettingsTabKey = 'general' | 'ai' | 'youtube' | 'voice' | 'slide' | 'other'

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
  slideVisible: true,
  activeSettingsTab: 'general',
}))

export default menuStore
