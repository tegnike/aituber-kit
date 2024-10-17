import React, { useEffect } from 'react'
import { IconButton } from './iconButton'
import { useTranslation } from 'react-i18next'

type ToastProps = {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export const Toast = ({
  message,
  type,
  onClose,
  duration = 5000,
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
    <div className="cursor-pointer top-4 right-4 p-4 rounded-16 text-text1 shadow-lg text-sm flex items-center mb-8 bg-white bg-opacity-80">
      <IconButton
        iconName={getIconName()}
        isProcessing={false}
        onClick={onClose}
        iconColor={getIconColor()} // iconColorプロパティを使用
        className="!p-2 !bg-transparent !hover:bg-black/10"
      />
      <span className="mr-2">{t(message)}</span>
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
