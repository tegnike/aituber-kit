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
    <div className="absolute bottom-[94px] z-20 w-full sm:bottom-[100px]">
      <div className="mx-auto max-w-4xl px-3 sm:px-4" ref={containerRef}>
        <div
          ref={contentRef}
          className={`preset-questions-scroll flex gap-2 overflow-x-auto pb-2 ${
            shouldCenter ? 'justify-center' : 'justify-start'
          }`}
        >
          {sortedQuestions.map((question) => (
            <button
              key={question.id}
              onClick={() => handleQuestionClick(question.text)}
              className="aurora-glass-popover group inline-flex max-w-[82vw] items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold text-theme-default shadow-[0_2px_8px_rgba(31,38,60,0.08)] transition-colors duration-200 hover:border-secondary sm:max-w-none sm:px-4"
            >
              <span className="truncate">{question.text}</span>
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center text-secondary transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
