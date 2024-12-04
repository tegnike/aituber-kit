import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

  console.log('Parsed body:', body)
  console.log('localLlmUrl:', body.localLlmUrl)

  if (!body.localLlmUrl) {
    return res.status(400).json({
      error: 'localLlmUrl is required',
      receivedBody: body,
    })
  }

  try {
    const response = await axios.post(
      body.localLlmUrl.replace(/\/$/, ''),
      {
        model: body.model,
        messages: body.messages,
        stream: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      }
    )

    response.data.pipe(res)
  } catch (error) {
    console.error('Error details:', error)

    let errorMessage = 'Error processing request'

    if (error && typeof error === 'object') {
      const err = error as any
      if (
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response
      ) {
        errorMessage = err.response.data
      } else if ('message' in err && typeof err.message === 'string') {
        errorMessage = err.message
      }
    }

    res.status(500).json({ error: errorMessage })
  }
}
