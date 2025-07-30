import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { apiKey } = req.query

  const nijivoiceApiKey = apiKey || process.env.NIJIVOICE_API_KEY
  if (!nijivoiceApiKey) {
    return res.status(400).json({ error: 'API key is required' })
  }

  try {
    const response = await fetch(
      'https://api.nijivoice.com/api/platform/v1/voice-actors',
      {
        headers: {
          'x-api-key': nijivoiceApiKey as string,
        },
      }
    )
    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Failed to fetch voice actors:', error)
    return res.status(500).json({ error: 'Failed to fetch voice actors' })
  }
}
