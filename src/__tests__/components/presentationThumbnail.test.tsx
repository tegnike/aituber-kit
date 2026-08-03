import { fireEvent, render, screen } from '@testing-library/react'
import PresentationThumbnail from '@/components/presentationThumbnail'
import { normalizeExternalPresentation } from '@/features/presentation/presentationNormalizer'
import {
  loadPresentationDocument,
  unloadPresentation,
} from '@/features/stores/presentation'

describe('PresentationThumbnail', () => {
  afterEach(() => unloadPresentation())

  it('renders the thumbnail supplied by the external presentation', () => {
    loadPresentationDocument(
      normalizeExternalPresentation({
        schemaVersion: 1,
        presentationId: 'thumbnail-test',
        revision: 1,
        title: 'Thumbnail test',
        thumbnail: {
          id: 'show-thumbnail',
          type: 'image',
          url: 'http://127.0.0.1:9892/api/shows/show-1/assets/thumbnail.png',
          alt: '番組サムネイル',
        },
        createdAt: '2026-07-28T12:00:00.000Z',
        sections: [
          {
            id: 'section-1',
            title: 'Section',
            slides: [{ id: 'slide-1', markdown: '# Slide' }],
          },
        ],
      }),
      'sha256:thumbnail-test'
    )

    render(<PresentationThumbnail />)

    expect(screen.getByRole('img', { name: '番組サムネイル' })).toHaveAttribute(
      'src',
      'http://127.0.0.1:9892/api/shows/show-1/assets/thumbnail.png'
    )
  })

  it('hides a thumbnail that fails to load', () => {
    loadPresentationDocument(
      normalizeExternalPresentation({
        schemaVersion: 1,
        presentationId: 'broken-thumbnail-test',
        revision: 1,
        title: 'Broken thumbnail test',
        thumbnail: {
          id: 'broken-thumbnail',
          type: 'image',
          url: 'https://example.com/broken.png',
          alt: '壊れたサムネイル',
        },
        createdAt: '2026-07-28T12:00:00.000Z',
        sections: [
          {
            id: 'section-1',
            title: 'Section',
            slides: [{ id: 'slide-1', markdown: '# Slide' }],
          },
        ],
      }),
      'sha256:broken-thumbnail-test'
    )

    render(<PresentationThumbnail />)
    fireEvent.error(screen.getByRole('img', { name: '壊れたサムネイル' }))

    expect(
      screen.queryByRole('img', { name: '壊れたサムネイル' })
    ).not.toBeInTheDocument()
  })
})
