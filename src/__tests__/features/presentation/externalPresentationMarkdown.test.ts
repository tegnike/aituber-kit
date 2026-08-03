import { serializeExternalPresentationMarkdown } from '@/features/presentation/externalPresentationMarkdown'
import type { PresentationDocument } from '@/features/presentation/presentationTypes'

const document: PresentationDocument = {
  schemaVersion: 1,
  presentationId: 'product-demo',
  revision: 1,
  title: 'Product demo',
  createdAt: '2026-08-03T00:00:00.000Z',
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      slides: [
        {
          id: 'intro-1',
          markdown: '# Original heading\n\nOriginal body',
          pauseAfter: false,
          assets: [
            {
              id: 'diagram',
              type: 'image',
              url: 'https://example.com/diagram.png',
              alt: 'Architecture diagram',
            },
          ],
        },
      ],
    },
    {
      id: 'details',
      title: 'Details',
      slides: [
        {
          id: 'details-1',
          markdown: '<!-- _class: custom-layout -->\n\n# Details',
          pauseAfter: true,
        },
      ],
    },
  ],
}

describe('serializeExternalPresentationMarkdown', () => {
  it('preserves producer-authored Markdown without inferring a layout from metadata', () => {
    const markdown = serializeExternalPresentationMarkdown(document)

    expect(markdown).toBe(
      '# Original heading\n\nOriginal body\n\n---\n\n<!-- _class: custom-layout -->\n\n# Details'
    )
    expect(markdown).not.toContain('diagram.png')
  })

  it('preserves section and slide order while only adding Marpit separators', () => {
    expect(
      serializeExternalPresentationMarkdown(document).split('\n\n---\n\n')
    ).toEqual([
      document.sections[0].slides[0].markdown,
      document.sections[1].slides[0].markdown,
    ])
  })
})
