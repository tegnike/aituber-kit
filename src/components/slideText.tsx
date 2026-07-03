import homeStore from '@/features/stores/home'

export const SlideText = () => {
  const slideMessages = homeStore((s) => s.slideMessages)
  return (
    <div className="absolute bottom-0 z-20 w-screen bg-white/60 p-2 backdrop-blur-xl">
      <div className="mx-auto max-w-[80vw] p-2 sm:p-4 text-center">
        <div className="line-clamp-1 w-full px-2 sm:px-4 text-primary text-lg sm:text-xl font-bold">
          {slideMessages[0] || '　'}
        </div>
      </div>
    </div>
  )
}
