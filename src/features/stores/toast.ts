import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  tag?: string
  closing?: boolean
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string | null
  removeToast: (identifier: string) => void
  closeToast: (identifier: string) => void
}

const toastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const { tag } = toast
    const currentToasts = get().toasts

    if (tag && currentToasts.some((t) => t.tag === tag)) {
      return null
    }

    const id = Math.random().toString(36).substring(2, 11)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
    return id
  },
  removeToast: (identifier) =>
    set((state) => ({
      toasts: state.toasts.filter(
        (toast) => toast.id !== identifier && toast.tag !== identifier
      ),
    })),
  closeToast: (identifier) => {
    set((state) => ({
      toasts: state.toasts.map((toast) =>
        toast.id === identifier || toast.tag === identifier
          ? { ...toast, closing: true }
          : toast
      ),
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(
          (toast) => toast.id !== identifier && toast.tag !== identifier
        ),
      }))
    }, 300)
  },
}))

export default toastStore
