import type { NextApiRequest, NextApiResponse } from 'next'

// モバイルデバイス判定
const isMobileDevice = (userAgent: string): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  )
}

// デバイスタイプを判定
const getDeviceType = (userAgent: string): string => {
  if (/iPhone/i.test(userAgent)) return '📱 iPhone'
  if (/iPad/i.test(userAgent)) return '📱 iPad'
  if (/Android/i.test(userAgent)) {
    if (/Mobile/i.test(userAgent)) return '📱 Android (Mobile)'
    return '📱 Android (Tablet)'
  }
  if (/Macintosh/i.test(userAgent)) return '💻 Mac'
  if (/Windows/i.test(userAgent)) return '💻 Windows'
  if (/Linux/i.test(userAgent)) return '💻 Linux'
  return '🖥️ Unknown'
}

// ブラウザを判定
const getBrowser = (userAgent: string): string => {
  if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) return 'Chrome'
  if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'Safari'
  if (/Firefox/i.test(userAgent)) return 'Firefox'
  if (/Edg/i.test(userAgent)) return 'Edge'
  return 'Other'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    return res.status(500).json({ error: 'Slack webhook URL not configured' })
  }

  try {
    const { slideDocs, totalPages, userAgent, startTime, endTime, duration } =
      req.body

    // IPアドレスを取得（Vercel/プロキシ対応）
    const forwarded = req.headers['x-forwarded-for']
    const ip =
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0]
        : forwarded?.[0]) ||
      req.socket?.remoteAddress ||
      'Unknown'

    // デバイス・ブラウザ情報
    const deviceType = getDeviceType(userAgent || '')
    const browser = getBrowser(userAgent || '')
    const isMobile = isMobileDevice(userAgent || '')

    const message = {
      text: `🎉 プレゼンテーション完了通知`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎉 プレゼンテーション完了',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*スライド:*\n${slideDocs}`,
            },
            {
              type: 'mrkdwn',
              text: `*総ページ数:*\n${totalPages}ページ`,
            },
          ],
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*開始時刻:*\n${startTime}`,
            },
            {
              type: 'mrkdwn',
              text: `*終了時刻:*\n${endTime}`,
            },
          ],
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*視聴時間:*\n⏱️ ${duration}`,
            },
            {
              type: 'mrkdwn',
              text: `*デバイス:*\n${deviceType}`,
            },
          ],
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*ブラウザ:*\n${browser}`,
            },
            {
              type: 'mrkdwn',
              text: `*IPアドレス:*\n\`${ip}\``,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_${isMobile ? '📱 モバイル' : '💻 デスクトップ'} | ${userAgent?.substring(0, 80) || 'Unknown'}..._`,
            },
          ],
        },
      ],
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Slack notification error:', error)
    res.status(500).json({ error: 'Failed to send notification' })
  }
}
