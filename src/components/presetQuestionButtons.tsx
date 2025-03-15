import { useCallback } from 'react'
import settingsStore from '@/features/stores/settings'

type Props = {
  onSelectQuestion: (text: string) => void
}

export const PresetQuestionButtons = ({ onSelectQuestion }: Props) => {
  const presetQuestions = settingsStore((s) => s.presetQuestions)
  const showPresetQuestions = settingsStore((s) => s.showPresetQuestions)

  const handleQuestionClick = useCallback(
    (text: string) => {
      onSelectQuestion(text)
    },
    [onSelectQuestion]
  )

  if (!showPresetQuestions || presetQuestions.length === 0) {
    return null
  }

  return (
    <div className="absolute bottom-[80px] z-10 w-full px-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex overflow-x-auto pb-8 gap-2 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
          {presetQuestions.map((question) => (
            <button
              key={question.id}
              onClick={() => handleQuestionClick(question.text)}
              className="bg-white text-black rounded-2xl px-4 py-2 whitespace-nowrap shadow-md hover:bg-gray-100 transition-colors"
            >
              Q.{question.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
