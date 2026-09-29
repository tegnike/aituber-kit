import {
  getVoicevoxBrowserServerUrl,
  getVoicevoxSpeakersInBrowser,
  synthesizeVoicevoxInBrowser,
  VoicevoxBrowserError,
} from '@/features/messages/voicevoxBrowserClient'

const mockFetch = jest.fn()
global.fetch = mockFetch

const response = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(4)),
  }) as unknown as Response

describe('voicevoxBrowserClient', () => {
  beforeEach(() => mockFetch.mockReset())

  it('空URLをlocalhostのVOICEVOXへ正規化し、外部接続を拒否する', () => {
    expect(getVoicevoxBrowserServerUrl('').toString()).toBe(
      'http://127.0.0.1:50021/'
    )
    expect(getVoicevoxBrowserServerUrl('http://[::1]:50021').hostname).toBe(
      '[::1]'
    )
    for (const input of [
      'https://example.com',
      'http://192.168.1.10:50021',
      'ftp://localhost:50021',
      'http://localhost:50021/#fragment',
      'http://localhost:50021/path',
      'http://localhost:50021?token=x',
      'http://user:pass@localhost:50021',
    ]) {
      expect(() => getVoicevoxBrowserServerUrl(input)).toThrow(
        VoicevoxBrowserError
      )
    }
  })

  it('audio_queryからスケールを上書きしてsynthesisを行う', async () => {
    mockFetch
      .mockResolvedValueOnce(response({ speedScale: 1, pitchScale: 0 }))
      .mockResolvedValueOnce(response(new ArrayBuffer(4)))

    const audio = await synthesizeVoicevoxInBrowser(
      '花詩ましょです',
      '46',
      1.2,
      0.1,
      1.1,
      ''
    )

    expect(audio).toBeInstanceOf(ArrayBuffer)
    expect(mockFetch.mock.calls[0][0]).toContain(
      'text=%E8%8A%B1%E8%A9%A9%E3%81%BE%E3%81%97%E3%82%87%E3%81%A7%E3%81%99'
    )
    expect(mockFetch.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      credentials: 'omit',
      redirect: 'error',
    })
    expect(mockFetch.mock.calls[1][0]).toContain('/synthesis?speaker=46')
    expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toMatchObject({
      speedScale: 1.2,
      pitchScale: 0.1,
      intonationScale: 1.1,
    })
  })

  it('audio_queryのHTTPエラー時はsynthesisを実行しない', async () => {
    mockFetch.mockResolvedValue(response({}, 500))
    await expect(
      synthesizeVoicevoxInBrowser('test', '46', 1, 0, 1, '')
    ).rejects.toMatchObject({ code: 'http' })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('不正なaudio_query JSONを拒否する', async () => {
    mockFetch.mockResolvedValue(response([]))
    await expect(
      synthesizeVoicevoxInBrowser('test', '46', 1, 0, 1, '')
    ).rejects.toMatchObject({ code: 'json' })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('話者一覧をスタイル単位へ変換する', async () => {
    mockFetch.mockResolvedValue(
      response([
        {
          name: '小夜/SAYO',
          speaker_uuid: 'id',
          styles: [{ name: 'ノーマル', id: 46, type: 'talk' }],
        },
      ])
    )
    await expect(getVoicevoxSpeakersInBrowser('')).resolves.toEqual([
      { id: 46, speaker: '小夜/SAYO/ノーマル' },
    ])
  })

  it('synthesisのHTTPエラーを通知する', async () => {
    mockFetch
      .mockResolvedValueOnce(response({}))
      .mockResolvedValueOnce(response({}, 503))
    await expect(
      synthesizeVoicevoxInBrowser('test', '46', 1, 0, 1, '')
    ).rejects.toMatchObject({ code: 'http' })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('ネットワーク拒否は起動・CORS・Chromeの許可を案内する', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(getVoicevoxSpeakersInBrowser('')).rejects.toThrow(
      /起動.*CORS.*Chrome/
    )
  })

  it('ヘッダー受信後に音声本文が止まってもタイムアウトする', async () => {
    jest.useFakeTimers()
    try {
      mockFetch
        .mockResolvedValueOnce(response({}))
        .mockImplementationOnce((_url, init) =>
          Promise.resolve({
            ok: true,
            arrayBuffer: () =>
              new Promise((_resolve, reject) => {
                init.signal.addEventListener('abort', () =>
                  reject(new DOMException('Aborted', 'AbortError'))
                )
              }),
          })
        )
      const pending = synthesizeVoicevoxInBrowser('test', '46', 1, 0, 1, '')
      const rejected = expect(pending).rejects.toMatchObject({
        code: 'timeout',
      })
      await jest.advanceTimersByTimeAsync(30000)
      await rejected
      expect(mockFetch.mock.calls[1][1].signal.aborted).toBe(true)
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })
})
