import { useCallback, useRef, useEffect, useState } from 'react'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import { SpeakQueue } from '@/features/messages/speakQueue'

type Props = {
  onSelectQuestion: (text: string) => void
}

export const PresetQuestionButtons = ({ onSelectQuestion }: Props) => {
  const presetQuestions = settingsStore((s) => s.presetQuestions)
  const showPresetQuestions = settingsStore((s) => s.showPresetQuestions)
  const [shouldCenter, setShouldCenter] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleQuestionClick = useCallback(
    (text: string) => {
      homeStore.setState({ isSpeaking: false })
      SpeakQueue.stopAll()
      onSelectQuestion(text)
    },
    [onSelectQuestion]
  )

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && contentRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const contentWidth = contentRef.current.scrollWidth
        setShouldCenter(contentWidth <= containerWidth)
      }
    }

    checkOverflow()

    // リサイズ時にも再計算
    const handleResize = () => {
      checkOverflow()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [presetQuestions])

  if (!showPresetQuestions || presetQuestions.length === 0) {
    return null
  }

  // Sort questions by order
  const sortedQuestions = [...presetQuestions].sort((a, b) => a.order - b.order)

  return (
    <div className="absolute bottom-[80px] z-20 w-full px-16">
      <div className="mx-auto max-w-4xl" ref={containerRef}>
        <div
          ref={contentRef}
          className={`flex overflow-x-auto pb-8 gap-4 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent ${
            shouldCenter ? 'justify-center' : 'justify-start'
          }`}
        >
          {sortedQuestions.map((question) => (
            <button
              key={question.id}
              onClick={() => handleQuestionClick(question.text)}
              className="bg-white text-black rounded-2xl px-4 py-3 whitespace-nowrap hover:bg-gray-100 transition-colors shadow-md"
            >
              {question.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
