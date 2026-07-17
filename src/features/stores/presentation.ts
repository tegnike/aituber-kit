import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  PresentationActualState,
  PresentationControlAction,
  PresentationControlTarget,
  PresentationDocument,
  PresentationPlaybackState,
} from '@/features/presentation/presentationTypes'
import {
  applyPresentationControlAction,
  completePresentationNarration,
} from '@/features/presentation/presentationStateMachine'

interface PresentationState {
  document: PresentationDocument | null
  contentHash: string | null
  presentationId: string | null
  revision: number | null
  sectionId: string | null
  slideId: string | null
  state: PresentationPlaybackState
  pauseRequested: boolean
  lastError: string | null
  updatedAt: string
}

const initialState: PresentationState = {
  document: null,
  contentHash: null,
  presentationId: null,
  revision: null,
  sectionId: null,
  slideId: null,
  state: 'unassigned',
  pauseRequested: false,
  lastError: null,
  updatedAt: new Date(0).toISOString(),
}

const presentationStore = create<PresentationState>()(
  persist(() => initialState, {
    name: 'aituber-kit-presentation-position',
    partialize: (state) => ({
      presentationId: state.presentationId,
      revision: state.revision,
      sectionId: state.sectionId,
      slideId: state.slideId,
      state:
        state.state === 'playing' ||
        state.state === 'loading' ||
        state.state === 'error'
          ? 'paused'
          : state.state,
      updatedAt: state.updatedAt,
    }),
  })
)

const now = () => new Date().toISOString()

const getPosition = (
  document: PresentationDocument,
  state: PresentationState
) => {
  const sectionIndex = Math.max(
    0,
    document.sections.findIndex((section) => section.id === state.sectionId)
  )
  const section = document.sections[sectionIndex]
  const slideIndex = Math.max(
    0,
    section.slides.findIndex((slide) => slide.id === state.slideId)
  )
  return { sectionIndex, slideIndex }
}

const setMachineState = (
  document: PresentationDocument,
  machineState: ReturnType<typeof applyPresentationControlAction>
) => {
  if (!machineState) return false
  const section = document.sections[machineState.sectionIndex]
  const slide = section.slides[machineState.slideIndex]
  presentationStore.setState({
    sectionId: section.id,
    slideId: slide.id,
    state: machineState.playbackState,
    pauseRequested: machineState.pauseRequested,
    lastError: null,
    updatedAt: now(),
  })
  return true
}

export const setPresentationLoading = (
  presentationId: string,
  revision: number
) => {
  presentationStore.setState({
    presentationId,
    revision,
    state: 'loading',
    pauseRequested: false,
    lastError: null,
    updatedAt: now(),
  })
}

export const loadPresentationDocument = (
  document: PresentationDocument,
  contentHash: string,
  autoStart = false
) => {
  const previous = presentationStore.getState()
  const canRestore =
    previous.presentationId === document.presentationId &&
    previous.revision === document.revision
  const section = canRestore
    ? (document.sections.find((item) => item.id === previous.sectionId) ??
      document.sections[0])
    : document.sections[0]
  const slide = canRestore
    ? (section.slides.find((item) => item.id === previous.slideId) ??
      section.slides[0])
    : section.slides[0]
  const stableState = canRestore
    ? previous.state === 'playing' ||
      previous.state === 'loading' ||
      previous.state === 'error'
      ? 'paused'
      : previous.state
    : autoStart
      ? 'playing'
      : 'ready'

  presentationStore.setState({
    document,
    contentHash,
    presentationId: document.presentationId,
    revision: document.revision,
    sectionId: section.id,
    slideId: slide.id,
    state: stableState === 'unassigned' ? 'ready' : stableState,
    pauseRequested: false,
    lastError: null,
    updatedAt: now(),
  })
}

export const setPresentationError = (message: string) => {
  presentationStore.setState({
    state: 'error',
    pauseRequested: false,
    lastError: message,
    updatedAt: now(),
  })
}

export const unloadPresentation = () => {
  presentationStore.setState({ ...initialState, updatedAt: now() })
}

export const applyPresentationControl = (
  action: PresentationControlAction,
  target?: PresentationControlTarget,
  speak = false
) => {
  if (action === 'unload') {
    unloadPresentation()
    return true
  }
  const current = presentationStore.getState()
  if (!current.document) return false
  const position = getPosition(current.document, current)
  return setMachineState(
    current.document,
    applyPresentationControlAction(
      current.document,
      {
        ...position,
        playbackState: current.state,
        pauseRequested: current.pauseRequested,
      },
      action,
      target,
      speak
    )
  )
}

export const finishCurrentPresentationNarration = () => {
  const current = presentationStore.getState()
  if (!current.document) return false
  const position = getPosition(current.document, current)
  const next = completePresentationNarration(current.document, {
    ...position,
    playbackState: current.state,
    pauseRequested: current.pauseRequested,
  })
  return setMachineState(current.document, next)
}

export const getCurrentPresentationLocation = () => {
  const state = presentationStore.getState()
  if (!state.document) return null
  const position = getPosition(state.document, state)
  const section = state.document.sections[position.sectionIndex]
  const slide = section.slides[position.slideIndex]
  const flatIndex =
    state.document.sections
      .slice(0, position.sectionIndex)
      .reduce((count, item) => count + item.slides.length, 0) +
    position.slideIndex
  return { section, slide, ...position, flatIndex }
}

export const getPresentationActualState = (
  isSpeaking: boolean
): PresentationActualState => {
  const state = presentationStore.getState()
  const location = getCurrentPresentationLocation()
  return {
    ...(state.presentationId
      ? {
          presentationId: state.presentationId,
          revision: state.revision ?? undefined,
        }
      : {}),
    state: state.state,
    sectionId: location?.section.id,
    slideId: location?.slide.id,
    slideIndex: location?.flatIndex,
    isSpeaking,
    lastError: state.lastError,
    updatedAt: state.updatedAt,
  }
}

export default presentationStore
