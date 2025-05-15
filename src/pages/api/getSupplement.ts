import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'

type ResponseData = {
  content?: string
  message?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { slideName } = req.query

  if (typeof slideName !== 'string' || !slideName) {
    return res.status(400).json({
      message: 'Bad Request: Missing or invalid slideName query parameter',
    })
  }

  // slideNameのサニタイズ (updateScript.tsと同様)
  const sanitizedSlideName = path
    .normalize(slideName)
    .replace(/^(\.\.(\/|\\|$))+/, '')
  if (
    /[\\/:\*\?"<>\|]/.test(sanitizedSlideName) ||
    sanitizedSlideName.includes('..')
  ) {
    return res.status(400).json({
      message:
        'Bad Request: Invalid slideName contains invalid characters or path traversal attempts.',
    })
  }

  const filePath = path.join(
    process.cwd(),
    'public',
    'slides',
    sanitizedSlideName,
    'supplement.txt'
  )

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    res.status(200).json({ content })
  } catch (error: any) {
    // ファイルが存在しない場合は空の内容を返す (エラーではなく正常系として扱う)
    if (error.code === 'ENOENT') {
      res.status(200).json({ content: '' })
    } else {
      console.error(`Error reading file: ${filePath}`, error)
      res.status(500).json({
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}
