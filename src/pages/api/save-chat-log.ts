import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { Message } from '@/features/messages/messages'
import {
  isRestrictedMode,
  createRestrictedModeErrorResponse,
} from '@/utils/restrictedMode'

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

  if (isRestrictedMode()) {
    return res
      .status(403)
      .json(createRestrictedModeErrorResponse('save-chat-log'))
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

    // overwrite=trueの場合はtargetFileNameが必須
    if (overwrite && !targetFileName) {
      return res.status(400).json({
        message: 'targetFileName is required when overwrite is true',
      })
    }

    const logsDir = path.join(process.cwd(), 'logs')

    // logsディレクトリが存在しない場合は作成
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir)
    }

    // ファイル名の決定: isNewFile → targetFileName → 最新ファイル → 新規作成
    const newFileName = `log_${currentTime.replace(/[:.]/g, '-')}.json`
    const fileName = isNewFile
      ? newFileName
      : targetFileName || getLatestLogFile(logsDir) || newFileName

    const filePath = path.join(logsDir, fileName)

    // 上書きモードでなければ既存メッセージを読み込んで追記
    const allMessages = overwrite
      ? newMessages
      : [...readExistingMessages(filePath, fileName), ...newMessages]

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
    return files[0] ?? null
  } catch (error) {
    console.error('Error reading log directory:', error)
    return null
  }
}

function readExistingMessages(filePath: string, fileName: string): Message[] {
  if (!fs.existsSync(filePath)) return []

  try {
    const messages = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    if (!Array.isArray(messages)) {
      console.warn(`Invalid format in ${fileName}, resetting file.`)
      return []
    }
    return messages
  } catch (error) {
    console.error(`Error parsing ${fileName}, resetting file.`, error)
    return []
  }
}
