import React from 'react'
import { Toast } from './toast'
import toastStore from '@/features/stores/toast'
import { useEffect, useState } from 'react'

export const Toasts: React.FC = () => {
  const [toasts, setToasts] = useState(toastStore.getState().toasts)

  useEffect(() => {
    const unsubscribe = toastStore.subscribe((state) => setToasts(state.toasts))
    return () => unsubscribe()
  }, [])

  const removeToast = toastStore.getState().removeToast

  return (
    <div className="absolute top-4 right-4 z-15 font-bold m-24">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
