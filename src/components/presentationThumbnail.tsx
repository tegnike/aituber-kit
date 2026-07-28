import presentationStore from '@/features/stores/presentation'

const PresentationThumbnail = () => {
  const thumbnail = presentationStore((state) => state.document?.thumbnail)
  if (!thumbnail) return null

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
      />
    </div>
  )
}

export default PresentationThumbnail
