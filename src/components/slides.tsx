import { logger } from '@/lib/logger'
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import slideStore from '@/features/stores/slide'
import presentationStore, {
  applyPresentationControl,
  finishCurrentPresentationNarration,
} from '@/features/stores/presentation'
import { buildExternalSlideMarkdown } from '@/features/presentation/externalSlideMarkdown'
import homeStore from '@/features/stores/home'
import { speakMessageHandler } from '@/features/chat/handlers'
import { SpeakQueue } from '@/features/messages/speakQueue'
import SlideContent from './slideContent'
import SlideControls from './slideControls'
import SlideFrame from './slideFrame'
import PresentationThumbnail from './presentationThumbnail'

interface SlidesProps {
  markdown: string
  visible?: boolean
  thumbnailVisible?: boolean
}

export { goToSlide } from '@/features/stores/slide'

const Slides: React.FC<SlidesProps> = ({
  visible = true,
  thumbnailVisible = false,
}) => {
  const [marpitContainer, setMarpitContainer] = useState<Element | null>(null)
  const legacyIsPlaying = slideStore((state) => state.isPlaying)
  const legacyCurrentSlide = slideStore((state) => state.currentSlide)
  const selectedSlideDocs = slideStore((state) => state.selectedSlideDocs)
  const document = presentationStore((state) => state.document)
  const playbackState = presentationStore((state) => state.state)
  const currentSectionId = presentationStore((state) => state.sectionId)
  const currentSlideId = presentationStore((state) => state.slideId)
  const chatProcessingCount = homeStore((state) => state.chatProcessingCount)
  const [legacySlideCount, setLegacySlideCount] = useState(0)
  const narrationKeyRef = useRef<string | null>(null)
  const narrationObservedRef = useRef(false)

  const externalSlides = useMemo(
    () =>
      document?.sections.flatMap((section) =>
        section.slides.map((slide) => ({ section, slide }))
      ) ?? [],
    [document]
  )
  const externalCurrentSlide = Math.max(
    0,
    externalSlides.findIndex(
      ({ section, slide }) =>
        section.id === currentSectionId && slide.id === currentSlideId
    )
  )
  const isExternal = Boolean(document)
  const isPlaying = isExternal ? playbackState === 'playing' : legacyIsPlaying
  const currentSlide = isExternal ? externalCurrentSlide : legacyCurrentSlide
  const slideCount = isExternal ? externalSlides.length : legacySlideCount
  const externalMarkdown = useMemo(
    () =>
      externalSlides
        .map(({ section, slide }) => {
          const sectionSlideIndex = section.slides.findIndex(
            (item) => item.id === slide.id
          )
          return buildExternalSlideMarkdown(section, slide, sectionSlideIndex)
        })
        .join('\n\n---\n\n'),
    [externalSlides]
  )

  useEffect(() => {
    slideStore.setState({ currentSlide, isPlaying })
  }, [currentSlide, isPlaying])

  useEffect(() => {
    const currentMarpitContainer = window.document.querySelector('.marpit')
    if (!currentMarpitContainer) return
    const slides = currentMarpitContainer.querySelectorAll(':scope > svg')
    slides.forEach((slide, index) => {
      const svgElement = slide as SVGElement
      svgElement.style.display = index === currentSlide ? 'block' : 'none'
    })
  }, [currentSlide, marpitContainer])

  useEffect(() => {
    let cancelled = false
    let styleElement: HTMLStyleElement | null = null

    const convertMarkdown = async () => {
      if (!isExternal && !selectedSlideDocs) {
        setMarpitContainer(null)
        setLegacySlideCount(0)
        return
      }
      try {
        const response = await fetch('/api/convertMarkdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isExternal
              ? { external: true, markdown: externalMarkdown }
              : { slideName: selectedSlideDocs }
          ),
        })
        if (!response.ok) {
          throw new Error(`Slide rendering failed (${response.status})`)
        }
        const data = await response.json()
        const parser = new DOMParser()
        const parsed = parser.parseFromString(data.html, 'text/html')
        const marpitElement = parsed.querySelector('.marpit')
        if (cancelled) return
        setMarpitContainer(marpitElement)

        const slides = marpitElement?.querySelectorAll(':scope > svg') ?? []
        if (!isExternal) setLegacySlideCount(slides.length)

        styleElement = window.document.createElement('style')
        styleElement.textContent = data.css
        window.document.head.appendChild(styleElement)
      } catch (error) {
        logger.error('Failed to render slides:', error)
      }
    }

    void convertMarkdown()
    return () => {
      cancelled = true
      styleElement?.remove()
    }
  }, [externalMarkdown, isExternal, selectedSlideDocs])

  useEffect(() => {
    const styleElement = window.document.createElement('style')
    styleElement.textContent = `
      div.marpit > svg > foreignObject > section { padding: 2em; }
      div.marpit img { background: #eee; color: #555; }
    `
    window.document.head.appendChild(styleElement)
    return () => styleElement.remove()
  }, [])

  const readLegacySlide = useCallback(
    (slideIndex: number) => {
      const scripts = require(
        `../../public/slides/${selectedSlideDocs}/scripts.json`
      )
      const script = scripts.find(
        (item: { page: number }) => item.page === slideIndex
      )
      const line = script?.line ?? ''
      logger.log(line)
      void speakMessageHandler(line)
    },
    [selectedSlideDocs]
  )

  useEffect(() => {
    if (!isExternal || playbackState !== 'playing') {
      narrationKeyRef.current = null
      narrationObservedRef.current = false
      return
    }
    const current = externalSlides[externalCurrentSlide]
    if (!current) return
    const key = `${current.section.id}:${current.slide.id}`
    if (narrationKeyRef.current === key) return

    narrationKeyRef.current = key
    narrationObservedRef.current = false
    const narration = current.slide.narration?.trim() ?? ''
    if (!narration) {
      narrationKeyRef.current = null
      finishCurrentPresentationNarration()
      return
    }

    void speakMessageHandler(narration).then(() => {
      if (
        narrationKeyRef.current === key &&
        homeStore.getState().chatProcessingCount === 0
      ) {
        narrationKeyRef.current = null
        finishCurrentPresentationNarration()
      }
    })
  }, [externalCurrentSlide, externalSlides, isExternal, playbackState])

  useEffect(() => {
    if (
      !isExternal ||
      playbackState !== 'playing' ||
      !narrationKeyRef.current
    ) {
      return
    }
    if (chatProcessingCount > 0) {
      narrationObservedRef.current = true
      return
    }
    if (narrationObservedRef.current) {
      narrationObservedRef.current = false
      narrationKeyRef.current = null
      finishCurrentPresentationNarration()
    }
  }, [chatProcessingCount, isExternal, playbackState])

  const nextSlide = useCallback(() => {
    if (isExternal) {
      applyPresentationControl('next_slide')
      return
    }
    slideStore.setState((state) => {
      const next = Math.min(state.currentSlide + 1, slideCount - 1)
      if (legacyIsPlaying) readLegacySlide(next)
      return { currentSlide: next }
    })
  }, [isExternal, legacyIsPlaying, readLegacySlide, slideCount])

  const prevSlide = useCallback(() => {
    if (isExternal) {
      applyPresentationControl('previous_slide')
      return
    }
    slideStore.setState((state) => ({
      currentSlide: Math.max(state.currentSlide - 1, 0),
    }))
  }, [isExternal])

  const toggleIsPlaying = () => {
    if (isExternal) {
      applyPresentationControl(
        playbackState === 'playing'
          ? 'pause'
          : playbackState === 'paused'
            ? 'resume'
            : 'start'
      )
      return
    }

    const nextPlaying = !legacyIsPlaying
    slideStore.setState({ isPlaying: nextPlaying })
    if (nextPlaying) {
      readLegacySlide(currentSlide)
    } else {
      homeStore.setState({ isSpeaking: false })
      SpeakQueue.stopAll()
    }
  }

  useEffect(() => {
    if (
      !isExternal &&
      chatProcessingCount === 0 &&
      legacyIsPlaying &&
      currentSlide < slideCount - 1
    ) {
      nextSlide()
    }
  }, [
    chatProcessingCount,
    currentSlide,
    isExternal,
    legacyIsPlaying,
    nextSlide,
    slideCount,
  ])

  useEffect(() => {
    if (
      !isExternal &&
      currentSlide === slideCount - 1 &&
      chatProcessingCount === 0
    ) {
      slideStore.setState({ isPlaying: false })
    }
  }, [chatProcessingCount, currentSlide, isExternal, slideCount])

  const currentSection = externalSlides[externalCurrentSlide]?.section
  const canMoveToNextSection = Boolean(
    document &&
    currentSection &&
    document.sections.findIndex((section) => section.id === currentSection.id) <
      document.sections.length - 1
  )

  return (
    <SlideFrame
      visible={visible}
      controls={
        thumbnailVisible ? null : (
          <SlideControls
            currentSlide={currentSlide}
            slideCount={slideCount}
            isPlaying={isPlaying}
            prevSlide={prevSlide}
            nextSlide={nextSlide}
            toggleIsPlaying={toggleIsPlaying}
            currentSectionTitle={currentSection?.title}
            playbackState={isExternal ? playbackState : undefined}
            nextSection={
              isExternal && canMoveToNextSection
                ? () => applyPresentationControl('next_section')
                : undefined
            }
          />
        )
      }
    >
      {thumbnailVisible ? (
        <PresentationThumbnail />
      ) : (
        <SlideContent marpitContainer={marpitContainer} />
      )}
    </SlideFrame>
  )
}

export default Slides
