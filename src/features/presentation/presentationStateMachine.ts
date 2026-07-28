import type {
  PresentationControlAction,
  PresentationControlTarget,
  PresentationDocument,
  PresentationPlaybackState,
} from './presentationTypes'

export interface PresentationPosition {
  sectionIndex: number
  slideIndex: number
}

export interface PresentationMachineState extends PresentationPosition {
  playbackState: PresentationPlaybackState
  pauseRequested: boolean
}

const clampPosition = (
  document: PresentationDocument,
  position: PresentationPosition
): PresentationPosition => {
  const sectionIndex = Math.max(
    0,
    Math.min(position.sectionIndex, document.sections.length - 1)
  )
  const slides = document.sections[sectionIndex].slides
  return {
    sectionIndex,
    slideIndex: Math.max(0, Math.min(position.slideIndex, slides.length - 1)),
  }
}

const findTarget = (
  document: PresentationDocument,
  target?: PresentationControlTarget
): PresentationPosition | null => {
  if (!target?.sectionId && !target?.slideId) return null

  for (
    let sectionIndex = 0;
    sectionIndex < document.sections.length;
    sectionIndex++
  ) {
    const section = document.sections[sectionIndex]
    if (target.sectionId && section.id !== target.sectionId) continue
    if (!target.slideId) return { sectionIndex, slideIndex: 0 }
    const slideIndex = section.slides.findIndex(
      (slide) => slide.id === target.slideId
    )
    if (slideIndex >= 0) return { sectionIndex, slideIndex }
  }
  return null
}

const moveSlide = (
  document: PresentationDocument,
  state: PresentationMachineState,
  delta: -1 | 1
): PresentationPosition => {
  const current = clampPosition(document, state)
  if (delta === 1) {
    const section = document.sections[current.sectionIndex]
    if (current.slideIndex < section.slides.length - 1) {
      return { ...current, slideIndex: current.slideIndex + 1 }
    }
    if (current.sectionIndex < document.sections.length - 1) {
      return { sectionIndex: current.sectionIndex + 1, slideIndex: 0 }
    }
    return current
  }

  if (current.slideIndex > 0) {
    return { ...current, slideIndex: current.slideIndex - 1 }
  }
  if (current.sectionIndex > 0) {
    const sectionIndex = current.sectionIndex - 1
    return {
      sectionIndex,
      slideIndex: document.sections[sectionIndex].slides.length - 1,
    }
  }
  return current
}

export const applyPresentationControlAction = (
  document: PresentationDocument,
  state: PresentationMachineState,
  action: PresentationControlAction,
  target?: PresentationControlTarget,
  speak = false
): PresentationMachineState | null => {
  const position = clampPosition(document, state)
  switch (action) {
    case 'start':
    case 'resume':
      return {
        ...state,
        ...position,
        playbackState: 'playing',
        pauseRequested: false,
      }
    case 'pause':
      return state.playbackState === 'playing'
        ? { ...state, ...position, pauseRequested: true }
        : {
            ...state,
            ...position,
            playbackState: 'paused',
            pauseRequested: false,
          }
    case 'next_slide':
      return {
        ...state,
        ...moveSlide(document, state, 1),
        playbackState: 'paused',
        pauseRequested: false,
      }
    case 'previous_slide':
      return {
        ...state,
        ...moveSlide(document, state, -1),
        playbackState: 'paused',
        pauseRequested: false,
      }
    case 'next_section': {
      if (position.sectionIndex >= document.sections.length - 1) {
        return {
          ...state,
          ...position,
          playbackState: 'completed',
          pauseRequested: false,
        }
      }
      return {
        ...state,
        sectionIndex: position.sectionIndex + 1,
        slideIndex: 0,
        playbackState: 'playing',
        pauseRequested: false,
      }
    }
    case 'previous_section':
      return {
        ...state,
        sectionIndex: Math.max(0, position.sectionIndex - 1),
        slideIndex: 0,
        playbackState: 'paused',
        pauseRequested: false,
      }
    case 'goto': {
      const nextPosition = findTarget(document, target)
      if (!nextPosition) return null
      return {
        ...state,
        ...nextPosition,
        playbackState: speak ? 'playing' : 'paused',
        pauseRequested: false,
      }
    }
    case 'reset':
      return {
        sectionIndex: 0,
        slideIndex: 0,
        playbackState: 'ready',
        pauseRequested: false,
      }
    case 'hide':
    case 'show':
      return state
    case 'unload':
      return {
        sectionIndex: 0,
        slideIndex: 0,
        playbackState: 'unassigned',
        pauseRequested: false,
      }
  }
}

export const completePresentationNarration = (
  document: PresentationDocument,
  state: PresentationMachineState
): PresentationMachineState => {
  const position = clampPosition(document, state)
  const section = document.sections[position.sectionIndex]
  const slide = section.slides[position.slideIndex]
  const isFinalSlide =
    position.sectionIndex === document.sections.length - 1 &&
    position.slideIndex === section.slides.length - 1

  if (isFinalSlide) {
    return {
      ...state,
      ...position,
      playbackState: 'completed',
      pauseRequested: false,
    }
  }
  if (state.pauseRequested) {
    return {
      ...state,
      ...position,
      playbackState: 'paused',
      pauseRequested: false,
    }
  }
  if (slide.pauseAfter) {
    return {
      ...state,
      ...position,
      playbackState: 'section_paused',
      pauseRequested: false,
    }
  }
  return {
    ...state,
    ...moveSlide(document, state, 1),
    playbackState: 'playing',
    pauseRequested: false,
  }
}
