import Link from 'next/link'
import { isOfficialSite } from '@/utils/officialSite'

export const SeoSummary = () => {
  if (!isOfficialSite()) return null

  return (
    <Link
      href="/aituber/"
      className="fixed bottom-3 left-3 z-30 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs font-bold text-white/80 shadow-lg backdrop-blur-sm transition hover:border-cyan-300/60 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
    >
      AITuberKitとは
    </Link>
  )
}
