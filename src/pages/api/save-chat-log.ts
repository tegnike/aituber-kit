import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { Message } from '@/features/messages/messages'

// Supabaseクライアントの初期化
let supabase: SupabaseClient | null = null
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const {
      messages: newMessages,
      isNewFile,
      targetFileName,
      overwrite,
    } = req.body as {
      messages: Message[]
      isNewFile?: boolean
      targetFileName?: string | null
      overwrite?: boolean
    }
    const currentTime = new Date().toISOString()

    if (!Array.isArray(newMessages) || newMessages.length === 0) {
      return res.status(400).json({ message: 'Invalid messages data' })
    }

    const logsDir = path.join(process.cwd(), 'logs')

    // logsディレクトリが存在しない場合は作成
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir)
    }

    // ファイル名の決定優先順位:
    // 1. isNewFile が true → 新規ファイル作成
    // 2. targetFileName が指定されている → そのファイルを使用
    // 3. それ以外 → 最新のログファイルまたは新規作成
    let fileName: string
    if (isNewFile) {
      fileName = `log_${currentTime.replace(/[:.]/g, '-')}.json`
    } else if (targetFileName) {
      fileName = targetFileName
    } else {
      fileName =
        getLatestLogFile(logsDir) ||
        `log_${currentTime.replace(/[:.]/g, '-')}.json`
    }

    const filePath = path.join(logsDir, fileName)

    let allMessages: Message[]

    if (overwrite) {
      // 上書きモード: 既存のファイルを読み込まずに直接上書き
      allMessages = newMessages
    } else {
      // 追記モード: 既存のファイルを読み込んで追加
      let existingMessages: Message[] = []
      if (fs.existsSync(filePath)) {
        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8')
          existingMessages = JSON.parse(fileContent)
          if (!Array.isArray(existingMessages)) {
            console.warn(`Invalid format in ${fileName}, resetting file.`)
            existingMessages = []
          }
        } catch (parseError) {
          console.error(
            `Error parsing ${fileName}, resetting file.`,
            parseError
          )
          existingMessages = []
        }
      }
      allMessages = [...existingMessages, ...newMessages]
    }

    // メッセージ配列を保存
    fs.writeFileSync(filePath, JSON.stringify(allMessages, null, 2))

    if (supabase) {
      const { data: existingSession } = await supabase
        .from('local_chat_sessions')
        .select('id')
        .eq('title', fileName)
        .maybeSingle()

      let sessionId = existingSession?.id

      if (sessionId) {
        await supabase
          .from('local_chat_sessions')
          .update({ updated_at: currentTime })
          .eq('id', sessionId)
      } else {
        const { data: newSession, error: sessionError } = await supabase
          .from('local_chat_sessions')
          .insert({
            title: fileName,
            created_at: currentTime,
            updated_at: currentTime,
          })
          .select('id')
          .single()

        if (sessionError) throw sessionError
        sessionId = newSession.id
      }

      const messagesToSave = newMessages.map((msg) => ({
        session_id: sessionId,
        role: msg.role,
        content:
          typeof msg.content === 'string'
            ? msg.content
            : JSON.stringify(msg.content),
        created_at: msg.timestamp || currentTime,
      }))

      const { error: messageError } = await supabase
        .from('local_messages')
        .insert(messagesToSave)

      if (messageError) throw messageError
    }

    res.status(200).json({ message: 'Logs saved successfully' })
  } catch (error) {
    console.error('Error saving chat log:', error)
    res.status(500).json({ message: 'Error saving chat log' })
  }
}

function getLatestLogFile(dir: string): string | null {
  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith('log_') && f.endsWith('.json'))
      .sort()
      .reverse()
    return files.length > 0 ? files[0] : null
  } catch (error) {
    console.error('Error reading log directory:', error)
    return null
  }
}
