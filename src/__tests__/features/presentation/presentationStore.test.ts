import { normalizeExternalPresentation } from '@/features/presentation/presentationNormalizer'
import presentationStore, {
  applyPresentationControl,
  finishCurrentPresentationNarration,
  getCurrentPresentationLocation,
  loadPresentationDocument,
  setPresentationLoading,
  unloadPresentation,
} from '@/features/stores/presentation'
import menuStore from '@/features/stores/menu'
import type { PresentationManifestV1 } from '@/features/presentation/presentationTypes'

const manifest: PresentationManifestV1 = {
  schemaVersion: 1,
  presentationId: 'store-test',
  revision: 1,
  title: 'Store test',
  createdAt: '2026-07-14T20:00:00.000Z',
  sections: [
    {
      id: 'section-1',
      title: 'One',
      qaBrief: 'SECRET_BRIEF_MUST_NOT_BE_PERSISTED',
      slides: [
        { id: 'slide-1', markdown: '# One', pauseAfter: false },
        { id: 'slide-2', markdown: '# Two' },
      ],
    },
    {
      id: 'section-2',
      title: 'Two',
      slides: [{ id: 'slide-3', markdown: '# Three' }],
    },
  ],
}

describe('presentationStore', () => {
  beforeEach(() => {
    localStorage.clear()
    unloadPresentation()
    menuStore.setState({ slideVisible: false })
  })

  afterAll(() => {
    presentationStore.persist.clearStorage()
  })

  it('runs narration progression and section boundaries', () => {
    loadPresentationDocument(
      normalizeExternalPresentation(manifest),
      'sha256:test'
    )
    expect(presentationStore.getState().state).toBe('ready')
    expect(applyPresentationControl('start')).toBe(true)
    expect(menuStore.getState().slideVisible).toBe(true)
    expect(finishCurrentPresentationNarration()).toBe(true)
    expect(getCurrentPresentationLocation()?.slide.id).toBe('slide-2')
    expect(presentationStore.getState().state).toBe('playing')
    finishCurrentPresentationNarration()
    expect(presentationStore.getState().state).toBe('section_paused')
    applyPresentationControl('next_section')
    expect(getCurrentPresentationLocation()?.slide.id).toBe('slide-3')
    finishCurrentPresentationNarration()
    expect(presentationStore.getState().state).toBe('completed')
    expect(menuStore.getState().slideVisible).toBe(false)
  })

  it('hides the slide on reset and shows it when slide playback starts', () => {
    loadPresentationDocument(
      normalizeExternalPresentation(manifest),
      'sha256:test'
    )
    menuStore.setState({ slideVisible: false })

    applyPresentationControl('start')
    expect(menuStore.getState().slideVisible).toBe(true)

    applyPresentationControl('reset')
    expect(presentationStore.getState().state).toBe('ready')
    expect(menuStore.getState().slideVisible).toBe(false)
  })

  it('persists position metadata without persisting manifest or Q&A content', () => {
    loadPresentationDocument(
      normalizeExternalPresentation(manifest),
      'sha256:test'
    )
    const persisted = localStorage.getItem('aituber-kit-presentation-position')
    expect(persisted).toContain('store-test')
    expect(persisted).not.toContain('SECRET_BRIEF_MUST_NOT_BE_PERSISTED')
    expect(persisted).not.toContain('sha256:test')
  })

  it('does not persist transient loading state across a browser reload', () => {
    setPresentationLoading('store-test', 1)
    const persisted = localStorage.getItem('aituber-kit-presentation-position')
    expect(persisted).toContain('"state":"paused"')
    expect(persisted).not.toContain('"state":"loading"')
  })
})
