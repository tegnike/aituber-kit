import { fireEvent, render, screen } from '@testing-library/react'

import { KeyboardShortcutInput } from '@/components/settings/KeyboardShortcutInput'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('KeyboardShortcutInput', () => {
  it('explains that mobile use requires an external keyboard', () => {
    render(
      <KeyboardShortcutInput
        value="Alt"
        defaultValue="Alt"
        onChange={jest.fn()}
      />
    )

    expect(screen.getByText('ShortcutExternalKeyboardInfo')).toBeInTheDocument()
  })

  it('records a key combination after the user clicks the field', () => {
    const onChange = jest.fn()
    render(
      <KeyboardShortcutInput
        value="Alt"
        defaultValue="Alt"
        onChange={onChange}
        testId="shortcut"
      />
    )

    const input = screen.getByTestId('shortcut')
    fireEvent.click(input)
    fireEvent.keyDown(input, {
      key: 'k',
      code: 'KeyK',
      ctrlKey: true,
      shiftKey: true,
    })

    expect(onChange).toHaveBeenCalledWith('Control+Shift+KeyK')
  })

  it('exposes the current shortcut as its accessible name when idle', () => {
    render(
      <KeyboardShortcutInput
        value="Control+Shift+KeyK"
        defaultValue="Alt"
        onChange={jest.fn()}
        testId="shortcut"
      />
    )

    const input = screen.getByTestId('shortcut')
    expect(input).toHaveAttribute('aria-label', 'Ctrl + Shift + K')
    expect(input).toHaveAccessibleName('Ctrl + Shift + K')

    fireEvent.click(input)

    expect(input).toHaveAttribute('aria-label', 'ShortcutPressKeys')
    expect(input).toHaveAccessibleName('ShortcutPressKeys')
  })

  it('lets Tab move focus without recording it', () => {
    const onChange = jest.fn()
    render(
      <KeyboardShortcutInput
        value="Alt"
        defaultValue="Alt"
        onChange={onChange}
        testId="shortcut"
      />
    )

    const input = screen.getByTestId('shortcut')
    fireEvent.click(input)

    expect(fireEvent.keyDown(input, { key: 'Tab', code: 'Tab' })).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveTextContent('Alt')
  })

  it('cancels recording with Escape without closing the parent view', () => {
    const onChange = jest.fn()
    const parentKeyDown = jest.fn()
    window.addEventListener('keydown', parentKeyDown)

    render(
      <KeyboardShortcutInput
        value="Alt"
        defaultValue="Alt"
        onChange={onChange}
        testId="shortcut"
      />
    )

    const input = screen.getByTestId('shortcut')
    fireEvent.click(input)

    expect(fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' })).toBe(
      false
    )
    expect(onChange).not.toHaveBeenCalled()
    expect(parentKeyDown).not.toHaveBeenCalled()
    expect(input).toHaveTextContent('Alt')

    window.removeEventListener('keydown', parentKeyDown)
  })

  it('records a modifier-only shortcut on key release', () => {
    const onChange = jest.fn()
    render(
      <KeyboardShortcutInput
        value="Mod+Period"
        defaultValue="Mod+Period"
        onChange={onChange}
        testId="shortcut"
      />
    )

    const input = screen.getByTestId('shortcut')
    fireEvent.click(input)
    fireEvent.keyDown(input, { key: 'Alt', code: 'AltLeft', altKey: true })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.keyUp(input, { key: 'Alt', code: 'AltLeft' })

    expect(onChange).toHaveBeenCalledWith('Alt')
  })

  it('rejects a shortcut already assigned to another action', () => {
    const onChange = jest.fn()
    render(
      <KeyboardShortcutInput
        value="Mod+Period"
        defaultValue="Mod+Period"
        onChange={onChange}
        conflictsWith={['Control+Shift+KeyK']}
        testId="shortcut"
      />
    )

    const input = screen.getByTestId('shortcut')
    fireEvent.click(input)
    fireEvent.keyDown(input, {
      key: 'Control',
      code: 'ControlLeft',
      ctrlKey: true,
    })
    fireEvent.keyDown(input, {
      key: 'Shift',
      code: 'ShiftLeft',
      ctrlKey: true,
      shiftKey: true,
    })
    fireEvent.keyDown(input, {
      key: 'k',
      code: 'KeyK',
      ctrlKey: true,
      shiftKey: true,
    })
    fireEvent.keyUp(input, {
      key: 'Shift',
      code: 'ShiftLeft',
      ctrlKey: true,
    })

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('ShortcutConflict')
  })

  it('restores the default shortcut', () => {
    const onChange = jest.fn()
    render(
      <KeyboardShortcutInput
        value="F8"
        defaultValue="Alt"
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByText('ShortcutReset'))

    expect(onChange).toHaveBeenCalledWith('Alt')
  })

  it('does not restore a default that conflicts with another action', () => {
    const onChange = jest.fn()
    render(
      <KeyboardShortcutInput
        value="F8"
        defaultValue="Alt"
        onChange={onChange}
        conflictsWith={['Alt']}
      />
    )

    fireEvent.click(screen.getByText('ShortcutReset'))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('ShortcutConflict')
  })
})
