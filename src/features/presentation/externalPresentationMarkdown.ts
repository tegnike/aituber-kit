import type { PresentationDocument } from '@/features/presentation/presentationTypes'

/**
 * Serializes an external presentation without inferring layouts or rewriting
 * content. The producer owns the Markdown; AITuberKit only preserves slide
 * order and inserts Marpit slide separators.
 */
export const serializeExternalPresentationMarkdown = (
  document: PresentationDocument
) =>
  document.sections
    .flatMap((section) => section.slides)
    .map((slide) => slide.markdown)
    .join('\n\n---\n\n')
