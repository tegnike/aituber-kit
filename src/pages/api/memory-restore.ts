/**
 * Memory Restore API
 *
 * ローカルファイルからメモリを復元するAPI
 * Requirements: 5.7, 5.8
 */

import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { Message } from '@/features/messages/messages'
import {
  isRestrictedMode,
  createRestrictedModeErrorResponse,
} from '@/utils/restrictedMode'

interface MemoryRestoreRequest {
  filename: string
}

interface MemoryRestoreResponse {
  messages: Message[]
  restoredCount: number
  embeddingCount: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (isRestrictedMode()) {
    return res
      .status(403)
      .json(createRestrictedModeErrorResponse('memory-restore'))
  }

  try {
    const { filename } = req.body as MemoryRestoreRequest

    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' })
    }

    // ファイル名の安全性チェック（パストラバーサル対策）
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ message: 'Invalid filename' })
    }

    const logsDir = path.join(process.cwd(), 'logs')
    const filePath = path.join(logsDir, filename)

    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' })
    }

    // ファイルの読み込み
    const content = fs.readFileSync(filePath, 'utf-8')
    const messages = JSON.parse(content)

    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: 'Invalid file format' })
    }

    // Embeddingを持つメッセージの数をカウント
    const embeddingCount = messages.filter(
      (msg: Message) => msg.embedding && Array.isArray(msg.embedding)
    ).length

    const response: MemoryRestoreResponse = {
      messages,
      restoredCount: messages.length,
      embeddingCount,
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Error restoring memory:', error)
    res.status(500).json({ message: 'Error restoring memory' })
  }
}
