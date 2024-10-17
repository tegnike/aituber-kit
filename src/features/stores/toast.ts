import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  tag?: string // タグプロパティを追加
  closing?: boolean
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string | null
  removeToast: (id: string) => void
  closeToast: (id: string) => void
}

const toastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const { tag } = toast
    const currentToasts = get().toasts

    // タグが指定されていて、同じタグのトーストが既に存在する場合は追加しない
    if (tag && currentToasts.some((t) => t.tag === tag)) {
      return null
    }

    const id = Math.random().toString(36).substr(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
    return id
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  closeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.map((toast) =>
        toast.id === id ? { ...toast, closing: true } : toast
      ),
    }))
    // トーストを閉じるアニメーションの後に削除
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }))
    }, 300) // アニメーションの時間に合わせて調整
  },
}))

export default toastStore
