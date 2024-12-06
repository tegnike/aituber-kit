import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

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
    const { messages, isNewFile } = req.body
    const created_at = new Date().toISOString()

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
          }),
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
      ? `log_${created_at.replace(/[:.]/g, '-')}.json`
      : getLatestLogFile(logsDir)

    const filePath = path.join(logsDir, fileName)
    fs.writeFileSync(filePath, JSON.stringify(processedMessages, null, 2))

    // TODO: 標準化する
    if (supabase) {
      // 既存のセッションを検索
      const { data: existingSession } = await supabase
        .from('local_chat_sessions')
        .select()
        .eq('title', fileName)
        .single()

      let sessionId

      if (existingSession) {
        // 既存のセッションが見つかった場合
        sessionId = existingSession.id

        // updated_at のみ更新
        await supabase
          .from('local_chat_sessions')
          .update({ updated_at: created_at })
          .eq('id', sessionId)
      } else {
        // 新しいセッションを作成
        const { data: newSession, error: sessionError } = await supabase
          .from('local_chat_sessions')
          .insert({
            title: fileName,
            created_at: created_at,
            updated_at: created_at,
          })
          .select()
          .single()

        if (sessionError) throw sessionError
        sessionId = newSession.id
      }

      // 最新のメッセージのみを保存
      const lastMessage = processedMessages[processedMessages.length - 1]
      const messageToSave = {
        session_id: sessionId,
        role: lastMessage.role,
        content: Array.isArray(lastMessage.content)
          ? JSON.stringify(lastMessage.content)
          : lastMessage.content,
        created_at: created_at,
      }

      const { error: messageError } = await supabase
        .from('local_messages')
        .insert(messageToSave)

      if (messageError) throw messageError
    }

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
