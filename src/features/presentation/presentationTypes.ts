export interface PresentationManifestV1 {
  schemaVersion: 1
  presentationId: string
  revision: number
  title: string
  thumbnail?: PresentationAssetV1
  description?: string
  locale?: string
  createdAt: string
  theme?: string
  sections: PresentationSectionV1[]
  metadata?: Record<string, string | number | boolean | null>
}

export interface PresentationSectionV1 {
  id: string
  title: string
  qaBrief?: string
  responsePolicy?: string
  sources?: PresentationSourceV1[]
  slides: PresentationSlideV1[]
}

export interface PresentationSlideV1 {
  id: string
  markdown: string
  narration?: string
  speechText?: string
  notes?: string
  pauseAfter?: boolean
  assets?: PresentationAssetV1[]
}

export interface PresentationAssetV1 {
  id: string
  type: 'image'
  url: string
  alt: string
  credit?: string
  sourceUrl?: string
}

export interface PresentationSourceV1 {
  id: string
  title: string
  url: string
  publisher?: string
  publishedAt?: string
}

export interface PresentationSlide extends PresentationSlideV1 {
  pauseAfter: boolean
}

export interface PresentationSection extends Omit<
  PresentationSectionV1,
  'slides'
> {
  slides: PresentationSlide[]
}

export interface PresentationDocument extends Omit<
  PresentationManifestV1,
  'sections'
> {
  sections: PresentationSection[]
}

export type PresentationPlaybackState =
  | 'unassigned'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'section_paused'
  | 'completed'
  | 'error'

export type PresentationControlAction =
  | 'start'
  | 'pause'
  | 'resume'
  | 'next_slide'
  | 'previous_slide'
  | 'next_section'
  | 'previous_section'
  | 'goto'
  | 'reset'
  | 'hide'
  | 'show'
  | 'unload'

export interface PresentationControlTarget {
  sectionId?: string
  slideId?: string
}

export interface PresentationAssignment {
  presentationId: string
  revision: number
  autoStart: boolean
}

export interface PresentationActualState {
  presentationId?: string
  revision?: number
  state: PresentationPlaybackState
  sectionId?: string
  slideId?: string
  slideIndex?: number
  isSpeaking: boolean
  lastError: string | null
  updatedAt: string
}
