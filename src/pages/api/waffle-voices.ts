import type { NextApiRequest, NextApiResponse } from 'next'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

const WAFFLE_VOICES_URL = 'https://aniwaffle.com/v1/voices'

export type WaffleVoice = { id: string; name: string }

type Data = {
  voices?: WaffleVoice[]
  error?: string
  errorCode?: string
}

// ボイス一覧は API キー（ワークスペース）ごとに異なるため、ファイルには保存せずそのまま返す
async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const apiKey =
    (req.body as { apiKey?: string } | null)?.apiKey ||
    process.env.ANIWAFFLE_API_KEY

  if (!apiKey) {
    res.status(400).json({ error: 'Empty API Key', errorCode: 'EmptyAPIKey' })
    return
  }

  try {
    const response = await fetch(WAFFLE_VOICES_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      res.status(response.status).json({
        error: `Waffle APIからの応答が異常です。ステータスコード: ${response.status}`,
      })
      return
    }

    const data: unknown = await response.json()
    const list = (data as { voices?: unknown } | null)?.voices
    if (!Array.isArray(list)) {
      res.status(502).json({ error: 'Invalid Waffle voice list' })
      return
    }

    const voices = list
      .filter(
        (voice): voice is WaffleVoice =>
          typeof voice?.id === 'string' && typeof voice?.name === 'string'
      )
      .map(({ id, name }) => ({ id, name }))

    res.status(200).json({ voices })
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : String(error) })
  }
}

export default withAccessPolicy(routePolicies['/api/waffle-voices'], handler)
