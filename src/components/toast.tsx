import React, { useEffect } from 'react'
import { IconButton } from './iconButton'
import { useTranslation } from 'react-i18next'

type ToastProps = {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
  closing?: boolean
}

export const Toast = ({
  message,
  type,
  onClose,
  duration = 5000,
  closing = false,
}: ToastProps) => {
  const { t } = useTranslation()

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [onClose, duration])

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-toast-success'
      case 'error':
        return 'text-toast-error'
      default:
        return 'text-toast-info'
    }
  }

  const getIconName = () => {
    switch (type) {
      case 'success':
        return '24/Check'
      case 'error':
        return '24/Error'
      default:
        return '24/CommentOutline'
    }
  }

  return (
    <div
      className={`cursor-pointer top-4 right-4 p-4 rounded-2xl text-text1 shadow-lg text-sm flex items-center justify-between mb-2 bg-white bg-opacity-80 transition-opacity duration-300 ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex items-center">
        <IconButton
          iconName={getIconName()}
          isProcessing={false}
          onClick={onClose}
          iconColor={getIconColor()}
          className="!p-2 !bg-transparent !hover:bg-black/10"
        />
        <span className="mr-2">{t(message)}</span>
      </div>
      <IconButton
        iconName="24/Close"
        isProcessing={false}
        onClick={onClose}
        iconColor="text-error"
        className="!p-2 !bg-transparent !hover:bg-black/10"
      />
    </div>
  )
}
