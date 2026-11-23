import { expect } from '@playwright/test'
import type { ConsoleMessage, Page, Request, Route } from '@playwright/test'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
type PersistedValue = JsonPrimitive
type PersistedSettings = Record<string, unknown>
type PersistedHome = {
  chatLog?: unknown[]
  showIntroduction?: boolean
  userOnboarded?: boolean
} & Record<string, unknown>
type PersistedSlide = {
  selectedSlideDocs?: string
} & Record<string, unknown>

export const storageKeys = {
  settings: 'aitube-kit-settings',
  home: 'aitube-kit-home',
  slide: 'aitube-kit-slide',
} as const

const defaultSettingsState: PersistedSettings = {
  selectLanguage: 'en',
  showControlPanel: true,
  modelType: 'pngtuber',
  selectAIService: 'openai',
  selectAIModel: 'gpt-4o',
  enableMultiModal: true,
  youtubeMode: false,
  youtubePlaying: false,
  slideMode: false,
  youtubeCommentSource: 'youtube-api',
  youtubeApiKey: '',
  youtubeLiveId: '',
  onecommePort: 11180,
  youtubeCommentInterval: 10,
  gameCommentaryEnabled: false,
  gameCommentaryPlaying: false,
  gameCommentaryCaptureInterval: 5,
  gameCommentaryContextCount: 5,
  gameCommentaryPromptTemplate: '',
  gameCommentaryBackgroundAnalysisPromptTemplate: '',
  gameCommentaryImageQuality: 0.7,
  gameCommentaryResizeWidth: 1024,
  gameCommentarySaveToChat: true,
  gameCommentaryBackgroundAnalysisEnabled: false,
  gameCommentaryBackgroundAnalysisInterval: 2,
}

const defaultHomeState: PersistedHome = {
  chatLog: [],
  showIntroduction: false,
}

const defaultSlideState: PersistedSlide = {
  selectedSlideDocs: '',
}

type StoreSeed<T extends Record<string, unknown>> = {
  state?: T
  version?: number
}

export type PrepareAppOptions = {
  settings?: PersistedSettings
  home?: PersistedHome
  slide?: PersistedSlide
  settingsVersion?: number
  homeVersion?: number
  slideVersion?: number
  network?: boolean | TestNetworkOptions
}

export type ConsoleEntry = {
  type: string
  text: string
  location: {
    url: string
    lineNumber: number
    columnNumber: number
  }
}

export type RequestFailureEntry = {
  url: string
  method: string
  resourceType: string
  failureText: string
}

export type NetworkRequestEntry = {
  url: string
  method: string
  pathname: string
  resourceType: string
  postData: string | null
  postDataJSON: unknown
}

export type NetworkDiagnostics = {
  apiRequests: NetworkRequestEntry[]
  externalRequests: NetworkRequestEntry[]
  unhandledApiRequests: NetworkRequestEntry[]
}

export type PageDiagnostics = {
  console: ConsoleEntry[]
  pageErrors: string[]
  requestFailures: RequestFailureEntry[]
  dispose: () => void
}

type NetworkMockResponseInit = {
  status?: number
  contentType?: string
  body?: string | Buffer
  json?: JsonValue
  headers?: Record<string, string>
}

type NetworkMockResponse =
  | NetworkMockResponseInit
  | ((
      request: Request
    ) => NetworkMockResponseInit | Promise<NetworkMockResponseInit>)

export type TestNetworkOptions = {
  apiMocks?: Record<string, NetworkMockResponse>
  blockExternal?: boolean
  mockUnhandledApi?: boolean | NetworkMockResponseInit
  diagnostics?: NetworkDiagnostics
}

const emptyAudioBody = Buffer.alloc(0)

const defaultHarmlessApiMocks: Record<string, NetworkMockResponse> = {
  '/api/save-chat-log': { json: { ok: true } },
  '/api/embedding': { json: { embedding: Array(1536).fill(0) } },
  '/api/get-pngtuber-list': {
    json: [
      {
        path: '/pngtuber/nike01',
        name: 'nike01',
        videoFile: 'loop_mouthless_h264.mp4',
        mouthTrack: 'mouth_track.json',
        mouthSprites: {
          closed: 'closed.png',
          open: 'open.png',
          half: 'half.png',
          e: 'e.png',
          u: 'u.png',
        },
      },
    ],
  },
  '/api/youtube/continuation': { json: { text: '', shouldContinue: false } },
  '/api/ai/vercel': createAIChatMockResponse,
  '/api/ai/custom': createAIChatMockResponse,
  '/api/difyChat': createDifyMockResponse,
  '/api/whisper': { json: { text: '' } },
  '/api/openAITTS': { contentType: 'audio/wav', body: emptyAudioBody },
  '/api/azureOpenAITTS': { contentType: 'audio/wav', body: emptyAudioBody },
  '/api/tts-google': { contentType: 'audio/wav', body: emptyAudioBody },
  '/api/tts-voicevox': { contentType: 'audio/wav', body: emptyAudioBody },
  '/api/tts-aivisspeech': { contentType: 'audio/wav', body: emptyAudioBody },
  '/api/tts-aivis-cloud-api': {
    contentType: 'audio/wav',
    body: emptyAudioBody,
  },
  '/api/tts-koeiromap': { contentType: 'audio/wav', body: emptyAudioBody },
  '/api/stylebertvits2': { contentType: 'audio/wav', body: emptyAudioBody },
  '/api/elevenLabs': { contentType: 'audio/wav', body: emptyAudioBody },
  '/api/cartesia': { contentType: 'audio/wav', body: emptyAudioBody },
  '/api/tts-waffle': { contentType: 'audio/wav', body: emptyAudioBody },
  '/api/waffle-voices': { json: { voices: [] } },
}

const unhandledApiMock: NetworkMockResponseInit = {
  status: 501,
  json: {
    error: 'Unhandled E2E API mock',
    errorCode: 'UnhandledE2EApiMock',
  },
}

export async function prepareApp(page: Page, options: PrepareAppOptions = {}) {
  if (options.network) {
    await setupTestNetwork(
      page,
      options.network === true ? undefined : options.network
    )
  }

  await initializeLocalStorage(page, {
    state: {
      ...defaultSettingsState,
      ...options.settings,
    },
    version: options.settingsVersion,
  })

  await initializeHomeStorage(page, {
    state: {
      ...defaultHomeState,
      ...options.home,
    },
    version: options.homeVersion,
  })

  await initializeSlideStorage(page, {
    state: {
      ...defaultSlideState,
      ...options.slide,
    },
    version: options.slideVersion,
  })

  await mockBrowserAPIs(page)
}

export async function initializeLocalStorage(
  page: Page,
  seed: StoreSeed<PersistedSettings> = {}
) {
  await page.addInitScript(
    ({ storageKey, seed }) => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          state: seed.state ?? {},
          version: seed.version ?? 0,
        })
      )
    },
    { storageKey: storageKeys.settings, seed }
  )
}

export async function initializeHomeStorage(
  page: Page,
  seed: StoreSeed<PersistedHome> = {}
) {
  await page.addInitScript(
    ({ storageKey, seed }) => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          state: seed.state ?? {},
          version: seed.version ?? 0,
        })
      )
    },
    { storageKey: storageKeys.home, seed }
  )
}

export async function initializeSlideStorage(
  page: Page,
  seed: StoreSeed<PersistedSlide> = {}
) {
  await page.addInitScript(
    ({ storageKey, seed }) => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          state: seed.state ?? {},
          version: seed.version ?? 0,
        })
      )
    },
    { storageKey: storageKeys.slide, seed }
  )
}

export async function mockBrowserAPIs(page: Page) {
  await page.addInitScript(() => {
    const disableNextPortalPointerEvents = () => {
      const style = document.createElement('style')
      style.textContent = 'nextjs-portal{pointer-events:none!important;}'
      document.head.appendChild(style)
    }

    if (document.head) {
      disableNextPortalPointerEvents()
    } else {
      document.addEventListener(
        'DOMContentLoaded',
        disableNextPortalPointerEvents,
        {
          once: true,
        }
      )
    }

    const createDisplayStream = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 360
      const context = canvas.getContext('2d')
      if (context) {
        context.fillStyle = '#1f2937'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = '#f9fafb'
        context.font = '24px sans-serif'
        context.fillText('AITuberKit E2E capture', 40, 80)
      }

      if ('captureStream' in canvas) {
        return canvas.captureStream(5)
      }

      return new MediaStream()
    }

    const mediaDevices = navigator.mediaDevices ?? ({} as MediaDevices)

    Object.defineProperty(mediaDevices, 'getDisplayMedia', {
      configurable: true,
      value: async () => createDisplayStream(),
    })

    Object.defineProperty(mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => createDisplayStream(),
    })

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: mediaDevices,
    })

    HTMLMediaElement.prototype.play = async () => {}

    // 実AudioContextはオーディオデバイス未初期化の環境（CI・ローカルの自動化
    // ブラウザ）でネイティブ層のハングを起こしメインスレッドが停止することが
    // あるため、テストではハードウェアに触れないスタブへ差し替える
    class FakeAudioNode {
      connect() {
        return this
      }
      disconnect() {}
    }
    class FakeAudioContext {
      state = 'running'
      sampleRate = 44100
      currentTime = 0
      destination = new FakeAudioNode()
      async close() {
        this.state = 'closed'
      }
      async resume() {
        this.state = 'running'
      }
      async suspend() {
        this.state = 'suspended'
      }
      async decodeAudioData() {
        throw new Error('decodeAudioData is not supported in e2e tests')
      }
      createGain() {
        return Object.assign(new FakeAudioNode(), { gain: { value: 1 } })
      }
      createBufferSource() {
        return Object.assign(new FakeAudioNode(), {
          buffer: null,
          onended: null,
          start() {},
          stop() {},
        })
      }
      createAnalyser() {
        return Object.assign(new FakeAudioNode(), {
          fftSize: 2048,
          frequencyBinCount: 1024,
          getByteFrequencyData() {},
          getByteTimeDomainData() {},
          getFloatTimeDomainData() {},
        })
      }
      createMediaStreamSource() {
        return new FakeAudioNode()
      }
      createScriptProcessor() {
        return Object.assign(new FakeAudioNode(), { onaudioprocess: null })
      }
    }
    ;(window as any).AudioContext = FakeAudioContext
    ;(window as any).webkitAudioContext = FakeAudioContext
  })
}

export function collectPageDiagnostics(page: Page): PageDiagnostics {
  const consoleEntries: ConsoleEntry[] = []
  const pageErrors: string[] = []
  const requestFailures: RequestFailureEntry[] = []

  const handleConsole = (message: ConsoleMessage) => {
    if (!['error', 'warning'].includes(message.type())) return

    consoleEntries.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
    })
  }

  const handlePageError = (error: Error) => {
    pageErrors.push(error.stack || error.message)
  }

  const handleRequestFailed = (request: Request) => {
    requestFailures.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      failureText: request.failure()?.errorText ?? 'unknown',
    })
  }

  page.on('console', handleConsole)
  page.on('pageerror', handlePageError)
  page.on('requestfailed', handleRequestFailed)

  return {
    console: consoleEntries,
    pageErrors,
    requestFailures,
    dispose: () => {
      page.off('console', handleConsole)
      page.off('pageerror', handlePageError)
      page.off('requestfailed', handleRequestFailed)
    },
  }
}

export function createNetworkDiagnostics(): NetworkDiagnostics {
  return {
    apiRequests: [],
    externalRequests: [],
    unhandledApiRequests: [],
  }
}

export async function expectNoPageErrors(diagnostics: PageDiagnostics) {
  expect(diagnostics.pageErrors).toEqual([])
}

export async function expectNoConsoleErrors(
  diagnostics: PageDiagnostics,
  ignored: RegExp[] = []
) {
  const unexpectedErrors = diagnostics.console.filter(
    (entry) =>
      entry.type === 'error' &&
      !ignored.some((pattern) => pattern.test(entry.text))
  )

  expect(unexpectedErrors).toEqual([])
}

export async function setupTestNetwork(
  page: Page,
  options: TestNetworkOptions = {}
) {
  const apiMocks = {
    ...defaultHarmlessApiMocks,
    ...options.apiMocks,
  }

  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const mock = apiMocks[url.pathname]
    const entry = createNetworkRequestEntry(request, url)

    if (url.pathname.startsWith('/api/')) {
      options.diagnostics?.apiRequests.push(entry)
    }

    if (mock) {
      await fulfillMock(route, await resolveMockResponse(mock, request))
      return
    }

    if (options.mockUnhandledApi && url.pathname.startsWith('/api/')) {
      options.diagnostics?.unhandledApiRequests.push(entry)
      await fulfillMock(
        route,
        options.mockUnhandledApi === true
          ? unhandledApiMock
          : options.mockUnhandledApi
      )
      return
    }

    if (options.blockExternal !== false && isExternalUrl(url)) {
      options.diagnostics?.externalRequests.push(entry)
      await fulfillExternalRequest(route)
      return
    }

    await route.continue()
  })
}

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByTestId('chat-message-input')).toBeVisible()
}

export async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await waitForAppReady(page)
}

export async function openSettings(page: Page) {
  await page.getByTestId('open-settings-button').evaluate((element) => {
    ;(element as HTMLElement).click()
  })
  await expect(page.getByTestId('settings-panel')).toBeVisible()
}

export async function closeSettings(page: Page) {
  await page.getByTestId('close-settings-button').evaluate((element) => {
    ;(element as HTMLElement).click()
  })
  await expect(page.getByTestId('settings-panel')).toBeHidden()
}

export async function openSettingsTab(page: Page, tab: string) {
  const tabTestId = `settings-tab-${tab}`
  let tabButton = page.getByTestId(tabTestId).filter({ visible: true }).first()

  if (!(await tabButton.isVisible().catch(() => false))) {
    await openMobileSettingsTabGroup(page, tab)
    tabButton = page.getByTestId(tabTestId).filter({ visible: true }).first()
  }

  await expect(tabButton).toBeVisible()
  await tabButton.evaluate((element) => {
    ;(element as HTMLElement).click()
  })

  await expect(page.getByTestId('settings-panel')).toBeVisible()
  if (await tabButton.isVisible().catch(() => false)) {
    await expect(tabButton).toHaveClass(/bg-primary/)
  }
}

async function openMobileSettingsTabGroup(page: Page, tab: string) {
  const tabGroup = settingsTabGroups[tab]
  if (!tabGroup) {
    throw new Error(`Unknown settings tab group mapping for tab: ${tab}`)
  }

  const groupButton = page
    .getByTestId(`settings-group-${tabGroup}`)
    .filter({ visible: true })
    .first()

  await expect(groupButton).toBeVisible()
  await groupButton.evaluate((element) => {
    ;(element as HTMLElement).click()
  })
}

export async function openToolsMenu(page: Page) {
  const toolsToggle = page.getByTestId('main-tools-toggle-button')
  await expect(toolsToggle).toBeVisible()
  await toolsToggle.evaluate((element) => {
    ;(element as HTMLElement).click()
  })
  await expect(page.getByTestId('main-tools-menu')).toBeVisible()
}

const settingsTabGroups: Record<string, string> = {
  quickStart: 'start',
  character: 'start',
  ai: 'conversation',
  memory: 'conversation',
  voice: 'voiceInput',
  speechInput: 'voiceInput',
  youtube: 'streaming',
  gameCommentary: 'streaming',
  slide: 'streaming',
  images: 'streaming',
  presence: 'automation',
  idle: 'automation',
  kiosk: 'automation',
  based: 'system',
  other: 'system',
  description: 'system',
}

export async function readPersistedSetting<T = PersistedValue>(
  page: Page,
  key: string
): Promise<T> {
  return page.evaluate(
    ({ storageKey, key }) => {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw).state[key] : undefined
    },
    { storageKey: storageKeys.settings, key }
  )
}

export async function expectPersistedSetting(
  page: Page,
  key: string,
  value: PersistedValue
) {
  await expect.poll(() => readPersistedSetting(page, key)).toBe(value)
}

export async function readPersistedSlideSetting<T = PersistedValue>(
  page: Page,
  key: string
): Promise<T> {
  return page.evaluate(
    ({ storageKey, key }) => {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw).state[key] : undefined
    },
    { storageKey: storageKeys.slide, key }
  )
}

export async function expectPersistedSlideSetting(
  page: Page,
  key: string,
  value: PersistedValue
) {
  await expect.poll(() => readPersistedSlideSetting(page, key)).toBe(value)
}

export async function writePersistedSettings(
  page: Page,
  values: PersistedSettings
) {
  await page.evaluate(
    ({ storageKey, values }) => {
      const current = JSON.parse(
        localStorage.getItem(storageKey) || '{"state":{},"version":0}'
      )

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...current,
          state: {
            ...current.state,
            ...values,
          },
        })
      )
    },
    { storageKey: storageKeys.settings, values }
  )
}

export async function setControlValue(
  page: Page,
  testId: string,
  value: string
) {
  await page.getByTestId(testId).evaluate((element, nextValue) => {
    const input = element as HTMLInputElement | HTMLSelectElement
    const prototype =
      input instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set

    valueSetter?.call(input, nextValue)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.dispatchEvent(new Event('blur', { bubbles: true }))
  }, value)
}

export async function fillSettingInput(
  page: Page,
  testId: string,
  value: string
) {
  await page.getByTestId(testId).fill(value)
}

export async function selectSettingOption(
  page: Page,
  testId: string,
  value: string
) {
  await page.getByTestId(testId).selectOption(value)
}

export async function toggleSetting(page: Page, testId: string) {
  await page.getByTestId(testId).click()
}

async function fulfillMock(route: Route, mock: NetworkMockResponseInit) {
  const headers = {
    'access-control-allow-origin': '*',
    ...mock.headers,
  }

  if (mock.json !== undefined) {
    await route.fulfill({
      status: mock.status ?? 200,
      contentType: mock.contentType ?? 'application/json',
      headers,
      body: JSON.stringify(mock.json),
    })
    return
  }

  await route.fulfill({
    status: mock.status ?? 200,
    contentType: mock.contentType ?? 'text/plain',
    headers,
    body: mock.body ?? '',
  })
}

function isExternalUrl(url: URL) {
  return !['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
}

function createNetworkRequestEntry(
  request: Request,
  url: URL
): NetworkRequestEntry {
  return {
    url: request.url(),
    method: request.method(),
    pathname: url.pathname,
    resourceType: request.resourceType(),
    postData: request.postData(),
    postDataJSON: readPostDataJSON(request),
  }
}

async function resolveMockResponse(
  mock: NetworkMockResponse,
  request: Request
) {
  return typeof mock === 'function' ? await mock(request) : mock
}

function createAIChatMockResponse(request: Request): NetworkMockResponseInit {
  if (isStreamRequest(request)) {
    return {
      contentType: 'text/plain; charset=utf-8',
      body: 'E2E response',
    }
  }

  return {
    json: { text: 'E2E response' },
  }
}

function createDifyMockResponse(request: Request): NetworkMockResponseInit {
  if (isStreamRequest(request)) {
    return {
      contentType: 'text/event-stream; charset=utf-8',
      body: 'data: {"event":"message","answer":"E2E response","conversation_id":"e2e-conversation"}\n\n',
    }
  }

  return {
    json: {
      answer: 'E2E response',
      conversation_id: 'e2e-conversation',
    },
  }
}

function isStreamRequest(request: Request) {
  const requestBody = readPostDataJSON(request)

  return (
    typeof requestBody === 'object' &&
    requestBody !== null &&
    'stream' in requestBody &&
    Boolean(requestBody.stream)
  )
}

function readPostDataJSON(request: Request): Record<string, unknown> | null {
  try {
    return request.postDataJSON() as Record<string, unknown>
  } catch {
    return null
  }
}

async function fulfillExternalRequest(route: Route) {
  const resourceType = route.request().resourceType()

  if (resourceType === 'fetch' || resourceType === 'xhr') {
    await fulfillMock(route, { json: { ok: true, blockedByE2E: true } })
    return
  }

  if (resourceType === 'script') {
    await fulfillMock(route, {
      contentType: 'application/javascript',
      body: '',
    })
    return
  }

  if (resourceType === 'stylesheet') {
    await fulfillMock(route, {
      contentType: 'text/css',
      body: '',
    })
    return
  }

  if (resourceType === 'image') {
    await fulfillMock(route, {
      contentType: 'image/gif',
      body: Buffer.from(
        'R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==',
        'base64'
      ),
    })
    return
  }

  if (resourceType === 'font') {
    await fulfillMock(route, {
      contentType: 'font/woff2',
      body: Buffer.alloc(0),
    })
    return
  }

  if (resourceType === 'media') {
    await fulfillMock(route, {
      contentType: 'application/octet-stream',
      body: Buffer.alloc(0),
    })
    return
  }

  await fulfillMock(route, {
    contentType: 'text/plain; charset=utf-8',
    body: '',
  })
}
