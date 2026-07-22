import React from 'react'
import { render } from '@testing-library/react'

import { MessageInput } from '@/components/messageInput'

let mockChatProcessing = false

type MockIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  'data-testid'?: string
}

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: jest.fn((selector) =>
    selector({
      chatProcessing: mockChatProcessing,
      modalImage: '',
    })
  ),
}))

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: jest.fn((selector) =>
    selector({
      selectAIService: 'openai',
      selectAIModel: 'gpt-4o',
      imageDisplayPosition: 'input',
      enableMultiModal: false,
      customModel: '',
      realtimeAPIMode: false,
      showSilenceProgressBar: false,
    })
  ),
}))

jest.mock('@/features/stores/slide', () => ({
  __esModule: true,
  default: jest.fn((selector) => selector({ isPlaying: false })),
}))

jest.mock('@/hooks/useKioskMode', () => ({
  useKioskMode: () => ({
    isKioskMode: false,
    validateInput: () => ({ valid: true }),
    maxInputLength: undefined,
  }),
}))

jest.mock('@/components/iconButton', () => ({
  IconButton: (props: MockIconButtonProps) => (
    <button
      className={props.className}
      disabled={props.disabled}
      onClick={props.onClick}
      data-testid={props['data-testid']}
    />
  ),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ''} {...props} />
  ),
}))

const defaultProps = {
  userMessage: '',
  isMicRecording: false,
  onChangeUserMessage: jest.fn(),
  onClickSendButton: jest.fn(),
  onClickMicButton: jest.fn(),
  onClickStopButton: jest.fn(),
  isSpeaking: false,
  silenceTimeoutRemaining: null,
  continuousMicListeningMode: false,
  onToggleContinuousMode: jest.fn(),
}

describe('MessageInput focus contract', () => {
  let focusSpy: jest.SpyInstance

  beforeEach(() => {
    mockChatProcessing = false
    delete (window as Window & { ontouchstart?: unknown }).ontouchstart
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 0,
    })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn(() => ({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    })
    focusSpy = jest
      .spyOn(HTMLTextAreaElement.prototype, 'focus')
      .mockImplementation(() => undefined)
  })

  afterEach(() => {
    focusSpy.mockRestore()
  })

  it('does not focus on initial mount when focusOnMount is false', () => {
    render(<MessageInput {...defaultProps} focusOnMount={false} />)

    expect(focusSpy).not.toHaveBeenCalled()
  })

  it('preserves initial focus for the normal screen by default', () => {
    render(<MessageInput {...defaultProps} />)

    expect(focusSpy).toHaveBeenCalledTimes(1)
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('focuses non-touch desktop browsers that expose touch event APIs', () => {
    Object.defineProperty(window, 'ontouchstart', {
      configurable: true,
      value: null,
    })

    render(<MessageInput {...defaultProps} />)

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('does not clear a draft when focusOnMount changes after mounting', () => {
    const { getByTestId, rerender } = render(
      <MessageInput {...defaultProps} focusOnMount={false} />
    )
    rerender(
      <MessageInput
        {...defaultProps}
        userMessage="draft"
        focusOnMount={false}
      />
    )

    rerender(
      <MessageInput {...defaultProps} userMessage="draft" focusOnMount={true} />
    )

    expect(getByTestId('chat-message-input')).toHaveValue('draft')
    expect(focusSpy).not.toHaveBeenCalled()
  })

  it('restores focus after chat processing even when mount focus is disabled', () => {
    mockChatProcessing = true
    const { rerender } = render(
      <MessageInput {...defaultProps} focusOnMount={false} />
    )

    expect(focusSpy).not.toHaveBeenCalled()

    mockChatProcessing = false
    rerender(<MessageInput {...defaultProps} focusOnMount={false} />)

    expect(focusSpy).toHaveBeenCalledTimes(1)
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
  })
})
