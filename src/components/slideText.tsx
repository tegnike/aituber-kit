import homeStore from '@/features/stores/home'

export const SlideText = () => {
  const slideMessages = homeStore((s) => s.slideMessages)
  return (
    <div className="bg-white absolute bottom-0 z-20 w-screen p-8">
      <div className="mx-auto max-w-[80vw] p-16 text-center">
        <div className="line-clamp-1 w-full px-16 text-text-primary typography-20 font-bold">
          {slideMessages[0] || '　'}
        </div>
      </div>
    </div>
  )
}
