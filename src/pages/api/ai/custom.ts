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
  } = req.body

  try {
    const response = await handleCustomApi(
      messages,
      customApiUrl,
      customApiHeaders === '' ? '{}' : customApiHeaders,
      customApiBody === '' ? '{}' : customApiBody,
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
