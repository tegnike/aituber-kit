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
        temperature: body.temperature,
        max_tokens: body.maxTokens,
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
    console.error('Error in Local LLM API call:', error)

    let errorMessage = 'Error processing request'
    let errorCode = 'LocalLLMError'

    if (error && typeof error === 'object') {
      const err = error as any
      if (err.code === 'ECONNREFUSED') {
        errorMessage = 'Failed to connect to Local LLM server'
        errorCode = 'LocalLLMConnectionError'
      } else if (err.response?.status === 404) {
        errorMessage = 'Local LLM endpoint not found'
        errorCode = 'LocalLLMNotFound'
      } else if (err.response?.data) {
        errorMessage = err.response.data
        errorCode = 'LocalLLMAPIError'
      } else if (err.message) {
        errorMessage = err.message
      }
    }

    res.status(500).json({
      error: errorMessage,
      errorCode: errorCode,
    })
  }
}
