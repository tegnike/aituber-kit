/**
 * KioskOverlay Component
 *
 * Main overlay component for kiosk mode
 * Handles fullscreen and passcode dialog
 * Requirements: 4.1, 4.2 - フルスクリーン表示とUI制御
 */

import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useKioskMode } from '@/hooks/useKioskMode'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useEscLongPress } from '@/hooks/useEscLongPress'
import { useMultiTap } from '@/hooks/useMultiTap'
import { PasscodeDialog } from './passcodeDialog'
import settingsStore from '@/features/stores/settings'

export const KioskOverlay: React.FC = () => {
  const { t } = useTranslation()
  const { isKioskMode, isTemporaryUnlocked, temporaryUnlock } = useKioskMode()
  const { isFullscreen, isSupported, requestFullscreen } = useFullscreen()

  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false)

  const kioskPasscode = settingsStore((s) => s.kioskPasscode)

  // Handle Esc long press to show passcode dialog
  useEscLongPress(
    useCallback(() => {
      if (isKioskMode && !isTemporaryUnlocked) {
        setShowPasscodeDialog(true)
      }
    }, [isKioskMode, isTemporaryUnlocked]),
    { enabled: isKioskMode && !isTemporaryUnlocked }
  )

  // Handle multi-tap to show passcode dialog (for touch devices)
  const { ref: multiTapRef } = useMultiTap(
    useCallback(() => {
      if (isKioskMode && !isTemporaryUnlocked) {
        setShowPasscodeDialog(true)
      }
    }, [isKioskMode, isTemporaryUnlocked]),
    { enabled: isKioskMode && !isTemporaryUnlocked }
  )

  // Handle passcode success
  const handlePasscodeSuccess = useCallback(() => {
    temporaryUnlock()
    setShowPasscodeDialog(false)
  }, [temporaryUnlock])

  // Handle passcode dialog close
  const handlePasscodeClose = useCallback(() => {
    setShowPasscodeDialog(false)
  }, [])

  // Handle fullscreen request
  const handleRequestFullscreen = useCallback(async () => {
    await requestFullscreen()
  }, [requestFullscreen])

  // Don't render if kiosk mode is disabled or temporarily unlocked
  if (!isKioskMode || isTemporaryUnlocked) {
    return null
  }

  return (
    <>
      <div
        data-testid="kiosk-overlay"
        className="fixed inset-0 z-30 pointer-events-none"
      >
        {/* Fullscreen prompt (when not in fullscreen) */}
        {!isFullscreen && isSupported && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 pointer-events-auto cursor-pointer"
            onClick={handleRequestFullscreen}
          >
            <div className="text-white text-2xl font-bold mb-4 text-center">
              {t('Kiosk.FullscreenPrompt')}
            </div>
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                handleRequestFullscreen()
              }}
            >
              {t('Kiosk.ReturnToFullscreen')}
            </button>
          </div>
        )}
        {/* Multi-tap zone for touch devices */}
        <div
          ref={multiTapRef}
          data-testid="kiosk-multi-tap-zone"
          className="absolute top-0 right-0 w-20 h-20 pointer-events-auto"
          style={{ opacity: 0 }}
        />
      </div>

      {/* Passcode dialog */}
      <PasscodeDialog
        isOpen={showPasscodeDialog}
        onClose={handlePasscodeClose}
        onSuccess={handlePasscodeSuccess}
        correctPasscode={kioskPasscode}
      />
    </>
  )
}
