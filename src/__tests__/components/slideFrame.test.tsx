import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SlideFrame from '@/components/slideFrame'

describe('SlideFrame', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1200,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
    })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    })
  })

  const renderFrame = () =>
    render(
      <SlideFrame controls={<button type="button">Next slide</button>}>
        <div>Slide content</div>
      </SlideFrame>
    )

  it('limits pointer events to the frame and exposes four resize handles', async () => {
    renderFrame()

    await waitFor(() =>
      expect(screen.getByTestId('slide-frame')).toHaveStyle({ width: '960px' })
    )
    expect(screen.getByTestId('slide-mode-viewer')).toHaveClass(
      'pointer-events-none'
    )
    expect(screen.getByTestId('slide-frame')).toHaveClass('pointer-events-auto')
    expect(screen.getByTestId('slide-resize-top-left')).toHaveClass(
      'pointer-events-none',
      'opacity-0',
      'rounded-full',
      'border',
      'group-hover:pointer-events-auto',
      'group-hover:opacity-100'
    )
    expect(screen.getByTestId('slide-resize-top-left')).not.toHaveClass(
      'rounded-sm',
      'border-2',
      'shadow-sm'
    )
    expect(screen.getByTestId('slide-resize-top-right')).toBeInTheDocument()
    expect(screen.getByTestId('slide-resize-bottom-left')).toBeInTheDocument()
    expect(screen.getByTestId('slide-resize-bottom-right')).toBeInTheDocument()
  })

  it('moves only when dragging the slide surface', () => {
    renderFrame()

    const frame = screen.getByTestId('slide-frame')
    const initialTransform = frame.style.transform
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Next slide' }), {
      button: 0,
      clientX: 10,
      clientY: 10,
    })
    fireEvent.mouseMove(document, { clientX: 80, clientY: 70 })
    expect(frame.style.transform).toBe(initialTransform)
    fireEvent.mouseUp(document)

    fireEvent.mouseDown(screen.getByTestId('slide-drag-surface'), {
      button: 0,
      clientX: 100,
      clientY: 100,
    })
    fireEvent.mouseMove(document, { clientX: 160, clientY: 140 })

    expect(frame.style.transform).toContain('translate(60px, 40px)')
    fireEvent.mouseUp(document)
  })

  it('keeps the slide aspect ratio while resizing from a corner', () => {
    renderFrame()

    const frame = screen.getByTestId('slide-frame')
    const initialWidth = Number.parseFloat(frame.style.width)

    fireEvent.mouseDown(screen.getByTestId('slide-resize-bottom-right'), {
      button: 0,
      clientX: 0,
      clientY: 0,
    })
    fireEvent.mouseMove(document, { clientX: 100, clientY: 56 })

    const resizedWidth = Number.parseFloat(frame.style.width)
    const resizedHeight = Number.parseFloat(
      screen.getByTestId('slide-drag-surface').style.height
    )
    expect(resizedWidth).toBeGreaterThan(initialWidth)
    expect(resizedWidth / resizedHeight).toBeCloseTo(16 / 9, 4)
    fireEvent.mouseUp(document)
  })

  it('keeps its position while hidden and shown with different content', () => {
    const { rerender } = renderFrame()
    const frame = screen.getByTestId('slide-frame')

    fireEvent.mouseDown(screen.getByTestId('slide-drag-surface'), {
      button: 0,
      clientX: 100,
      clientY: 100,
    })
    fireEvent.mouseMove(document, { clientX: 160, clientY: 140 })
    fireEvent.mouseUp(document)

    rerender(
      <SlideFrame visible={false} controls={null}>
        <div>Hidden content</div>
      </SlideFrame>
    )
    expect(screen.getByTestId('slide-mode-viewer')).toHaveStyle({
      visibility: 'hidden',
    })

    rerender(
      <SlideFrame visible controls={null}>
        <div>Thumbnail content</div>
      </SlideFrame>
    )
    expect(frame.style.transform).toContain('translate(60px, 40px)')
    expect(screen.getByText('Thumbnail content')).toBeInTheDocument()
  })
})
