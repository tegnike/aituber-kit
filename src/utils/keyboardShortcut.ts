export const DEFAULT_SETTINGS_TOGGLE_SHORTCUT = 'Mod+Period'
export const DEFAULT_VOICE_INPUT_SHORTCUT = 'Alt'
export type KeyboardShortcutPlatform = 'mac' | 'windows' | 'other'

const MODIFIERS = ['Mod', 'Control', 'Alt', 'Shift', 'Meta'] as const
type ShortcutModifier = (typeof MODIFIERS)[number]

const modifierCodes: Record<string, Exclude<ShortcutModifier, 'Mod'>> = {
  ControlLeft: 'Control',
  ControlRight: 'Control',
  AltLeft: 'Alt',
  AltRight: 'Alt',
  ShiftLeft: 'Shift',
  ShiftRight: 'Shift',
  MetaLeft: 'Meta',
  MetaRight: 'Meta',
}

const keyToCode: Record<string, string> = {
  Control: 'Control',
  Alt: 'Alt',
  Shift: 'Shift',
  Meta: 'Meta',
  ' ': 'Space',
  '.': 'Period',
  ',': 'Comma',
  '/': 'Slash',
  ';': 'Semicolon',
  "'": 'Quote',
  '[': 'BracketLeft',
  ']': 'BracketRight',
  '\\': 'Backslash',
  '`': 'Backquote',
  '-': 'Minus',
  '=': 'Equal',
}

const codeLabels: Record<string, string> = {
  Space: 'Space',
  Period: '.',
  Comma: ',',
  Slash: '/',
  Semicolon: ';',
  Quote: "'",
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  Escape: 'Esc',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
}

const getEventCode = (event: KeyboardEvent): string => {
  if (event.code) return modifierCodes[event.code] ?? event.code
  if (keyToCode[event.key]) return keyToCode[event.key]
  if (/^[a-z]$/i.test(event.key)) return `Key${event.key.toUpperCase()}`
  if (/^[0-9]$/.test(event.key)) return `Digit${event.key}`
  return event.key
}

const isModifier = (value: string): value is ShortcutModifier =>
  MODIFIERS.includes(value as ShortcutModifier)

const parseShortcut = (shortcut: string) => {
  const tokens = shortcut.split('+').filter(Boolean)
  const modifiers = tokens.filter(isModifier)
  const keys = tokens.filter((token) => !isModifier(token))

  if (
    tokens.length === 0 ||
    new Set(tokens).size !== tokens.length ||
    keys.length > 1 ||
    (modifiers.includes('Mod') &&
      (modifiers.includes('Control') || modifiers.includes('Meta')))
  ) {
    return null
  }

  return { modifiers, key: keys[0] }
}

const getShortcutVariants = (shortcut: string): string[] => {
  const parsed = parseShortcut(shortcut)
  if (!parsed) return []

  const modifierVariants = parsed.modifiers.includes('Mod')
    ? (['Control', 'Meta'] as const).map((modModifier) => [
        ...parsed.modifiers.filter((modifier) => modifier !== 'Mod'),
        modModifier,
      ])
    : [parsed.modifiers]

  return modifierVariants.map((modifiers) =>
    [
      ...MODIFIERS.filter((modifier) => modifiers.includes(modifier)),
      ...(parsed.key ? [parsed.key] : []),
    ].join('+')
  )
}

export const normalizeKeyboardShortcut = (
  shortcut: string | undefined,
  fallback: string
): string => {
  const parsed = shortcut ? parseShortcut(shortcut) : null
  if (!parsed) return fallback

  return [
    ...MODIFIERS.filter((modifier) => parsed.modifiers.includes(modifier)),
    ...(parsed.key ? [parsed.key] : []),
  ].join('+')
}

export const keyboardShortcutFromEvent = (
  event: KeyboardEvent
): string | null => {
  if (
    event.isComposing ||
    event.key === 'Process' ||
    event.key === 'Unidentified'
  ) {
    return null
  }

  const eventCode = getEventCode(event)
  const eventModifier = isModifier(eventCode) ? eventCode : null
  const modifiers: ShortcutModifier[] = []

  if (event.ctrlKey || eventModifier === 'Control') modifiers.push('Control')
  if (event.altKey || eventModifier === 'Alt') modifiers.push('Alt')
  if (event.shiftKey || eventModifier === 'Shift') modifiers.push('Shift')
  if (event.metaKey || eventModifier === 'Meta') modifiers.push('Meta')

  return [...modifiers, ...(eventModifier ? [] : [eventCode])].join('+') || null
}

export const isModifierKeyboardEvent = (event: KeyboardEvent): boolean =>
  isModifier(getEventCode(event))

export const matchesKeyboardShortcut = (
  event: KeyboardEvent,
  shortcut: string
): boolean => {
  const parsed = parseShortcut(shortcut)
  if (!parsed) return false

  const eventCode = getEventCode(event)
  const eventModifier = isModifier(eventCode) ? eventCode : null
  const actualControl = event.ctrlKey || eventModifier === 'Control'
  const actualAlt = event.altKey || eventModifier === 'Alt'
  const actualShift = event.shiftKey || eventModifier === 'Shift'
  const actualMeta = event.metaKey || eventModifier === 'Meta'
  const expectsMod = parsed.modifiers.includes('Mod')

  if (
    expectsMod
      ? actualControl === actualMeta
      : actualControl !== parsed.modifiers.includes('Control')
  ) {
    return false
  }
  if (!expectsMod && actualMeta !== parsed.modifiers.includes('Meta'))
    return false
  if (actualAlt !== parsed.modifiers.includes('Alt')) return false
  if (actualShift !== parsed.modifiers.includes('Shift')) return false

  if (parsed.key) return eventCode === parsed.key

  const expectedModifiers = parsed.modifiers.flatMap((modifier) =>
    modifier === 'Mod' ? ['Control', 'Meta'] : [modifier]
  )
  return eventModifier !== null && expectedModifiers.includes(eventModifier)
}

export const isKeyboardShortcutRelease = (
  event: KeyboardEvent,
  shortcut: string
): boolean => {
  const parsed = parseShortcut(shortcut)
  if (!parsed) return false

  const releasedCode = getEventCode(event)
  if (parsed.key === releasedCode) return true
  if (parsed.modifiers.includes(releasedCode as ShortcutModifier)) return true

  return (
    parsed.modifiers.includes('Mod') &&
    (releasedCode === 'Control' || releasedCode === 'Meta')
  )
}

export const detectKeyboardShortcutPlatform = (
  navigatorPlatform: string,
  userAgent: string
): KeyboardShortcutPlatform => {
  const platformDescription = `${navigatorPlatform} ${userAgent}`
  if (/Mac|iPhone|iPad|iPod/i.test(platformDescription)) return 'mac'
  if (/Win/i.test(platformDescription)) return 'windows'
  return 'other'
}

export const formatKeyboardShortcut = (
  shortcut: string,
  platform: KeyboardShortcutPlatform = 'other'
): string => {
  const parsed = parseShortcut(shortcut)
  if (!parsed) return shortcut

  const modifierLabels = parsed.modifiers.map((modifier) => {
    if (modifier === 'Mod') return platform === 'mac' ? 'Cmd' : 'Ctrl'
    if (modifier === 'Control') return 'Ctrl'
    if (modifier === 'Alt') return platform === 'mac' ? 'Option' : 'Alt'
    if (modifier === 'Meta') {
      if (platform === 'mac') return 'Cmd'
      if (platform === 'windows') return 'Win'
      return 'Meta'
    }
    return modifier
  })
  const keyLabel = parsed.key
    ? (codeLabels[parsed.key] ??
      parsed.key.replace(/^Key/, '').replace(/^Digit/, ''))
    : null

  return [...modifierLabels, ...(keyLabel ? [keyLabel] : [])].join(' + ')
}

export const keyboardShortcutsConflict = (
  firstShortcut: string,
  secondShortcut: string
): boolean => {
  const firstVariants = getShortcutVariants(firstShortcut)
  const secondVariants = new Set(getShortcutVariants(secondShortcut))
  return firstVariants.some((variant) => secondVariants.has(variant))
}

export const isEditableKeyboardTarget = (
  target: EventTarget | null
): boolean => {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

export const hasCommandModifier = (shortcut: string): boolean => {
  const parsed = parseShortcut(shortcut)
  if (!parsed) return false
  return parsed.modifiers.some((modifier) =>
    ['Mod', 'Control', 'Alt', 'Meta'].includes(modifier)
  )
}
