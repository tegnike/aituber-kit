import type {
  PresentationDocument,
  PresentationManifestV1,
} from '@/features/presentation/presentationTypes'
import { validateExternalPresentation } from '@/features/presentation/presentationSchema'

export const normalizeExternalPresentation = (
  value: unknown
): PresentationDocument => {
  const validation = validateExternalPresentation(value)
  if (!validation.ok) {
    throw new Error('Invalid external presentation')
  }

  return {
    ...validation.manifest,
    sections: validation.manifest.sections.map((section) => ({
      ...section,
      slides: section.slides.map((slide, index) => ({
        ...slide,
        pauseAfter: slide.pauseAfter ?? index === section.slides.length - 1,
      })),
    })),
  }
}

interface LegacyScript {
  page: number
  line?: string
  notes?: string
}

export const normalizeLegacyPresentation = (
  markdown: string,
  scripts: LegacyScript[],
  supplement = '',
  presentationId = 'legacy-presentation'
): PresentationDocument => {
  const pages = markdown.split(/^\s*---\s*$/m)
  const manifest: PresentationManifestV1 = {
    schemaVersion: 1,
    presentationId,
    revision: 1,
    title: presentationId,
    createdAt: new Date(0).toISOString(),
    sections: [
      {
        id: 'legacy-section',
        title: presentationId,
        qaBrief: supplement,
        slides: pages.map((page, index) => {
          const script = scripts.find((item) => item.page === index)
          return {
            id: `legacy-slide-${index + 1}`,
            markdown: page.trim(),
            narration: script?.line,
            notes: script?.notes,
            pauseAfter: index === pages.length - 1,
          }
        }),
      },
    ],
  }

  return normalizeExternalPresentation(manifest)
}
