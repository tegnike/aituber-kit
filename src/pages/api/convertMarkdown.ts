import { NextApiRequest, NextApiResponse } from 'next'
import { Marpit } from '@marp-team/marpit'
import fs from 'fs/promises'
import path from 'path'
import { isRestrictedMode } from '@/utils/restrictedMode'
import assetManifest from '@/constants/assetManifest.json'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (isRestrictedMode()) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' })
    }
    const { slideName } = req.body as { slideName: string }
    if (!slideName) {
      return res.status(400).json({ message: 'slideName is required' })
    }
    const rendered = (
      assetManifest.slides.rendered as Record<
        string,
        { html: string; css: string }
      >
    )[slideName]
    return res.status(200).json(rendered ?? { html: '', css: '' })
  }

  if (req.method === 'POST') {
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
        console.warn(`CSSファイルが見つかりません: ${slideName}/theme.css`)
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
      console.error(error)
      res.status(500).json({
        message: 'Error processing markdown',
        error: (error as Error).message,
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
