/**
 * SlideConvert Component Tests
 *
 * スライド変換コンポーネントのテスト
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
      api_routeKey: 'api-route-test-key',
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
  getDefaultModel: jest.fn((service) =>
    service === 'api_route' ? '' : 'gpt-4o'
  ),
  getMultiModalModels: jest.fn((service) =>
    service === 'api_route' ? [] : ['gpt-4o', 'gpt-4o-mini']
  ),
  isMultiModalAvailable: jest.fn((service, _model, enabled) =>
    service === 'api_route' ? enabled : true
  ),
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
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  beforeEach(() => {
    jest.clearAllMocks()

    mockSettingsStore.mockImplementation((selector) => {
      const state = {
        selectAIService: 'openai',
        selectLanguage: 'ja',
        selectAIModel: 'gpt-4o',
        enableMultiModal: true,
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

  const useApiRoute = (model = 'openai/gpt-4o', enableMultiModal = true) => {
    mockSettingsStore.mockImplementation((selector) =>
      selector({
        selectAIService: 'api_route',
        selectLanguage: 'ja',
        selectAIModel: model,
        enableMultiModal,
        customModel: false,
      } as any)
    )
  }

  const submitPdf = () => {
    fireEvent.change(document.getElementById('fileInput')!, {
      target: {
        files: [new File(['pdf'], 'slides.pdf', { type: 'application/pdf' })],
      },
    })
    fireEvent.change(screen.getByPlaceholderText('Folder Name'), {
      target: { value: 'api-route-slides' },
    })
    fireEvent.submit(screen.getByText('PdfConvertButton').closest('form')!)
  }

  it('submits an editable API Route model, key and multimodal toggle', async () => {
    useApiRoute()
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
    render(<SlideConvert onFolderUpdate={mockOnFolderUpdate} />)

    const modelInput = screen.getByRole('textbox', {
      name: 'PdfConvertModelSelect',
    })
    expect(modelInput).toHaveValue('openai/gpt-4o')
    fireEvent.change(modelInput, {
      target: { value: 'google/gemini-2.5-flash' },
    })
    submitPdf()

    await waitFor(() => expect(mockOnFolderUpdate).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith('/api/convertSlide', {
      method: 'POST',
      body: expect.any(FormData),
    })
    const body = (global.fetch as jest.Mock).mock.calls[0][1].body as FormData
    expect(body.get('aiService')).toBe('api_route')
    expect(body.get('apiKey')).toBe('api-route-test-key')
    expect(body.get('model')).toBe('google/gemini-2.5-flash')
    expect(body.get('enableMultiModal')).toBe('true')
  })

  it('updates the API Route conversion model when the selected model changes', () => {
    useApiRoute()
    const { rerender } = render(
      <SlideConvert onFolderUpdate={mockOnFolderUpdate} />
    )
    useApiRoute('anthropic/claude-sonnet-4-6')
    rerender(<SlideConvert onFolderUpdate={mockOnFolderUpdate} />)
    expect(
      screen.getByRole('textbox', { name: 'PdfConvertModelSelect' })
    ).toHaveValue('anthropic/claude-sonnet-4-6')
  })

  it.each([
    ['', true],
    ['openai/gpt-4o', false],
  ])(
    'does not submit with model %s and multimodal enabled %s',
    (model, enabled) => {
      useApiRoute(model, enabled)
      global.fetch = jest.fn()
      render(<SlideConvert onFolderUpdate={mockOnFolderUpdate} />)
      submitPdf()
      expect(global.fetch).not.toHaveBeenCalled()
    }
  )
})
