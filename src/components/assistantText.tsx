import settingsStore from '@/features/stores/settings'
import { EMOTIONS } from '@/features/messages/messages'

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const emotionPattern = new RegExp(
  `\\[(${EMOTIONS.map(escapeRegExp).join('|')})\\]`,
  'gi'
)

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
      className={`absolute bottom-0 left-0 ${shouldShowPresetQuestions ? 'mb-[140px] sm:mb-[180px]' : 'mb-[64px] sm:mb-[80px]'} w-full z-10`}
    >
      <div className="mx-auto max-w-4xl w-full p-2 sm:p-4">
        <div className="bg-white rounded-lg">
          {showCharacterName && (
            <div className="px-3 sm:px-6 py-2 bg-secondary rounded-t-lg text-theme text-sm sm:text-base font-bold tracking-wider">
              {characterName}
            </div>
          )}
          <div className="px-3 sm:px-6 py-4">
            <div className="line-clamp-4 text-secondary text-sm sm:text-base font-bold">
              {message
                .replace(emotionPattern, '')
                .replace(/\[motion:[^\]]*\]/gi, '')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
