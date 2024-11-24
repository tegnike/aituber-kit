import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { messages, isNewFile } = req.body

    // メッセージ内の画像データを省略
    const processedMessages = messages.map((msg: any) => {
      if (msg.content && Array.isArray(msg.content)) {
        return {
          ...msg,
          content: msg.content.map((content: any) => {
            if (content.type === 'image') {
              return {
                type: 'image',
                image: '[image data omitted]',
              }
            }
            return content
          })
        }
      }
      return msg
    })

    const logsDir = path.join(process.cwd(), 'logs')

    // logsディレクトリが存在しない場合は作成
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir)
    }

    const fileName = isNewFile
      ? `log_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      : getLatestLogFile(logsDir)

    const filePath = path.join(logsDir, fileName)
    fs.writeFileSync(filePath, JSON.stringify(processedMessages, null, 2))

    res.status(200).json({ message: 'Log saved successfully' })
  } catch (error) {
    console.error('Error saving chat log:', error)
    res.status(500).json({ message: 'Error saving chat log' })
  }
}

function getLatestLogFile(dir: string): string {
  const files = fs.readdirSync(dir)
  return (
    files.sort().reverse()[0] ||
    `log_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  )
}
