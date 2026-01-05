/**
 * OpenAIConfig Component Tests
 *
 * TDD: Tests for OpenAI settings UI component demo mode behavior
 * Requirements: 5.1, 5.2, 7.1, 7.2
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { OpenAIConfig } from '@/components/settings/modelProvider/OpenAIConfig'
import * as demoMode from '@/hooks/useDemoMode'

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        OpenAIAPIKeyLabel: 'OpenAI APIキー',
        RealtimeAPIMode: 'Realtime APIモード',
        AudioMode: 'Audio Mode',
        StatusOn: 'ON',
        StatusOff: 'OFF',
        SelectModel: 'モデルを選択',
        RealtimeAPIModeContentType: '入力タイプ',
        RealtimeAPIModeVoice: 'ボイス',
        InputText: 'テキスト入力',
        InputAudio: '音声入力',
        UpdateRealtimeAPISettings: '更新',
        UpdateRealtimeAPISettingsInfo: '設定を更新します',
        DemoModeNotice: 'デモ版ではこの機能は利用できません',
      }
      return translations[key] || key
    },
  }),
}))

// Mock useDemoMode hook
jest.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: jest.fn(),
}))

// Mock settingsStore
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => {
      const state = {}
      return selector ? selector(state) : state
    }),
    {
      setState: jest.fn(),
    }
  ),
}))

// Mock websocketStore
jest.mock('@/features/stores/websocketStore', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({
      wsManager: {
        reconnect: jest.fn().mockReturnValue(true),
      },
    })),
  },
}))

// Mock toastStore
jest.mock('@/features/stores/toast', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({
      addToast: jest.fn(),
    })),
  },
}))

// Mock aiModels
jest.mock('@/features/constants/aiModels', () => ({
  getModels: jest.fn().mockReturnValue(['gpt-4o', 'gpt-4o-mini']),
  getOpenAIRealtimeModels: jest
    .fn()
    .mockReturnValue(['gpt-4o-realtime-preview']),
  getOpenAIAudioModels: jest.fn().mockReturnValue(['gpt-4o-audio-preview']),
  isMultiModalModel: jest.fn().mockReturnValue(true),
  isSearchGroundingModel: jest.fn().mockReturnValue(false),
  defaultModels: {
    openai: 'gpt-4o',
    openaiRealtime: 'gpt-4o-realtime-preview',
    openaiAudio: 'gpt-4o-audio-preview',
  },
}))

const mockUseDemoMode = demoMode.useDemoMode as jest.MockedFunction<
  typeof demoMode.useDemoMode
>

const defaultProps = {
  openaiKey: 'test-key',
  realtimeAPIMode: false,
  audioMode: false,
  realtimeAPIModeContentType: 'input_text' as const,
  realtimeAPIModeVoice: 'shimmer' as const,
  audioModeInputType: 'input_text' as const,
  audioModeVoice: 'shimmer' as const,
  selectAIModel: 'gpt-4o',
  customModel: false,
  enableMultiModal: true,
  multiModalMode: 'ai-decide',
  updateMultiModalModeForModel: jest.fn(),
}

describe('OpenAIConfig Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDemoMode.mockReturnValue({ isDemoMode: false })
  })

  describe('normal mode rendering', () => {
    it('should render OpenAI config with Realtime API toggle enabled', () => {
      render(<OpenAIConfig {...defaultProps} />)
      expect(screen.getByText('Realtime APIモード')).toBeInTheDocument()

      // Find the toggle button for Realtime API mode
      const realtimeSection = screen
        .getByText('Realtime APIモード')
        .closest('div')?.parentElement
      const toggleButton = realtimeSection?.querySelector('button')
      expect(toggleButton).not.toBeDisabled()
    })

    it('should render Audio Mode toggle enabled', () => {
      render(<OpenAIConfig {...defaultProps} />)
      expect(screen.getByText('Audio Mode')).toBeInTheDocument()

      // Find the toggle button for Audio mode
      const buttons = screen.getAllByRole('button')
      const audioModeButton = buttons.find(
        (btn) => btn.textContent === 'OFF' || btn.textContent === 'ON'
      )
      expect(audioModeButton).toBeDefined()
    })

    it('should not show demo mode notice in normal mode', () => {
      render(<OpenAIConfig {...defaultProps} />)
      expect(
        screen.queryByText('デモ版ではこの機能は利用できません')
      ).not.toBeInTheDocument()
    })

    it('should allow toggling Realtime API mode in normal mode', () => {
      render(<OpenAIConfig {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      const realtimeToggle = buttons[0] // First OFF button is Realtime API toggle

      fireEvent.click(realtimeToggle)
      // Check that setState was called (mock would be called)
      const settingsStore = require('@/features/stores/settings').default
      expect(settingsStore.setState).toHaveBeenCalled()
    })
  })

  describe('demo mode rendering', () => {
    beforeEach(() => {
      mockUseDemoMode.mockReturnValue({ isDemoMode: true })
    })

    it('should disable Realtime API toggle in demo mode', () => {
      render(<OpenAIConfig {...defaultProps} />)

      // Find the Realtime API section and its toggle
      const realtimeSection = screen
        .getByText('Realtime APIモード')
        .closest('div')?.parentElement
      const toggleButton = realtimeSection?.querySelector('button')

      expect(toggleButton).toBeDisabled()
    })

    it('should disable Audio Mode toggle in demo mode', () => {
      render(<OpenAIConfig {...defaultProps} />)

      // Find the Audio Mode section and its toggle
      const audioSection = screen
        .getByText('Audio Mode')
        .closest('div')?.parentElement
      const toggleButton = audioSection?.querySelector('button')

      expect(toggleButton).toBeDisabled()
    })

    it('should show demo mode notice near WebSocket features in demo mode', () => {
      render(<OpenAIConfig {...defaultProps} />)
      expect(
        screen.getByText('デモ版ではこの機能は利用できません')
      ).toBeInTheDocument()
    })

    it('should apply visual disabled styling in demo mode', () => {
      render(<OpenAIConfig {...defaultProps} />)

      // Check that disabled styling (opacity) is applied
      const realtimeSection = screen
        .getByText('Realtime APIモード')
        .closest('div')?.parentElement
      expect(realtimeSection?.className).toContain('opacity-50')
    })
  })

  describe('Realtime API mode enabled state', () => {
    const realtimeEnabledProps = {
      ...defaultProps,
      realtimeAPIMode: true,
      selectAIModel: 'gpt-4o-realtime-preview',
    }

    it('should render Realtime API settings when enabled in normal mode', () => {
      mockUseDemoMode.mockReturnValue({ isDemoMode: false })
      render(<OpenAIConfig {...realtimeEnabledProps} />)

      expect(screen.getByText('入力タイプ')).toBeInTheDocument()
      expect(screen.getByText('ボイス')).toBeInTheDocument()
    })

    it('should render Realtime API settings as disabled in demo mode', () => {
      mockUseDemoMode.mockReturnValue({ isDemoMode: true })
      render(<OpenAIConfig {...realtimeEnabledProps} />)

      // When realtimeAPIMode is true but in demo mode,
      // the toggle should show ON but be disabled
      const buttons = screen.getAllByRole('button')
      const onButton = buttons.find((btn) => btn.textContent === 'ON')
      expect(onButton).toBeDisabled()
    })
  })

  describe('Audio mode enabled state', () => {
    const audioEnabledProps = {
      ...defaultProps,
      audioMode: true,
      selectAIModel: 'gpt-4o-audio-preview',
    }

    it('should render Audio mode settings when enabled in normal mode', () => {
      mockUseDemoMode.mockReturnValue({ isDemoMode: false })
      render(<OpenAIConfig {...audioEnabledProps} />)

      expect(screen.getByText('入力タイプ')).toBeInTheDocument()
      expect(screen.getByText('ボイス')).toBeInTheDocument()
    })

    it('should render Audio mode settings as disabled in demo mode', () => {
      mockUseDemoMode.mockReturnValue({ isDemoMode: true })
      render(<OpenAIConfig {...audioEnabledProps} />)

      // When audioMode is true but in demo mode,
      // the toggle should show ON but be disabled
      const buttons = screen.getAllByRole('button')
      const onButton = buttons.find((btn) => btn.textContent === 'ON')
      expect(onButton).toBeDisabled()
    })
  })
})
