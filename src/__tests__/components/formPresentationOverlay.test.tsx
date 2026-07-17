import React from 'react'
import { render, screen } from '@testing-library/react'

import { Form } from '@/components/form'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/features/stores/menu', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/features/chat/handlers', () => ({
  handleSendChatFn: () => jest.fn(),
}))

jest.mock('@/features/constants/aiModels', () => ({
  isMultiModalAvailable: () => false,
}))

jest.mock('@/components/messageInputContainer', () => ({
  MessageInputContainer: () => <div data-testid="message-input" />,
}))

jest.mock('@/components/presetQuestionButtons', () => ({
  PresetQuestionButtons: () => <div data-testid="preset-questions" />,
}))

const mockSettingsStore = settingsStore as jest.MockedFunction<
  typeof settingsStore
>
const mockMenuStore = menuStore as jest.MockedFunction<typeof menuStore>
const mockHomeStore = homeStore as jest.MockedFunction<typeof homeStore>

describe('Form - Presentation answer overlay', () => {
  beforeEach(() => {
    mockSettingsStore.mockImplementation((selector) =>
      selector({
        slideMode: true,
        selectAIService: 'openai',
        selectAIModel: 'gpt-4',
        enableMultiModal: false,
        customModel: false,
        gameCommentaryEnabled: false,
        gameCommentaryPlaying: false,
        showMessageInput: true,
      } as any)
    )
    mockMenuStore.mockImplementation((selector) =>
      selector({ slideVisible: true } as any)
    )
  })

  it('一時停止中の外部スライドでも発話中は入力欄の代わりに回答を表示する', () => {
    mockHomeStore.mockImplementation((selector) =>
      selector({
        modalImage: '',
        webcamStatus: false,
        captureStatus: false,
        chatProcessingCount: 1,
        isSpeaking: true,
        slideMessages: ['質問への回答です。'],
      } as any)
    )

    render(<Form />)

    expect(screen.getByTestId('slide-text-overlay')).toHaveTextContent(
      '質問への回答です。'
    )
    expect(screen.queryByTestId('message-input')).not.toBeInTheDocument()
  })

  it('発話していないときは入力欄を表示する', () => {
    mockHomeStore.mockImplementation((selector) =>
      selector({
        modalImage: '',
        webcamStatus: false,
        captureStatus: false,
        chatProcessingCount: 0,
        isSpeaking: false,
        slideMessages: [],
      } as any)
    )

    render(<Form />)

    expect(screen.getByTestId('message-input')).toBeInTheDocument()
    expect(screen.queryByTestId('slide-text-overlay')).not.toBeInTheDocument()
  })

  it('停止後は発話カウントが残っても入力欄へ戻る', () => {
    mockHomeStore.mockImplementation((selector) =>
      selector({
        modalImage: '',
        webcamStatus: false,
        captureStatus: false,
        chatProcessingCount: 1,
        isSpeaking: false,
        slideMessages: ['停止された回答です。'],
      } as any)
    )

    render(<Form />)

    expect(screen.getByTestId('message-input')).toBeInTheDocument()
    expect(screen.queryByTestId('slide-text-overlay')).not.toBeInTheDocument()
  })

  it('設定がOFFのときは入力欄だけを非表示にする', () => {
    mockSettingsStore.mockImplementation((selector) =>
      selector({
        slideMode: true,
        selectAIService: 'openai',
        selectAIModel: 'gpt-4',
        enableMultiModal: false,
        customModel: false,
        gameCommentaryEnabled: false,
        gameCommentaryPlaying: false,
        showMessageInput: false,
      } as any)
    )
    mockHomeStore.mockImplementation((selector) =>
      selector({
        modalImage: '',
        webcamStatus: false,
        captureStatus: false,
        chatProcessingCount: 0,
        isSpeaking: false,
        slideMessages: [],
      } as any)
    )

    render(<Form />)

    expect(screen.queryByTestId('message-input')).not.toBeInTheDocument()
    expect(screen.getByTestId('preset-questions')).toBeInTheDocument()
  })
})
