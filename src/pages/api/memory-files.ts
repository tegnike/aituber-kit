import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { isRestrictedMode } from '@/utils/restrictedMode'

interface MemoryFileInfo {
  filename: string
  title: string
  createdAt: string
  messageCount: number
  hasEmbeddings: boolean
}

const truncate = (text: string, max = 40): string => {
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}...`
}

const toText = (content: unknown): string => {
  if (typeof content === 'string') return content.trim()
  if (!Array.isArray(content)) return ''

  return content
    .map((part) => {
      if (typeof part === 'string') return part
      if (part && typeof part === 'object' && 'text' in part) {
        const maybeText = (part as { text?: unknown }).text
        return typeof maybeText === 'string' ? maybeText : ''
      }
      return ''
    })
    .join(' ')
    .trim()
}

const deriveTitleFromMessages = (
  filename: string,
  messages: Array<{ role?: string; content?: unknown }>
): string => {
  const firstUser = messages.find((m) => m.role === 'user')
  const firstUserText = firstUser ? toText(firstUser.content) : ''
  if (firstUserText) return truncate(firstUserText)

  const firstTextMessage = messages
    .map((m) => toText(m.content))
    .find((text) => text.length > 0)
  if (firstTextMessage) return truncate(firstTextMessage)

  return filename.replace(/^log_/, '').replace(/\.json$/, '')
}

const isValidLogFilename = (filename: string): boolean => {
  return (
    filename.startsWith('log_') &&
    filename.endsWith('.json') &&
    !filename.includes('..') &&
    !filename.includes('/')
  )
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (isRestrictedMode()) {
    if (req.method === 'GET') {
      return res.status(200).json({ files: [] })
    }
    return res.status(403).json({ message: 'Restricted mode' })
  }

  try {
    const logsDir = path.join(process.cwd(), 'logs')

    if (req.method === 'DELETE') {
      const { filename } = req.body as { filename?: string }
      if (!filename) {
        return res.status(400).json({ message: 'Filename is required' })
      }
      if (!isValidLogFilename(filename)) {
        return res.status(400).json({ message: 'Invalid filename' })
      }

      const filePath = path.join(logsDir, filename)
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' })
      }

      fs.unlinkSync(filePath)
      return res.status(200).json({ message: 'Deleted' })
    }

    if (!fs.existsSync(logsDir)) {
      return res.status(200).json({ files: [] })
    }

    const files = fs
      .readdirSync(logsDir)
      .filter((f) => isValidLogFilename(f))
      .sort()
      .reverse()

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

          const match = filename.match(
            /log_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/
          )
          const createdAt = match
            ? match[1].replace(/-(\d{2})-(\d{2})-(\d{2})$/, ':$1:$2:$3')
            : new Date().toISOString()

          return {
            filename,
            title: deriveTitleFromMessages(
              filename,
              messages as Array<{ role?: string; content?: unknown }>
            ),
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

    return res.status(200).json({ files: fileInfos })
  } catch (error) {
    console.error('Error in memory-files API:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
