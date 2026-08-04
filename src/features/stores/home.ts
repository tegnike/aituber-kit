import { logger } from '@/lib/logger'
import { create } from 'zustand'
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware'

import { Message } from '@/features/messages/messages'
import { Viewer } from '../vrmViewer/viewer'
import { messageSelectors } from '../messages/messageSelectors'
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch'
import { generateMessageId } from '@/utils/messageUtils'
import { addEmbeddingsToMessages } from '@/features/memory/memoryStoreSync'
import type { SanitizedMessage } from '../messages/messageSelectors'
import { PresenceState, PresenceError } from '@/features/presence/presenceTypes'
import { isRestrictedMode } from '@/utils/restrictedMode'
import { PNGTuberEngine } from '@/features/pngTuber/pngTuberEngine'

// Live2DComponent が Object.assign で位置制御関数を合成した Live2D モデル
type Live2DViewer = InstanceType<typeof Live2DModel> & {
  fixPosition?: () => void
  unfixPosition?: () => void
  resetPosition?: () => void
  saveModelPosition?: () => void
}

export interface PersistedState {
  userOnboarded: boolean
  chatLog: Message[]
  showIntroduction: boolean
}

export interface TransientState {
  viewer: Viewer
  live2dViewer: Live2DViewer | null
  pngTuberViewer: PNGTuberEngine | null
  slideMessages: string[]
  activeSpeech: { id: string; text: string } | null
  chatProcessing: boolean
  chatProcessingCount: number
  incrementChatProcessingCount: () => void
  decrementChatProcessingCount: () => void
  upsertMessage: (message: Partial<Message>) => void
  modalImage: string
  triggerShutter: boolean
  webcamStatus: boolean
  captureStatus: boolean
  isCubismCoreLoaded: boolean
  setIsCubismCoreLoaded: (loaded: boolean) => void
  isLive2dLoaded: boolean
  setIsLive2dLoaded: (loaded: boolean) => void
  isSpeaking: boolean
  // Presence detection transient state
  presenceState: PresenceState
  presenceError: PresenceError | null
  lastDetectionTime: number | null
}

export type HomeState = PersistedState & TransientState

const HOME_STORAGE_KEY = 'aitube-kit-home'
const HOME_STORAGE_WRITE_DEBOUNCE_MS = 750

let pendingHomePersistValue: string | null = null
let homePersistTimer: ReturnType<typeof setTimeout> | null = null
let homePersistListenersRegistered = false

const flushPendingHomePersist = () => {
  if (typeof window === 'undefined' || pendingHomePersistValue === null) {
    return
  }

  window.localStorage.setItem(HOME_STORAGE_KEY, pendingHomePersistValue)
  pendingHomePersistValue = null
}

const scheduleHomePersistWrite = (value: string) => {
  pendingHomePersistValue = value

  if (typeof window === 'undefined') {
    return
  }

  if (homePersistTimer) {
    clearTimeout(homePersistTimer)
  }

  homePersistTimer = setTimeout(() => {
    homePersistTimer = null
    flushPendingHomePersist()
  }, HOME_STORAGE_WRITE_DEBOUNCE_MS)
}

const clearPendingHomePersist = () => {
  pendingHomePersistValue = null
  if (homePersistTimer) {
    clearTimeout(homePersistTimer)
    homePersistTimer = null
  }
}

const registerHomePersistFlushListeners = () => {
  if (typeof window === 'undefined' || homePersistListenersRegistered) {
    return
  }

  const flush = () => {
    if (homePersistTimer) {
      clearTimeout(homePersistTimer)
      homePersistTimer = null
    }
    flushPendingHomePersist()
  }

  window.addEventListener('pagehide', flush)
  window.addEventListener('beforeunload', flush)
  homePersistListenersRegistered = true
}

const homePersistStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') {
      return null
    }
    return window.localStorage.getItem(name)
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') {
      return
    }

    if (name !== HOME_STORAGE_KEY) {
      window.localStorage.setItem(name, value)
      return
    }

    registerHomePersistFlushListeners()
    scheduleHomePersistWrite(value)
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') {
      return
    }

    if (name === HOME_STORAGE_KEY) {
      clearPendingHomePersist()
    }

    window.localStorage.removeItem(name)
  },
}

// 更新の一時的なバッファリングを行うための変数
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null
const SAVE_DEBOUNCE_DELAY = 2000 // 2秒
let lastSavedLogLength = 0 // 最後に保存したログの長さを記録
// 履歴削除後に次回保存で新規ファイルを作成するかどうかを示すフラグ
let shouldCreateNewFile = false
// チャットログ復元中フラグ（embedding取得をスキップするため）
let isRestoringChatLog = false
// 保存先ログファイル名
let targetLogFileName: string | null = null

// チャットログ復元中フラグを設定
export const setRestoringChatLog = (value: boolean): void => {
  isRestoringChatLog = value
}

// チャットログ復元中かどうかを取得
export const getRestoringChatLog = (): boolean => {
  return isRestoringChatLog
}

// 保存先ログファイル名を設定
export const setTargetLogFileName = (fileName: string | null): void => {
  targetLogFileName = fileName
}

// 保存先ログファイル名を取得
export const getTargetLogFileName = (): string | null => {
  return targetLogFileName
}

// ログ保存状態をリセットする共通関数
const resetSaveState = () => {
  logger.log('Chat log was cleared, resetting save state.')
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
      pngTuberViewer: null,
      slideMessages: [],
      activeSpeech: null,
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
          } else {
            if (!message.role || message.content === undefined) {
              logger.error(
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
              ...(message.userName && { userName: message.userName }),
              ...(message.thinking && { thinking: message.thinking }),
            }
            updatedChatLog = [...currentChatLog, newMessage]
          }

          return { chatLog: updatedChatLog }
        })
      },
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
      // Presence detection initial state
      presenceState: 'idle',
      presenceError: null,
      lastDetectionTime: null,
    }),
    {
      name: HOME_STORAGE_KEY,
      storage: createJSONStorage(() => homePersistStorage),
      partialize: ({ chatLog, showIntroduction }) => ({
        chatLog: messageSelectors.cutImageMessage(chatLog),
        showIntroduction,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          lastSavedLogLength = state.chatLog.length
          logger.log('Rehydrated chat log length:', lastSavedLogLength)
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

    saveDebounceTimer = setTimeout(async () => {
      // 新規追加 or 更新があったメッセージだけを抽出
      const newMessagesToSave = state.chatLog.filter(
        (msg, idx) =>
          idx >= lastSavedLogLength || // 追加分
          prevState.chatLog.find((p) => p.id === msg.id)?.content !==
            msg.content // 更新分
      )

      if (newMessagesToSave.length > 0) {
        if (isRestrictedMode()) {
          lastSavedLogLength = state.chatLog.length
          shouldCreateNewFile = false
          return
        }

        const processedMessages = newMessagesToSave.map((msg) =>
          messageSelectors.sanitizeMessageForStorage(msg)
        )

        // メモリ機能が有効な場合、Embeddingを付与してから保存
        let messagesWithEmbedding: SanitizedMessage[]
        try {
          messagesWithEmbedding = await addEmbeddingsToMessages(
            processedMessages as Message[]
          )
        } catch (error) {
          logger.warn(
            'Failed to add embeddings, saving without embeddings:',
            error
          )
          messagesWithEmbedding = processedMessages
        }

        logger.log(`Saving ${messagesWithEmbedding.length} new messages...`)

        if (typeof fetch !== 'function') {
          logger.warn('fetch is unavailable. Skipping chat log save.')
          return
        }

        void fetch('/api/save-chat-log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messagesWithEmbedding,
            isNewFile: shouldCreateNewFile,
          }),
        })
          .then((response) => {
            if (response.ok) {
              lastSavedLogLength = state.chatLog.length
              // 新規ファイルが作成された場合はフラグをリセット
              shouldCreateNewFile = false
              logger.log(
                'Messages saved successfully. New saved length:',
                lastSavedLogLength
              )
            } else {
              logger.error('Failed to save chat log:', response.statusText)
            }
          })
          .catch((error) => {
            logger.error('チャットログの保存中にエラーが発生しました:', error)
          })
      } else {
        logger.log('No new messages to save.')
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
