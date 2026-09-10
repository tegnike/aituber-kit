import { test, expect } from '@playwright/test'
import {
  prepareApp,
  gotoHome,
  openSettings,
  openSettingsTab,
  closeSettings,
  expectPersistedSetting,
} from './helpers/app'

test('GPT-Live settings, independent subtitles, and graceful stop', async ({
  page,
}) => {
  await prepareApp(page, {
    settings: {
      selectLanguage: 'ja',
      liveMode: false,
      maxPastMessages: 200,
      openaiKey: 'test-key',
      showInputForm: true,
    },
    network: { blockExternal: true },
  })
  await page.addInitScript(() => {
    class Peer {
      channel = {
        readyState: 'open',
        onmessage: null as null | ((e: { data: string }) => void),
        send: (data: string) => {
          if (JSON.parse(data).type === 'session.close') {
            this.channel.onmessage?.({
              data: JSON.stringify({
                type: 'session.closed',
                usage: { seconds: 12 },
              }),
            })
          }
        },
        close: () => {},
      }
      localDescription = { sdp: 'v=0\r\n' }
      iceGatheringState = 'complete'
      connectionState = 'connected'
      addTrack() {}
      createDataChannel() {
        return this.channel
      }
      async createOffer() {
        return { type: 'offer', sdp: 'v=0\r\n' }
      }
      async setLocalDescription() {}
      async setRemoteDescription() {
        for (const event of [
          { type: 'session.started' },
          {
            type: 'session.input_transcript.delta',
            delta: 'こんにちは',
            start_ms: 1000,
            end_ms: 1500,
          },
          {
            type: 'session.output_transcript.delta',
            delta: 'はい、',
            start_ms: 1100,
            end_ms: 1400,
          },
          {
            type: 'session.output_transcript.delta',
            delta: '聞こえています。',
            start_ms: 1400,
            end_ms: 1800,
          },
        ])
          this.channel.onmessage?.({ data: JSON.stringify(event) })
      }
      close() {}
    }
    window.RTCPeerConnection = Peer as unknown as typeof RTCPeerConnection
    navigator.mediaDevices.getUserMedia = async () => {
      const context = new AudioContext()
      return context.createMediaStreamDestination().stream
    }
  })
  await page.route('**/api/ai/live-session', async (route) => {
    const body = route.request().postDataJSON()
    expect(body.voice).toBe('quartz')
    expect(body.backendModel).toBe('gpt-5.6-terra')
    await route.fulfill({
      json: { session: { id: 'live_test' }, transport: { sdp: 'v=0\r\n' } },
    })
  })
  await gotoHome(page)
  await openSettings(page)
  await openSettingsTab(page, 'ai')
  await page.getByTestId('live-mode-toggle').click()
  await expectPersistedSetting(page, 'liveMode', true)
  const historyCount = page.locator('input[type="number"][max="128"]')
  await expect(historyCount).toHaveValue('128')
  await expectPersistedSetting(page, 'maxPastMessages', 200)
  await historyCount.fill('35')
  await expectPersistedSetting(page, 'maxPastMessages', 35)
  await expect(
    page.getByText(/GPT-Liveの上限は128件・合計8,192トークン/)
  ).toBeVisible()

  await page.getByLabel('GPT-Liveの声', { exact: true }).selectOption('quartz')
  await closeSettings(page)
  await expect(page.getByTestId('live-conversation')).toBeVisible()
  await page.getByRole('button', { name: '会話を開始', exact: true }).click()
  await expect(
    page.getByRole('status').filter({ hasText: '会話中' })
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('aitube-kit-home')!).state.chatLog.map(
          (m: { content: string }) => m.content
        )
      )
    )
    .toEqual(['こんにちは', 'はい、聞こえています。'])
  await page.screenshot({ path: '/tmp/aituber-live-ui.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  const panel = page.getByTestId('live-conversation')
  await expect(panel).toBeVisible()
  await expect
    .poll(async () => (await panel.boundingBox())!.height)
    .toBeLessThan(110)
  await page.screenshot({ path: '/tmp/aituber-live-mobile.png' })
  await page.getByRole('button', { name: '会話を終了', exact: true }).click()
  await expect(
    page.getByRole('status').filter({ hasText: '会話を終了しました' })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '会話を開始', exact: true })
  ).toBeEnabled()
})
