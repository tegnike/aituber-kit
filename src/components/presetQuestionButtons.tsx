import { useCallback, useRef, useEffect, useState } from 'react'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import { SpeakQueue } from '@/features/messages/speakQueue'
import { InlineOutlineIcon } from './iconButton'

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
    <div className="pointer-events-none absolute bottom-[94px] z-20 w-full sm:bottom-[100px]">
      <div
        className="pointer-events-auto mx-auto max-w-4xl px-3 sm:px-4"
        ref={containerRef}
      >
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
                <InlineOutlineIcon name="24/Send" size={16} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
