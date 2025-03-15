import homeStore from '@/features/stores/home'

export const SlideText = () => {
  const slideMessages = homeStore((s) => s.slideMessages)
  return (
    <div className="bg-white absolute bottom-0 z-20 w-screen p-2">
      <div className="mx-auto max-w-[80vw] p-4 text-center">
        <div className="line-clamp-1 w-full px-4 text-text-primary text-xl font-bold">
          {slideMessages[0] || '　'}
        </div>
      </div>
    </div>
  )
}
