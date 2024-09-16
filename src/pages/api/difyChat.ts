import { NextRequest } from 'next/server'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'DifyMethod Not Allowed',
        errorCode: 'MethodNotAllowed',
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const { query, apiKey, url, conversationId, stream } = await req.json()

  if (!apiKey && !process.env.DIFY_KEY) {
    return new Response(
      JSON.stringify({ error: 'Dify Empty API Key', errorCode: 'EmptyAPIKey' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
  if (!url && !process.env.DIFY_URL) {
    return new Response(
      JSON.stringify({
        error: 'Dify Empty URL',
        errorCode: 'AIInvalidProperty',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const headers = {
    Authorization: `Bearer ${apiKey || process.env.DIFY_KEY}`,
    'Content-Type': 'application/json',
  }
  const body = JSON.stringify({
    inputs: {},
    query: query,
    response_mode: stream ? 'streaming' : 'blocking',
    conversation_id: conversationId,
    user: 'aituber-kit',
    files: [],
  })

  try {
    const response = await fetch(
      url.replace(/\/$/, '') || process.env.DIFY_URL,
      {
        method: 'POST',
        headers: headers,
        body: body,
      }
    )

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Dify API request failed',
          errorCode: 'AIAPIError',
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (stream) {
      return new Response(response.body, {
        headers: { 'Content-Type': 'text/event-stream' },
      })
    } else {
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    console.error('Error in Dify API call:', error)
    return new Response(
      JSON.stringify({
        error: 'Dify Internal Server Error',
        errorCode: 'AIAPIError',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
