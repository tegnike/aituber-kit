import { useEffect, useMemo, useState } from 'react'
import settingsStore from '@/features/stores/settings'
import { useTranslation } from 'react-i18next'
import {
  BoltIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  CodeBracketSquareIcon,
  CommandLineIcon,
  KeyIcon,
  PaperAirplaneIcon,
  PlayIcon,
  ServerStackIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

type EndpointId =
  | 'messages'
  | 'speak'
  | 'chat'
  | 'stop'
  | 'status'
  | 'events'
  | 'presentation_register'
  | 'presentation_get'
  | 'presentation_activate'
  | 'presentation_control'
  | 'presentation_status'
  | 'legacy_direct'
  | 'legacy_ai'
  | 'legacy_user'

type CodeSampleId = 'curl' | 'node' | 'python'
type EndpointGroup = 'v1' | 'presentation' | 'legacy'

type EndpointDefinition = {
  id: EndpointId
  group: EndpointGroup
  label: string
  method: 'GET' | 'POST' | 'PUT'
  path: string
  description: string
  requiresApiKey: boolean
  requiresClientId?: boolean
  requiresPresentationId?: boolean
  supportsRevisionQuery?: boolean
  defaultBody?: Record<string, unknown>
  fields: Array<{
    name: string
    type: string
    required?: boolean
    description: string
  }>
}

const defaultPresentationId = 'api-console-demo'

const endpoints: EndpointDefinition[] = [
  {
    id: 'messages',
    group: 'v1',
    label: 'Messages',
    method: 'POST',
    path: '/api/v1/messages/',
    description:
      'messages と type を指定して、発話・AI生成・通常入力をまとめて送信します。',
    requiresApiKey: true,
    defaultBody: {
      messages: ['こんにちは。外部APIからの発話テストです。'],
      type: 'direct_send',
    },
    fields: [
      {
        name: 'messages',
        type: 'string[]',
        required: true,
        description: '送信する本文の配列です。',
      },
      {
        name: 'type',
        type: '"direct_send" | "ai_generate" | "user_input"',
        description:
          'direct_send はそのまま発話、ai_generate はAI生成、user_input は通常入力として処理します。',
      },
      {
        name: 'text',
        type: 'string',
        description: 'messages の代わりに単一本文を送る場合に使います。',
      },
      {
        name: 'systemPrompt',
        type: 'string',
        description:
          'type が ai_generate で useCurrentSystemPrompt=false のときに使うシステムプロンプトです。',
      },
      {
        name: 'useCurrentSystemPrompt',
        type: 'boolean',
        description:
          'type が ai_generate のとき、現在のキャラクター設定のシステムプロンプトを使うかどうかです。',
      },
      {
        name: 'image',
        type: 'string',
        description:
          'data URL などの画像文字列です。画像付き入力として処理します。',
      },
    ],
  },
  {
    id: 'speak',
    group: 'v1',
    label: 'Speak',
    method: 'POST',
    path: '/api/v1/speak/',
    description: 'テキストをそのままキャラクターに発話させます。',
    requiresApiKey: true,
    defaultBody: {
      text: 'こんにちは。外部APIからの発話テストです。',
      emotion: 'neutral',
      priority: 'normal',
      interrupt: false,
    },
    fields: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: '発話させる本文です。messages の代わりに指定できます。',
      },
      {
        name: 'messages',
        type: 'string[]',
        description: '複数文をまとめてキューに入れる場合に使います。',
      },
      {
        name: 'emotion',
        type: 'string',
        description: '発話時の表情・感情指定です。未指定なら通常状態です。',
      },
      {
        name: 'speechSessionId',
        type: 'string',
        description:
          'ストリーミング回答を分割送信するとき、同じ回答の全リクエストに共通で指定します。発話順を維持したまま同一キューへ追加されます。',
      },
      {
        name: 'priority',
        type: '"normal" | "high"',
        description: 'high の場合は通常より前にキューへ入れます。',
      },
      {
        name: 'interrupt',
        type: 'boolean',
        description:
          'true の場合、現在の発話/待機キューを止めてからこの発話を入れます。',
      },
    ],
  },
  {
    id: 'chat',
    group: 'v1',
    label: 'Chat',
    method: 'POST',
    path: '/api/v1/chat/',
    description: 'AITuberKitの入力欄に送った場合と同じ会話処理に流します。',
    requiresApiKey: true,
    defaultBody: {
      text: '今日の配信で一言あいさつしてください。',
      mode: 'user_input',
      interrupt: false,
    },
    fields: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description:
          'キャラクターへ渡す入力文です。messages の代わりに指定できます。',
      },
      {
        name: 'messages',
        type: 'string[]',
        description: '複数の入力文をまとめて送る場合に使います。',
      },
      {
        name: 'mode',
        type: '"user_input" | "ai_generate"',
        description:
          'user_input は通常入力欄と同じ送信フロー、ai_generate は外部API互換のAI生成フローです。',
      },
      {
        name: 'systemPrompt',
        type: 'string',
        description:
          'mode が ai_generate で useCurrentSystemPrompt=false のときに使うシステムプロンプトです。',
      },
      {
        name: 'useCurrentSystemPrompt',
        type: 'boolean',
        description:
          'mode が ai_generate のとき、現在のキャラクター設定のシステムプロンプトを使うかどうかです。既定値は true です。',
      },
      {
        name: 'image',
        type: 'string',
        description:
          'data URL などの画像文字列です。画像付き入力として処理します。',
      },
      {
        name: 'priority',
        type: '"normal" | "high"',
        description: 'high の場合は通常より前にキューへ入れます。',
      },
      {
        name: 'interrupt',
        type: 'boolean',
        description:
          'true の場合、現在の発話/待機キューを止めてからこの入力を入れます。',
      },
    ],
  },
  {
    id: 'stop',
    group: 'v1',
    label: 'Stop',
    method: 'POST',
    path: '/api/v1/stop/',
    description: '現在の発話と待機中の制御を停止します。',
    requiresApiKey: true,
    defaultBody: {
      mode: 'all',
      reason: 'manual_api_console',
    },
    fields: [
      {
        name: 'mode',
        type: '"speech" | "queue" | "all"',
        description:
          '停止範囲です。speech は現在の発話、queue は待機キュー、all は両方を止めます。未指定時は all です。',
      },
      {
        name: 'reason',
        type: 'string',
        description: '停止理由のメモです。イベントログ確認用に残せます。',
      },
    ],
  },
  {
    id: 'status',
    group: 'v1',
    label: 'Status',
    method: 'GET',
    path: '/api/v1/status/',
    description: '接続中クライアントの状態とキュー件数を取得します。',
    requiresApiKey: true,
    fields: [
      {
        name: 'clientId',
        type: 'query string',
        required: true,
        description: '状態を取得する Message Receiver の Client ID です。',
      },
    ],
  },
  {
    id: 'events',
    group: 'v1',
    label: 'Events Snapshot',
    method: 'GET',
    path: '/api/v1/events/',
    description: '直近のAPIイベントを取得します。SSE接続の確認にも使えます。',
    requiresApiKey: true,
    fields: [
      {
        name: 'clientId',
        type: 'query string',
        description: '指定した Client ID のイベントだけに絞り込めます。',
      },
      {
        name: 'snapshot',
        type: 'query boolean',
        description:
          'true の場合は直近イベントをJSONで返します。未指定の場合はSSE接続になります。',
      },
    ],
  },
  {
    id: 'presentation_register',
    group: 'presentation',
    label: 'Register / Update',
    method: 'PUT',
    path: '/api/v1/presentations/{presentationId}',
    description:
      'Presentation Manifestを登録または更新します。同じRevision・同じ内容の再送はno-opになります。',
    requiresApiKey: true,
    requiresClientId: false,
    requiresPresentationId: true,
    defaultBody: {
      schemaVersion: 1,
      presentationId: defaultPresentationId,
      revision: 1,
      title: 'API Console Demo',
      locale: 'ja-JP',
      createdAt: '2026-07-14T20:00:00.000Z',
      theme: 'default',
      sections: [
        {
          id: 'section-1',
          title: 'デモセクション',
          qaBrief: 'このデモ資料に関する質問へ、資料の内容に基づいて回答する。',
          responsePolicy: '資料にない情報は推測で断定しない。',
          slides: [
            {
              id: 'slide-1',
              markdown:
                '# API Console Demo\n\n外部APIから登録したスライドです。',
              narration: '外部APIから登録したデモスライドです。',
              pauseAfter: true,
            },
          ],
        },
      ],
    },
    fields: [
      {
        name: 'presentationId',
        type: 'string',
        required: true,
        description:
          'URLとManifestで一致させるPresentation IDです。英数字・ハイフン・アンダースコアを使用できます。',
      },
      {
        name: 'revision',
        type: 'integer >= 1',
        required: true,
        description:
          '更新番号です。同じIDでは保存済みRevision以上を指定します。',
      },
      {
        name: 'sections',
        type: 'PresentationSectionV1[]',
        required: true,
        description:
          '1件以上のSectionと、各Sectionに1件以上のSlideを指定します。',
      },
    ],
  },
  {
    id: 'presentation_get',
    group: 'presentation',
    label: 'Get Manifest',
    method: 'GET',
    path: '/api/v1/presentations/{presentationId}',
    description:
      '保存済みPresentation Manifestを取得します。Revisionは任意です。',
    requiresApiKey: true,
    requiresClientId: false,
    requiresPresentationId: true,
    supportsRevisionQuery: true,
    fields: [
      {
        name: 'presentationId',
        type: 'path string',
        required: true,
        description: '取得するPresentation IDです。',
      },
      {
        name: 'revision',
        type: 'query integer',
        description:
          '任意のRevisionです。保存済みRevisionと異なる場合は409になります。',
      },
    ],
  },
  {
    id: 'presentation_activate',
    group: 'presentation',
    label: 'Activate',
    method: 'POST',
    path: '/api/v1/presentations/{presentationId}/activate',
    description:
      'PresentationをClient IDへ割り当て、ブラウザへ読込コマンドを送ります。',
    requiresApiKey: true,
    requiresPresentationId: true,
    defaultBody: {
      revision: 1,
      autoStart: false,
    },
    fields: [
      {
        name: 'clientId',
        type: 'query or body string',
        required: true,
        description: 'Presentationを割り当てるClient IDです。',
      },
      {
        name: 'revision',
        type: 'integer >= 1',
        required: true,
        description: '割り当てる保存済みRevisionです。',
      },
      {
        name: 'autoStart',
        type: 'boolean',
        description: 'trueなら読込後に開始します。既定値はfalseです。',
      },
    ],
  },
  {
    id: 'presentation_control',
    group: 'presentation',
    label: 'Control',
    method: 'POST',
    path: '/api/v1/presentation/control',
    description:
      '割当済みPresentationの開始、一時停止、移動、解除などを非同期で指示します。',
    requiresApiKey: true,
    defaultBody: {
      action: 'start',
    },
    fields: [
      {
        name: 'clientId',
        type: 'query or body string',
        required: true,
        description: '操作対象のClient IDです。',
      },
      {
        name: 'action',
        type: '"start" | "pause" | "resume" | "next_slide" | "previous_slide" | "next_section" | "previous_section" | "goto" | "reset" | "unload"',
        required: true,
        description: '実行するPresentation操作です。',
      },
      {
        name: 'target',
        type: '{ sectionId?: string; slideId?: string }',
        description: 'goto時に必須となる移動先です。',
      },
      {
        name: 'speak',
        type: 'boolean',
        description: '移動後に読み上げるかを指定します。',
      },
    ],
  },
  {
    id: 'presentation_status',
    group: 'presentation',
    label: 'Presentation Status',
    method: 'GET',
    path: '/api/v1/presentation/status',
    description:
      'Clientの割当状態（desired）とブラウザの実状態（actual）、同期状態を取得します。',
    requiresApiKey: true,
    fields: [
      {
        name: 'clientId',
        type: 'query string',
        required: true,
        description: '状態を取得するClient IDです。',
      },
    ],
  },
  {
    id: 'legacy_direct',
    group: 'legacy',
    label: 'Legacy Direct Send',
    method: 'POST',
    path: '/api/messages/',
    description: '旧API: そのまま発話させる direct_send です。',
    requiresApiKey: false,
    defaultBody: {
      messages: ['こんにちは、今日もいい天気ですね。'],
    },
    fields: [
      {
        name: 'messages',
        type: 'string[]',
        required: true,
        description: 'そのまま発話させる本文の配列です。',
      },
    ],
  },
  {
    id: 'legacy_ai',
    group: 'legacy',
    label: 'Legacy AI Generate',
    method: 'POST',
    path: '/api/messages/',
    description: '旧API: AIで回答を生成してから発話させます。',
    requiresApiKey: false,
    defaultBody: {
      systemPrompt: 'You are a helpful assistant.',
      useCurrentSystemPrompt: false,
      messages: ['この画像について説明してください。'],
      image: 'data:image/png;base64,...',
    },
    fields: [
      {
        name: 'messages',
        type: 'string[]',
        required: true,
        description: 'AIへ渡すユーザー入力の配列です。',
      },
      {
        name: 'systemPrompt',
        type: 'string',
        description:
          'useCurrentSystemPrompt=false のときに使うシステムプロンプトです。',
      },
      {
        name: 'useCurrentSystemPrompt',
        type: 'boolean',
        description:
          '現在のキャラクター設定のシステムプロンプトを使うかどうかです。',
      },
      {
        name: 'image',
        type: 'string',
        description: 'data URL などの画像文字列です。',
      },
    ],
  },
  {
    id: 'legacy_user',
    group: 'legacy',
    label: 'Legacy User Input',
    method: 'POST',
    path: '/api/messages/',
    description: '旧API: 通常のユーザー入力として処理します。',
    requiresApiKey: false,
    defaultBody: {
      messages: ['こんにちは。'],
    },
    fields: [
      {
        name: 'messages',
        type: 'string[]',
        required: true,
        description: '通常のユーザー入力として処理する本文の配列です。',
      },
    ],
  },
]

const legacyTypeByEndpoint: Partial<Record<EndpointId, string>> = {
  legacy_direct: 'direct_send',
  legacy_ai: 'ai_generate',
  legacy_user: 'user_input',
}

const codeSampleTabs: Array<{ id: CodeSampleId; label: string }> = [
  { id: 'curl', label: 'cURL' },
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
]

const defaultEndpoint = endpoints.find(
  (endpoint) => endpoint.id === 'messages'
)!

const stringifyBody = (body?: Record<string, unknown>) =>
  body ? JSON.stringify(body, null, 2) : ''

const isRequestBodyObject = (
  value: unknown
): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const formatMessageInputValue = (value: unknown) => {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string').join('\n')
  }
  return ''
}

const extractMessageText = (
  endpoint: EndpointDefinition,
  body?: Record<string, unknown>
) => {
  if (
    endpoint.group === 'legacy' ||
    endpoint.id === 'messages' ||
    endpoint.id === 'speak' ||
    endpoint.id === 'chat'
  ) {
    return (
      formatMessageInputValue(body?.messages) ||
      formatMessageInputValue(body?.text)
    )
  }
  return formatMessageInputValue(body?.text)
}

const SendMessage = () => {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<EndpointId>(defaultEndpoint.id)
  const [clientId, setClientId] = useState('')
  const [presentationId, setPresentationId] = useState(defaultPresentationId)
  const [presentationRevision, setPresentationRevision] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [requestBody, setRequestBody] = useState(
    stringifyBody(defaultEndpoint.defaultBody)
  )
  const [messageText, setMessageText] = useState(
    extractMessageText(defaultEndpoint, defaultEndpoint.defaultBody)
  )
  const [responseText, setResponseText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const [selectedSample, setSelectedSample] = useState<CodeSampleId>('curl')
  const [endpointsOpen, setEndpointsOpen] = useState(false)

  const selectedEndpoint = useMemo(
    () => endpoints.find((endpoint) => endpoint.id === selectedId)!,
    [selectedId]
  )

  useEffect(() => {
    const storedClientId = settingsStore.getState().clientId
    if (storedClientId) {
      setClientId(storedClientId)
    }
  }, [])

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const buildUrl = () => {
    const path = selectedEndpoint.requiresPresentationId
      ? selectedEndpoint.path.replace(
          '{presentationId}',
          encodeURIComponent(presentationId.trim() || 'PRESENTATION_ID')
        )
      : selectedEndpoint.path
    const url = new URL(path, baseUrl || 'http://localhost:3000')

    if (selectedEndpoint.requiresClientId !== false && clientId) {
      url.searchParams.set('clientId', clientId)
    }

    if (selectedEndpoint.supportsRevisionQuery && presentationRevision.trim()) {
      url.searchParams.set('revision', presentationRevision.trim())
    }

    const legacyType = legacyTypeByEndpoint[selectedEndpoint.id]
    if (legacyType) {
      url.searchParams.set('type', legacyType)
    }

    if (selectedEndpoint.id === 'events') {
      url.searchParams.set('snapshot', 'true')
    }

    return url
  }

  const parseBody = () => {
    if (selectedEndpoint.method === 'GET' || !requestBody.trim()) {
      return undefined
    }

    return JSON.parse(requestBody)
  }

  const buildCurlSample = () => {
    const url = buildUrl().toString()
    const headers =
      selectedEndpoint.method !== 'GET'
        ? ['-H "Content-Type: application/json"']
        : []

    if (selectedEndpoint.requiresApiKey) {
      headers.push('-H "Authorization: Bearer YOUR_API_KEY"')
    }

    const body =
      selectedEndpoint.method !== 'GET' && requestBody.trim()
        ? ` \\\n  -d '${requestBody.replace(/\n/g, '')}'`
        : ''

    return `curl -X ${selectedEndpoint.method}${
      headers.length ? ` \\\n  ${headers.join(' \\\n  ')}` : ''
    }${body} \\\n  '${url}'`
  }

  const buildNodeSample = () => {
    const url = buildUrl().toString()
    const headers = [
      ...(selectedEndpoint.method !== 'GET'
        ? [`'Content-Type': 'application/json'`]
        : []),
      ...(selectedEndpoint.requiresApiKey
        ? [`Authorization: 'Bearer YOUR_API_KEY'`]
        : []),
    ]
    const body = requestBody.trim() || '{}'
    const requestOptions = [
      `method: '${selectedEndpoint.method}'`,
      `headers: {${headers.length ? `\n    ${headers.join(',\n    ')}\n  ` : ''}}`,
      ...(selectedEndpoint.method !== 'GET'
        ? [`body: JSON.stringify(${body})`]
        : []),
    ]

    return `const url = '${url}'

const response = await fetch(url, {
  ${requestOptions.join(',\n  ')}
})

console.log(response.status)
console.log(await response.json())`
  }

  const buildPythonSample = () => {
    const url = buildUrl().toString()
    const headers = [
      ...(selectedEndpoint.method !== 'GET'
        ? [`'Content-Type': 'application/json'`]
        : []),
      ...(selectedEndpoint.requiresApiKey
        ? [`'Authorization': 'Bearer YOUR_API_KEY'`]
        : []),
    ]
    const body = requestBody.trim() || '{}'
    const requestArgs = [
      `'${selectedEndpoint.method}'`,
      'url',
      ...(headers.length ? ['headers=headers'] : []),
      ...(selectedEndpoint.method !== 'GET' ? ['json=payload'] : []),
    ]

    return `${selectedEndpoint.method !== 'GET' ? 'import json\n' : ''}import requests

url = '${url}'
${headers.length ? `headers = {\n    ${headers.join(',\n    ')}\n}\n` : ''}${
      selectedEndpoint.method !== 'GET'
        ? `payload = json.loads(${JSON.stringify(body)})\n`
        : ''
    }
response = requests.request(${requestArgs.join(', ')})

print(response.status_code)
print(response.json())`
  }

  const getSelectedCodeSample = () => {
    if (selectedSample === 'node') return buildNodeSample()
    if (selectedSample === 'python') return buildPythonSample()
    return buildCurlSample()
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopyStatus(t('ApiConsole.copied'))
    setTimeout(() => setCopyStatus(''), 1600)
  }

  const handleEndpointChange = (endpoint: EndpointDefinition) => {
    const defaultBody = endpoint.defaultBody
      ? { ...endpoint.defaultBody }
      : undefined
    if (endpoint.id === 'presentation_register' && defaultBody) {
      defaultBody.presentationId =
        presentationId.trim() || defaultPresentationId
    }
    setSelectedId(endpoint.id)
    setRequestBody(stringifyBody(defaultBody))
    setMessageText(extractMessageText(endpoint, defaultBody))
    setResponseText('')
    if (window.innerWidth < 1024) {
      setEndpointsOpen(false)
    }
  }

  const handlePresentationIdChange = (value: string) => {
    setPresentationId(value)
    if (selectedEndpoint.id !== 'presentation_register') return

    try {
      const parsed = JSON.parse(requestBody)
      if (isRequestBodyObject(parsed)) {
        parsed.presentationId = value
        setRequestBody(JSON.stringify(parsed, null, 2))
      }
    } catch {
      // Keep invalid JSON untouched while editing the path parameter.
    }
  }

  const handleMessageTextChange = (text: string) => {
    setMessageText(text)

    try {
      const parsed = requestBody.trim()
        ? JSON.parse(requestBody)
        : { ...(selectedEndpoint.defaultBody ?? {}) }
      const body = isRequestBodyObject(parsed)
        ? parsed
        : { ...(selectedEndpoint.defaultBody ?? {}) }
      if (
        selectedEndpoint.group === 'legacy' ||
        selectedEndpoint.id === 'messages'
      ) {
        body.messages = text
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
        delete body.text
      } else {
        body.text = text
        delete body.messages
      }
      setRequestBody(JSON.stringify(body, null, 2))
    } catch {
      const body =
        selectedEndpoint.group === 'legacy' ||
        selectedEndpoint.id === 'messages'
          ? { messages: text ? [text] : [] }
          : { text }
      setRequestBody(JSON.stringify(body, null, 2))
    }
  }

  const handleRequestBodyChange = (bodyText: string) => {
    setRequestBody(bodyText)

    try {
      if (!bodyText.trim()) {
        setMessageText('')
        return
      }

      const parsed = JSON.parse(bodyText)
      if (isRequestBodyObject(parsed)) {
        setMessageText(extractMessageText(selectedEndpoint, parsed))
      } else {
        setMessageText('')
      }
    } catch {
      // Keep the current message text while the JSON is invalid.
    }
  }

  const handleSubmit = async () => {
    if (selectedEndpoint.requiresClientId !== false && !clientId.trim()) {
      setResponseText(t('ApiConsole.clientIdRequired'))
      return
    }

    if (selectedEndpoint.requiresPresentationId && !presentationId.trim()) {
      setResponseText(t('ApiConsole.presentationIdRequired'))
      return
    }

    if (selectedEndpoint.requiresApiKey && !apiKey.trim()) {
      setResponseText(t('ApiConsole.apiKeyRequired'))
      return
    }

    setIsSending(true)
    setResponseText('')

    try {
      const body = parseBody()
      const res = await fetch(buildUrl(), {
        method: selectedEndpoint.method,
        headers: {
          ...(selectedEndpoint.method !== 'GET'
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...(selectedEndpoint.requiresApiKey
            ? { Authorization: `Bearer ${apiKey.trim()}` }
            : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })

      const contentType = res.headers.get('content-type') || ''
      const payload = contentType.includes('application/json')
        ? await res.json()
        : await res.text()

      setResponseText(
        JSON.stringify(
          {
            status: res.status,
            ok: res.ok,
            body: payload,
          },
          null,
          2
        )
      )
    } catch (error) {
      setResponseText(
        JSON.stringify(
          {
            error: error instanceof Error ? error.message : String(error),
          },
          null,
          2
        )
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-theme text-theme-default">
      <header className="border-b border-primary/20 bg-base-dark text-theme">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 md:px-8">
          <div className="flex flex-col gap-4">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-bold uppercase text-theme">
                <CommandLineIcon className="h-4 w-4" aria-hidden="true" />
                External API
              </div>
              <h1 className="text-3xl font-bold tracking-normal md:text-4xl">
                {t('ApiConsole.title')}
              </h1>
              <p className="mt-2 text-sm leading-6 text-theme opacity-80 md:text-base">
                {t('ApiConsole.description')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 md:px-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-5 lg:self-start">
          <nav className="theme-surface-popover overflow-hidden rounded-lg border shadow-sm">
            <div className="border-b border-primary/15">
              <button
                type="button"
                onClick={() => setEndpointsOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left lg:cursor-default"
                aria-expanded={endpointsOpen}
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-bold">
                  <ServerStackIcon className="h-5 w-5 shrink-0 text-primary" />
                  <span>Endpoints</span>
                  <span className="min-w-0 truncate rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary lg:hidden">
                    {selectedEndpoint.method} {selectedEndpoint.label}
                  </span>
                </span>
                <ChevronDownIcon
                  className={`h-5 w-5 shrink-0 text-primary transition lg:hidden ${
                    endpointsOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>
            <div className={`${endpointsOpen ? 'block' : 'hidden'} lg:block`}>
              {(['v1', 'presentation', 'legacy'] as const).map((group) => (
                <div
                  key={group}
                  className="border-b border-primary/10 p-3 last:border-b-0"
                >
                  <div className="mb-2 text-xs font-bold uppercase text-primary">
                    {group === 'v1'
                      ? t('ApiConsole.v1Endpoints')
                      : group === 'presentation'
                        ? t('ApiConsole.presentationEndpoints')
                        : t('ApiConsole.legacyEndpoints')}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {endpoints
                      .filter((endpoint) => endpoint.group === group)
                      .map((endpoint) => (
                        <button
                          key={endpoint.id}
                          type="button"
                          onClick={() => handleEndpointChange(endpoint)}
                          className={`group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                            selectedId === endpoint.id
                              ? 'border-primary bg-primary text-theme shadow-sm'
                              : 'border-transparent bg-transparent text-theme-default hover:border-primary/30 hover:bg-primary/10'
                          }`}
                        >
                          <span
                            className={`inline-flex w-12 justify-center rounded-md px-2 py-1 text-[11px] font-bold ${
                              endpoint.method === 'GET'
                                ? selectedId === endpoint.id
                                  ? 'bg-secondary/20 text-theme'
                                  : 'bg-secondary/10 text-secondary'
                                : selectedId === endpoint.id
                                  ? 'bg-secondary/20 text-theme'
                                  : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {endpoint.method}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-bold">
                            {endpoint.label}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </aside>

        <div className="grid min-w-0 gap-5">
          <section className="theme-surface-popover grid gap-3 rounded-lg border p-4 shadow-sm md:grid-cols-2">
            {selectedEndpoint.requiresClientId !== false && (
              <label className="flex flex-col gap-2 text-sm font-bold">
                <span className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-primary" />
                  {t('ClientID')}
                </span>
                <input
                  type="text"
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  className="theme-surface-control h-11 rounded-lg border px-3 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            )}
            {selectedEndpoint.requiresApiKey && (
              <label
                className={`flex flex-col gap-2 text-sm font-bold ${
                  selectedEndpoint.requiresClientId === false
                    ? 'md:col-span-2'
                    : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  <KeyIcon className="h-5 w-5 text-primary" />
                  {t('ApiConsole.apiKey')}
                </span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  className="theme-surface-control h-11 rounded-lg border px-3 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder={t('ApiConsole.apiKeyPlaceholder')}
                />
              </label>
            )}
            {selectedEndpoint.requiresPresentationId && (
              <label className="flex flex-col gap-2 text-sm font-bold">
                <span>Presentation ID</span>
                <input
                  type="text"
                  value={presentationId}
                  onChange={(event) =>
                    handlePresentationIdChange(event.target.value)
                  }
                  className="theme-surface-control h-11 rounded-lg border px-3 font-mono font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="morning-show-2026-07-14"
                />
              </label>
            )}
            {selectedEndpoint.supportsRevisionQuery && (
              <label className="flex flex-col gap-2 text-sm font-bold">
                <span>Revision（任意）</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={presentationRevision}
                  onChange={(event) =>
                    setPresentationRevision(event.target.value)
                  }
                  className="theme-surface-control h-11 rounded-lg border px-3 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="1"
                />
              </label>
            )}
          </section>

          <section className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <div className="theme-surface-popover min-w-0 rounded-lg border shadow-sm">
              <div className="border-b border-primary/15 p-4">
                <div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-theme">
                        {selectedEndpoint.method}
                      </span>
                      <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        {selectedEndpoint.requiresApiKey
                          ? 'API Key'
                          : 'No Auth'}
                      </span>
                      <h2 className="text-xl font-bold text-theme-default">
                        {selectedEndpoint.label}
                      </h2>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-text-primary">
                      {selectedEndpoint.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid min-w-0 gap-4 p-4">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-text-primary">
                    <BoltIcon className="h-5 w-5 text-primary" />
                    Endpoint URL
                  </div>
                  <div className="min-w-0 overflow-auto rounded-lg bg-base-dark px-3 py-3 font-mono text-xs text-theme">
                    {buildUrl().toString()}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-text-primary">
                    <CodeBracketSquareIcon className="h-5 w-5 text-primary" />
                    Parameters
                  </div>
                  <div className="overflow-hidden rounded-lg border border-primary/20">
                    {selectedEndpoint.fields.map((field) => (
                      <div
                        key={field.name}
                        className="grid gap-2 border-b border-primary/10 p-3 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)]"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-bold text-primary">
                              {field.name}
                            </code>
                            {field.required && (
                              <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-bold text-secondary">
                                required
                              </span>
                            )}
                          </div>
                          <div className="mt-1 font-mono text-xs text-text-primary">
                            {field.type}
                          </div>
                        </div>
                        <p className="min-w-0 text-sm leading-6 text-theme-default">
                          {field.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedEndpoint.method !== 'GET' && (
                  <div className="grid min-w-0 gap-3">
                    {selectedEndpoint.id === 'chat' && (
                      <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm leading-6 text-theme-default">
                        <div className="mb-1 font-bold text-theme-default">
                          mode
                        </div>
                        <div>
                          <code className="rounded bg-base-light px-1.5 py-0.5 font-mono text-xs text-primary">
                            user_input
                          </code>
                          :
                          画面下の入力欄から送ったのと同じ扱いです。現在のキャラクター設定、チャット履歴、通常の送信フローを使います。
                        </div>
                        <div>
                          <code className="rounded bg-base-light px-1.5 py-0.5 font-mono text-xs text-primary">
                            ai_generate
                          </code>
                          : 外部API側でAI生成を明示する互換モードです。
                          <code className="mx-1 rounded bg-base-light px-1.5 py-0.5 font-mono text-xs text-primary">
                            systemPrompt
                          </code>
                          や
                          <code className="mx-1 rounded bg-base-light px-1.5 py-0.5 font-mono text-xs text-primary">
                            useCurrentSystemPrompt
                          </code>
                          を指定でき、
                          <code className="mx-1 rounded bg-base-light px-1.5 py-0.5 font-mono text-xs text-primary">
                            type=ai_generate
                          </code>
                          としてAI生成に渡します。
                        </div>
                      </div>
                    )}
                    {(selectedEndpoint.id === 'messages' ||
                      selectedEndpoint.id === 'speak' ||
                      selectedEndpoint.id === 'chat' ||
                      selectedEndpoint.id.startsWith('legacy_')) && (
                      <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-text-primary">
                        <span className="flex items-center gap-2">
                          <PaperAirplaneIcon className="h-5 w-5 text-primary" />
                          Message
                        </span>
                        <textarea
                          value={messageText}
                          onChange={(event) =>
                            handleMessageTextChange(event.target.value)
                          }
                          className="theme-surface-control min-h-[120px] w-full min-w-0 rounded-lg border p-3 text-sm font-normal leading-6 text-theme-default outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          spellCheck={false}
                        />
                      </label>
                    )}
                    <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-text-primary">
                      <span className="flex items-center gap-2">
                        <CodeBracketSquareIcon className="h-5 w-5 text-primary" />
                        {t('ApiConsole.requestBody')}
                      </span>
                      <textarea
                        value={requestBody}
                        onChange={(event) =>
                          handleRequestBodyChange(event.target.value)
                        }
                        className="theme-surface-control min-h-[260px] w-full min-w-0 rounded-lg border p-3 font-mono text-sm font-normal leading-6 text-theme-default outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        spellCheck={false}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="grid min-w-0 content-start gap-5">
              <div className="theme-surface-popover min-w-0 rounded-lg border shadow-sm">
                <div className="flex flex-col gap-3 border-b border-primary/15 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-theme-default">
                      <CommandLineIcon className="h-5 w-5 text-primary" />
                      実行コード
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-1 rounded-lg bg-primary/10 p-1">
                    {codeSampleTabs.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => setSelectedSample(sample.id)}
                        className={`rounded-md px-3 py-1.5 text-sm font-bold transition ${
                          selectedSample === sample.id
                            ? 'bg-primary text-theme shadow-sm'
                            : 'text-text-primary hover:text-primary'
                        }`}
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid min-w-0 gap-4 p-4">
                  <div className="relative min-w-0">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(getSelectedCodeSample())}
                      aria-label="コードをコピー"
                      title="コードをコピー"
                      className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-primary/20 bg-primary/20 text-theme transition hover:bg-primary/30"
                    >
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    </button>
                    {copyStatus && (
                      <span className="absolute right-12 top-2 z-10 inline-flex h-8 items-center gap-1 rounded-md bg-secondary/20 px-2 text-xs font-bold text-theme">
                        <CheckCircleIcon className="h-4 w-4" />
                        {copyStatus}
                      </span>
                    )}
                    <pre className="max-h-64 min-w-0 overflow-auto rounded-lg bg-base-dark p-3 pr-12 text-xs leading-5 text-theme">
                      <code>{getSelectedCodeSample()}</code>
                    </pre>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSending}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-theme transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSending ? (
                      <BoltIcon className="h-5 w-5 animate-pulse" />
                    ) : (
                      <PlayIcon className="h-5 w-5" />
                    )}
                    {isSending ? t('ApiConsole.sending') : t('ApiConsole.send')}
                  </button>
                </div>
              </div>

              <div className="theme-surface-popover min-w-0 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between border-b border-primary/15 px-4 py-3">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-theme-default">
                    <PaperAirplaneIcon className="h-5 w-5 text-primary" />
                    {t('ApiConsole.response')}
                  </h2>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    JSON
                  </span>
                </div>
                <div className="p-4">
                  <pre className="min-h-[220px] overflow-auto rounded-lg bg-base-dark p-4 text-sm leading-6 text-theme">
                    <code>{responseText || t('ApiConsole.noResponse')}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default SendMessage
