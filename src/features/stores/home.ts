import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Message } from '@/features/messages/messages'
import { Viewer } from '../vrmViewer/viewer'

export interface PersistedState {
  userOnboarded: boolean
  chatLog: Message[]
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
  captureStatus: boolean
  ws: WebSocket | null
  wsStreaming: boolean
}

export type HomeState = PersistedState & TransientState

const homeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      // persisted states
      userOnboarded: false,
      chatLog: [],
      dontShowIntroduction: false,
      assistantMessage: '',

      // transient states
      viewer: new Viewer(),
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
      captureStatus: false,
      ws: null,
      wsStreaming: false,
    }),
    {
      name: 'aitube-kit-home',
      partialize: ({ chatLog, dontShowIntroduction }) => ({
        chatLog: chatLog.map((message: Message) => ({
          ...message,
          content:
            typeof message.content === 'string'
              ? message.content
              : message.content[0].text,
        })),
        dontShowIntroduction,
      }),
    }
  )
)

export default homeStore
