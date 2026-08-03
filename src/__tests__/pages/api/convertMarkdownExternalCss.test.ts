import handler, {
  createExternalPresentationMarpit,
} from '@/pages/api/convertMarkdown'
import {
  DEFAULT_PRESENTATION_THEME_ID,
  resolvePresentationTheme,
} from '@/features/presentation/presentationThemes'
import { createMockReq, createMockRes } from '../../helpers/apiRouteTestUtils'

describe('external presentation rendering', () => {
  const originalRestrictedMode = process.env.NEXT_PUBLIC_RESTRICTED_MODE

  afterEach(() => {
    if (originalRestrictedMode === undefined) {
      delete process.env.NEXT_PUBLIC_RESTRICTED_MODE
    } else {
      process.env.NEXT_PUBLIC_RESTRICTED_MODE = originalRestrictedMode
    }
  })

  it('provides a neutral opaque default theme', () => {
    const theme = resolvePresentationTheme()

    expect(theme.id).toBe(DEFAULT_PRESENTATION_THEME_ID)
    expect(theme.css).toContain('background: #f7f8fc;')
    expect(theme.css).toContain('color: #172033;')
  })

  it('supports application-independent registered themes', () => {
    const theme = resolvePresentationTheme('dark')

    expect(theme.id).toBe('dark')
    expect(theme.css).toContain('background: #161b26;')
  })

  it('falls back safely when a producer requests an unknown theme', () => {
    expect(resolvePresentationTheme('product-specific-theme').id).toBe(
      DEFAULT_PRESENTATION_THEME_ID
    )
  })

  it('renders GitHub-style tables without relying on a producer-specific template', () => {
    const markdown = `# Latency breakdown

| Stage | Duration |
|---|---:|
| Speech recognition | 150 ms |`
    const rendered = createExternalPresentationMarpit().render(markdown)

    expect(rendered.html).toContain('<table>')
    expect(rendered.html).toContain('<th>Stage</th>')
    expect(rendered.html).toContain('<td style="text-align:right">150 ms</td>')
  })

  it('rejects external Markdown rendering in restricted mode', async () => {
    process.env.NEXT_PUBLIC_RESTRICTED_MODE = 'true'
    const res = createMockRes()

    await handler(
      createMockReq({
        method: 'POST',
        body: { external: true, markdown: '# External' },
      }),
      res
    )

    expect(res._status).toBe(403)
    expect(res._json).toEqual({
      error: 'feature_disabled_in_restricted_mode',
      message:
        'The feature "external presentation" is disabled in restricted mode.',
    })
  })
})
