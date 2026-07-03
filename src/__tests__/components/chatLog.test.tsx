import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { ChatLog } from '@/components/chatLog'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { messageSelectors } from '@/features/messages/messageSelectors'

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    setState: jest.fn(),
    getState: jest.fn(() => ({})),
  }),
}))

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    setState: jest.fn(),
    getState: jest.fn(() => ({})),
  }),
}))

jest.mock('@/features/messages/messageSelectors', () => ({
  messageSelectors: {
    getTextAndImageMessages: jest.fn((messages) => messages),
  },
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => React.createElement('img', props),
}))

const mockSettingsStore = settingsStore as jest.MockedFunction<
  typeof settingsStore
> & {
  setState: jest.Mock
  getState: jest.Mock
}
const mockHomeStore = homeStore as jest.MockedFunction<typeof homeStore>
const mockGetTextAndImageMessages =
  messageSelectors.getTextAndImageMessages as jest.Mock

describe('ChatLog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.body.style.userSelect = ''
    Element.prototype.scrollIntoView = jest.fn()

    mockSettingsStore.mockImplementation((selector) => {
      const state = {
        characterName: 'Character',
        userDisplayName: 'User',
        chatLogWidth: 400,
        chatLogPosition: 'left',
        chatLogStyle: 'glass',
        chatLogEdgeOffset: null,
        showThinkingText: false,
      }
      return selector(state as any)
    })
    mockSettingsStore.getState.mockReturnValue({
      chatLogWidth: 400,
      chatLogEdgeOffset: null,
    } as any)

    mockHomeStore.mockImplementation((selector) => {
      const state = {
        chatLog: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
      }
      return selector(state as any)
    })

    mockGetTextAndImageMessages.mockImplementation((messages) => messages)
  })

  it('prevents text selection while resizing the conversation log', async () => {
    const removeAllRanges = jest.fn()
    jest.spyOn(window, 'getSelection').mockReturnValue({
      removeAllRanges,
    } as unknown as Selection)

    const { container } = render(<ChatLog />)
    const resizeHandle = container.querySelector(
      '.cursor-ew-resize'
    ) as HTMLElement

    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 400,
    })
    const preventMouseDownDefault = jest.spyOn(mouseDownEvent, 'preventDefault')

    resizeHandle.dispatchEvent(mouseDownEvent)

    expect(preventMouseDownDefault).toHaveBeenCalled()
    expect(removeAllRanges).toHaveBeenCalled()
    await waitFor(() => expect(document.body.style.userSelect).toBe('none'))

    removeAllRanges.mockClear()
    const mouseMoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: 500,
    })
    const preventMouseMoveDefault = jest.spyOn(mouseMoveEvent, 'preventDefault')

    document.dispatchEvent(mouseMoveEvent)

    expect(preventMouseMoveDefault).toHaveBeenCalled()
    expect(removeAllRanges).toHaveBeenCalled()
    expect(mockSettingsStore.setState).toHaveBeenCalledWith({
      chatLogWidth: 500,
    })

    fireEvent.mouseUp(document)

    await waitFor(() => expect(document.body.style.userSelect).toBe(''))
  })

  it('resizes from the inner edge when the log is displayed on the right', async () => {
    mockSettingsStore.mockImplementation((selector) => {
      const state = {
        characterName: 'Character',
        userDisplayName: 'User',
        chatLogWidth: 400,
        chatLogPosition: 'right',
        chatLogStyle: 'glass',
        chatLogEdgeOffset: null,
        showThinkingText: false,
      }
      return selector(state as any)
    })

    const removeAllRanges = jest.fn()
    jest.spyOn(window, 'getSelection').mockReturnValue({
      removeAllRanges,
    } as unknown as Selection)

    const { container } = render(<ChatLog />)
    const panel = container.firstChild as HTMLElement
    expect(panel.className).toContain('right-2')

    const resizeHandle = container.querySelector(
      '.cursor-ew-resize'
    ) as HTMLElement
    expect(resizeHandle.className).toContain('left-0')

    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 600,
    })
    resizeHandle.dispatchEvent(mouseDownEvent)

    await waitFor(() => expect(document.body.style.userSelect).toBe('none'))

    const mouseMoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: 500,
    })
    document.dispatchEvent(mouseMoveEvent)

    expect(mockSettingsStore.setState).toHaveBeenCalledWith({
      chatLogWidth: window.innerWidth - 500,
    })

    fireEvent.mouseUp(document)

    await waitFor(() => expect(document.body.style.userSelect).toBe(''))
  })

  it('renders the classic bubble-card design when chatLogStyle is classic', () => {
    mockSettingsStore.mockImplementation((selector) => {
      const state = {
        characterName: 'Character',
        userDisplayName: 'User',
        chatLogWidth: 400,
        chatLogPosition: 'left',
        chatLogStyle: 'classic',
        chatLogEdgeOffset: null,
        showThinkingText: false,
      }
      return selector(state as any)
    })

    const { container } = render(<ChatLog />)
    const panel = container.firstChild as HTMLElement

    expect(panel.className).not.toContain('aurora-glass-panel')
    expect(panel.className).toContain('left-2')
    expect(container.querySelector('.theme-surface-popover')).not.toBeNull()
    expect(container.querySelector('.cursor-ew-resize')).not.toBeNull()
  })

  it('resizes the edge offset when dragging the outer handle', async () => {
    mockSettingsStore.mockImplementation((selector) => {
      const state = {
        characterName: 'Character',
        userDisplayName: 'User',
        chatLogWidth: 400,
        chatLogPosition: 'right',
        chatLogStyle: 'glass',
        chatLogEdgeOffset: null,
        showThinkingText: false,
      }
      return selector(state as any)
    })

    const removeAllRanges = jest.fn()
    jest.spyOn(window, 'getSelection').mockReturnValue({
      removeAllRanges,
    } as unknown as Selection)

    const { container } = render(<ChatLog />)
    const handles = container.querySelectorAll('.cursor-ew-resize')
    expect(handles.length).toBe(2)
    const outerHandle = handles[1] as HTMLElement
    // 右配置時、外側ハンドルはパネルの右端（画面端側）
    expect(outerHandle.className).toContain('right-0')

    outerHandle.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    )
    await waitFor(() => expect(document.body.style.userSelect).toBe('none'))

    // pointerFromEdge = innerWidth - clientX = 60。内縁(0+400)は固定される
    document.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: window.innerWidth - 60,
      })
    )

    expect(mockSettingsStore.setState).toHaveBeenCalledWith({
      chatLogEdgeOffset: 60,
      chatLogWidth: 340,
    })

    fireEvent.mouseUp(document)
    await waitFor(() => expect(document.body.style.userSelect).toBe(''))
  })

  it('shows the subtle resize guide while hovering the handle', async () => {
    const { container } = render(<ChatLog />)
    const resizeHandle = container.querySelector(
      '.cursor-ew-resize'
    ) as HTMLElement
    const resizeGuide = resizeHandle.querySelector('div') as HTMLElement

    expect(resizeGuide.className).toContain('top-1/2')
    expect(resizeGuide.className).toContain('right-0.5')
    expect(resizeGuide.className).toContain('h-24')
    expect(resizeGuide.className).toContain('w-1.5')
    expect(resizeGuide.style.backgroundColor).toBe(
      'color-mix(in srgb, var(--color-primary) 70%, transparent)'
    )
    expect(resizeGuide.className).toContain('opacity-0')

    fireEvent.mouseEnter(resizeHandle)

    await waitFor(() => expect(resizeGuide.className).toContain('opacity-100'))

    fireEvent.mouseLeave(resizeHandle)

    await waitFor(() => expect(resizeGuide.className).toContain('opacity-0'))
  })
})
