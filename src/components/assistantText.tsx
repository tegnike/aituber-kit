import settingsStore from '@/features/stores/settings'

export const AssistantText = ({ message }: { message: string }) => {
  const characterName = settingsStore((s) => s.characterName)
  const showCharacterName = settingsStore((s) => s.showCharacterName)

  return (
    <div className="absolute bottom-0 left-0 md:mb-[96px] mb-[80px] w-full z-10">
      <div className="mx-auto max-w-4xl w-full p-16">
        <div className="bg-white rounded-8">
          {showCharacterName && (
            <div className="px-24 py-8 bg-secondary rounded-t-8 text-white font-bold tracking-wider">
              {characterName}
            </div>
          )}
          <div className="px-24 py-16">
            <div className="line-clamp-4 text-secondary typography-16 font-bold">
              {message.replace(/\[([a-zA-Z]*?)\]/g, '')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
