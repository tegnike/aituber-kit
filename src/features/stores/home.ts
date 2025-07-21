import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Message } from '@/features/messages/messages'
import { Viewer } from '../vrmViewer/viewer'
import { messageSelectors } from '../messages/messageSelectors'
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch'
import { generateMessageId } from '@/utils/messageUtils'

export interface PersistedState {
  userOnboarded: boolean
  chatLog: Message[]
  showIntroduction: boolean
}

export interface TransientState {
  viewer: Viewer
  live2dViewer: any
  slideMessages: string[]
  chatProcessing: boolean
  chatProcessingCount: number
  incrementChatProcessingCount: () => void
  decrementChatProcessingCount: () => void
  upsertMessage: (message: Partial<Message>) => void
  backgroundImageUrl: string
  modalImage: string
  triggerShutter: boolean
  webcamStatus: boolean
  captureStatus: boolean
  isCubismCoreLoaded: boolean
  setIsCubismCoreLoaded: (loaded: boolean) => void
  isLive2dLoaded: boolean
  setIsLive2dLoaded: (loaded: boolean) => void
  isSpeaking: boolean
}

export type HomeState = PersistedState & TransientState

// 更新の一時的なバッファリングを行うための変数
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null
const SAVE_DEBOUNCE_DELAY = 2000 // 2秒
let lastSavedLogLength = 0 // 最後に保存したログの長さを記録
// 履歴削除後に次回保存で新規ファイルを作成するかどうかを示すフラグ
let shouldCreateNewFile = false

// ログ保存状態をリセットする共通関数
const resetSaveState = () => {
  console.log('Chat log was cleared, resetting save state.')
  lastSavedLogLength = 0
  shouldCreateNewFile = true
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer)
  }
}

const homeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      // persisted states
      userOnboarded: false,
      chatLog: [],
      showIntroduction: process.env.NEXT_PUBLIC_SHOW_INTRODUCTION !== 'false',

      // transient states
      viewer: new Viewer(),
      live2dViewer: null,
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
      upsertMessage: (message) => {
        set((state) => {
          const currentChatLog = state.chatLog
          const messageId = message.id ?? generateMessageId()
          const existingMessageIndex = currentChatLog.findIndex(
            (msg) => msg.id === messageId
          )

          let updatedChatLog: Message[]

          if (existingMessageIndex > -1) {
            updatedChatLog = [...currentChatLog]
            const existingMessage = updatedChatLog[existingMessageIndex]

            updatedChatLog[existingMessageIndex] = {
              ...existingMessage,
              ...message,
              id: messageId,
            }
            console.log(`Message updated: ID=${messageId}`)
          } else {
            if (!message.role || message.content === undefined) {
              console.error(
                'Cannot add message without role or content',
                message
              )
              return { chatLog: currentChatLog }
            }
            const newMessage: Message = {
              id: messageId,
              role: message.role,
              content: message.content,
              ...(message.audio && { audio: message.audio }),
              ...(message.timestamp && { timestamp: message.timestamp }),
            }
            updatedChatLog = [...currentChatLog, newMessage]
            console.log(`Message added: ID=${messageId}`)
          }

          return { chatLog: updatedChatLog }
        })
      },
      backgroundImageUrl:
        process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_PATH ??
        '/backgrounds/bg-c.png',
      modalImage: '',
      triggerShutter: false,
      webcamStatus: false,
      captureStatus: false,
      isCubismCoreLoaded: false,
      setIsCubismCoreLoaded: (loaded) =>
        set(() => ({ isCubismCoreLoaded: loaded })),
      isLive2dLoaded: false,
      setIsLive2dLoaded: (loaded) => set(() => ({ isLive2dLoaded: loaded })),
      isSpeaking: false,
    }),
    {
      name: 'aitube-kit-home',
      partialize: ({ chatLog, showIntroduction }) => ({
        chatLog: messageSelectors.cutImageMessage(chatLog),
        showIntroduction,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          lastSavedLogLength = state.chatLog.length
          console.log('Rehydrated chat log length:', lastSavedLogLength)
        }
      },
    }
  )
)

// chatLogの変更を監視して差分を保存
homeStore.subscribe((state, prevState) => {
  if (state.chatLog !== prevState.chatLog && state.chatLog.length > 0) {
    if (lastSavedLogLength > state.chatLog.length) {
      resetSaveState()
    }

    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer)
    }

    saveDebounceTimer = setTimeout(() => {
      // 新規追加 or 更新があったメッセージだけを抽出
      const newMessagesToSave = state.chatLog.filter(
        (msg, idx) =>
          idx >= lastSavedLogLength || // 追加分
          prevState.chatLog.find((p) => p.id === msg.id)?.content !==
            msg.content // 更新分
      )

      if (newMessagesToSave.length > 0) {
        const processedMessages = newMessagesToSave.map((msg) =>
          messageSelectors.sanitizeMessageForStorage(msg)
        )

        console.log(`Saving ${processedMessages.length} new messages...`)

        void fetch('/api/save-chat-log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: processedMessages,
            isNewFile: shouldCreateNewFile,
          }),
        })
          .then((response) => {
            if (response.ok) {
              lastSavedLogLength = state.chatLog.length
              // 新規ファイルが作成された場合はフラグをリセット
              shouldCreateNewFile = false
              console.log(
                'Messages saved successfully. New saved length:',
                lastSavedLogLength
              )
            } else {
              console.error('Failed to save chat log:', response.statusText)
            }
          })
          .catch((error) => {
            console.error('チャットログの保存中にエラーが発生しました:', error)
          })
      } else {
        console.log('No new messages to save.')
      }
    }, SAVE_DEBOUNCE_DELAY)
  } else if (
    state.chatLog !== prevState.chatLog &&
    state.chatLog.length === 0
  ) {
    resetSaveState()
  }
})

export default homeStore
