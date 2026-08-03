export const DEFAULT_PRESENTATION_THEME_ID = 'default'

const basePresentationCss = `
div.marpit > svg {
  aspect-ratio: 16 / 9;
  height: auto;
  width: 100%;
}
div.marpit > svg > foreignObject > section {
  box-sizing: border-box;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.4;
  padding: 48px 56px;
}
div.marpit > svg > foreignObject > section h1 {
  font-size: 52px;
  line-height: 1.15;
  margin: 0 0 28px;
}
div.marpit > svg > foreignObject > section h2 {
  font-size: 36px;
  line-height: 1.2;
}
div.marpit > svg > foreignObject > section p,
div.marpit > svg > foreignObject > section li,
div.marpit > svg > foreignObject > section td,
div.marpit > svg > foreignObject > section th {
  font-size: 26px;
}
div.marpit > svg > foreignObject > section img {
  max-height: 70%;
  max-width: 100%;
  object-fit: contain;
}
div.marpit > svg > foreignObject > section table {
  border-collapse: collapse;
  width: 100%;
}
div.marpit > svg > foreignObject > section th,
div.marpit > svg > foreignObject > section td {
  border: 1px solid currentColor;
  padding: 10px 14px;
}
`

const presentationThemes = {
  default: `${basePresentationCss}
div.marpit > svg > foreignObject > section {
  background: #f7f8fc;
  color: #172033;
}
div.marpit > svg > foreignObject > section a {
  color: #315bb5;
}
`,
  dark: `${basePresentationCss}
div.marpit > svg > foreignObject > section {
  background: #161b26;
  color: #f3f5fa;
}
div.marpit > svg > foreignObject > section a {
  color: #8db4ff;
}
`,
} as const

export type PresentationThemeId = keyof typeof presentationThemes

export interface ResolvedPresentationTheme {
  id: PresentationThemeId
  css: string
}

export const resolvePresentationTheme = (
  requestedTheme?: string
): ResolvedPresentationTheme => {
  const id: PresentationThemeId = Object.hasOwn(
    presentationThemes,
    requestedTheme ?? ''
  )
    ? (requestedTheme as PresentationThemeId)
    : DEFAULT_PRESENTATION_THEME_ID

  return { id, css: presentationThemes[id] }
}
