import { Message } from '@/features/messages/messages'
import { NextRequest } from 'next/server'
import { handleCustomApi } from '@/lib/api-services/customApi'
import { isDemoMode, createDemoModeErrorResponse } from '@/utils/demoMode'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method Not Allowed',
        errorCode: 'METHOD_NOT_ALLOWED',
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  if (isDemoMode()) {
    return new Response(
      JSON.stringify(createDemoModeErrorResponse('custom-api')),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const {
    messages,
    stream,
    customApiUrl = '',
    customApiHeaders = '{}',
    customApiBody = '{}',
    customApiIncludeMimeType = false,
  } = await req.json()

  try {
    return await handleCustomApi(
      messages,
      customApiUrl,
      customApiHeaders === '' ? '{}' : customApiHeaders,
      customApiBody === '' ? '{}' : customApiBody,
      stream,
      customApiIncludeMimeType
    )
  } catch (error) {
    console.error('Error in Custom API call:', error)

    if (error instanceof Response) {
      return error
    }

    if (error instanceof Error) {
      const isClientError =
        error instanceof TypeError ||
        error.message.includes('Invalid URL') ||
        error.message.includes('customApiUrl')
      return new Response(
        JSON.stringify({
          error: error.message,
          errorCode: isClientError
            ? 'CustomAPIInvalidRequest'
            : 'CustomAPIError',
        }),
        {
          status: isClientError ? 400 : 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        error: 'Unexpected Error',
        errorCode: 'CustomAPIError',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
