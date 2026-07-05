type ModelLoadingOverlayProps = {
  className?: string
}

export default function ModelLoadingOverlay({
  className = '',
}: ModelLoadingOverlayProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center ${className}`}
      aria-label="モデルを読み込み中"
      role="status"
    >
      <div className="aurora-glass-bubble flex h-[76px] w-[76px] items-center justify-center rounded-full">
        <div
          className="h-9 w-9 animate-spin rounded-full border-4 border-[rgba(65,65,79,0.18)] border-t-[var(--aurora-icon)]"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
