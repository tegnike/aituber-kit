/**
 * Presence Store Tests
 *
 * TDD: Tests for presence detection state in home store
 * Requirements: 3.1, 3.2 - 状態管理
 */

import homeStore from '@/features/stores/home'
import { PresenceState, PresenceError } from '@/features/presence/presenceTypes'

describe('Home Store - Presence State', () => {
  beforeEach(() => {
    // Reset presence state to defaults
    homeStore.setState({
      presenceState: 'idle',
      presenceError: null,
      lastDetectionTime: null,
    })
  })

  describe('presenceState', () => {
    it('should default to idle', () => {
      const state = homeStore.getState()
      expect(state.presenceState).toBe('idle')
    })

    it('should be updatable to detected', () => {
      homeStore.setState({ presenceState: 'detected' })
      expect(homeStore.getState().presenceState).toBe('detected')
    })

    it('should be updatable to greeting', () => {
      homeStore.setState({ presenceState: 'greeting' })
      expect(homeStore.getState().presenceState).toBe('greeting')
    })

    it('should be updatable to conversation-ready', () => {
      homeStore.setState({ presenceState: 'conversation-ready' })
      expect(homeStore.getState().presenceState).toBe('conversation-ready')
    })

    it('should be updatable back to idle', () => {
      homeStore.setState({ presenceState: 'detected' })
      homeStore.setState({ presenceState: 'idle' })
      expect(homeStore.getState().presenceState).toBe('idle')
    })
  })

  describe('presenceError', () => {
    it('should default to null', () => {
      const state = homeStore.getState()
      expect(state.presenceError).toBeNull()
    })

    it('should be settable to CAMERA_PERMISSION_DENIED', () => {
      const error: PresenceError = {
        code: 'CAMERA_PERMISSION_DENIED',
        message: 'Camera permission denied',
      }
      homeStore.setState({ presenceError: error })
      expect(homeStore.getState().presenceError).toEqual(error)
    })

    it('should be settable to CAMERA_NOT_AVAILABLE', () => {
      const error: PresenceError = {
        code: 'CAMERA_NOT_AVAILABLE',
        message: 'Camera not available',
      }
      homeStore.setState({ presenceError: error })
      expect(homeStore.getState().presenceError).toEqual(error)
    })

    it('should be settable to MODEL_LOAD_FAILED', () => {
      const error: PresenceError = {
        code: 'MODEL_LOAD_FAILED',
        message: 'Failed to load face detection model',
      }
      homeStore.setState({ presenceError: error })
      expect(homeStore.getState().presenceError).toEqual(error)
    })

    it('should be clearable by setting to null', () => {
      const error: PresenceError = {
        code: 'CAMERA_PERMISSION_DENIED',
        message: 'Camera permission denied',
      }
      homeStore.setState({ presenceError: error })
      homeStore.setState({ presenceError: null })
      expect(homeStore.getState().presenceError).toBeNull()
    })
  })

  describe('lastDetectionTime', () => {
    it('should default to null', () => {
      const state = homeStore.getState()
      expect(state.lastDetectionTime).toBeNull()
    })

    it('should be settable to a timestamp', () => {
      const now = Date.now()
      homeStore.setState({ lastDetectionTime: now })
      expect(homeStore.getState().lastDetectionTime).toBe(now)
    })

    it('should be clearable by setting to null', () => {
      const now = Date.now()
      homeStore.setState({ lastDetectionTime: now })
      homeStore.setState({ lastDetectionTime: null })
      expect(homeStore.getState().lastDetectionTime).toBeNull()
    })
  })

  describe('state transitions', () => {
    it('should support idle -> detected -> greeting -> conversation-ready flow', () => {
      const state = homeStore.getState()
      expect(state.presenceState).toBe('idle')

      homeStore.setState({ presenceState: 'detected' })
      expect(homeStore.getState().presenceState).toBe('detected')

      homeStore.setState({ presenceState: 'greeting' })
      expect(homeStore.getState().presenceState).toBe('greeting')

      homeStore.setState({ presenceState: 'conversation-ready' })
      expect(homeStore.getState().presenceState).toBe('conversation-ready')
    })

    it('should support conversation-ready -> idle flow on departure', () => {
      homeStore.setState({ presenceState: 'conversation-ready' })
      homeStore.setState({ presenceState: 'idle' })
      expect(homeStore.getState().presenceState).toBe('idle')
    })
  })
})
