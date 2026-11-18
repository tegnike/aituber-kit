'use client'

import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import ModelLoadingOverlay from '@/components/modelLoadingOverlay'
import settingsStore from '@/features/stores/settings'

const LivLivComponent = dynamic(() => import('./LivLivComponent'), {
  ssr: false,
  loading: () => <ModelLoadingOverlay />,
})

export default function LivLivViewer() {
  const selectedLivlivPath = settingsStore((s) => s.selectedLivlivPath)
  return (
    <ErrorBoundary name="livliv-viewer" resetKey={selectedLivlivPath}>
      <div className="fixed inset-0 z-10 h-screen w-screen">
        <LivLivComponent selectedPath={selectedLivlivPath} />
      </div>
    </ErrorBoundary>
  )
}
