/**
 * PasscodeDialog Component
 *
 * Passcode input dialog for temporarily unlocking kiosk mode
 * Requirements: 3.1, 3.2, 3.3 - パスコード解除機能
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getLockoutState,
  setLockoutState,
  clearLockoutState,
  isLockedOut as checkIsLockedOut,
  RECOVERY_THRESHOLD,
} from './kioskLockout'

export interface PasscodeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  correctPasscode: string
}

const MAX_ATTEMPTS = 3
const LOCKOUT_DURATION = 30 // seconds

export const PasscodeDialog: React.FC<PasscodeDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPasscode,
}) => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutCountdown, setLockoutCountdown] = useState(0)
  const [totalFailures, setTotalFailures] = useState(0)

  // Restore lockout state when dialog opens
  useEffect(() => {
    if (isOpen) {
      const state = getLockoutState()
      setTotalFailures(state.totalFailures)
      if (checkIsLockedOut()) {
        setIsLocked(true)
        const remaining = Math.ceil((state.lockoutUntil! - Date.now()) / 1000)
        setLockoutCountdown(remaining > 0 ? remaining : 0)
      }
    }
  }, [isOpen])

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current && !isLocked) {
      inputRef.current.focus()
    }
  }, [isOpen, isLocked])

  // Handle lockout countdown
  useEffect(() => {
    if (!isLocked || lockoutCountdown <= 0) return

    const timer = setInterval(() => {
      setLockoutCountdown((prev) => {
        if (prev <= 1) {
          setIsLocked(false)
          setAttempts(0)
          setError(null)
          const state = getLockoutState()
          setLockoutState({
            lockoutUntil: null,
            totalFailures: state.totalFailures,
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isLocked, lockoutCountdown])

  // Handle Escape key to close dialog
  // Note: Add a short delay to prevent immediate close after long-press opens the dialog
  useEffect(() => {
    if (!isOpen) return

    let canClose = false
    const enableTimer = setTimeout(() => {
      canClose = true
    }, 500) // Wait 500ms before allowing Esc to close

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && canClose) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(enableTimer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setPasscode('')
      setError(null)
      // Don't reset attempts and lockout state to persist across open/close
    }
  }, [isOpen])

  const handleSubmit = useCallback(() => {
    if (isLocked) return

    if (passcode === correctPasscode) {
      // Success
      clearLockoutState()
      setTotalFailures(0)
      setAttempts(0)
      setPasscode('')
      setError(null)
      onSuccess()
    } else {
      // Failed attempt
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setPasscode('')

      const newTotalFailures = totalFailures + 1
      setTotalFailures(newTotalFailures)

      if (newAttempts >= MAX_ATTEMPTS) {
        // Lockout
        const lockoutUntil = Date.now() + LOCKOUT_DURATION * 1000
        setIsLocked(true)
        setLockoutCountdown(LOCKOUT_DURATION)
        setError(t('Kiosk.PasscodeLocked'))
        setLockoutState({ lockoutUntil, totalFailures: newTotalFailures })
      } else {
        // Show remaining attempts
        setError(t('Kiosk.PasscodeIncorrect'))
        setLockoutState({ lockoutUntil: null, totalFailures: newTotalFailures })
      }
    }
  }, [
    passcode,
    correctPasscode,
    attempts,
    isLocked,
    totalFailures,
    onSuccess,
    t,
  ])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const remainingAttempts = MAX_ATTEMPTS - attempts

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-80 max-w-[90vw]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('Kiosk.PasscodeTitle')}
        </h2>

        <input
          ref={inputRef}
          type="password"
          role="textbox"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLocked}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          placeholder="パスコード"
          autoComplete="off"
        />

        {error && !isLocked && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {isLocked && lockoutCountdown > 0 && (
          <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
            {t('Kiosk.PasscodeLocked')} ({lockoutCountdown}秒)
          </p>
        )}

        {!isLocked && attempts > 0 && remainingAttempts > 0 && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('Kiosk.PasscodeRemainingAttempts', { count: remainingAttempts })}
          </p>
        )}

        {totalFailures >= RECOVERY_THRESHOLD && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t('Kiosk.RecoveryHint')}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            {t('Kiosk.Cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isLocked || (passcode.length === 0 && correctPasscode.length > 0)
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md
                       hover:bg-blue-700 transition-colors
                       disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {t('Kiosk.Unlock')}
          </button>
        </div>
      </div>
    </div>
  )
}
