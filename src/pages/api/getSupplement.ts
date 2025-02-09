import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { slideDocs } = req.query

    if (typeof slideDocs !== 'string') {
      return res.status(400).json({ error: 'Invalid slideDocs parameter' })
    }

    try {
      const supplementPath = path.join(
        process.cwd(),
        'public',
        'slides',
        slideDocs,
        'supplement.txt'
      )
      const supplement = await fs.readFile(supplementPath, 'utf-8')
      res.status(200).json({ supplement })
    } catch (error) {
      console.error('Error reading supplement.txt:', error)
      res.status(500).json({ error: 'Failed to read supplement file' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
