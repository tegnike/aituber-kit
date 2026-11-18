import {
  listFeaturedLivLivModels,
  resolveLivLivModel,
} from '@/features/livliv/models'

const base = 'https://livliv-dev.github.io/player/characters/'

describe('listFeaturedLivLivModels', () => {
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('lists LivLiv characters by their .livliv on the Player site, without credited ones', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => [
        { id: 'd01', name: 'Yui' },
        { id: 'd03', name: 'Nana' },
        { id: 'd03ft', name: 'Nana' },
        { id: 'p01', name: 'Kujira', credit: 'someone else (CC BY-NC-SA)' },
        { id: '../x', name: 'Bad' },
      ],
    })) as unknown as typeof fetch

    const models = await listFeaturedLivLivModels(new AbortController().signal)

    expect(global.fetch).toHaveBeenCalledWith(
      `${base}index.json`,
      expect.anything()
    )
    expect(models).toEqual([
      { path: `${base}d01.livliv`, name: 'Yui' },
      { path: `${base}d03.livliv`, name: 'Nana (d03)' },
      { path: `${base}d03ft.livliv`, name: 'Nana (d03ft)' },
    ])
  })

  it('rejects a list it cannot read', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'd01' }),
    })) as unknown as typeof fetch

    await expect(
      listFeaturedLivLivModels(new AbortController().signal)
    ).rejects.toThrow('Invalid LivLiv featured list')
  })
})

describe('resolveLivLivModel', () => {
  it('loads absolute URLs as they are and site paths under the base path', async () => {
    await expect(resolveLivLivModel(`${base}d01.livliv`)).resolves.toBe(
      `${base}d01.livliv`
    )
    await expect(resolveLivLivModel('/livliv/My Model.livliv')).resolves.toBe(
      '/livliv/My%20Model.livliv'
    )
  })
})
