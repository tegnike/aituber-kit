/**
 * @jest-environment node
 */

// Mock the entire Viewer and its deep dependency chain
jest.mock('@/features/vrmViewer/viewer', () => ({
  Viewer: jest.fn().mockImplementation(() => ({
    model: null,
    loadVrm: jest.fn(),
    unloadVRM: jest.fn(),
  })),
}))
jest.mock('pixi-live2d-display-lipsyncpatch', () => ({}))
jest.mock('@/features/memory/memoryStoreSync', () => ({
  addEmbeddingsToMessages: jest.fn((msgs: unknown[]) => Promise.resolve(msgs)),
}))
jest.mock('@/features/messages/messageSelectors', () => ({
  messageSelectors: {
    cutImageMessage: (chatLog: unknown[]) => chatLog,
    sanitizeMessageForStorage: (msg: unknown) => msg,
  },
}))

import homeStore from '@/features/stores/home'
import {
  setRestoringChatLog,
  setTargetLogFileName,
  getTargetLogFileName,
} from '@/features/stores/home'

describe('homeStore', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    // Reset store state
    homeStore.setState({
      chatLog: [],
      chatProcessingCount: 0,
      chatProcessing: false,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('chatProcessingCount', () => {
    it('should increment count', () => {
      homeStore.getState().incrementChatProcessingCount()
      expect(homeStore.getState().chatProcessingCount).toBe(1)
    })

    it('should decrement count', () => {
      homeStore.setState({ chatProcessingCount: 3 })
      homeStore.getState().decrementChatProcessingCount()
      expect(homeStore.getState().chatProcessingCount).toBe(2)
    })

    it('should handle multiple increments', () => {
      homeStore.getState().incrementChatProcessingCount()
      homeStore.getState().incrementChatProcessingCount()
      homeStore.getState().incrementChatProcessingCount()
      expect(homeStore.getState().chatProcessingCount).toBe(3)
    })
  })

  describe('upsertMessage', () => {
    it('should add a new message with generated ID', () => {
      homeStore.getState().upsertMessage({
        role: 'user',
        content: 'Hello',
      })

      const chatLog = homeStore.getState().chatLog
      expect(chatLog).toHaveLength(1)
      expect(chatLog[0].role).toBe('user')
      expect(chatLog[0].content).toBe('Hello')
      expect(chatLog[0].id).toMatch(/^msg_/)
    })

    it('should add message with provided ID', () => {
      homeStore.getState().upsertMessage({
        id: 'custom-id',
        role: 'assistant',
        content: 'Hi there',
      })

      const chatLog = homeStore.getState().chatLog
      expect(chatLog[0].id).toBe('custom-id')
    })

    it('should update existing message by ID', () => {
      homeStore.getState().upsertMessage({
        id: 'msg-1',
        role: 'assistant',
        content: 'First version',
      })

      homeStore.getState().upsertMessage({
        id: 'msg-1',
        content: 'Updated version',
      })

      const chatLog = homeStore.getState().chatLog
      expect(chatLog).toHaveLength(1)
      expect(chatLog[0].content).toBe('Updated version')
    })

    it('should not add message without role', () => {
      homeStore.getState().upsertMessage({
        content: 'No role',
      })

      expect(homeStore.getState().chatLog).toHaveLength(0)
    })

    it('should not add message without content', () => {
      homeStore.getState().upsertMessage({
        role: 'user',
      })

      expect(homeStore.getState().chatLog).toHaveLength(0)
    })

    it('should include optional fields when provided', () => {
      homeStore.getState().upsertMessage({
        role: 'user',
        content: 'Test',
        userName: 'TestUser',
        timestamp: '2024-01-01',
      })

      const msg = homeStore.getState().chatLog[0]
      expect(msg.userName).toBe('TestUser')
      expect(msg.timestamp).toBe('2024-01-01')
    })

    it('should handle multiple messages', () => {
      homeStore.getState().upsertMessage({
        role: 'user',
        content: 'First',
      })
      homeStore.getState().upsertMessage({
        role: 'assistant',
        content: 'Second',
      })
      homeStore.getState().upsertMessage({
        role: 'user',
        content: 'Third',
      })

      expect(homeStore.getState().chatLog).toHaveLength(3)
    })
  })

  describe('module-level state functions', () => {
    it('setTargetLogFileName should set and getTargetLogFileName should retrieve', () => {
      setTargetLogFileName('test-log.json')
      expect(getTargetLogFileName()).toBe('test-log.json')
    })

    it('setTargetLogFileName with null should clear', () => {
      setTargetLogFileName('file.json')
      setTargetLogFileName(null)
      expect(getTargetLogFileName()).toBeNull()
    })

    it('setRestoringChatLog should not throw', () => {
      expect(() => setRestoringChatLog(true)).not.toThrow()
      expect(() => setRestoringChatLog(false)).not.toThrow()
    })
  })

  describe('initial state', () => {
    it('should have empty chatLog', () => {
      expect(homeStore.getState().chatLog).toEqual([])
    })

    it('should have chatProcessingCount at 0', () => {
      expect(homeStore.getState().chatProcessingCount).toBe(0)
    })

    it('should have isSpeaking as false', () => {
      expect(homeStore.getState().isSpeaking).toBe(false)
    })
  })

  describe('setCubismCoreLoaded / setLive2dLoaded', () => {
    it('should set isCubismCoreLoaded', () => {
      homeStore.getState().setIsCubismCoreLoaded(true)
      expect(homeStore.getState().isCubismCoreLoaded).toBe(true)
    })

    it('should set isLive2dLoaded', () => {
      homeStore.getState().setIsLive2dLoaded(true)
      expect(homeStore.getState().isLive2dLoaded).toBe(true)
    })
  })
})
