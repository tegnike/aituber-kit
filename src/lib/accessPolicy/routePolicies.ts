/**
 * 全APIルートのアクセスポリシー宣言テーブル（単一の真実の源）
 *
 * 設計ドキュメント: docs/access-policy-design.md §5
 *
 * - src/pages/api 配下の全ルートがここに登録されていることを
 *   静的テスト（apiRouteStaticChecks.test.ts）が保証する
 * - WAF 生成スクリプト（scripts/waf/generate-waf-rules.mjs）が
 *   Node の type stripping で直接 import するため、このファイルは
 *   `import type` 以外の import・パスエイリアス・enum を使用しないこと
 */

import type { RoutePolicy } from './types'

export const routePolicies = {
  '/api/ai/audio': {
    path: '/api/ai/audio',
    featureName: 'ai/audio',
    methods: ['POST'],
    resources: ['server-secret'],
    secret: {
      kind: 'pairs',
      pairs: [
        {
          source: 'body',
          key: 'apiKey',
          envVars: ['OPENAI_KEY', 'OPENAI_API_KEY'],
        },
      ],
    },
    restrictedBehavior: 'none',
    waf: { embedAllowed: true },
  },
  '/api/ai/realtime-client-secret': {
    path: '/api/ai/realtime-client-secret',
    featureName: 'ai/realtime-client-secret',
    methods: ['POST'],
    resources: ['server-secret'],
    secret: {
      kind: 'pairs',
      pairs: [
        {
          source: 'body',
          key: 'apiKey',
          envVars: ['OPENAI_KEY', 'OPENAI_API_KEY'],
        },
      ],
    },
    restrictedBehavior: 'none',
    waf: { embedAllowed: true },
  },
  '/api/ai/custom': {
    path: '/api/ai/custom',
    featureName: 'ai/custom',
    methods: ['POST'],
    resources: ['server-secret', 'server-url'],
    // S18検討済み・dynamicのまま維持: usesServerSecretはクライアント値の
    // 有無を問わずenv(CUSTOM_API_URL/HEADERS/BODY)の存在だけで決まる
    // （env優先で上書きマージするため）。SecretPairは
    // 「クライアント値が無い場合に限りenvを見る」という形しか表現できず、
    // この「envが常に優先」という逆方向の解決順は表現不可能。
    secret: { kind: 'dynamic' },
    restrictedBehavior: 'none',
    waf: { challenge: true, embedAllowed: true },
  },
  '/api/ai/vercel': {
    path: '/api/ai/vercel',
    featureName: 'ai/vercel',
    methods: ['POST'],
    resources: ['server-secret', 'server-url'],
    // サービス名から `${SERVICE}_KEY` / `${SERVICE}_API_KEY` を動的合成
    secret: { kind: 'dynamic' },
    restrictedBehavior: 'none',
    waf: { embedAllowed: true },
  },
  '/api/azureOpenAITTS': {
    path: '/api/azureOpenAITTS',
    featureName: 'azureOpenAITTS',
    methods: ['POST'],
    resources: ['server-secret'],
    secret: {
      kind: 'pairs',
      pairs: [
        { source: 'body', key: 'apiKey', envVars: ['AZURE_TTS_KEY'] },
        { source: 'body', key: 'endpoint', envVars: ['AZURE_TTS_ENDPOINT'] },
      ],
    },
    restrictedBehavior: 'none',
  },
  '/api/cartesia': {
    path: '/api/cartesia',
    featureName: 'cartesia',
    methods: ['POST'],
    resources: ['server-secret'],
    secret: {
      kind: 'pairs',
      pairs: [
        { source: 'body', key: 'apiKey', envVars: ['CARTESIA_API_KEY'] },
        { source: 'body', key: 'voiceId', envVars: ['CARTESIA_VOICE_ID'] },
      ],
    },
    restrictedBehavior: 'none',
  },
  '/api/convertMarkdown': {
    path: '/api/convertMarkdown',
    featureName: 'convertMarkdown',
    methods: ['POST'],
    resources: ['fs-read'],
    secret: { kind: 'none' },
    // 制限モード時は assetManifest からレンダリング済みデータを返す
    restrictedBehavior: 'in-route',
  },
  '/api/convertSlide': {
    path: '/api/convertSlide',
    featureName: 'convertSlide',
    restrictedFeatureName: 'convert-slide',
    methods: ['POST'],
    resources: ['fs-write', 'client-proxy'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
  },
  '/api/delete-image': {
    path: '/api/delete-image',
    featureName: 'delete-image',
    methods: ['DELETE'],
    resources: ['fs-write'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
  },
  '/api/difyChat': {
    path: '/api/difyChat',
    featureName: 'difyChat',
    methods: ['POST'],
    resources: ['server-secret', 'server-url'],
    // S18: onlyIfAbsent（url未指定時のみ評価）でapiKey/urlの条件結合を宣言的に表現
    secret: {
      kind: 'pairs',
      pairs: [
        {
          source: 'body',
          key: 'apiKey',
          envVars: ['DIFY_KEY', 'DIFY_API_KEY'],
          onlyIfAbsent: { source: 'body', key: 'url' },
        },
        { source: 'body', key: 'url', envVars: ['DIFY_URL'] },
      ],
    },
    restrictedBehavior: 'none',
  },
  '/api/elevenLabs': {
    path: '/api/elevenLabs',
    featureName: 'elevenLabs',
    methods: ['POST'],
    resources: ['server-secret'],
    secret: {
      kind: 'pairs',
      pairs: [
        { source: 'body', key: 'apiKey', envVars: ['ELEVENLABS_API_KEY'] },
        { source: 'body', key: 'voiceId', envVars: ['ELEVENLABS_VOICE_ID'] },
      ],
    },
    restrictedBehavior: 'none',
  },
  '/api/embedding': {
    path: '/api/embedding',
    featureName: 'embedding',
    methods: ['POST'],
    resources: ['server-secret'],
    secret: {
      kind: 'pairs',
      pairs: [
        {
          source: 'body',
          key: 'apiKey',
          envVars: ['OPENAI_EMBEDDING_KEY', 'OPENAI_API_KEY'],
        },
      ],
    },
    restrictedBehavior: 'none',
  },
  '/api/get-background-list': {
    path: '/api/get-background-list',
    featureName: 'get-background-list',
    methods: ['GET'],
    resources: ['fs-read'],
    secret: { kind: 'none' },
    restrictedBehavior: 'in-route',
  },
  '/api/get-image-list': {
    path: '/api/get-image-list',
    featureName: 'get-image-list',
    methods: ['GET'],
    resources: ['fs-read'],
    secret: { kind: 'none' },
    restrictedBehavior: 'in-route',
  },
  '/api/get-live2d-list': {
    path: '/api/get-live2d-list',
    featureName: 'get-live2d-list',
    methods: ['GET'],
    resources: ['fs-read'],
    secret: { kind: 'none' },
    restrictedBehavior: 'in-route',
  },
  '/api/get-pngtuber-list': {
    path: '/api/get-pngtuber-list',
    featureName: 'get-pngtuber-list',
    methods: ['GET'],
    resources: ['fs-read'],
    secret: { kind: 'none' },
    restrictedBehavior: 'in-route',
  },
  '/api/get-pose-list': {
    path: '/api/get-pose-list',
    featureName: 'get-pose-list',
    methods: ['GET'],
    resources: ['fs-read'],
    secret: { kind: 'none' },
    restrictedBehavior: 'in-route',
  },
  '/api/get-vrm-list': {
    path: '/api/get-vrm-list',
    featureName: 'get-vrm-list',
    methods: ['GET'],
    resources: ['fs-read'],
    secret: { kind: 'none' },
    restrictedBehavior: 'in-route',
  },
  '/api/getSlideFolders': {
    path: '/api/getSlideFolders',
    featureName: 'getSlideFolders',
    methods: ['GET'],
    resources: ['fs-read'],
    secret: { kind: 'none' },
    restrictedBehavior: 'in-route',
  },
  '/api/getSupplement': {
    path: '/api/getSupplement',
    featureName: 'getSupplement',
    methods: ['GET'],
    resources: ['fs-read'],
    secret: { kind: 'none' },
    restrictedBehavior: 'in-route',
  },
  '/api/memory-files': {
    path: '/api/memory-files',
    featureName: 'memory-files',
    methods: ['GET'],
    resources: ['fs-read'],
    secret: { kind: 'none' },
    // 制限モード時は { files: [] } を返す
    restrictedBehavior: 'in-route',
  },
  '/api/memory-restore': {
    path: '/api/memory-restore',
    featureName: 'memory-restore',
    methods: ['POST'],
    resources: ['fs-read'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
  },
  '/api/messages': {
    path: '/api/messages',
    featureName: 'messages',
    methods: ['GET', 'POST'],
    // legacy無認証キュー。将来 requireApiKey 配下への統合候補（設計 §5 注）
    resources: ['external-control'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
  },
  '/api/openAITTS': {
    path: '/api/openAITTS',
    featureName: 'openAITTS',
    methods: ['POST'],
    resources: ['server-secret'],
    secret: {
      kind: 'pairs',
      pairs: [
        {
          source: 'body',
          key: 'apiKey',
          envVars: ['OPENAI_TTS_KEY', 'OPENAI_API_KEY'],
        },
      ],
    },
    restrictedBehavior: 'none',
  },
  '/api/save-chat-log': {
    path: '/api/save-chat-log',
    featureName: 'save-chat-log',
    methods: ['POST'],
    resources: ['fs-write', 'server-secret'],
    secret: { kind: 'always' },
    restrictedBehavior: 'deny',
    waf: { embedAllowed: true },
  },
  '/api/stylebertvits2': {
    path: '/api/stylebertvits2',
    featureName: 'stylebertvits2',
    methods: ['POST'],
    resources: ['server-secret', 'server-url'],
    // S18検討済み・dynamicのまま維持: serverUrl/apiKeyのenv使用条件自体は
    // onlyIfAbsentで pairs 化できるが、本ルートはRunPod例外を含む独自の
    // URL解決（isAllowedConfiguredOrListedUrl呼び出し）をルート内で行っており
    // serverUrlPolicy宣言を持たない。そのため usesServerSecret には
    // isProtectedServerResource（URL検証結果）もORされる必要があるが、
    // withAccessPolicy の pairs 分岐はこの値を resolvedServerUrl 経由でしか
    // 合成できず、resolvedServerUrl は serverUrl 宣言がないと計算されない。
    // pairs化するとこのOR項が失われ挙動が変わる（既存テスト
    // 「guards client-provided local Style-Bert-VITS2 URLs by default」が
    // 検証している境界）ため、dynamicのまま維持する。
    secret: { kind: 'dynamic' },
    restrictedBehavior: 'none',
  },
  '/api/tts-aivis-cloud-api': {
    path: '/api/tts-aivis-cloud-api',
    featureName: 'tts-aivis-cloud-api',
    methods: ['POST'],
    resources: ['server-secret'],
    secret: {
      kind: 'pairs',
      pairs: [
        { source: 'body', key: 'apiKey', envVars: ['AIVIS_CLOUD_API_KEY'] },
      ],
    },
    restrictedBehavior: 'none',
    waf: { challenge: true, embedAllowed: true },
  },
  '/api/tts-aivisspeech': {
    path: '/api/tts-aivisspeech',
    featureName: 'tts-aivisspeech',
    methods: ['POST'],
    resources: ['server-secret', 'server-url'],
    secret: {
      kind: 'pairs',
      pairs: [
        {
          source: 'body',
          key: 'serverUrl',
          envVars: ['AIVIS_SPEECH_SERVER_URL'],
        },
      ],
    },
    serverUrl: {
      source: 'body',
      key: 'serverUrl',
      envVar: 'AIVIS_SPEECH_SERVER_URL',
      defaultUrl: 'http://localhost:10101',
      allowLocalLoopback: true,
    },
    restrictedBehavior: 'none',
  },
  '/api/tts-google': {
    path: '/api/tts-google',
    featureName: 'tts-google',
    methods: ['POST'],
    resources: ['server-secret'],
    secret: { kind: 'always' },
    restrictedBehavior: 'none',
  },
  '/api/tts-gsvi': {
    path: '/api/tts-gsvi',
    featureName: 'tts-gsvi',
    methods: ['POST'],
    resources: ['server-secret', 'server-url'],
    secret: {
      kind: 'pairs',
      pairs: [{ source: 'body', key: 'serverUrl', envVars: ['GSVI_TTS_URL'] }],
    },
    serverUrl: {
      source: 'body',
      key: 'serverUrl',
      envVar: 'GSVI_TTS_URL',
      defaultUrl: 'http://127.0.0.1:5000/tts',
      allowLocalLoopback: true,
    },
    restrictedBehavior: 'none',
  },
  '/api/tts-koeiromap': {
    path: '/api/tts-koeiromap',
    featureName: 'tts-koeiromap',
    methods: ['POST'],
    // クライアント持ち込みキーの中継のみ（サーバー秘匿リソース不使用）
    resources: ['client-proxy'],
    secret: { kind: 'none' },
    restrictedBehavior: 'none',
  },
  '/api/tts-voicevox': {
    path: '/api/tts-voicevox',
    featureName: 'tts-voicevox',
    methods: ['POST'],
    resources: ['server-secret', 'server-url'],
    secret: {
      kind: 'pairs',
      pairs: [
        { source: 'body', key: 'serverUrl', envVars: ['VOICEVOX_SERVER_URL'] },
      ],
    },
    serverUrl: {
      source: 'body',
      key: 'serverUrl',
      envVar: 'VOICEVOX_SERVER_URL',
      defaultUrl: 'http://localhost:50021',
      allowLocalLoopback: true,
    },
    restrictedBehavior: 'none',
  },
  '/api/update-aivis-speakers': {
    path: '/api/update-aivis-speakers',
    featureName: 'update-aivis-speakers',
    methods: ['POST'],
    resources: ['fs-write', 'server-secret', 'server-url'],
    secret: { kind: 'always' },
    serverUrl: {
      source: 'query',
      key: 'serverUrl',
      envVar: 'AIVIS_SPEECH_SERVER_URL',
      defaultUrl: 'http://127.0.0.1:10101',
      allowLocalLoopback: true,
    },
    restrictedBehavior: 'deny',
  },
  '/api/update-pose-rotation': {
    path: '/api/update-pose-rotation',
    featureName: 'update-pose-rotation',
    methods: ['POST'],
    resources: ['fs-write'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
  },
  '/api/update-voicevox-speakers': {
    path: '/api/update-voicevox-speakers',
    featureName: 'update-voicevox-speakers',
    methods: ['POST'],
    resources: ['fs-write', 'server-secret', 'server-url'],
    secret: { kind: 'always' },
    serverUrl: {
      source: 'query',
      key: 'serverUrl',
      envVar: 'VOICEVOX_SERVER_URL',
      defaultUrl: 'http://localhost:50021',
      allowLocalLoopback: true,
    },
    restrictedBehavior: 'deny',
  },
  '/api/updateSlideData': {
    path: '/api/updateSlideData',
    featureName: 'updateSlideData',
    restrictedFeatureName: 'update-slide-data',
    methods: ['POST'],
    resources: ['fs-write'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
  },
  '/api/upload-background': {
    path: '/api/upload-background',
    featureName: 'upload-background',
    methods: ['POST'],
    resources: ['fs-write'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
  },
  '/api/upload-image': {
    path: '/api/upload-image',
    featureName: 'upload-image',
    methods: ['POST'],
    resources: ['fs-write'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
  },
  '/api/upload-vrm-list': {
    path: '/api/upload-vrm-list',
    featureName: 'upload-vrm-list',
    methods: ['POST'],
    resources: ['fs-write'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
  },
  '/api/whisper': {
    path: '/api/whisper',
    featureName: 'whisper',
    methods: ['POST'],
    resources: ['server-secret'],
    // bodyParser: false（multipart手動パース後でないとキーが得られない）
    secret: { kind: 'dynamic' },
    restrictedBehavior: 'none',
  },
  '/api/youtube/continuation': {
    path: '/api/youtube/continuation',
    featureName: 'youtube/continuation',
    methods: ['POST'],
    resources: ['server-secret', 'server-url'],
    secret: { kind: 'dynamic' },
    restrictedBehavior: 'none',
  },
  '/api/v1/chat': {
    path: '/api/v1/chat',
    featureName: 'v1/chat',
    methods: ['POST'],
    resources: ['external-control'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/chat/callback': {
    path: '/api/v1/chat/callback',
    featureName: 'v1/chat/callback',
    methods: ['POST'],
    resources: ['external-control', 'server-url'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/events': {
    path: '/api/v1/events',
    featureName: 'v1/events',
    methods: ['GET'],
    resources: ['external-control'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/messages': {
    path: '/api/v1/messages',
    featureName: 'v1/messages',
    methods: ['POST'],
    resources: ['external-control'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/speak': {
    path: '/api/v1/speak',
    featureName: 'v1/speak',
    methods: ['POST'],
    resources: ['external-control'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/status': {
    path: '/api/v1/status',
    featureName: 'v1/status',
    methods: ['GET'],
    resources: ['external-control'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/stop': {
    path: '/api/v1/stop',
    featureName: 'v1/stop',
    methods: ['POST'],
    resources: ['external-control'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/client/commands': {
    path: '/api/v1/client/commands',
    featureName: 'v1/client/commands',
    methods: ['GET'],
    resources: ['external-control'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/client/messages': {
    path: '/api/v1/client/messages',
    featureName: 'v1/client/messages',
    methods: ['GET'],
    resources: ['external-control'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/client/status': {
    path: '/api/v1/client/status',
    featureName: 'v1/client/status',
    methods: ['POST'],
    resources: ['external-control', 'fs-read'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/client/speech-status': {
    path: '/api/v1/client/speech-status',
    featureName: 'v1/client/speech-status',
    methods: ['POST'],
    resources: ['external-control'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/receivers': {
    path: '/api/v1/receivers',
    featureName: 'v1/receivers',
    methods: ['GET'],
    resources: ['external-control'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/presentations/[presentationId]': {
    path: '/api/v1/presentations/[presentationId]',
    featureName: 'v1/presentations',
    methods: ['GET', 'PUT'],
    resources: ['external-control'],
    resourcesByMethod: {
      GET: ['fs-read'],
      PUT: ['fs-read', 'fs-write'],
    },
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/presentations/[presentationId]/activate': {
    path: '/api/v1/presentations/[presentationId]/activate',
    featureName: 'v1/presentations/activate',
    methods: ['POST'],
    resources: ['external-control', 'fs-read', 'fs-write'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/presentation/control': {
    path: '/api/v1/presentation/control',
    featureName: 'v1/presentation/control',
    methods: ['POST'],
    resources: ['external-control', 'fs-read', 'fs-write'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
  '/api/v1/presentation/status': {
    path: '/api/v1/presentation/status',
    featureName: 'v1/presentation/status',
    methods: ['GET'],
    resources: ['external-control', 'fs-read'],
    secret: { kind: 'none' },
    restrictedBehavior: 'deny',
    requiresApiKey: true,
  },
} satisfies Record<string, RoutePolicy>

export type KnownApiPath = keyof typeof routePolicies
