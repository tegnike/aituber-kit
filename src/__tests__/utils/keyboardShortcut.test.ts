import {
  DEFAULT_SETTINGS_TOGGLE_SHORTCUT,
  detectKeyboardShortcutPlatform,
  formatKeyboardShortcut,
  isKeyboardShortcutRelease,
  keyboardShortcutFromEvent,
  keyboardShortcutsConflict,
  matchesKeyboardShortcut,
  normalizeKeyboardShortcut,
} from '@/utils/keyboardShortcut'

describe('keyboardShortcut', () => {
  it.each([
    new KeyboardEvent('keydown', { code: 'Period', ctrlKey: true }),
    new KeyboardEvent('keydown', { code: 'Period', metaKey: true }),
  ])('matches the cross-platform default settings shortcut', (event) => {
    expect(matchesKeyboardShortcut(event, 'Mod+Period')).toBe(true)
  })

  it('requires an exact modifier combination', () => {
    expect(
      matchesKeyboardShortcut(
        new KeyboardEvent('keydown', {
          code: 'KeyK',
          ctrlKey: true,
          shiftKey: true,
        }),
        'Control+KeyK'
      )
    ).toBe(false)
  })

  it('creates a canonical shortcut from a keyboard event', () => {
    expect(
      keyboardShortcutFromEvent(
        new KeyboardEvent('keydown', {
          code: 'Space',
          ctrlKey: true,
          shiftKey: true,
        })
      )
    ).toBe('Control+Shift+Space')
  })

  it('supports modifier-only shortcuts and synthetic events without code', () => {
    const event = new KeyboardEvent('keydown', { key: 'Alt' })

    expect(keyboardShortcutFromEvent(event)).toBe('Alt')
    expect(matchesKeyboardShortcut(event, 'Alt')).toBe(true)
  })

  it('detects release of either the primary key or a chord modifier', () => {
    expect(
      isKeyboardShortcutRelease(
        new KeyboardEvent('keyup', { code: 'Space' }),
        'Control+Space'
      )
    ).toBe(true)
    expect(
      isKeyboardShortcutRelease(
        new KeyboardEvent('keyup', { code: 'ControlLeft' }),
        'Control+Space'
      )
    ).toBe(true)
  })

  it('formats physical key codes for display', () => {
    expect(formatKeyboardShortcut('Mod+Period', 'mac')).toBe('Cmd + .')
    expect(formatKeyboardShortcut('Alt', 'mac')).toBe('Option')
    expect(formatKeyboardShortcut('Mod+Period', 'other')).toBe('Ctrl + .')
    expect(formatKeyboardShortcut('Alt', 'other')).toBe('Alt')
    expect(formatKeyboardShortcut('Control+Shift+KeyK')).toBe(
      'Ctrl + Shift + K'
    )
  })

  it.each([
    ['MacIntel', 'Mozilla/5.0', 'mac'],
    ['Win32', 'Mozilla/5.0 (Windows NT 10.0)', 'other'],
  ])(
    'detects %s with %s as %s shortcut platform',
    (navigatorPlatform, userAgent, expected) => {
      expect(detectKeyboardShortcutPlatform(navigatorPlatform, userAgent)).toBe(
        expected
      )
    }
  )

  it('falls back when an environment shortcut is malformed', () => {
    expect(
      normalizeKeyboardShortcut(
        'Control+KeyK+KeyL',
        DEFAULT_SETTINGS_TOGGLE_SHORTCUT
      )
    ).toBe(DEFAULT_SETTINGS_TOGGLE_SHORTCUT)
  })

  it('normalizes modifier order from environment configuration', () => {
    expect(normalizeKeyboardShortcut('Shift+Control+KeyK', 'Alt')).toBe(
      'Control+Shift+KeyK'
    )
  })

  it('detects platform-overlapping Mod shortcut conflicts', () => {
    expect(keyboardShortcutsConflict('Mod+Period', 'Control+Period')).toBe(true)
    expect(keyboardShortcutsConflict('Mod+Period', 'Alt+Period')).toBe(false)
  })
})
