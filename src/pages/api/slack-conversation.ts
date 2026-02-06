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
    const { slideDocs, userMessage, assistantMessage, userAgent, timestamp } =
      req.body

    // IPアドレスを取得（Vercel/プロキシ対応）
    const forwarded = req.headers['x-forwarded-for']
    const ip =
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0]
        : forwarded?.[0]) ||
      req.socket?.remoteAddress ||
      'Unknown'

    // デバイス情報
    const deviceType = getDeviceType(userAgent || '')
    const isMobile = isMobileDevice(userAgent || '')

    const message = {
      text: `💬 自由会話モード - Q&A`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '💬 自由会話モード - 質問と回答',
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
              text: `*時刻:*\n${timestamp}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🙋 ユーザー質問:*\n>${userMessage.replace(/\n/g, '\n>')}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🤖 AI回答:*\n${assistantMessage.substring(0, 500)}${assistantMessage.length > 500 ? '...' : ''}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `${deviceType} | ${isMobile ? '📱 モバイル' : '💻 デスクトップ'} | IP: \`${ip}\``,
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
    console.error('Slack conversation notification error:', error)
    res.status(500).json({ error: 'Failed to send notification' })
  }
}
