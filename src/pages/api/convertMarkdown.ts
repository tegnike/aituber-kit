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

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
}

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
    const marpit = new Marpit({ inlineSVG: true })
    const rendered = marpit.render(externalMarkdown)
    return res.status(200).json({
      html: sanitizePresentationHtml(rendered.html),
      css: rendered.css,
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
