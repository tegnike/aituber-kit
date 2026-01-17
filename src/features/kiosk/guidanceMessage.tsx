/**
 * GuidanceMessage Component
 *
 * Displays guidance message for kiosk mode users
 * Requirements: 6.1, 6.2, 6.3 - 操作誘導表示
 */

import React from 'react'

export interface GuidanceMessageProps {
  message: string
  visible: boolean
  onDismiss?: () => void
}

export const GuidanceMessage: React.FC<GuidanceMessageProps> = ({
  message,
  visible,
  onDismiss,
}) => {
  if (!visible) return null

  return (
    <div
      data-testid="guidance-message"
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 animate-fade-in text-center text-3xl"
      onClick={onDismiss}
    >
      <div
        className="font-bold text-white drop-shadow-lg cursor-pointer pointer-events-auto animate-pulse-slow"
        style={{
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        }}
      >
        {message}
      </div>
    </div>
  )
}
