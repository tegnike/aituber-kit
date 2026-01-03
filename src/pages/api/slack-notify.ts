import type { NextApiRequest, NextApiResponse } from 'next'

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
    const { slideDocs, totalPages, userAgent, timestamp } = req.body

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
              text: `*総ページ数:*\n${totalPages}`,
            },
          ],
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*完了時刻:*\n${timestamp}`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_${userAgent?.substring(0, 100) || 'Unknown'}_`,
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
