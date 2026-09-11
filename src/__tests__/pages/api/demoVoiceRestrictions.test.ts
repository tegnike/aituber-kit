import live from '@/pages/api/ai/live-session'
import audio from '@/pages/api/ai/audio'
import tts from '@/pages/api/openAITTS'
import realtime from '@/pages/api/ai/realtime-client-secret'
import { createMockReq, createMockRes } from '../../helpers/apiRouteTestUtils'

const originalEnv = process.env
const originalFetch = global.fetch
beforeEach(() => {
  process.env = { ...originalEnv, NEXT_PUBLIC_DEMO_MODE: 'true' }
  global.fetch = jest.fn()
})
afterEach(() => {
  process.env = originalEnv
  global.fetch = originalFetch
})
test.each([live, audio, tts, realtime])(
  'blocks demo voice sessions even with a client key before upstream requests',
  async (handler) => {
    const res = createMockRes()
    await handler(createMockReq({ body: { apiKey: 'client-key' } }), res)
    expect(res._status).toBe(403)
    expect(res._json).toMatchObject({ errorCode: 'FeatureDisabledInDemoMode' })
    expect(global.fetch).not.toHaveBeenCalled()
  }
)
test('preserves live transcription with the users own key', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ value: 'ephemeral', expires_at: 123 }),
  })
  const res = createMockRes()
  await realtime(
    createMockReq({
      body: { apiKey: 'client-key', sessionType: 'transcription' },
    }),
    res
  )
  expect(global.fetch).toHaveBeenCalledTimes(1)
  expect(res._status).toBe(200)
})
