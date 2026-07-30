import { useRef, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

import { TextButton } from '@/components/textButton'
import { settingsControlClass } from '@/components/settings/formStyles'
import {
  detectKeyboardShortcutPlatform,
  formatKeyboardShortcut,
  isModifierKeyboardEvent,
  keyboardShortcutFromEvent,
  keyboardShortcutsConflict,
} from '@/utils/keyboardShortcut'

const subscribeToPlatform = () => () => {}
const getServerPlatform = () => 'other' as const
const getClientPlatform = () =>
  detectKeyboardShortcutPlatform(navigator.platform, navigator.userAgent)

type Props = {
  value: string
  defaultValue: string
  onChange: (shortcut: string) => void
  conflictsWith?: string[]
  testId?: string
}

export const KeyboardShortcutInput = ({
  value,
  defaultValue,
  onChange,
  conflictsWith = [],
  testId,
}: Props) => {
  const { t } = useTranslation()
  const [isRecording, setIsRecording] = useState(false)
  const [hasConflict, setHasConflict] = useState(false)
  const pendingShortcutRef = useRef<string | null>(null)
  const platform = useSyncExternalStore(
    subscribeToPlatform,
    getClientPlatform,
    getServerPlatform
  )

  const saveShortcut = (shortcut: string) => {
    if (
      conflictsWith.some((assignedShortcut) =>
        keyboardShortcutsConflict(shortcut, assignedShortcut)
      )
    ) {
      setHasConflict(true)
      pendingShortcutRef.current = null
      return
    }

    onChange(shortcut)
    setHasConflict(false)
    setIsRecording(false)
    pendingShortcutRef.current = null
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!isRecording) return

    if (event.key === 'Tab') {
      setIsRecording(false)
      pendingShortcutRef.current = null
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setIsRecording(false)
      pendingShortcutRef.current = null
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const shortcut = keyboardShortcutFromEvent(event.nativeEvent)
    if (!shortcut) return

    if (isModifierKeyboardEvent(event.nativeEvent)) {
      pendingShortcutRef.current = shortcut
      return
    }

    saveShortcut(shortcut)
  }

  const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!isRecording) return

    event.preventDefault()
    event.stopPropagation()

    if (
      isModifierKeyboardEvent(event.nativeEvent) &&
      pendingShortcutRef.current
    ) {
      saveShortcut(pendingShortcutRef.current)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          className={`${settingsControlClass.medium} text-left font-mono focus:outline-none focus:ring-2 focus:ring-primary`}
          onClick={() => {
            setIsRecording(true)
            setHasConflict(false)
            pendingShortcutRef.current = null
          }}
          onBlur={() => {
            setIsRecording(false)
            pendingShortcutRef.current = null
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          aria-label={
            isRecording
              ? t('ShortcutPressKeys')
              : formatKeyboardShortcut(value, platform)
          }
          data-testid={testId}
        >
          {isRecording
            ? t('ShortcutPressKeys')
            : formatKeyboardShortcut(value, platform)}
        </button>
        <TextButton
          type="button"
          className="w-full sm:w-auto"
          onClick={() => {
            saveShortcut(defaultValue)
          }}
        >
          {t('ShortcutReset')}
        </TextButton>
      </div>
      {hasConflict && (
        <div className="mt-2 text-sm text-red-500" role="alert">
          {t('ShortcutConflict')}
        </div>
      )}
      <div className="mt-2 text-sm text-gray-600">
        {t('ShortcutExternalKeyboardInfo')}
      </div>
    </div>
  )
}
