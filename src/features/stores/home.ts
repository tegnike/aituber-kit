import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Message } from '@/features/messages/messages'
import { Viewer } from '../vrmViewer/viewer'
import { messageSelectors } from '../messages/messageSelectors'

export interface PersistedState {
  userOnboarded: boolean
  chatLog: Message[]
  showIntroduction: boolean
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
}

export type HomeState = PersistedState & TransientState

const homeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      // persisted states
      userOnboarded: false,
      chatLog: [],
      showIntroduction: process.env.NEXT_PUBLIC_SHOW_INTRODUCTION !== 'false',
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
    }),
    {
      name: 'aitube-kit-home',
      partialize: ({ chatLog, showIntroduction }) => ({
        chatLog: messageSelectors.cutImageMessage(chatLog),
        showIntroduction,
      }),
    }
  )
)

// chatLogの変更を監視して保存
homeStore.subscribe((state, prevState) => {
  if (state.chatLog !== prevState.chatLog && state.chatLog.length > 0) {
    fetch('/api/save-chat-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: state.chatLog,
        isNewFile: prevState.chatLog.length === 0,
      }),
    }).catch((error) => console.error('Error saving chat log:', error))
  }
})

export default homeStore
