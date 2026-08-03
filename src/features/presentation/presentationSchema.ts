import { z } from 'zod'
import type { PresentationManifestV1 } from './presentationTypes'

export const PRESENTATION_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/
export const PRESENTATION_LIMITS = {
  sections: 50,
  slides: 200,
  markdown: 50_000,
  narration: 10_000,
  qaBrief: 100_000,
  sources: 500,
  notes: 10_000,
  responsePolicy: 10_000,
  description: 2_000,
  locale: 64,
  assetsPerSlide: 20,
  metadataEntries: 50,
  metadataValue: 10_000,
} as const

const idSchema = z.string().regex(PRESENTATION_ID_PATTERN, 'Invalid ID')
const httpUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => {
      const protocol = new URL(value).protocol
      return protocol === 'http:' || protocol === 'https:'
    },
    { message: 'URL must use http or https' }
  )

export const isSafePresentationMarkdown = (markdown: string) => {
  const forbidden = [
    /<\/?[a-z][^>]*>/i,
    /\bon[a-z]+\s*=/i,
    /\]\(\s*(?:javascript|data|file)\s*:/i,
  ]
  return !forbidden.some((pattern) => pattern.test(markdown))
}

const assetSchema = z.object({
  id: idSchema,
  type: z.literal('image'),
  url: httpUrlSchema,
  alt: z.string().min(1),
  credit: z.string().optional(),
  sourceUrl: httpUrlSchema.optional(),
})

const sourceSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  url: httpUrlSchema,
  publisher: z.string().optional(),
  publishedAt: z.string().datetime({ offset: true }).optional(),
})

const slideSchema = z.object({
  id: idSchema,
  markdown: z
    .string()
    .max(PRESENTATION_LIMITS.markdown)
    .refine(isSafePresentationMarkdown, 'Markdown contains unsafe content'),
  narration: z.string().max(PRESENTATION_LIMITS.narration).optional(),
  notes: z.string().max(PRESENTATION_LIMITS.notes).optional(),
  pauseAfter: z.boolean().optional(),
  assets: z
    .array(assetSchema)
    .max(PRESENTATION_LIMITS.assetsPerSlide)
    .optional(),
})

const sectionSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  qaBrief: z.string().max(PRESENTATION_LIMITS.qaBrief).optional(),
  responsePolicy: z.string().max(PRESENTATION_LIMITS.responsePolicy).optional(),
  sources: z.array(sourceSchema).optional(),
  slides: z.array(slideSchema).min(1),
})

const metadataValueSchema = z.union([
  z.string().max(PRESENTATION_LIMITS.metadataValue),
  z.number(),
  z.boolean(),
  z.null(),
])

export const presentationManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    presentationId: idSchema,
    revision: z.number().int().min(1),
    title: z.string().min(1),
    thumbnail: assetSchema.optional(),
    description: z.string().max(PRESENTATION_LIMITS.description).optional(),
    locale: z.string().max(PRESENTATION_LIMITS.locale).optional(),
    createdAt: z.string().datetime({ offset: true }),
    theme: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,64}$/, 'Invalid theme ID')
      .optional(),
    sections: z.array(sectionSchema).min(1).max(PRESENTATION_LIMITS.sections),
    metadata: z.record(metadataValueSchema).optional(),
  })
  .superRefine((manifest, context) => {
    const sectionIds = new Set<string>()
    const slideIds = new Set<string>()
    const assetIds = new Set<string>()
    let slideCount = 0
    let sourceCount = 0

    if (manifest.thumbnail) assetIds.add(manifest.thumbnail.id)

    if (
      manifest.metadata &&
      Object.keys(manifest.metadata).length >
        PRESENTATION_LIMITS.metadataEntries
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['metadata'],
        message: `Metadata cannot exceed ${PRESENTATION_LIMITS.metadataEntries} entries`,
      })
    }

    manifest.sections.forEach((section, sectionIndex) => {
      if (sectionIds.has(section.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sections', sectionIndex, 'id'],
          message: 'Section IDs must be unique',
        })
      }
      sectionIds.add(section.id)
      sourceCount += section.sources?.length ?? 0

      section.slides.forEach((slide, slideIndex) => {
        slideCount += 1
        if (slideIds.has(slide.id)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['sections', sectionIndex, 'slides', slideIndex, 'id'],
            message: 'Slide IDs must be unique',
          })
        }
        slideIds.add(slide.id)

        slide.assets?.forEach((asset, assetIndex) => {
          if (assetIds.has(asset.id)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: [
                'sections',
                sectionIndex,
                'slides',
                slideIndex,
                'assets',
                assetIndex,
                'id',
              ],
              message: 'Asset IDs must be unique',
            })
          }
          assetIds.add(asset.id)
        })
      })
    })

    if (slideCount > PRESENTATION_LIMITS.slides) {
      context.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: PRESENTATION_LIMITS.slides,
        inclusive: true,
        type: 'array',
        path: ['sections'],
        message: `Presentation cannot exceed ${PRESENTATION_LIMITS.slides} slides`,
      })
    }
    if (sourceCount > PRESENTATION_LIMITS.sources) {
      context.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: PRESENTATION_LIMITS.sources,
        inclusive: true,
        type: 'array',
        path: ['sections'],
        message: `Presentation cannot exceed ${PRESENTATION_LIMITS.sources} sources`,
      })
    }
  })

export type PresentationValidationResult =
  | { ok: true; manifest: PresentationManifestV1 }
  | { ok: false; issues: z.ZodIssue[] }

export const validateExternalPresentation = (
  value: unknown
): PresentationValidationResult => {
  const result = presentationManifestSchema.safeParse(value)
  return result.success
    ? { ok: true, manifest: result.data }
    : { ok: false, issues: result.error.issues }
}
