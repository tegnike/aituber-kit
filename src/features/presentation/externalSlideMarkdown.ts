import type {
  PresentationSection,
  PresentationSlide,
} from './presentationTypes'

const classDirectivePattern = /<!--\s*_class:\s*[^>]+-->/
const markdownImagePattern = /!\[[^\]]*\]\([^\n)]+(?:\)[^\n)]*)?\)/
const levelOneHeadingPattern = /^#\s+(.+)$/m

const escapeMarkdownLabel = (value: string) =>
  value.replaceAll('\\', '\\\\').replaceAll('[', '\\[').replaceAll(']', '\\]')

const overviewSourceLabel = (publisher: string | undefined, url: string) => {
  try {
    if (new URL(url).hostname === 'prtimes.jp') return 'PR TIMES'
  } catch {
    // Presentation URLs are validated before this helper receives them.
  }
  return publisher || new URL(url).hostname
}

export const buildExternalSlideMarkdown = (
  section: PresentationSection,
  slide: PresentationSlide,
  slideIndex: number
) => {
  const asset = slide.assets?.[0]
  if (!asset) return slide.markdown

  if (slideIndex === 0) {
    const source = section.sources?.[0]
    const sourceUrl = asset.sourceUrl || source?.url
    const slideHeading =
      slide.markdown.match(levelOneHeadingPattern)?.[1]?.trim() || section.title
    const sourceLine = sourceUrl
      ? `[${escapeMarkdownLabel(overviewSourceLabel(source?.publisher, sourceUrl))}: ${escapeMarkdownLabel(sourceUrl)}](${sourceUrl})`
      : asset.credit
        ? escapeMarkdownLabel(asset.credit)
        : ''
    return [
      '<!-- _class: news-overview -->',
      `![${escapeMarkdownLabel(asset.alt)}](${asset.url})`,
      `# ${slideHeading}`,
      sourceLine,
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  if (markdownImagePattern.test(slide.markdown)) return slide.markdown

  const template = classDirectivePattern.test(slide.markdown)
    ? ''
    : '<!-- _class: news-photo-main -->\n\n'
  return `${template}${slide.markdown}\n\n![${escapeMarkdownLabel(asset.alt)}](${asset.url})`
}
