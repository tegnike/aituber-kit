import { createExternalPresentationMarpit } from '@/pages/api/convertMarkdown'
import {
  DEFAULT_PRESENTATION_THEME_ID,
  resolvePresentationTheme,
} from '@/features/presentation/presentationThemes'

describe('external presentation rendering', () => {
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
})
