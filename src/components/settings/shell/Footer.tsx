import { APP_VERSION } from '@/constants/appVersion'

export const Footer = () => {
  return (
    <footer className="theme-surface-contrast shrink-0 border-t border-primary/20 py-1 text-center font-Montserrat text-xs">
      powered by ChatVRM from Pixiv / ver. {APP_VERSION}
    </footer>
  )
}
