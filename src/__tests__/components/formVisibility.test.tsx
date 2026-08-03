import React from 'react'
import { render, screen } from '@testing-library/react'
import { Form } from '@/components/form'

let mockShowInputForm = true

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      slideMode: false,
      showInputForm: mockShowInputForm,
      selectAIService: 'openai',
      selectAIModel: 'gpt-4',
      enableMultiModal: false,
      customModel: false,
      gameCommentaryEnabled: false,
      gameCommentaryPlaying: false,
    }),
}))

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      modalImage: '',
      webcamStatus: false,
      captureStatus: false,
      chatProcessingCount: 0,
    }),
}))

jest.mock('@/features/stores/menu', () => ({
  __esModule: true,
  default: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ slideVisible: false }),
}))

jest.mock('@/features/stores/slide', () => ({
  __esModule: true,
  default: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ isPlaying: false }),
}))

jest.mock('@/features/chat/handlers', () => ({
  handleSendChatFn: () => jest.fn(),
}))

jest.mock('@/features/constants/aiModels', () => ({
  isMultiModalAvailable: jest.fn(() => false),
}))

jest.mock('@/components/messageInputContainer', () => ({
  MessageInputContainer: () => <div data-testid="message-input" />,
}))

jest.mock('@/components/presetQuestionButtons', () => ({
  PresetQuestionButtons: () => <div data-testid="preset-questions" />,
}))

jest.mock('@/components/slideText', () => ({
  SlideText: () => <div data-testid="slide-text" />,
}))

describe('Form visibility', () => {
  beforeEach(() => {
    mockShowInputForm = true
  })

  it('shows the message input when enabled', () => {
    render(<Form />)

    expect(screen.getByTestId('message-input')).toBeTruthy()
  })

  it('hides only the message input when disabled', () => {
    mockShowInputForm = false
    render(<Form />)

    expect(screen.queryByTestId('message-input')).toBeNull()
    expect(screen.getByTestId('preset-questions')).toBeTruthy()
  })
})
