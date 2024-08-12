import { NextApiRequest, NextApiResponse } from 'next'
import { Marpit } from '@marp-team/marpit'
import fs from 'fs/promises'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { slideName } = req.body as { slideName: string }

    try {
      const markdownPath = path.join(
        process.cwd(),
        'public',
        'slides',
        slideName,
        'slides.md'
      )
      const markdown = await fs.readFile(markdownPath, 'utf-8')

      const cssPath = path.join(
        process.cwd(),
        'public',
        'slides',
        slideName,
        'theme.css'
      )
      const css = await fs.readFile(cssPath, 'utf-8')

      const marpit = new Marpit({
        inlineSVG: true,
      })
      marpit.themeSet.default = marpit.themeSet.add(css)

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
