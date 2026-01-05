/**
 * MemorySettings Component Tests
 *
 * TDD: Tests for memory settings UI component
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MemorySettings from '@/components/settings/memorySettings'
import settingsStore from '@/features/stores/settings'
import { DEFAULT_MEMORY_CONFIG } from '@/features/memory/memoryTypes'
import { getMemoryService } from '@/features/memory/memoryService'
import { useDemoMode } from '@/hooks/useDemoMode'

// Mock useDemoMode hook
jest.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: jest.fn(),
}))

const mockUseDemoMode = useDemoMode as jest.MockedFunction<typeof useDemoMode>

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        MemorySettings: 'メモリ設定',
        MemoryEnabled: 'メモリ機能を有効にする',
        MemoryEnabledInfo:
          'メモリ機能を有効にすると、過去の会話を記憶してコンテキストに追加します。',
        MemorySimilarityThreshold: '類似度閾値',
        MemorySimilarityThresholdInfo:
          '類似度がこの値以上の記憶のみを検索結果として使用します。',
        MemorySearchLimit: '検索結果上限',
        MemorySearchLimitInfo: '検索結果の最大件数を設定します。',
        MemoryMaxContextTokens: '最大コンテキストトークン数',
        MemoryMaxContextTokensInfo:
          'メモリコンテキストに追加する最大トークン数を設定します。',
        MemoryClear: '記憶をクリア',
        MemoryClearConfirm: '本当にすべての記憶を削除しますか？',
        MemoryCount: '保存済み記憶件数',
        MemoryCountValue: '{{count}}件',
        MemoryAPIKeyWarning:
          'OpenAI APIキーが設定されていないため、メモリ機能は利用できません。',
        MemoryRestore: '記憶を復元',
        MemoryRestoreInfo: 'ローカルファイルから記憶を復元します。',
        MemoryRestoreSelect: 'ファイルを選択',
        StatusOn: '状態：ON',
        StatusOff: '状態：OFF',
        DemoModeNotice: 'デモモードでは利用できません',
      }
      return translations[key] || key
    },
  }),
}))

// Mock memoryService
const mockMemoryService = {
  getMemoryCount: jest.fn().mockResolvedValue(0),
  clearAllMemories: jest.fn().mockResolvedValue(undefined),
  isAvailable: jest.fn().mockReturnValue(true),
}

jest.mock('@/features/memory/memoryService', () => ({
  getMemoryService: () => mockMemoryService,
}))

describe('MemorySettings Component', () => {
  beforeEach(() => {
    // Reset store to default values
    settingsStore.setState({
      memoryEnabled: DEFAULT_MEMORY_CONFIG.memoryEnabled,
      memorySimilarityThreshold:
        DEFAULT_MEMORY_CONFIG.memorySimilarityThreshold,
      memorySearchLimit: DEFAULT_MEMORY_CONFIG.memorySearchLimit,
      memoryMaxContextTokens: DEFAULT_MEMORY_CONFIG.memoryMaxContextTokens,
      openaiKey: 'test-api-key', // APIキーを設定
    })

    // デフォルトは通常モード
    mockUseDemoMode.mockReturnValue({ isDemoMode: false })

    // Reset mocks
    jest.clearAllMocks()
    mockMemoryService.getMemoryCount.mockResolvedValue(0)
  })

  describe('Requirement 5.1: Memory ON/OFF Toggle', () => {
    it('should render memory toggle switch', () => {
      render(<MemorySettings />)
      expect(screen.getByText('メモリ機能を有効にする')).toBeInTheDocument()
    })

    it('should display current memory enabled status', () => {
      settingsStore.setState({ memoryEnabled: false })
      render(<MemorySettings />)
      expect(screen.getByText('状態：OFF')).toBeInTheDocument()
    })

    it('should toggle memory enabled state on click', () => {
      settingsStore.setState({ memoryEnabled: false })
      render(<MemorySettings />)

      const toggleButton = screen.getByText('状態：OFF')
      fireEvent.click(toggleButton)

      expect(settingsStore.getState().memoryEnabled).toBe(true)
    })
  })

  describe('Requirement 5.2: Similarity Threshold Slider', () => {
    it('should render similarity threshold slider', () => {
      render(<MemorySettings />)
      expect(screen.getByText('類似度閾値')).toBeInTheDocument()
    })

    it('should display current threshold value', () => {
      settingsStore.setState({ memorySimilarityThreshold: 0.7 })
      render(<MemorySettings />)

      const slider = screen.getByRole('slider', { name: /類似度閾値/i })
      expect(slider).toHaveValue('0.7')
    })

    it('should update threshold on slider change', () => {
      render(<MemorySettings />)

      const slider = screen.getByRole('slider', { name: /類似度閾値/i })
      fireEvent.change(slider, { target: { value: '0.8' } })

      expect(settingsStore.getState().memorySimilarityThreshold).toBe(0.8)
    })

    it('should enforce min/max range (0.5-0.9)', () => {
      render(<MemorySettings />)

      const slider = screen.getByRole('slider', { name: /類似度閾値/i })
      expect(slider).toHaveAttribute('min', '0.5')
      expect(slider).toHaveAttribute('max', '0.9')
    })
  })

  describe('Requirement 5.3: Search Limit Setting', () => {
    it('should render search limit input', () => {
      render(<MemorySettings />)
      expect(screen.getByText('検索結果上限')).toBeInTheDocument()
    })

    it('should display current search limit value', () => {
      settingsStore.setState({ memorySearchLimit: 5 })
      render(<MemorySettings />)

      const input = screen.getByRole('spinbutton', { name: /検索結果上限/i })
      expect(input).toHaveValue(5)
    })

    it('should update search limit on change', () => {
      render(<MemorySettings />)

      const input = screen.getByRole('spinbutton', { name: /検索結果上限/i })
      fireEvent.change(input, { target: { value: '8' } })

      expect(settingsStore.getState().memorySearchLimit).toBe(8)
    })

    it('should enforce min/max range (1-10)', () => {
      render(<MemorySettings />)

      const input = screen.getByRole('spinbutton', { name: /検索結果上限/i })
      expect(input).toHaveAttribute('min', '1')
      expect(input).toHaveAttribute('max', '10')
    })
  })

  describe('Requirement 5.4: Memory Clear Button', () => {
    it('should render clear memory button', () => {
      render(<MemorySettings />)
      expect(screen.getByText('記憶をクリア')).toBeInTheDocument()
    })

    it('should call clearAllMemories when confirmed', async () => {
      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

      render(<MemorySettings />)

      const clearButton = screen.getByText('記憶をクリア')
      fireEvent.click(clearButton)

      await waitFor(() => {
        expect(mockMemoryService.clearAllMemories).toHaveBeenCalled()
      })

      confirmSpy.mockRestore()
    })

    it('should not call clearAllMemories when cancelled', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

      render(<MemorySettings />)

      const clearButton = screen.getByText('記憶をクリア')
      fireEvent.click(clearButton)

      expect(mockMemoryService.clearAllMemories).not.toHaveBeenCalled()

      confirmSpy.mockRestore()
    })
  })

  describe('Requirement 5.5: Memory Count Display', () => {
    it('should display current memory count', async () => {
      mockMemoryService.getMemoryCount.mockResolvedValue(42)

      render(<MemorySettings />)

      await waitFor(() => {
        expect(screen.getByText('保存済み記憶件数')).toBeInTheDocument()
      })
    })
  })

  describe('Requirement 5.6: API Key Warning', () => {
    it('should show warning when OpenAI API key is not set', () => {
      settingsStore.setState({ openaiKey: '' })

      render(<MemorySettings />)

      expect(
        screen.getByText(
          'OpenAI APIキーが設定されていないため、メモリ機能は利用できません。'
        )
      ).toBeInTheDocument()
    })

    it('should not show warning when OpenAI API key is set', () => {
      settingsStore.setState({ openaiKey: 'test-api-key' })

      render(<MemorySettings />)

      expect(
        screen.queryByText(
          'OpenAI APIキーが設定されていないため、メモリ機能は利用できません。'
        )
      ).not.toBeInTheDocument()
    })
  })

  describe('Max Context Tokens Setting', () => {
    it('should render max context tokens input', () => {
      render(<MemorySettings />)
      expect(screen.getByText('最大コンテキストトークン数')).toBeInTheDocument()
    })

    it('should update max context tokens on change', () => {
      render(<MemorySettings />)

      const input = screen.getByRole('spinbutton', {
        name: /最大コンテキストトークン数/i,
      })
      fireEvent.change(input, { target: { value: '1500' } })

      expect(settingsStore.getState().memoryMaxContextTokens).toBe(1500)
    })
  })

  describe('Requirement 5.7: Memory Restore UI', () => {
    it('should render restore memory section', () => {
      render(<MemorySettings />)
      expect(screen.getByText('記憶を復元')).toBeInTheDocument()
    })

    it('should render file select button', () => {
      render(<MemorySettings />)
      expect(screen.getByText('ファイルを選択')).toBeInTheDocument()
    })
  })

  describe('Requirement 6.1: Demo Mode Support', () => {
    beforeEach(() => {
      mockUseDemoMode.mockReturnValue({ isDemoMode: true })
    })

    it('should display demo mode notice when demo mode is enabled', () => {
      render(<MemorySettings />)
      expect(
        screen.getByText('デモモードでは利用できません')
      ).toBeInTheDocument()
    })

    it('should disable memory toggle when demo mode is enabled', () => {
      settingsStore.setState({ memoryEnabled: false })
      render(<MemorySettings />)

      const toggleButton = screen.getByText('状態：OFF')
      expect(toggleButton.closest('button')).toBeDisabled()
    })

    it('should disable similarity threshold slider when demo mode is enabled', () => {
      render(<MemorySettings />)

      const slider = screen.getByRole('slider', { name: /類似度閾値/i })
      expect(slider).toBeDisabled()
    })

    it('should disable search limit input when demo mode is enabled', () => {
      render(<MemorySettings />)

      const input = screen.getByRole('spinbutton', { name: /検索結果上限/i })
      expect(input).toBeDisabled()
    })

    it('should disable max context tokens input when demo mode is enabled', () => {
      render(<MemorySettings />)

      const input = screen.getByRole('spinbutton', {
        name: /最大コンテキストトークン数/i,
      })
      expect(input).toBeDisabled()
    })

    it('should disable clear memory button when demo mode is enabled', () => {
      render(<MemorySettings />)

      const clearButton = screen.getByText('記憶をクリア')
      expect(clearButton.closest('button')).toBeDisabled()
    })

    it('should disable file restore button when demo mode is enabled', () => {
      render(<MemorySettings />)

      const restoreButton = screen.getByText('ファイルを選択')
      expect(restoreButton.closest('button')).toBeDisabled()
    })

    it('should not display demo mode notice in normal mode', () => {
      mockUseDemoMode.mockReturnValue({ isDemoMode: false })
      render(<MemorySettings />)

      expect(
        screen.queryByText('デモモードでは利用できません')
      ).not.toBeInTheDocument()
    })
  })
})
