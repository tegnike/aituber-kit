import {
  normalizeExternalPresentation,
  normalizeLegacyPresentation,
} from '@/features/presentation/presentationNormalizer'
import { buildPresentationPromptContext } from '@/features/presentation/presentationPromptContext'
import { sanitizePresentationHtml } from '@/features/presentation/presentationSanitizer'
import { validateExternalPresentation } from '@/features/presentation/presentationSchema'
import {
  getPresentationDisplayNarration,
  getPresentationSpeechText,
} from '@/features/presentation/presentationText'
import {
  applyPresentationControlAction,
  completePresentationNarration,
} from '@/features/presentation/presentationStateMachine'
import type { PresentationManifestV1 } from '@/features/presentation/presentationTypes'

const createManifest = (): PresentationManifestV1 => ({
  schemaVersion: 1,
  presentationId: 'daily-news',
  revision: 1,
  title: 'Daily news',
  createdAt: '2026-07-14T20:00:00.000+02:00',
  theme: 'default',
  sections: [
    {
      id: 'section-1',
      title: 'Section one',
      qaBrief: 'FIRST_SECTION_ONLY',
      responsePolicy: 'Do not guess',
      sources: [
        { id: 'source-1', title: 'Source', url: 'https://example.com' },
      ],
      slides: [
        {
          id: 'slide-1',
          markdown: '# One',
          narration: 'First narration',
          notes: 'First notes',
          pauseAfter: false,
        },
        { id: 'slide-2', markdown: '# Two', narration: 'Second narration' },
      ],
    },
    {
      id: 'section-2',
      title: 'Section two',
      qaBrief: 'MUST_NOT_LEAK',
      slides: [{ id: 'slide-3', markdown: '# Three' }],
    },
  ],
})

describe('external presentation domain', () => {
  it('validates and normalizes implicit section pauses', () => {
    const manifest = createManifest()
    expect(validateExternalPresentation(manifest).ok).toBe(true)
    const document = normalizeExternalPresentation(manifest)
    expect(document.sections[0].slides[0].pauseAfter).toBe(false)
    expect(document.sections[0].slides[1].pauseAfter).toBe(true)
    expect(document.sections[1].slides[0].pauseAfter).toBe(true)
  })

  it('keeps display narration and speech text separate with compatible fallbacks', () => {
    const separated = {
      narration: 'Bunkerkidsを紹介します。',
      speechText: 'バンカーキッズを紹介します。',
    }
    expect(getPresentationDisplayNarration(separated)).toBe(
      'Bunkerkidsを紹介します。'
    )
    expect(getPresentationSpeechText(separated)).toBe(
      'バンカーキッズを紹介します。'
    )
    expect(getPresentationDisplayNarration({ speechText: '発話だけ' })).toBe(
      '発話だけ'
    )
    expect(getPresentationSpeechText({ narration: '従来の原稿' })).toBe(
      '従来の原稿'
    )
  })

  it.each([
    [
      'duplicate slide IDs',
      (manifest: PresentationManifestV1) => {
        manifest.sections[1].slides[0].id = 'slide-1'
      },
    ],
    [
      'unsafe HTML',
      (manifest: PresentationManifestV1) => {
        manifest.sections[0].slides[0].markdown = '<script>alert(1)</script>'
      },
    ],
    [
      'unsafe asset URL',
      (manifest: PresentationManifestV1) => {
        manifest.sections[0].slides[0].assets = [
          {
            id: 'asset-1',
            type: 'image',
            url: 'file:///etc/passwd',
            alt: 'unsafe',
          },
        ]
      },
    ],
    [
      'standalone Marpit slide separator',
      (manifest: PresentationManifestV1) => {
        manifest.sections[0].slides[0].markdown =
          '# One\n\n---\n\n# Unexpected slide'
      },
    ],
  ])('rejects %s', (_name, mutate) => {
    const manifest = createManifest()
    mutate(manifest)
    expect(validateExternalPresentation(manifest).ok).toBe(false)
  })

  it('enforces documented markdown, narration, and section limits', () => {
    const oversizedMarkdown = createManifest()
    oversizedMarkdown.sections[0].slides[0].markdown = 'x'.repeat(50_001)
    expect(validateExternalPresentation(oversizedMarkdown).ok).toBe(false)

    const oversizedNarration = createManifest()
    oversizedNarration.sections[0].slides[0].narration = 'x'.repeat(10_001)
    expect(validateExternalPresentation(oversizedNarration).ok).toBe(false)

    const oversizedSpeechText = createManifest()
    oversizedSpeechText.sections[0].slides[0].speechText = 'x'.repeat(10_001)
    expect(validateExternalPresentation(oversizedSpeechText).ok).toBe(false)

    const tooManySections = createManifest()
    tooManySections.sections = Array.from({ length: 51 }, (_, index) => ({
      id: `section-${index}`,
      title: `Section ${index}`,
      slides: [{ id: `limit-slide-${index}`, markdown: '# Test' }],
    }))
    expect(validateExternalPresentation(tooManySections).ok).toBe(false)
  })

  it('bounds optional producer-controlled fields and collections', () => {
    const oversizedNotes = createManifest()
    oversizedNotes.sections[0].slides[0].notes = 'x'.repeat(10_001)
    expect(validateExternalPresentation(oversizedNotes).ok).toBe(false)

    const tooManyAssets = createManifest()
    tooManyAssets.sections[0].slides[0].assets = Array.from(
      { length: 21 },
      (_, index) => ({
        id: `asset-${index}`,
        type: 'image' as const,
        url: `https://example.com/${index}.png`,
        alt: `Asset ${index}`,
      })
    )
    expect(validateExternalPresentation(tooManyAssets).ok).toBe(false)

    const tooMuchMetadata = createManifest()
    tooMuchMetadata.metadata = Object.fromEntries(
      Array.from({ length: 51 }, (_, index) => [`key-${index}`, index])
    )
    expect(validateExternalPresentation(tooMuchMetadata).ok).toBe(false)
  })

  it('sanitizes rendered HTML defense in depth', () => {
    const sanitized = sanitizePresentationHtml(
      '<svg onload="alert(1)"><script>alert(1)</script><image href="javascript:alert(1)"></image></svg>'
    )
    expect(sanitized).not.toMatch(/script|onload|javascript:/i)
    expect(sanitized).toContain('<svg')
  })

  it('builds Q&A context from only the active section', () => {
    const document = normalizeExternalPresentation(createManifest())
    const context = buildPresentationPromptContext(
      document,
      'section-1',
      'slide-1'
    )
    expect(context).toContain('FIRST_SECTION_ONLY')
    expect(context).toContain('First notes')
    expect(context).toContain('First narration')
    expect(context).not.toContain('Second narration')
    expect(context).not.toContain('MUST_NOT_LEAK')
    expect(context).toContain('trust="untrusted_reference"')
  })

  it('stops at a section boundary and starts the next section explicitly', () => {
    const document = normalizeExternalPresentation(createManifest())
    const atSecondSlide = {
      sectionIndex: 0,
      slideIndex: 1,
      playbackState: 'playing' as const,
      pauseRequested: false,
    }
    const paused = completePresentationNarration(document, atSecondSlide)
    expect(paused.playbackState).toBe('section_paused')
    const next = applyPresentationControlAction(
      document,
      paused,
      'next_section'
    )
    expect(next).toEqual(
      expect.objectContaining({
        sectionIndex: 1,
        slideIndex: 0,
        playbackState: 'playing',
      })
    )
    expect(completePresentationNarration(document, next!)).toEqual(
      expect.objectContaining({ playbackState: 'completed' })
    )
  })

  it('normalizes a legacy package without changing its source files', () => {
    const document = normalizeLegacyPresentation(
      '# Page 1\n\n---\n\n# Page 2',
      [
        { page: 0, line: 'Hello' },
        { page: 1, notes: 'Details' },
      ],
      'Supplement'
    )
    expect(document.sections[0].slides).toHaveLength(2)
    expect(document.sections[0].slides[0].narration).toBe('Hello')
    expect(document.sections[0].qaBrief).toBe('Supplement')
  })

  it('removes legacy front matter and empty slide chunks before mapping scripts', () => {
    const document = normalizeLegacyPresentation(
      '---\nmarp: true\ntheme: default\n---\n\n# Page 1\n\n---\n\n---\n\n# Page 2',
      [
        { page: 0, line: 'First narration' },
        { page: 1, line: 'Second narration' },
      ]
    )

    expect(document.sections[0].slides).toHaveLength(2)
    expect(document.sections[0].slides[0]).toEqual(
      expect.objectContaining({
        markdown: '# Page 1',
        narration: 'First narration',
      })
    )
    expect(document.sections[0].slides[1]).toEqual(
      expect.objectContaining({
        markdown: '# Page 2',
        narration: 'Second narration',
      })
    )
  })
})
