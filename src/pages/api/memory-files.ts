/**
 * Memory Files API
 *
 * ローカルのログファイル一覧を取得するAPI
 * Requirements: 5.7, 5.8
 */

import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

interface MemoryFileInfo {
  filename: string
  createdAt: string
  messageCount: number
  hasEmbeddings: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const logsDir = path.join(process.cwd(), 'logs')

    // logsディレクトリが存在しない場合は空配列を返す
    if (!fs.existsSync(logsDir)) {
      return res.status(200).json({ files: [] })
    }

    // ログファイルの一覧を取得
    const files = fs
      .readdirSync(logsDir)
      .filter((f) => f.startsWith('log_') && f.endsWith('.json'))
      .sort()
      .reverse()

    // 各ファイルの情報を取得
    const fileInfos: MemoryFileInfo[] = files
      .map((filename) => {
        try {
          const filePath = path.join(logsDir, filename)
          const messages = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

          if (!Array.isArray(messages)) return null

          const hasEmbeddings = messages.some(
            (msg: { embedding?: number[] }) =>
              msg.embedding && Array.isArray(msg.embedding)
          )

          // ファイル名から日時を抽出（時刻部分のハイフンをコロンに戻す）
          const match = filename.match(
            /log_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/
          )
          const createdAt = match
            ? match[1].replace(/-(\d{2})-(\d{2})-(\d{2})$/, ':$1:$2:$3')
            : new Date().toISOString()

          return {
            filename,
            createdAt,
            messageCount: messages.length,
            hasEmbeddings,
          }
        } catch (error) {
          console.error(`Error reading file ${filename}:`, error)
          return null
        }
      })
      .filter((info): info is MemoryFileInfo => info !== null)

    res.status(200).json({ files: fileInfos })
  } catch (error) {
    console.error('Error listing memory files:', error)
    res.status(500).json({ message: 'Error listing memory files' })
  }
}
