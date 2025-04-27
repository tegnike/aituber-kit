import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'

type ScriptEntry = {
  page: number
  line: string
  notes?: string
}

type RequestBody = {
  slideName: string
  scripts: ScriptEntry[]
  supplementContent: string // supplement.txtの内容を追加
}

type ResponseData = {
  message: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { slideName, scripts, supplementContent }: RequestBody = req.body

  // supplementContentも必須とする（空文字列は許可）
  if (!slideName || !scripts || supplementContent === undefined) {
    return res.status(400).json({
      message: 'Bad Request: Missing slideName, scripts, or supplementContent',
    })
  }

  // slideNameのサニタイズ
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

  const slidesDir = path.join(process.cwd(), 'public', 'slides')
  const targetDir = path.join(slidesDir, sanitizedSlideName)
  const scriptFilePath = path.join(targetDir, 'scripts.json')
  const supplementFilePath = path.join(targetDir, 'supplement.txt') // supplement.txtのパス

  try {
    // 対象ディレクトリの存在確認
    try {
      await fs.access(targetDir)
    } catch (error) {
      console.error(`Directory not found: ${targetDir}`, error)
      return res
        .status(404)
        .json({ message: 'Not Found: Slide directory does not exist.' })
    }

    // scriptsの内容を検証
    if (
      !Array.isArray(scripts) ||
      scripts.some(
        (s) =>
          typeof s.page !== 'number' ||
          typeof s.line !== 'string' ||
          (s.notes !== undefined && typeof s.notes !== 'string')
      )
    ) {
      return res
        .status(400)
        .json({ message: 'Bad Request: Invalid scripts format.' })
    }

    // supplementContentの内容を検証 (文字列であること)
    if (typeof supplementContent !== 'string') {
      return res.status(400).json({
        message:
          'Bad Request: Invalid supplementContent format, must be a string.',
      })
    }

    // ファイルに書き込み (scripts.json と supplement.txt の両方)
    // Promise.all を使って並行処理し、両方の成功を待つ
    await Promise.all([
      fs.writeFile(scriptFilePath, JSON.stringify(scripts, null, 2), 'utf-8'),
      fs.writeFile(supplementFilePath, supplementContent, 'utf-8'), // supplement.txtを書き込み
    ])

    res.status(200).json({ message: 'Slide data updated successfully' }) // メッセージ変更
  } catch (error) {
    console.error(`Error writing slide data for ${sanitizedSlideName}:`, error)
    res.status(500).json({
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
