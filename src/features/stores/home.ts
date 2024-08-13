import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Message } from '@/features/messages/messages'
import { Viewer } from '../vrmViewer/viewer'

export interface PersistedState {
  userOnboarded: boolean
  chatLog: Message[]
  codeLog: Message[]
  dontShowIntroduction: boolean
}

export interface TransientState {
  viewer: Viewer
  assistantMessage: string
  slideMessages: string[]
  chatProcessing: boolean
  chatProcessingCount: number
  incrementChatProcessingCount: () => void
  decrementChatProcessingCount: () => void
  backgroundImageUrl: string
  modalImage: string
  triggerShutter: boolean
  webcamStatus: boolean
  ws: WebSocket | null
  voicePlaying: boolean // WebSocketモード用の設定
}

export type HomeState = PersistedState & TransientState

const homeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      // persisted states
      userOnboarded: false,
      chatLog: [],
      codeLog: [],
      dontShowIntroduction: false,

      // transient states
      viewer: new Viewer(),
      assistantMessage: '',
      slideMessages: [],
      chatProcessing: false,
      chatProcessingCount: 0,
      incrementChatProcessingCount: () => {
        set(({ chatProcessingCount }) => ({
          chatProcessingCount: chatProcessingCount + 1,
        }))
      },
      decrementChatProcessingCount: () => {
        set(({ chatProcessingCount }) => ({
          chatProcessingCount: chatProcessingCount - 1,
        }))
      },
      backgroundImageUrl:
        process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_PATH ?? '/bg-c.png',
      modalImage: '',
      triggerShutter: false,
      webcamStatus: false,
      ws: null,
      voicePlaying: false,
    }),
    {
      name: 'aitube-kit-home',
      partialize: ({ chatLog, codeLog, dontShowIntroduction }) => ({
        chatLog,
        codeLog,
        dontShowIntroduction,
      }),
    }
  )
)
export default homeStore
