import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import { Buffer } from 'buffer'

// FormDataのパース用に設定を無効化
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // リクエストボディをバッファとして取得
    const buffer = await getRawBody(req)

    // Content-Typeからバウンダリを抽出
    const contentTypeHeader = req.headers['content-type']
    if (!contentTypeHeader) {
      return res.status(400).json({ error: 'Content-Type header is missing' })
    }

    const boundary = getBoundary(contentTypeHeader)
    if (!boundary) {
      return res
        .status(400)
        .json({ error: 'Could not detect boundary from Content-Type' })
    }

    // マルチパートデータをパース
    const parts = parseMultipartData(buffer, boundary)

    // audio file、language、openaiKey、modelを探す
    let audioFilePart = null
    let language = undefined
    let openaiKey = undefined
    let model = 'whisper-1'

    for (const part of parts) {
      if (part.name === 'file' && part.filename) {
        audioFilePart = part
      } else if (part.name === 'language' && part.data) {
        language = part.data.toString('utf-8')
      } else if (part.name === 'openaiKey' && part.data) {
        openaiKey = part.data.toString('utf-8')
      } else if (part.name === 'model' && part.data) {
        model = part.data.toString('utf-8')
      }
    }

    if (!audioFilePart) {
      return res.status(400).json({ error: 'No audio file provided' })
    }

    console.log('Received audio file:', {
      filename: audioFilePart.filename,
      contentType: audioFilePart.type,
      dataSize: audioFilePart.data.length,
    })

    // OpenAI APIの設定
    // クライアントから送信されたキーを優先し、なければ環境変数を使用
    const apiKey =
      openaiKey ||
      process.env.OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_KEY

    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' })
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // OpenAIが必要とするファイルオブジェクトを作成
    // バッファからBlobを作成し、それをFileオブジェクトに変換
    const audioBlob = new Blob([audioFilePart.data], {
      type: audioFilePart.type || 'audio/webm',
    })

    // Fileオブジェクトを作成
    const audioFile = new File(
      [audioBlob],
      audioFilePart.filename || 'audio.webm',
      { type: audioFilePart.type || 'audio/webm' }
    )

    // Whisper APIに送信
    console.log(`Sending audio data to Whisper API using model: ${model}`)
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: model,
      language: language || undefined,
      response_format: 'json',
    })

    console.log('Whisper API response:', response)

    return res.status(200).json({ text: response.text })
  } catch (error: any) {
    console.error('Whisper API error:', error)

    // エラーの詳細をクライアントに返す
    return res.status(500).json({
      error: 'Failed to process audio',
      details: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

// リクエストボディをRawデータとして取得する関数
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    req.on('data', (chunk) => {
      chunks.push(chunk)
    })

    req.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    req.on('error', (err) => {
      reject(err)
    })
  })
}

// Content-Typeヘッダーからboundaryを抽出
function getBoundary(contentType: string): string | null {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
  return boundaryMatch ? boundaryMatch[1] || boundaryMatch[2] : null
}

// マルチパートデータをパースする関数
interface Part {
  name: string
  data: Buffer
  filename?: string
  type?: string
}

function parseMultipartData(buffer: Buffer, boundary: string): Part[] {
  // バウンダリの前後に -- と \r\n を追加
  const delimiter = Buffer.from(`--${boundary}\r\n`)
  const closeDelimiter = Buffer.from(`--${boundary}--\r\n`)

  // パートを抽出
  const parts: Part[] = []
  let position = 0

  // 先頭のデリミタをスキップ
  position = buffer.indexOf(delimiter)
  if (position === -1) return parts
  position += delimiter.length

  while (position < buffer.length) {
    // デリミタの開始位置を探す
    const nextDelimiter = buffer.indexOf(`--${boundary}`, position)
    if (nextDelimiter === -1) break

    // ヘッダとボディを分ける空行を見つける
    const headerEnd = buffer.indexOf('\r\n\r\n', position)
    if (headerEnd === -1 || headerEnd > nextDelimiter) break

    // ヘッダを解析
    const headerString = buffer.slice(position, headerEnd).toString('utf-8')
    const headers = parseHeaders(headerString)

    // Content-Dispositionを解析
    const contentDisposition = headers['content-disposition'] || ''
    const nameMatch = contentDisposition.match(/name="([^"]+)"/)
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
    const name = nameMatch ? nameMatch[1] : ''
    const filename = filenameMatch ? filenameMatch[1] : undefined

    // Content-Typeを取得
    const contentType = headers['content-type']

    // データ部分を取得
    const body = buffer.slice(headerEnd + 4, nextDelimiter - 2) // \r\n を除去

    // パート情報を保存
    parts.push({
      name,
      data: body,
      filename,
      type: contentType,
    })

    // 次のパートへ
    position = nextDelimiter + delimiter.length
  }

  return parts
}

// ヘッダ文字列をオブジェクトに変換
function parseHeaders(headerString: string): Record<string, string> {
  const headers: Record<string, string> = {}
  const lines = headerString.split('\r\n')

  for (const line of lines) {
    const [key, value] = line.split(': ')
    if (key && value) {
      headers[key.toLowerCase()] = value
    }
  }

  return headers
}
