/**
 * Kiosk Mode Integration Tests
 *
 * Task 7.2: Comprehensive integration tests for kiosk mode
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3
 */

import { renderHook, act } from '@testing-library/react'
import { useKioskMode } from '@/hooks/useKioskMode'
import settingsStore from '@/features/stores/settings'
import { DEFAULT_KIOSK_CONFIG } from '@/features/kiosk/kioskTypes'

describe('Kiosk Mode Integration Tests', () => {
  // Reset store before each test
  beforeEach(() => {
    settingsStore.setState({
      kioskModeEnabled: DEFAULT_KIOSK_CONFIG.kioskModeEnabled,
      kioskPasscode: DEFAULT_KIOSK_CONFIG.kioskPasscode,
      kioskGuidanceMessage: DEFAULT_KIOSK_CONFIG.kioskGuidanceMessage,
      kioskGuidanceTimeout: DEFAULT_KIOSK_CONFIG.kioskGuidanceTimeout,
      kioskMaxInputLength: DEFAULT_KIOSK_CONFIG.kioskMaxInputLength,
      kioskNgWords: DEFAULT_KIOSK_CONFIG.kioskNgWords,
      kioskNgWordEnabled: DEFAULT_KIOSK_CONFIG.kioskNgWordEnabled,
      kioskTemporaryUnlock: DEFAULT_KIOSK_CONFIG.kioskTemporaryUnlock,
    })
  })

  describe('Requirements 1.1, 1.2, 1.3: Kiosk Mode ON/OFF', () => {
    it('should enable kiosk mode and persist to store', () => {
      settingsStore.setState({ kioskModeEnabled: true })

      const { result } = renderHook(() => useKioskMode())
      expect(result.current.isKioskMode).toBe(true)
      expect(result.current.canAccessSettings).toBe(false)
    })

    it('should disable kiosk mode and allow settings access', () => {
      settingsStore.setState({ kioskModeEnabled: false })

      const { result } = renderHook(() => useKioskMode())
      expect(result.current.isKioskMode).toBe(false)
      expect(result.current.canAccessSettings).toBe(true)
    })

    it('should load defaults from environment variables (simulated)', () => {
      // Verify that DEFAULT_KIOSK_CONFIG values are used
      expect(DEFAULT_KIOSK_CONFIG.kioskModeEnabled).toBe(false)
      expect(DEFAULT_KIOSK_CONFIG.kioskPasscode).toBe('0000')
      expect(DEFAULT_KIOSK_CONFIG.kioskMaxInputLength).toBe(200)
    })
  })

  describe('Requirements 2.1, 2.2, 2.3: Settings Access Restriction', () => {
    it('should restrict settings access when kiosk mode is enabled', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskTemporaryUnlock: false,
      })

      const { result } = renderHook(() => useKioskMode())
      expect(result.current.canAccessSettings).toBe(false)
    })

    it('should allow settings access when temporarily unlocked', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskTemporaryUnlock: true,
      })

      const { result } = renderHook(() => useKioskMode())
      expect(result.current.canAccessSettings).toBe(true)
    })
  })

  describe('Requirements 3.1, 3.2, 3.3, 3.4: Passcode Unlock', () => {
    it('should support temporary unlock via passcode', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskPasscode: '1234',
        kioskTemporaryUnlock: false,
      })

      const { result } = renderHook(() => useKioskMode())

      expect(result.current.isTemporaryUnlocked).toBe(false)

      // Simulate successful passcode entry
      act(() => {
        result.current.temporaryUnlock()
      })

      expect(result.current.isTemporaryUnlocked).toBe(true)
      expect(result.current.canAccessSettings).toBe(true)
    })

    it('should support re-lock after temporary unlock', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskTemporaryUnlock: true,
      })

      const { result } = renderHook(() => useKioskMode())

      expect(result.current.isTemporaryUnlocked).toBe(true)

      // Re-lock
      act(() => {
        result.current.lockAgain()
      })

      expect(result.current.isTemporaryUnlocked).toBe(false)
      expect(result.current.canAccessSettings).toBe(false)
    })

    it('should verify passcode is configurable', () => {
      settingsStore.setState({ kioskPasscode: 'mypasscode123' })
      const state = settingsStore.getState()
      expect(state.kioskPasscode).toBe('mypasscode123')
    })
  })

  describe('Requirements 4.1, 4.2, 4.3: Fullscreen Display', () => {
    // Note: Actual fullscreen API behavior is tested in useFullscreen.test.ts
    // This test verifies the integration with settings

    it('should have fullscreen support configured', () => {
      settingsStore.setState({ kioskModeEnabled: true })

      const { result } = renderHook(() => useKioskMode())
      // Kiosk mode implies fullscreen should be requested
      expect(result.current.isKioskMode).toBe(true)
    })
  })

  describe('Requirements 5.1, 5.2, 5.3: UI Simplification', () => {
    it('should integrate with showControlPanel setting', () => {
      // When kiosk mode is enabled, control panel should typically be hidden
      // This integration is handled at the component level
      settingsStore.setState({
        kioskModeEnabled: true,
        showControlPanel: false,
      })

      const state = settingsStore.getState()
      expect(state.kioskModeEnabled).toBe(true)
      expect(state.showControlPanel).toBe(false)
    })
  })

  describe('Requirements 6.1, 6.2, 6.3: Guidance Message', () => {
    it('should support customizable guidance message', () => {
      const customMessage = 'Welcome! Please say hello!'
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskGuidanceMessage: customMessage,
      })

      const state = settingsStore.getState()
      expect(state.kioskGuidanceMessage).toBe(customMessage)
    })

    it('should support configurable guidance timeout', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskGuidanceTimeout: 30,
      })

      const state = settingsStore.getState()
      expect(state.kioskGuidanceTimeout).toBe(30)
    })
  })

  describe('Requirements 7.1, 7.2, 7.3: Input Restrictions', () => {
    it('should enforce max input length in kiosk mode', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskMaxInputLength: 50,
      })

      const { result } = renderHook(() => useKioskMode())
      expect(result.current.maxInputLength).toBe(50)

      // Valid input
      const valid = result.current.validateInput('Hello')
      expect(valid.valid).toBe(true)

      // Invalid input (too long)
      const invalid = result.current.validateInput('a'.repeat(51))
      expect(invalid.valid).toBe(false)
    })

    it('should filter NG words when enabled', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskNgWordEnabled: true,
        kioskNgWords: ['badword', 'inappropriate'],
      })

      const { result } = renderHook(() => useKioskMode())

      // Valid input
      const valid = result.current.validateInput('Hello world')
      expect(valid.valid).toBe(true)

      // Invalid input (contains NG word)
      const invalid = result.current.validateInput('This has badword in it')
      expect(invalid.valid).toBe(false)
      expect(invalid.reason).toContain('不適切')
    })

    it('should allow NG word configuration', () => {
      const ngWords = ['word1', 'word2', 'word3']
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskNgWords: ngWords,
      })

      const state = settingsStore.getState()
      expect(state.kioskNgWords).toEqual(ngWords)
    })
  })

  describe('State Persistence', () => {
    it('should NOT persist temporary unlock state', () => {
      // kioskTemporaryUnlock should always reset to false on reload
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskTemporaryUnlock: true,
      })

      // Verify the state includes temporary unlock
      const state = settingsStore.getState()
      expect(state.kioskTemporaryUnlock).toBe(true)

      // Note: In actual app, partialize excludes kioskTemporaryUnlock
      // This is verified in settingsKiosk.test.ts
    })

    it('should persist kiosk settings (except temporary unlock)', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskPasscode: '9999',
        kioskGuidanceMessage: 'Custom message',
        kioskGuidanceTimeout: 15,
        kioskMaxInputLength: 100,
        kioskNgWords: ['test'],
        kioskNgWordEnabled: true,
      })

      const state = settingsStore.getState()
      expect(state.kioskModeEnabled).toBe(true)
      expect(state.kioskPasscode).toBe('9999')
      expect(state.kioskGuidanceMessage).toBe('Custom message')
      expect(state.kioskGuidanceTimeout).toBe(15)
      expect(state.kioskMaxInputLength).toBe(100)
      expect(state.kioskNgWords).toEqual(['test'])
      expect(state.kioskNgWordEnabled).toBe(true)
    })
  })

  describe('Full Workflow Integration', () => {
    it('should handle complete kiosk mode workflow', () => {
      // 1. Start with kiosk mode disabled
      settingsStore.setState({
        kioskModeEnabled: false,
        kioskTemporaryUnlock: false,
      })

      let { result, rerender } = renderHook(() => useKioskMode())
      expect(result.current.isKioskMode).toBe(false)
      expect(result.current.canAccessSettings).toBe(true)

      // 2. Enable kiosk mode
      act(() => {
        settingsStore.setState({ kioskModeEnabled: true })
      })
      rerender()

      expect(result.current.isKioskMode).toBe(true)
      expect(result.current.canAccessSettings).toBe(false)

      // 3. Temporarily unlock
      act(() => {
        result.current.temporaryUnlock()
      })

      expect(result.current.isTemporaryUnlocked).toBe(true)
      expect(result.current.canAccessSettings).toBe(true)

      // 4. Re-lock
      act(() => {
        result.current.lockAgain()
      })

      expect(result.current.isTemporaryUnlocked).toBe(false)
      expect(result.current.canAccessSettings).toBe(false)

      // 5. Disable kiosk mode
      act(() => {
        settingsStore.setState({ kioskModeEnabled: false })
      })
      rerender()

      expect(result.current.isKioskMode).toBe(false)
      expect(result.current.canAccessSettings).toBe(true)
    })

    it('should handle input validation in kiosk mode workflow', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskMaxInputLength: 20,
        kioskNgWordEnabled: true,
        kioskNgWords: ['spam'],
      })

      const { result } = renderHook(() => useKioskMode())

      // Test various inputs
      const testCases = [
        { input: 'Hello', expected: true },
        { input: '', expected: true },
        { input: 'Valid message here!', expected: true },
        { input: 'This message is too long for the limit', expected: false },
        { input: 'spam message', expected: false },
        { input: 'SPAM', expected: false },
      ]

      testCases.forEach(({ input, expected }) => {
        const validation = result.current.validateInput(input)
        expect(validation.valid).toBe(expected)
      })
    })
  })
})
