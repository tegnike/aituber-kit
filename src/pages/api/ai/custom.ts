import { NextApiRequest, NextApiResponse } from 'next'
import { handleCustomApi } from '@/lib/api-services/customApi'
import { pipeResponse } from '@/utils/pipeResponse'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      errorCode: 'METHOD_NOT_ALLOWED',
    })
  }

  const {
    messages,
    stream,
    customApiUrl = '',
    customApiHeaders = '{}',
    customApiBody = '{}',
    customApiIncludeMimeType = false,
    threadId,
  } = req.body

  // サーバーサイド環境変数を優先（秘匿設定）
  const apiUrl = process.env.CUSTOM_API_URL || customApiUrl

  // ヘッダー: フロントエンド設定をベースに、サーバーサイド環境変数で上書きマージ
  const frontHeaders = customApiHeaders === '' ? '{}' : customApiHeaders
  const serverHeaders = process.env.CUSTOM_API_HEADERS || ''
  let mergedHeaders = frontHeaders
  if (serverHeaders) {
    try {
      const front = JSON.parse(frontHeaders)
      const server = JSON.parse(serverHeaders)
      mergedHeaders = JSON.stringify({ ...front, ...server })
    } catch (e) {
      console.warn('Failed to parse/merge custom API headers:', e)
      mergedHeaders = serverHeaders
    }
  }

  // ボディ: フロントエンド設定をベースに、サーバーサイド環境変数で上書きマージ
  const frontBody = customApiBody === '' ? '{}' : customApiBody
  const serverBody = process.env.CUSTOM_API_BODY || ''
  let mergedBody = frontBody
  if (serverBody) {
    try {
      const front = JSON.parse(frontBody)
      const server = JSON.parse(serverBody)
      mergedBody = JSON.stringify({ ...front, ...server })
    } catch (e) {
      console.warn('Failed to parse/merge custom API body:', e)
      mergedBody = serverBody
    }
  }

  // threadIdをmergedBodyに注入
  if (threadId) {
    try {
      const bodyObj = JSON.parse(mergedBody)
      bodyObj.threadId = threadId
      mergedBody = JSON.stringify(bodyObj)
    } catch (e) {
      console.warn('Failed to inject threadId into mergedBody:', e)
    }
  }

  try {
    const response = await handleCustomApi(
      messages,
      apiUrl,
      mergedHeaders,
      mergedBody,
      stream,
      customApiIncludeMimeType
    )

    return pipeResponse(response, res)
  } catch (error) {
    console.error('Error in Custom API call:', error)

    if (error instanceof Response) {
      return pipeResponse(error, res)
    }

    if (error instanceof Error) {
      const isClientError =
        error instanceof TypeError ||
        error.message.includes('Invalid URL') ||
        error.message.includes('customApiUrl')
      return res.status(isClientError ? 400 : 500).json({
        error: error.message,
        errorCode: isClientError ? 'CustomAPIInvalidRequest' : 'CustomAPIError',
      })
    }

    return res.status(500).json({
      error: 'Unexpected Error',
      errorCode: 'CustomAPIError',
    })
  }
}
