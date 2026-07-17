import { logger } from '@/lib/logger'
import { NextApiRequest, NextApiResponse } from 'next'
import { Marpit } from '@marp-team/marpit'
import fs from 'fs/promises'
import path from 'path'
import { isRestrictedMode } from '@/utils/restrictedMode'
import assetManifest from '@/constants/assetManifest.json'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'
import { isSafePresentationMarkdown } from '@/features/presentation/presentationSchema'
import { sanitizePresentationHtml } from '@/features/presentation/presentationSanitizer'
import { newsTemplateCss } from '@/features/presentation/newsTemplateCss'

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
}

export const createExternalPresentationMarpit = () => {
  const marpit = new Marpit({ inlineSVG: true })
  marpit.markdown.enable('table')
  return marpit
}

export const externalPresentationCss = `
div.marpit > svg {
  aspect-ratio: 16 / 9;
  height: auto;
  width: 100%;
}
div.marpit > svg > foreignObject > section {
  background: #f4f7ff;
  color: #10172a;
}
div.marpit > svg > foreignObject > section.news-overview {
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  padding: 36px 60px 52px;
  position: relative;
  text-align: center;
  width: 100%;
}
div.marpit > svg > foreignObject > section.news-overview > p:first-of-type {
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  justify-content: center;
  margin: 0;
  min-height: 0;
  width: 100%;
}
div.marpit > svg > foreignObject > section.news-overview > p:first-of-type img {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(29, 38, 69, .18);
  height: auto;
  max-height: 430px;
  max-width: 80%;
  object-fit: contain;
  width: auto;
}
div.marpit > svg > foreignObject > section.news-overview h1 {
  border: 0;
  font-size: 42px;
  line-height: 1.25;
  margin: 18px 0 0;
  max-width: 94%;
  padding: 0;
  text-align: center;
}
div.marpit > svg > foreignObject > section.news-overview > p:last-of-type {
  bottom: 20px;
  font-size: 14px;
  margin: 0;
  max-width: 84%;
  overflow: hidden;
  position: absolute;
  right: 34px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}
div.marpit > svg > foreignObject > section.news-overview::after {
  display: none;
}
div.marpit > svg > foreignObject > section.news-compare {
  align-content: center;
  box-sizing: border-box;
  column-gap: 72px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto auto auto;
  height: 100%;
  padding: 38px 54px 34px;
  row-gap: 14px;
  width: 100%;
}
div.marpit > svg > foreignObject > section.news-compare h1 {
  border: 0;
  font-size: 56px;
  grid-column: 1 / -1;
  line-height: 1.15;
  margin: 0 0 24px;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-compare h2 {
  border: 0;
  color: #4d37a8;
  font-size: 38px;
  margin: 0;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-compare h2:first-of-type {
  grid-column: 1;
  grid-row: 2;
}
div.marpit > svg > foreignObject > section.news-compare h2:last-of-type {
  border-left: 3px solid rgba(90, 72, 170, .22);
  grid-column: 2;
  grid-row: 2;
  padding-left: 48px;
}
div.marpit > svg > foreignObject > section.news-compare ul {
  display: flex;
  flex-direction: column;
  font-size: 31px;
  gap: 22px;
  line-height: 1.3;
  list-style: none;
  margin: 0;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-compare ul:first-of-type {
  grid-column: 1;
  grid-row: 3;
}
div.marpit > svg > foreignObject > section.news-compare ul:last-of-type {
  border-left: 3px solid rgba(90, 72, 170, .22);
  grid-column: 2;
  grid-row: 3;
  padding-left: 48px;
}
div.marpit > svg > foreignObject > section.news-compare li {
  margin: 0;
}
div.marpit > svg > foreignObject > section.news-compare > p:last-of-type {
  border-top: 3px solid rgba(90, 72, 170, .2);
  font-size: 29px;
  font-weight: 700;
  grid-column: 1 / -1;
  grid-row: 4;
  line-height: 1.25;
  margin: 28px 0 0;
  padding: 16px 20px 0;
  text-align: center;
}
div.marpit > svg > foreignObject > section.news-thesis {
  align-content: center;
  box-sizing: border-box;
  display: grid;
  height: 100%;
  padding: 48px 58px;
  text-align: center;
  width: 100%;
}
div.marpit > svg > foreignObject > section.news-thesis h1 {
  border: 0;
  font-size: 56px;
  line-height: 1.14;
  margin: 0 0 34px;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-thesis blockquote {
  border: 0;
  border-bottom: 3px solid rgba(90, 72, 170, .2);
  border-top: 3px solid rgba(90, 72, 170, .2);
  color: #18223a;
  font-size: 54px;
  font-weight: 750;
  line-height: 1.15;
  margin: 0;
  padding: 28px 16px;
}
div.marpit > svg > foreignObject > section.news-thesis blockquote p {
  margin: 0;
}
div.marpit > svg > foreignObject > section.news-thesis blockquote strong:first-child {
  color: #4d37a8;
}
div.marpit > svg > foreignObject > section.news-thesis blockquote strong:last-child {
  color: #167d88;
}
div.marpit > svg > foreignObject > section.news-thesis ul {
  display: grid;
  font-size: 25px;
  font-weight: 650;
  grid-template-columns: repeat(3, 1fr);
  line-height: 1.3;
  list-style: none;
  margin: 28px 0 0;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-thesis li {
  margin: 0;
  padding: 0 26px;
}
div.marpit > svg > foreignObject > section.news-thesis li + li {
  border-left: 3px solid rgba(90, 72, 170, .18);
}
div.marpit > svg > foreignObject > section.news-thesis h2 {
  border: 0;
  color: #4d37a8;
  font-size: 36px;
  line-height: 1.2;
  margin: 28px 0 0;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-priority {
  align-content: center;
  box-sizing: border-box;
  column-gap: 42px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto auto auto;
  height: 100%;
  padding: 48px 58px;
  width: 100%;
}
div.marpit > svg > foreignObject > section.news-priority h1 {
  border: 0;
  font-size: 54px;
  grid-column: 1 / -1;
  line-height: 1.14;
  margin: 0 0 46px;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-priority h2 {
  border: 0;
  border-top: 9px solid #6f5bdb;
  color: #4d37a8;
  font-size: 34px;
  grid-row: 2;
  line-height: 1.2;
  margin: 0;
  padding: 16px 0 0;
}
div.marpit > svg > foreignObject > section.news-priority h2:nth-of-type(2) {
  border-color: #1da9b4;
  color: #167d88;
}
div.marpit > svg > foreignObject > section.news-priority h2:nth-of-type(3) {
  border-color: #d84f91;
  color: #a83a70;
}
div.marpit > svg > foreignObject > section.news-priority h2:nth-of-type(1),
div.marpit > svg > foreignObject > section.news-priority > p:nth-of-type(1) {
  grid-column: 1;
}
div.marpit > svg > foreignObject > section.news-priority h2:nth-of-type(2),
div.marpit > svg > foreignObject > section.news-priority > p:nth-of-type(2) {
  grid-column: 2;
}
div.marpit > svg > foreignObject > section.news-priority h2:nth-of-type(3),
div.marpit > svg > foreignObject > section.news-priority > p:nth-of-type(3) {
  grid-column: 3;
}
div.marpit > svg > foreignObject > section.news-priority > p:not(:last-child) {
  font-size: 25px;
  font-weight: 600;
  grid-row: 3;
  line-height: 1.35;
  margin: 12px 0 0;
}
div.marpit > svg > foreignObject > section.news-priority > p:last-child {
  border-top: 3px solid rgba(90, 72, 170, .18);
  font-size: 30px;
  font-weight: 750;
  grid-column: 1 / -1;
  grid-row: 4;
  margin: 42px 0 0;
  padding-top: 18px;
  text-align: center;
}
div.marpit > svg > foreignObject > section.news-guardrail {
  align-content: center;
  box-sizing: border-box;
  column-gap: 66px;
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
  grid-template-rows: repeat(6, auto) auto;
  height: 100%;
  padding: 48px 60px;
  width: 100%;
}
div.marpit > svg > foreignObject > section.news-guardrail h1 {
  align-self: center;
  border: 0;
  font-size: 58px;
  grid-column: 1;
  grid-row: 1 / 7;
  line-height: 1.14;
  margin: 0;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-guardrail h2 {
  border: 0;
  border-left: 9px solid #d84f91;
  color: #a83a70;
  font-size: 33px;
  grid-column: 2;
  line-height: 1.2;
  margin: 0;
  padding: 0 0 0 20px;
}
div.marpit > svg > foreignObject > section.news-guardrail h2:nth-of-type(1) {
  grid-row: 1;
}
div.marpit > svg > foreignObject > section.news-guardrail h2:nth-of-type(2) {
  grid-row: 3;
}
div.marpit > svg > foreignObject > section.news-guardrail h2:nth-of-type(3) {
  grid-row: 5;
}
div.marpit > svg > foreignObject > section.news-guardrail > ul {
  align-self: center;
  display: grid;
  font-size: 27px;
  gap: 16px;
  grid-column: 2;
  grid-row: 1 / 7;
  line-height: 1.3;
  list-style: none;
  margin: 0;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-guardrail > ul > li {
  background: linear-gradient(90deg, rgba(216, 79, 145, .11), rgba(255, 255, 255, .48));
  border-left: 9px solid #d84f91;
  border-radius: 0 12px 12px 0;
  display: grid;
  gap: 20px;
  grid-template-columns: max-content 1fr;
  margin: 0;
  padding: 16px 20px;
}
div.marpit > svg > foreignObject > section.news-guardrail > ul > li > strong {
  color: #a83a70;
  font-size: 32px;
  line-height: 1.15;
}
div.marpit > svg > foreignObject > section.news-guardrail > p:not(:last-child) {
  font-size: 24px;
  grid-column: 2;
  line-height: 1.3;
  margin: 7px 0 22px;
  padding-left: 29px;
}
div.marpit > svg > foreignObject > section.news-guardrail > p:nth-of-type(1) {
  grid-row: 2;
}
div.marpit > svg > foreignObject > section.news-guardrail > p:nth-of-type(2) {
  grid-row: 4;
}
div.marpit > svg > foreignObject > section.news-guardrail > p:nth-of-type(3) {
  grid-row: 6;
}
div.marpit > svg > foreignObject > section.news-guardrail > p:last-child {
  border-top: 3px solid rgba(90, 72, 170, .18);
  font-size: 30px;
  font-weight: 750;
  grid-column: 1 / -1;
  grid-row: 7;
  margin: 34px 0 0;
  padding-top: 18px;
  text-align: center;
}
div.marpit > svg > foreignObject > section.news-metrics {
  align-content: center;
  box-sizing: border-box;
  height: 100%;
  padding: 52px 64px;
  text-align: center;
  width: 100%;
}
div.marpit > svg > foreignObject > section.news-metrics h1 {
  border: 0;
  font-size: 50px;
  line-height: 1.15;
  margin: 0 0 62px;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-metrics ul {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  list-style: none;
  margin: 0;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-metrics li {
  align-items: center;
  display: flex;
  flex-direction: column;
  font-size: 25px;
  justify-content: center;
  line-height: 1.35;
  min-height: 210px;
  padding: 10px 34px;
}
div.marpit > svg > foreignObject > section.news-metrics li + li {
  border-left: 3px solid rgba(90, 72, 170, .22);
}
div.marpit > svg > foreignObject > section.news-metrics li strong {
  color: #4631b3;
  display: block;
  font-size: 66px;
  letter-spacing: -.04em;
  line-height: 1;
  margin-bottom: 20px;
}
div.marpit > svg > foreignObject > section.news-stack {
  align-content: center;
  box-sizing: border-box;
  height: 100%;
  padding: 52px 68px;
  width: 100%;
}
div.marpit > svg > foreignObject > section.news-stack h1 {
  border: 0;
  font-size: 48px;
  line-height: 1.15;
  margin: 0 0 38px;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-stack ul {
  display: grid;
  gap: 18px;
  list-style: none;
  margin: 0;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-stack li {
  background: linear-gradient(90deg, rgba(111, 91, 219, .1), transparent 70%);
  border-left: 9px solid #6f5bdb;
  font-size: 27px;
  line-height: 1.3;
  padding: 18px 24px;
}
div.marpit > svg > foreignObject > section.news-stack li:nth-child(2) {
  background: linear-gradient(90deg, rgba(29, 169, 180, .1), transparent 70%);
  border-left-color: #1da9b4;
}
div.marpit > svg > foreignObject > section.news-stack li:nth-child(3) {
  background: linear-gradient(90deg, rgba(216, 79, 145, .1), transparent 70%);
  border-left-color: #d84f91;
}
div.marpit > svg > foreignObject > section.news-stack li strong {
  display: inline-block;
  font-size: 31px;
  min-width: 300px;
}
div.marpit > svg > foreignObject > section.news-latency {
  align-content: center;
  box-sizing: border-box;
  height: 100%;
  padding: 44px 64px;
  width: 100%;
}
div.marpit > svg > foreignObject > section.news-latency h1 {
  border: 0;
  font-size: 50px;
  line-height: 1.15;
  margin: 0 0 24px;
  padding: 0;
}
div.marpit > svg > foreignObject > section.news-latency table {
  border-collapse: collapse;
  font-size: 25px;
  width: 100%;
}
div.marpit > svg > foreignObject > section.news-latency th,
div.marpit > svg > foreignObject > section.news-latency td {
  border: 1px solid rgba(75, 88, 125, .22);
  line-height: 1.2;
  padding: 12px 18px;
}
div.marpit > svg > foreignObject > section.news-latency th {
  background: rgba(124, 102, 230, .12);
  color: #382a78;
}
div.marpit > svg > foreignObject > section.news-latency p {
  font-size: 28px;
  margin: 20px 0 0;
}
`

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const externalMarkdown =
    req.body?.external === true && typeof req.body?.markdown === 'string'
      ? req.body.markdown
      : null

  if (externalMarkdown !== null) {
    if (!isSafePresentationMarkdown(externalMarkdown)) {
      return res.status(422).json({
        message: 'External markdown contains unsafe content',
        code: 'VALIDATION_ERROR',
      })
    }
    const marpit = createExternalPresentationMarpit()
    const rendered = marpit.render(externalMarkdown)
    return res.status(200).json({
      html: sanitizePresentationHtml(rendered.html),
      css: `${rendered.css}\n${externalPresentationCss}\n${newsTemplateCss}`,
    })
  }

  if (isRestrictedMode()) {
    const { slideName } = req.body as { slideName: string }
    if (!slideName || typeof slideName !== 'string') {
      return res.status(400).json({ message: 'slideName is required' })
    }
    const renderedMap = assetManifest.slides.rendered as Record<
      string,
      { html: string; css: string }
    >
    const rendered = Object.hasOwn(renderedMap, slideName)
      ? renderedMap[slideName]
      : undefined
    return res.status(200).json(rendered ?? { html: '', css: '' })
  }

  const { slideName } = req.body as { slideName: string }

  if (!slideName) {
    return res.status(400).json({ message: 'slideName is required' })
  }

  try {
    const markdownPath = path.join(
      process.cwd(),
      'public',
      'slides',
      slideName,
      'slides.md'
    )
    const markdown = await fs.readFile(markdownPath, 'utf-8')

    let css = ''
    try {
      const cssPath = path.join(
        process.cwd(),
        'public',
        'slides',
        slideName,
        'theme.css'
      )
      css = await fs.readFile(cssPath, 'utf-8')
    } catch (cssError) {
      logger.warn(`CSSファイルが見つかりません: ${slideName}/theme.css`)
      // CSSファイルが見つからない場合は空文字列を使用
    }

    const marpit = new Marpit({
      inlineSVG: true,
    })
    if (css) {
      marpit.themeSet.default = marpit.themeSet.add(css)
    }

    const { html, css: generatedCss } = marpit.render(markdown)

    res.status(200).json({ html, css: generatedCss })
  } catch (error) {
    logger.error(error)
    res.status(500).json({
      message: 'Error processing markdown',
      error: (error as Error).message,
    })
  }
}

export default withAccessPolicy(routePolicies['/api/convertMarkdown'], handler)
