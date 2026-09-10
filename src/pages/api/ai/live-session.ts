import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import {
  LIVE_MODEL,
  DEFAULT_LIVE_BACKEND,
  liveVoices,
} from '@/features/live/config'
import { LIVE_HISTORY_MAX_MESSAGES } from '@/features/live/history'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'

const bodySchema = z.object({
  apiKey: z.string().max(1024).optional(),
  sdp: z
    .string()
    .min(1)
    .max(65536)
    .refine((s) => s.startsWith('v=0')),
  voice: z.enum(liveVoices).default('marin'),
  backendModel: z
    .string()
    .regex(/^[a-zA-Z0-9._:-]+$/)
    .max(128)
    .default(DEFAULT_LIVE_BACKEND),
  instructions: z.string().default(''),
  language: z
    .string()
    .regex(/^[a-zA-Z-]{2,12}$/)
    .default('ja'),
  webSearch: z.boolean().default(false),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .max(LIVE_HISTORY_MAX_MESSAGES)
    .default([]),
})

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader('Cache-Control', 'no-store')
  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success)
    return res
      .status(400)
      .json({ error: 'Invalid GPT-Live session configuration' })
  const body = parsed.data
  const apiKey =
    body.apiKey || process.env.OPENAI_KEY || process.env.OPENAI_API_KEY
  if (!apiKey)
    return res
      .status(400)
      .json({ error: 'Empty API Key', errorCode: 'EmptyAPIKey' })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch('https://api.openai.com/v1/live/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        session: {
          model: LIVE_MODEL,
          instructions: `${body.instructions}\nSpeak in ${body.language}. Keep spoken replies concise and natural. Ask the backend for factual questions, reasoning, and tasks. Do not read emotion tags or formatting aloud.`,
          audio: { output: { voice: body.voice } },
          store: false,
          input: body.history.map(({ role, content }) => ({
            type: 'message',
            role,
            content: [
              {
                type: role === 'assistant' ? 'output_text' : 'input_text',
                text: content,
              },
            ],
          })),
          delegation: {
            type: 'responses',
            responses: {
              model: body.backendModel,
              instructions: `${body.instructions}\nReturn concise answers in ${body.language} for a spoken conversation. Never claim to have performed actions without tools.`,
              ...(body.webSearch
                ? { tools: [{ type: 'web_search' }], tool_choice: 'auto' }
                : {}),
            },
          },
        },
        transport: { type: 'webrtc', sdp: body.sdp },
      }),
    })
    if (!response.ok) {
      // The API is authoritative: its tokenizer and message overhead are not
      // specified for GPT-Live. Do not substitute a character-count estimate.
      const upstream = await response.json().catch(() => null)
      const detail = upstream?.error
      const tokenLimit =
        response.status === 400 &&
        typeof detail?.message === 'string' &&
        /token/i.test(detail.message) &&
        /exceed|maximum|at most|too (many|long)|limit/i.test(detail.message)
      const field = typeof detail?.param === 'string' ? detail.param : ''
      const errorCode = tokenLimit
        ? /instructions/.test(field + ' ' + detail.message)
          ? 'LiveInstructionsLimitExceeded'
          : /input|history/.test(field + ' ' + detail.message)
            ? 'LiveHistoryLimitExceeded'
            : 'LiveTokenLimitExceeded'
        : 'LiveSessionCreationFailed'
      return res.status(response.status).json({
        error: 'GPT-Live session creation failed',
        errorCode,
      })
    }
    const data = await response.json()
    if (
      typeof data.session?.id !== 'string' ||
      typeof data.transport?.sdp !== 'string' ||
      !data.transport.sdp.startsWith('v=0')
    ) {
      return res
        .status(502)
        .json({ error: 'Invalid GPT-Live session response' })
    }
    // Do not forward the resolved backend/session configuration or credentials.
    return res.status(201).json({
      session: { id: data.session.id },
      transport: { type: 'webrtc', sdp: data.transport.sdp },
    })
  } catch {
    return res
      .status(controller.signal.aborted ? 504 : 502)
      .json({ error: 'GPT-Live connection failed' })
  } finally {
    clearTimeout(timeout)
  }
}

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }
export default withAccessPolicy(routePolicies['/api/ai/live-session'], handler)
