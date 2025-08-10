import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
      memory: process.memoryUsage(),
      // セキュリティ上、本番環境では詳細情報を制限
      ...(process.env.NODE_ENV === 'development' && {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      }),
    }

    res.status(200).json(healthData)
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}