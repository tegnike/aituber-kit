/**
 * SlideConvert Component Tests
 *
 * TDD: Tests for slide convert settings UI component
 * Requirements: 3.1, 7.1, 7.2
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SlideConvert from '@/components/settings/slideConvert'
import * as demoMode from '@/hooks/useDemoMode'

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        PdfConvertLabel: 'PDF変換',
        PdfConvertDescription: 'PDFファイルをスライドに変換します。',
        PdfConvertFileUpload: 'ファイルを選択',
        PdfConvertFolderName: 'フォルダ名',
        PdfConvertModelSelect: 'モデル選択',
        PdfConvertButton: '変換',
        PdfConvertLoading: '変換中...',
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
  default: jest.fn((selector) => {
    const state = {
      selectAIService: 'openai',
      selectLanguage: 'ja',
      selectAIModel: 'gpt-4o',
      enableMultiModal: true,
      multiModalMode: 'auto',
      customModel: '',
    }
    return selector ? selector(state) : state
  }),
}))

// Mock toastStore
jest.mock('@/features/stores/toast', () => ({
  __esModule: true,
  default: () => ({
    addToast: jest.fn(),
  }),
}))

// Mock aiModels
jest.mock('@/features/constants/aiModels', () => ({
  getDefaultModel: jest.fn().mockReturnValue('gpt-4o'),
  getMultiModalModels: jest.fn().mockReturnValue(['gpt-4o', 'gpt-4o-mini']),
  isMultiModalAvailable: jest.fn().mockReturnValue(true),
}))

const mockUseDemoMode = demoMode.useDemoMode as jest.MockedFunction<
  typeof demoMode.useDemoMode
>

describe('SlideConvert Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDemoMode.mockReturnValue({ isDemoMode: false })
  })

  describe('normal mode rendering', () => {
    it('should render slide convert form', () => {
      render(<SlideConvert onFolderUpdate={jest.fn()} />)
      expect(screen.getByText('PDF変換')).toBeInTheDocument()
    })

    it('should render file upload button enabled in normal mode', () => {
      render(<SlideConvert onFolderUpdate={jest.fn()} />)
      const uploadButton = screen.getByText('ファイルを選択')
      expect(uploadButton).toBeInTheDocument()
      expect(uploadButton.closest('button')).not.toBeDisabled()
    })

    it('should render convert button enabled in normal mode', () => {
      render(<SlideConvert onFolderUpdate={jest.fn()} />)
      const convertButton = screen.getByText('変換')
      expect(convertButton).toBeInTheDocument()
      expect(convertButton.closest('button')).not.toBeDisabled()
    })

    it('should not show demo mode notice in normal mode', () => {
      render(<SlideConvert onFolderUpdate={jest.fn()} />)
      expect(
        screen.queryByText('デモ版ではこの機能は利用できません')
      ).not.toBeInTheDocument()
    })
  })

  describe('demo mode rendering', () => {
    beforeEach(() => {
      mockUseDemoMode.mockReturnValue({ isDemoMode: true })
    })

    it('should render file upload button disabled in demo mode', () => {
      render(<SlideConvert onFolderUpdate={jest.fn()} />)
      const uploadButton = screen.getByText('ファイルを選択')
      expect(uploadButton.closest('button')).toBeDisabled()
    })

    it('should render convert button disabled in demo mode', () => {
      render(<SlideConvert onFolderUpdate={jest.fn()} />)
      const convertButton = screen.getByText('変換')
      expect(convertButton.closest('button')).toBeDisabled()
    })

    it('should show demo mode notice in demo mode', () => {
      render(<SlideConvert onFolderUpdate={jest.fn()} />)
      expect(
        screen.getByText('デモ版ではこの機能は利用できません')
      ).toBeInTheDocument()
    })

    it('should apply grayed out style to form in demo mode', () => {
      const { container } = render(<SlideConvert onFolderUpdate={jest.fn()} />)
      const form = container.querySelector('form')
      expect(form?.parentElement).toHaveClass('opacity-50')
    })
  })
})
