import { Message } from '@/features/messages/messages'
import { NextResponse } from 'next/server'

/**
 * base64データURLからMIMEタイプを抽出する
 * @param dataUrl base64データURL (例: "data:image/png;base64,...")
 * @returns MIMEタイプ (例: "image/png") または null
 */
function extractMimeTypeFromDataUrl(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:([^;]+);base64,/)
  const mimeType = match ? match[1] : null

  // MIMEタイプが画像形式であることを検証
  if (mimeType && !mimeType.startsWith('image/')) {
    return null
  }

  return mimeType
}

/**
 * メッセージ内の画像オブジェクトにmimeTypeを追加する
 * @param messages 処理するメッセージ配列
 * @returns mimeTypeが追加されたメッセージ配列
 */
function processMessagesWithMimeType(messages: Message[]): any[] {
  return messages.map((message) => {
    if (
      message.content &&
      Array.isArray(message.content) &&
      message.content.some((content: any) => content.type === 'image')
    ) {
      return {
        ...message,
        content: message.content.map((content: any) => {
          if (content.type === 'image' && content.image) {
            const mimeType = extractMimeTypeFromDataUrl(content.image)
            return mimeType
              ? {
                  ...content,
                  mimeType,
                }
              : content
          }
          return content
        }),
      }
    }
    return message
  })
}

/**
 * カスタムAPIを使用して応答を取得する
 * @param messages メッセージ
 * @param customApiUrl カスタムAPIのURL
 * @param customApiHeaders カスタムAPIのヘッダー (JSON文字列)
 * @param customApiBody カスタムAPIのボディ (JSON文字列)
 * @param stream ストリーミングするかどうか
 * @param customApiIncludeMimeType 画像にmimeTypeを含めるかどうか
 */
export async function handleCustomApi(
  messages: Message[],
  customApiUrl: string,
  customApiHeaders: string,
  customApiBody: string,
  stream: boolean,
  customApiIncludeMimeType: boolean = false
) {
  // 強制的にストリーミングを有効にする
  stream = true

  let parsedHeaders: Record<string, string> = {}
  let parsedBody: Record<string, any> = {}

  try {
    parsedHeaders = JSON.parse(customApiHeaders)
    parsedBody = JSON.parse(customApiBody)
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Invalid Headers or Body JSON',
        errorCode: 'InvalidJSON',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const apiHeaders = {
    'Content-Type': 'application/json',
    ...parsedHeaders,
  }

  // customApiIncludeMimeTypeが有効な場合は画像にmimeTypeを追加
  const processedMessages = customApiIncludeMimeType
    ? processMessagesWithMimeType(messages)
    : messages

  // messagesをデフォルトでbodyに含める
  const apiBody = JSON.stringify({
    ...parsedBody,
    messages: processedMessages,
  })

  const apiResponse = await fetch(customApiUrl, {
    method: 'POST',
    headers: apiHeaders,
    body: apiBody,
    signal: AbortSignal.timeout(180000), // 3分でタイムアウト
  })

  if (!apiResponse.ok) {
    console.error(
      `Custom API Error: Status ${apiResponse.status}, URL: ${customApiUrl}`
    )

    try {
      // エラーレスポンスの内容も可能であればログに出力
      const errorResponseText = await apiResponse.text()
      console.error(`Error Response: ${errorResponseText}`)

      // レスポンスを再作成するため、新しいResponseオブジェクトを作成
      return new Response(
        JSON.stringify({
          error: `Custom API Error: ${apiResponse.status}`,
          errorCode: 'CustomAPIError',
        }),
        {
          status: apiResponse.status,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    } catch (e) {
      console.error('Failed to read error response body:', e)
      return new Response(
        JSON.stringify({
          error: `Custom API Error: ${apiResponse.status}`,
          errorCode: 'CustomAPIError',
        }),
        {
          status: apiResponse.status,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }

  if (stream) {
    // ストリーミングレスポンスを正規化して返す
    // SSEの行をVercel AI SDK形式（text-delta + delta）に変換する
    let buffer = ''
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true })
        const lines = buffer.split('\n')
        // 最後の要素は不完全な行の可能性があるのでバッファに残す
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data:')) {
            controller.enqueue(encoder.encode(line + '\n'))
            continue
          }

          const content = line.substring(5).trim()
          if (!content || content === '[DONE]') {
            controller.enqueue(encoder.encode(line + '\n'))
            continue
          }

          try {
            const data = JSON.parse(content)

            // 既にVercel AI SDK形式（deltaフィールドあり）ならそのまま
            if (data.delta !== undefined) {
              controller.enqueue(encoder.encode(line + '\n'))
              continue
            }

            // payload.textフォーマットをdeltaフォーマットに変換
            if (data.payload?.text !== undefined) {
              const normalized = {
                type: data.type || 'text-delta',
                delta: data.payload.text,
              }
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(normalized)}\n`)
              )
              continue
            }

            // OpenAI互換形式（choices[].delta.reasoning_content）の推論コンテンツ変換
            if (data.choices?.[0]?.delta?.reasoning_content !== undefined) {
              const normalized = {
                type: 'reasoning-delta',
                delta: data.choices[0].delta.reasoning_content,
              }
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(normalized)}\n`)
              )
              // contentも同時に存在する場合があるのでフォールスルー
              if (data.choices[0].delta.content === undefined) {
                continue
              }
            }

            // OpenAI互換形式（choices[].delta.content）の変換
            if (data.choices?.[0]?.delta?.content !== undefined) {
              const normalized = {
                type: 'text-delta',
                delta: data.choices[0].delta.content,
              }
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(normalized)}\n`)
              )
              continue
            }

            // その他の形式はそのまま
            controller.enqueue(encoder.encode(line + '\n'))
          } catch {
            // JSONパース失敗時はそのまま
            controller.enqueue(encoder.encode(line + '\n'))
          }
        }
      },
      flush(controller) {
        // 残りのバッファを処理
        if (buffer.trim()) {
          controller.enqueue(encoder.encode(buffer + '\n'))
        }
      },
    })

    return new Response(apiResponse.body!.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } else {
    // 非ストリーミングレスポンス
    const data = await apiResponse.json()
    return new Response(
      JSON.stringify({
        text: data.text || data.content || JSON.stringify(data),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
