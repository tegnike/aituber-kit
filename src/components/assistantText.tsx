import settingsStore from '@/features/stores/settings'

export const AssistantText = ({ message }: { message: string }) => {
  const characterName = settingsStore((s) => s.characterName)
  const showCharacterName = settingsStore((s) => s.showCharacterName)
  const showPresetQuestions = settingsStore((s) => s.showPresetQuestions)
  const presetQuestions = settingsStore((s) => s.presetQuestions)

  // Check if preset questions should be shown AND there are actual questions
  const shouldShowPresetQuestions =
    showPresetQuestions && presetQuestions.length > 0

  return (
    <div
      className={`absolute bottom-0 left-0 ${shouldShowPresetQuestions ? 'md:mb-[180px] mb-[180px]' : 'md:mb-[96px] mb-[80px]'} w-full z-10`}
    >
      <div className="mx-auto max-w-4xl w-full p-4">
        <div className="bg-white rounded-lg">
          {showCharacterName && (
            <div className="px-6 py-2 bg-secondary rounded-t-lg text-theme font-bold tracking-wider">
              {characterName}
            </div>
          )}
          <div className="px-6 py-4">
            <div className="line-clamp-4 text-secondary font-bold">
              {message.replace(/\[([a-zA-Z]*?)\]/g, '')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
