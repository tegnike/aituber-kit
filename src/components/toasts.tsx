import React from 'react'
import { Toast } from './toast'
import toastStore from '@/features/stores/toast'
import { useEffect, useState } from 'react'

export const Toasts: React.FC = () => {
  const [toasts, setToasts] = useState(toastStore.getState().toasts)
  const closeToast = toastStore((state) => state.closeToast)

  useEffect(() => {
    const unsubscribe = toastStore.subscribe((state) => setToasts(state.toasts))
    return () => unsubscribe()
  }, [])

  return (
    <div className="absolute top-4 right-4 z-15 font-bold m-6 w-[calc(100%-48px)] md:w-[350px]">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => closeToast(toast.id)}
          closing={toast.closing}
        />
      ))}
    </div>
  )
}
