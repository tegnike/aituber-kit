import { useMemo } from 'react'

export const useIsDedicatedMobileWindow = () => {
  return useMemo(() => {
    if (typeof window === 'undefined') return false
    return (
      new URLSearchParams(window.location.search).get('layout') ===
      'mobile-window'
    )
  }, [])
}
