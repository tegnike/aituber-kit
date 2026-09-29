import {
  validateSpeakersResponse,
  type SpeakerResponse,
} from '@/lib/api-services/validateSpeakersResponse'

const DEFAULT_SERVER_URL = 'http://127.0.0.1:50021'
const REQUEST_TIMEOUT_MS = 30_000

export class VoicevoxBrowserError extends Error {
  constructor(
    public readonly code:
      | 'invalid-url'
      | 'http'
      | 'json'
      | 'network'
      | 'timeout',
    message: string
  ) {
    super(message)
    this.name = 'VoicevoxBrowserError'
  }
}

export type VoicevoxSpeakerOption = { id: number; speaker: string }

export function getVoicevoxBrowserServerUrl(input: string): URL {
  let url: URL
  try {
    url = new URL(input.trim() || DEFAULT_SERVER_URL)
  } catch {
    throw new VoicevoxBrowserError('invalid-url', 'VOICEVOX のURLが不正です。')
  }

  const isLoopback =
    url.hostname === 'localhost' ||
    url.hostname === '::1' ||
    url.hostname === '[::1]' ||
    /^127(?:\.\d{1,3}){3}$/.test(url.hostname)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    !isLoopback ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== '/' && url.pathname !== '')
  ) {
    throw new VoicevoxBrowserError(
      'invalid-url',
      'ブラウザ直接接続では localhost または 127.0.0.1 のVOICEVOXだけを指定できます。'
    )
  }
  return url
}

function endpoint(baseUrl: URL, path: string, query?: URLSearchParams): string {
  const url = new URL(path, baseUrl)
  if (query) url.search = query.toString()
  return url.toString()
}

async function request<T>(
  url: string,
  init: RequestInit,
  readBody: (response: Response) => Promise<T>
): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  )
  try {
    const response = await fetch(url, {
      ...init,
      credentials: 'omit',
      redirect: 'error',
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new VoicevoxBrowserError(
        'http',
        `VOICEVOXからの応答が異常です。ステータスコード: ${response.status}`
      )
    }
    // ヘッダーだけでなく、音声やJSONの受信が終わるまでタイムアウトを維持する。
    return await readBody(response)
  } catch (error) {
    if (controller.signal.aborted) {
      throw new VoicevoxBrowserError(
        'timeout',
        'VOICEVOXへの接続がタイムアウトしました。'
      )
    }
    if (error instanceof VoicevoxBrowserError) throw error
    throw new VoicevoxBrowserError(
      'network',
      'VOICEVOXに接続できません。VOICEVOXを起動し、このサイトのOriginをCORSで許可して、Chromeのローカルネットワークアクセスを許可してください。'
    )
  } finally {
    window.clearTimeout(timeout)
  }
}

async function responseJson(
  response: Response
): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await response.json()
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error()
    return value as Record<string, unknown>
  } catch {
    throw new VoicevoxBrowserError('json', 'VOICEVOXの音声クエリが不正です。')
  }
}

export async function synthesizeVoicevoxInBrowser(
  text: string,
  speaker: string,
  speed: number,
  pitch: number,
  intonation: number,
  serverUrl: string
): Promise<ArrayBuffer> {
  const baseUrl = getVoicevoxBrowserServerUrl(serverUrl)
  const query = new URLSearchParams({ text, speaker })
  const audioQuery = await request(
    endpoint(baseUrl, '/audio_query', query),
    { method: 'POST' },
    responseJson
  )
  audioQuery.speedScale = speed
  audioQuery.pitchScale = pitch
  audioQuery.intonationScale = intonation
  return request(
    endpoint(baseUrl, '/synthesis', new URLSearchParams({ speaker })),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/wav' },
      body: JSON.stringify(audioQuery),
    },
    (response) => response.arrayBuffer()
  )
}

export async function getVoicevoxSpeakersInBrowser(
  serverUrl: string
): Promise<VoicevoxSpeakerOption[]> {
  const baseUrl = getVoicevoxBrowserServerUrl(serverUrl)
  const speakers = await request(
    endpoint(baseUrl, '/speakers'),
    { method: 'GET' },
    async (response): Promise<SpeakerResponse[]> => {
      try {
        return await validateSpeakersResponse(response, 'VOICEVOX')
      } catch {
        throw new VoicevoxBrowserError('json', 'VOICEVOXの話者一覧が不正です。')
      }
    }
  )
  return speakers.flatMap((speaker) =>
    speaker.styles.map((style) => ({
      id: style.id,
      speaker: `${speaker.name}/${style.name}`,
    }))
  )
}
