import { Message } from '@/features/messages/messages'
import { NextRequest } from 'next/server'
import { handleCustomApi } from '../services/customApi'

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

  const {
    messages,
    stream,
    customApiUrl = '',
    customApiHeaders = '{}',
    customApiBody = '{}',
  } = await req.json()

  try {
    return await handleCustomApi(
      messages,
      customApiUrl,
      customApiHeaders === '' ? '{}' : customApiHeaders,
      customApiBody === '' ? '{}' : customApiBody,
      stream
    )
  } catch (error) {
    console.error('Error in Custom API call:', error)

    return new Response(
      JSON.stringify({
        error: 'Unexpected Error',
        errorCode: 'CustomAPIError',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
