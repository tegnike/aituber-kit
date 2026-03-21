import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LayoutMode = 'auto' | 'desktop' | 'mobile'

interface LayoutState {
  layoutMode: LayoutMode
  mobileChatOpen: boolean
  setLayoutMode: (mode: LayoutMode) => void
  setMobileChatOpen: (open: boolean) => void
  toggleMobileChat: () => void
}

const layoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layoutMode: 'auto',
      mobileChatOpen: false,
      setLayoutMode: (mode) => set({ layoutMode: mode }),
      setMobileChatOpen: (open) => set({ mobileChatOpen: open }),
      toggleMobileChat: () =>
        set((state) => ({ mobileChatOpen: !state.mobileChatOpen })),
    }),
    {
      name: 'aitube-kit-layout',
      partialize: (state) => ({
        layoutMode: state.layoutMode,
      }),
    }
  )
)

export default layoutStore
