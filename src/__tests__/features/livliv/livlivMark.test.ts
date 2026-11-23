import {
  filesWithoutLivLivServiceLogo,
  manifestWithoutLivLivServiceLogo,
  prepareLivLivPlaybackSource,
} from '@/features/livliv/livlivMark'

jest.mock(
  '@livliv-dev/player',
  () => ({
    modelFiles: jest.fn(),
  }),
  { virtual: true }
)

const featured = {
  format: 'livliv-model',
  version: 4,
  name: 'Yui',
  meta: {
    license: {
      id: 'LicenseRef-LivLiv-Samples',
      text: 'credit: Characters: LivLiv (livliv.ai)',
    },
    watermark: { kind: 'livliv', center: false },
  },
  layers: [{ id: 'face' }],
}

const textMark = {
  format: 'livliv-model',
  version: 4,
  name: 'Mira',
  meta: { watermark: { kind: 'text', text: 'Mira' } },
}

function blobText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') return blob.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

async function readManifest(files: Map<string, Blob>) {
  return JSON.parse(await blobText(files.get('model.json')!)) as {
    meta?: { watermark?: unknown; license?: unknown }
    watermark?: unknown
    name?: string
  }
}

describe('manifestWithoutLivLivServiceLogo', () => {
  it('removes the featured corner logo and the free-plan logo', () => {
    const corner = manifestWithoutLivLivServiceLogo(JSON.stringify(featured))
    expect(JSON.parse(corner!).meta.watermark).toEqual({ kind: 'none' })
    expect(JSON.parse(corner!).meta.license.text).toBe(
      'credit: Characters: LivLiv (livliv.ai)'
    )
    expect(JSON.parse(corner!).layers).toEqual(featured.layers)

    const free = manifestWithoutLivLivServiceLogo(
      JSON.stringify({
        meta: { watermark: { kind: 'livliv' } },
        name: 'Free',
      })
    )
    expect(JSON.parse(free!).meta.watermark).toEqual({ kind: 'none' })
    expect(JSON.parse(free!).name).toBe('Free')
  })

  it('keeps a viewer text mark, including when the text is LivLiv', () => {
    const raw = JSON.stringify({
      meta: { watermark: { kind: 'text', text: 'LivLiv' } },
    })
    expect(manifestWithoutLivLivServiceLogo(raw)).toBeNull()
    expect(
      manifestWithoutLivLivServiceLogo(JSON.stringify(textMark))
    ).toBeNull()
  })

  it('keeps kind none and a legacy text mark', () => {
    expect(
      manifestWithoutLivLivServiceLogo(
        JSON.stringify({ meta: { watermark: { kind: 'none' } } })
      )
    ).toBeNull()
    expect(
      manifestWithoutLivLivServiceLogo(
        JSON.stringify({ watermark: 'スタジオ', name: 'Old' })
      )
    ).toBeNull()
  })

  it('removes the legacy service logo string and leaves the rest of the model', () => {
    const next = manifestWithoutLivLivServiceLogo(
      JSON.stringify({
        format: 'livemaker-puppet',
        version: 3,
        name: 'Old',
        watermark: 'LivLiv',
      })
    )
    expect(JSON.parse(next!)).toEqual({
      format: 'livemaker-puppet',
      version: 3,
      name: 'Old',
    })
  })

  it('leaves unreadable manifests alone', () => {
    expect(manifestWithoutLivLivServiceLogo('{')).toBeNull()
    expect(manifestWithoutLivLivServiceLogo('[]')).toBeNull()
  })
})

describe('filesWithoutLivLivServiceLogo', () => {
  it('replaces only the shallowest model.json and keeps texture blobs', async () => {
    const texture = new Blob(['pixels'])
    const nested = new Blob([
      JSON.stringify({ meta: { watermark: { kind: 'livliv' } } }),
    ])
    const files = new Map<string, Blob>([
      ['model.json', new Blob([JSON.stringify(featured)])],
      ['textures/face.webp', texture],
      ['nested/model.json', nested],
    ])

    const next = await filesWithoutLivLivServiceLogo(files)

    expect(next).not.toBe(files)
    expect(next.get('textures/face.webp')).toBe(texture)
    expect(next.get('nested/model.json')).toBe(nested)
    expect((await readManifest(next)).meta?.watermark).toEqual({ kind: 'none' })
    expect((await readManifest(next)).name).toBe('Yui')
  })

  it('returns the same map when the package asks for a text mark', async () => {
    const files = new Map<string, Blob>([
      ['pack/model.json', new Blob([JSON.stringify(textMark)])],
      ['pack/textures/face.webp', new Blob(['pixels'])],
    ])
    await expect(filesWithoutLivLivServiceLogo(files)).resolves.toBe(files)
  })
})

describe('prepareLivLivPlaybackSource', () => {
  it('loads package files through the player and drops the service logo', async () => {
    const files = new Map<string, Blob>([
      ['model.json', new Blob([JSON.stringify(featured)])],
      ['textures/face.webp', new Blob(['face'])],
    ])
    const { modelFiles } = jest.requireMock('@livliv-dev/player') as {
      modelFiles: jest.Mock
    }
    modelFiles.mockResolvedValue(files)
    const source = 'https://livliv-dev.github.io/player/characters/d01.livliv'
    const signal = new AbortController().signal

    const prepared = await prepareLivLivPlaybackSource(source, signal)

    expect(modelFiles).toHaveBeenCalledWith(source, { signal })
    expect(prepared).not.toBe(source)
    const manifest = await readManifest(prepared as Map<string, Blob>)
    expect(manifest.meta?.watermark).toEqual({ kind: 'none' })
    expect(manifest.meta?.license).toEqual(featured.meta.license)
    expect((prepared as Map<string, Blob>).get('textures/face.webp')).toBe(
      files.get('textures/face.webp')
    )
  })
})
