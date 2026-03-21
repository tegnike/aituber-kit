export {}

type Bounds = {
  x: number
  y: number
  width: number
  height: number
}

declare global {
  interface Window {
    electronApp?: {
      isDesktop?: boolean
      openMobileWindow?: () => Promise<{ ok: boolean }>
      closeMobileWindow?: () => Promise<{ ok: boolean }>
      focusMainWindow?: () => Promise<{ ok: boolean }>
      hideMainWindow?: () => Promise<{ ok: boolean }>
      getMobileWindowBounds?: () => Promise<{ ok: boolean; bounds?: Bounds }>
      setMobileWindowPosition?: (
        x: number,
        y: number
      ) => Promise<{ ok: boolean }>
    }
  }
}
