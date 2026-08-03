import { useState } from 'react'
import presentationStore from '@/features/stores/presentation'

const PresentationThumbnail = () => {
  const thumbnail = presentationStore((state) => state.document?.thumbnail)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  if (!thumbnail || failedUrl === thumbnail.url) return null

  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg"
      data-testid="presentation-thumbnail"
    >
      <img
        src={thumbnail.url}
        alt={thumbnail.alt}
        className="pointer-events-none h-full w-full object-contain"
        draggable={false}
        onError={() => setFailedUrl(thumbnail.url)}
      />
    </div>
  )
}

export default PresentationThumbnail
