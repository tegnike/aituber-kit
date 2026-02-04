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
        MemoryRestore: '記憶を復元',
        MemoryRestoreInfo: 'ローカルファイルから記憶を復元します。',
        MemoryRestoreSelect: 'ファイルを選択',
        OpenAIAPIKeyLabel: 'OpenAI APIキー',
        APIKeyInstruction: 'APIキーを入力してください。',
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

    // Reset mocks
    jest.clearAllMocks()
    mockMemoryService.getMemoryCount.mockResolvedValue(0)
  })

  describe('Requirement 5.1: Memory ON/OFF Toggle', () => {
    it('should render memory toggle switch', () => {
      const element = React.createElement(MemorySettings)
      render(element)
      expect(screen.getByText('メモリ機能を有効にする')).toBeInTheDocument()
    })

    it('should display current memory enabled status', () => {
      settingsStore.setState({ memoryEnabled: false })
      const element = React.createElement(MemorySettings)
      render(element)
      const switches = screen.getAllByRole('switch')
      expect(switches.length).toBeGreaterThanOrEqual(1)
      expect(switches[0]).toHaveAttribute('aria-checked', 'false')
    })

    it('should toggle memory enabled state on click', () => {
      settingsStore.setState({ memoryEnabled: false })
      const element = React.createElement(MemorySettings)
      render(element)

      // 最初のトグルスイッチ（長期記憶のトグル）をクリック
      const switches = screen.getAllByRole('switch')
      fireEvent.click(switches[0])

      expect(settingsStore.getState().memoryEnabled).toBe(true)
    })
  })

  describe('Requirement 5.2: Similarity Threshold Slider', () => {
    it('should render similarity threshold slider', () => {
      settingsStore.setState({ memoryEnabled: true })
      const element = React.createElement(MemorySettings)
      render(element)
      expect(screen.getByText('類似度閾値')).toBeInTheDocument()
    })

    it('should display current threshold value', () => {
      settingsStore.setState({
        memoryEnabled: true,
        memorySimilarityThreshold: 0.7,
      })
      const element = React.createElement(MemorySettings)
      render(element)

      const slider = screen.getByRole('slider', { name: /類似度閾値/i })
      expect(slider).toHaveValue('0.7')
    })

    it('should update threshold on slider change', () => {
      settingsStore.setState({ memoryEnabled: true })
      const element = React.createElement(MemorySettings)
      render(element)

      const slider = screen.getByRole('slider', { name: /類似度閾値/i })
      fireEvent.change(slider, { target: { value: '0.8' } })

      expect(settingsStore.getState().memorySimilarityThreshold).toBe(0.8)
    })

    it('should enforce min/max range (0.1-0.95)', () => {
      settingsStore.setState({ memoryEnabled: true })
      const element = React.createElement(MemorySettings)
      render(element)

      const slider = screen.getByRole('slider', { name: /類似度閾値/i })
      expect(slider).toHaveAttribute('min', '0.1')
      expect(slider).toHaveAttribute('max', '0.95')
    })
  })

  describe('Requirement 5.3: Search Limit Setting', () => {
    it('should render search limit input', () => {
      settingsStore.setState({ memoryEnabled: true })
      const element = React.createElement(MemorySettings)
      render(element)
      expect(screen.getByText('検索結果上限')).toBeInTheDocument()
    })

    it('should display current search limit value', () => {
      settingsStore.setState({ memoryEnabled: true, memorySearchLimit: 5 })
      const element = React.createElement(MemorySettings)
      render(element)

      const input = screen.getByRole('spinbutton', { name: /検索結果上限/i })
      expect(input).toHaveValue(5)
    })

    it('should update search limit on change', () => {
      settingsStore.setState({ memoryEnabled: true })
      const element = React.createElement(MemorySettings)
      render(element)

      const input = screen.getByRole('spinbutton', { name: /検索結果上限/i })
      fireEvent.change(input, { target: { value: '8' } })

      expect(settingsStore.getState().memorySearchLimit).toBe(8)
    })

    it('should enforce min/max range (1-10)', () => {
      settingsStore.setState({ memoryEnabled: true })
      const element = React.createElement(MemorySettings)
      render(element)

      const input = screen.getByRole('spinbutton', { name: /検索結果上限/i })
      expect(input).toHaveAttribute('min', '1')
      expect(input).toHaveAttribute('max', '10')
    })
  })

  describe('Requirement 5.4: Memory Clear Button', () => {
    it('should render clear memory button', () => {
      settingsStore.setState({ memoryEnabled: true })
      const element = React.createElement(MemorySettings)
      render(element)
      expect(screen.getByText('記憶をクリア')).toBeInTheDocument()
    })

    it('should call clearAllMemories when confirmed', async () => {
      settingsStore.setState({ memoryEnabled: true })
      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

      const element = React.createElement(MemorySettings)
      render(element)

      const clearButton = screen.getByText('記憶をクリア')
      fireEvent.click(clearButton)

      await waitFor(() => {
        expect(mockMemoryService.clearAllMemories).toHaveBeenCalled()
      })

      confirmSpy.mockRestore()
    })

    it('should not call clearAllMemories when cancelled', async () => {
      settingsStore.setState({ memoryEnabled: true })
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

      const element = React.createElement(MemorySettings)
      render(element)

      const clearButton = screen.getByText('記憶をクリア')
      fireEvent.click(clearButton)

      expect(mockMemoryService.clearAllMemories).not.toHaveBeenCalled()

      confirmSpy.mockRestore()
    })
  })

  describe('Requirement 5.5: Memory Count Display', () => {
    it('should display current memory count', async () => {
      settingsStore.setState({ memoryEnabled: true })
      mockMemoryService.getMemoryCount.mockResolvedValue(42)

      const element = React.createElement(MemorySettings)
      render(element)

      await waitFor(() => {
        expect(screen.getByText('保存済み記憶件数')).toBeInTheDocument()
      })
    })
  })

  describe('Requirement 5.6: API Key Input', () => {
    it('should render OpenAI API key input field when memory is enabled', () => {
      settingsStore.setState({ memoryEnabled: true })
      const element = React.createElement(MemorySettings)
      render(element)

      expect(screen.getByText('OpenAI APIキー')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
    })

    it('should update OpenAI API key on change', () => {
      settingsStore.setState({ memoryEnabled: true, openaiKey: '' })

      const element = React.createElement(MemorySettings)
      render(element)

      const input = screen.getByPlaceholderText('sk-...')
      fireEvent.change(input, { target: { value: 'sk-test-key' } })

      expect(settingsStore.getState().openaiKey).toBe('sk-test-key')
    })

    it('should hide API key input when memory is disabled', () => {
      settingsStore.setState({ memoryEnabled: false, openaiKey: '' })

      const element = React.createElement(MemorySettings)
      render(element)

      expect(screen.queryByText('OpenAI APIキー')).not.toBeInTheDocument()
      expect(screen.queryByPlaceholderText('sk-...')).not.toBeInTheDocument()
    })
  })

  describe('Max Context Tokens Setting', () => {
    it('should render max context tokens input', () => {
      settingsStore.setState({ memoryEnabled: true })
      const element = React.createElement(MemorySettings)
      render(element)
      expect(screen.getByText('最大コンテキストトークン数')).toBeInTheDocument()
    })

    it('should update max context tokens on change', () => {
      settingsStore.setState({ memoryEnabled: true })
      const element = React.createElement(MemorySettings)
      render(element)

      const input = screen.getByRole('spinbutton', {
        name: /最大コンテキストトークン数/i,
      })
      fireEvent.change(input, { target: { value: '1500' } })

      expect(settingsStore.getState().memoryMaxContextTokens).toBe(1500)
    })
  })

  describe('Requirement 5.7: Memory Restore UI', () => {
    it('should render restore memory section', () => {
      settingsStore.setState({ memoryEnabled: true })
      const element = React.createElement(MemorySettings)
      render(element)
      expect(screen.getByText('記憶を復元')).toBeInTheDocument()
    })

    it('should render file select button', () => {
      settingsStore.setState({ memoryEnabled: true })
      const element = React.createElement(MemorySettings)
      render(element)
      expect(screen.getByText('ファイルを選択')).toBeInTheDocument()
    })
  })

  describe('Memory OFF state', () => {
    it('should hide detailed settings when memory is disabled', () => {
      settingsStore.setState({ memoryEnabled: false })
      const element = React.createElement(MemorySettings)
      render(element)

      // ON/OFFトグルは表示されるべき
      expect(screen.getByText('メモリ機能を有効にする')).toBeInTheDocument()
      // トグルスイッチが表示されている
      const switches = screen.getAllByRole('switch')
      expect(switches.length).toBeGreaterThanOrEqual(1)
      expect(switches[0]).toHaveAttribute('aria-checked', 'false')

      // 長期記憶の詳細設定は非表示
      expect(screen.queryByText('類似度閾値')).not.toBeInTheDocument()
      expect(screen.queryByText('検索結果上限')).not.toBeInTheDocument()
      expect(
        screen.queryByText('最大コンテキストトークン数')
      ).not.toBeInTheDocument()
      expect(screen.queryByText('保存済み記憶件数')).not.toBeInTheDocument()
      expect(screen.queryByText('記憶をクリア')).not.toBeInTheDocument()

      // 記憶を復元は常に表示される
      expect(screen.getByText('記憶を復元')).toBeInTheDocument()
    })

    it('should show detailed settings when memory is enabled', () => {
      settingsStore.setState({ memoryEnabled: true })
      const element = React.createElement(MemorySettings)
      render(element)

      // 詳細設定が表示されるべき
      expect(screen.getByText('類似度閾値')).toBeInTheDocument()
      expect(screen.getByText('検索結果上限')).toBeInTheDocument()
      expect(screen.getByText('最大コンテキストトークン数')).toBeInTheDocument()
      expect(screen.getByText('保存済み記憶件数')).toBeInTheDocument()
      expect(screen.getByText('記憶をクリア')).toBeInTheDocument()
      expect(screen.getByText('記憶を復元')).toBeInTheDocument()
    })
  })
})
