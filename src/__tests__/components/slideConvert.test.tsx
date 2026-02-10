/**
 * SlideConvert Component Tests
 *
 * スライド変換コンポーネントのテスト
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SlideConvert from '@/components/settings/slideConvert'
import settingsStore from '@/features/stores/settings'

// Mock stores
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    getState: jest.fn(() => ({
      openaiKey: 'test-key',
      anthropicKey: '',
      googleKey: '',
      azureKey: '',
      xaiKey: '',
      groqKey: '',
      cohereKey: '',
      mistralaiKey: '',
      perplexityKey: '',
      fireworksKey: '',
      deepseekKey: '',
      openrouterKey: '',
      difyKey: '',
    })),
    setState: jest.fn(),
  }),
}))

jest.mock('@/features/stores/toast', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    addToast: jest.fn(),
  })),
}))

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock aiModels
jest.mock('@/features/constants/aiModels', () => ({
  getDefaultModel: jest.fn(() => 'gpt-4o'),
  getMultiModalModels: jest.fn(() => ['gpt-4o', 'gpt-4o-mini']),
  isMultiModalAvailable: jest.fn(() => true),
}))

// Mock TextButton
jest.mock('@/components/textButton', () => ({
  TextButton: ({ children, onClick, disabled, type }: any) => (
    <button
      data-testid="text-button"
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  ),
}))

const mockSettingsStore = settingsStore as jest.MockedFunction<
  typeof settingsStore
>

describe('SlideConvert', () => {
  const mockOnFolderUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    mockSettingsStore.mockImplementation((selector) => {
      const state = {
        selectAIService: 'openai',
        selectLanguage: 'ja',
        selectAIModel: 'gpt-4o',
        enableMultiModal: true,
        multiModalMode: 'always',
        customModel: false,
      }
      return selector(state as any)
    })
  })

  it('should render the slide convert form', () => {
    render(<SlideConvert onFolderUpdate={mockOnFolderUpdate} />)

    expect(screen.getByText('PdfConvertLabel')).toBeTruthy()
    expect(screen.getByText('PdfConvertDescription')).toBeTruthy()
  })

  it('should render model selection dropdown', () => {
    render(<SlideConvert onFolderUpdate={mockOnFolderUpdate} />)

    const select = screen.getByDisplayValue('gpt-4o')
    expect(select).toBeTruthy()
  })

  it('should render folder name input', () => {
    render(<SlideConvert onFolderUpdate={mockOnFolderUpdate} />)

    const input = screen.getByPlaceholderText('Folder Name')
    expect(input).toBeTruthy()
  })

  it('should allow folder name input changes', () => {
    render(<SlideConvert onFolderUpdate={mockOnFolderUpdate} />)

    const input = screen.getByPlaceholderText('Folder Name')
    fireEvent.change(input, { target: { value: 'my-slide' } })
    expect((input as HTMLInputElement).value).toBe('my-slide')
  })

  it('should have a file upload button', () => {
    render(<SlideConvert onFolderUpdate={mockOnFolderUpdate} />)

    const buttons = screen.getAllByTestId('text-button')
    const uploadButton = buttons.find(
      (btn) => btn.textContent === 'PdfConvertFileUpload'
    )
    expect(uploadButton).toBeTruthy()
  })

  it('should have a submit button', () => {
    render(<SlideConvert onFolderUpdate={mockOnFolderUpdate} />)

    const buttons = screen.getAllByTestId('text-button')
    const submitButton = buttons.find(
      (btn) => btn.textContent === 'PdfConvertButton'
    )
    expect(submitButton).toBeTruthy()
  })
})
