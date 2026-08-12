import type { PresentationSlideV1 } from './presentationTypes'

export const getPresentationDisplayNarration = (
  slide: Pick<PresentationSlideV1, 'narration' | 'speechText'>
) => (slide.narration ?? slide.speechText)?.trim() ?? ''

export const getPresentationSpeechText = (
  slide: Pick<PresentationSlideV1, 'narration' | 'speechText'>
) => (slide.speechText ?? slide.narration)?.trim() ?? ''
