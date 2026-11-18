import type { ModelSource } from '@livliv-dev/player'
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import i18next from 'i18next'
import { create } from 'zustand'
import settingsStore from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'
import { logger } from '@/lib/logger'
import { buildUrl } from '@/utils/buildUrl'

export type LivLivModelEntry = { path: string; name: string }

interface ModelDatabase extends DBSchema {
  models: { key: string; value: Blob }
}

const localPrefix = 'livliv-local:'
// LivLiv Player の公開ページ。精選キャラクターは同梱せず、ここから読む。
const featuredBase = 'https://livliv-dev.github.io/player/characters/'
const maxPackageBytes = 200 * 1024 * 1024
let database: Promise<IDBPDatabase<ModelDatabase>> | undefined
let latestImport = 0

function openModelDatabase() {
  database ??= openDB<ModelDatabase>('aituberkit-livliv', 1, {
    upgrade(db) {
      db.createObjectStore('models')
    },
  }).catch((error) => {
    database = undefined
    throw error
  })
  return database
}

/** 取り込みのたびに増える。一覧と表示中のモデルを読み直すために使う。 */
export const useLocalLivLivRevision = create<number>(() => 0)

export const isLivLivFileName = (name: string) => /^.+\.livliv$/i.test(name)

export async function listLocalLivLivModels(): Promise<LivLivModelEntry[]> {
  const db = await openModelDatabase()
  return (await db.getAllKeys('models')).map((path) => ({
    path,
    name: path.slice(localPrefix.length),
  }))
}

export async function listHostedLivLivModels(
  signal: AbortSignal
): Promise<LivLivModelEntry[]> {
  const response = await fetch(buildUrl('/api/get-livliv-list'), { signal })
  if (!response.ok) {
    throw new Error(`LivLiv model list returned HTTP ${response.status}`)
  }
  const models: unknown = await response.json()
  if (
    !Array.isArray(models) ||
    models.some(
      (model) =>
        typeof model?.path !== 'string' || typeof model?.name !== 'string'
    )
  ) {
    throw new Error('Invalid LivLiv model list')
  }
  return models
}

/** LivLiv が作った精選キャラクター。他者の作品（credit 付き）は除く。 */
export async function listFeaturedLivLivModels(
  signal: AbortSignal
): Promise<LivLivModelEntry[]> {
  const response = await fetch(`${featuredBase}index.json`, { signal })
  if (!response.ok) {
    throw new Error(`LivLiv featured list returned HTTP ${response.status}`)
  }
  const characters: unknown = await response.json()
  if (
    !Array.isArray(characters) ||
    characters.some(
      (character) =>
        typeof character?.id !== 'string' || typeof character?.name !== 'string'
    )
  ) {
    throw new Error('Invalid LivLiv featured list')
  }
  const own = (
    characters as { id: string; name: string; credit?: unknown }[]
  ).filter(({ id, credit }) => !credit && /^[a-z0-9_]+$/.test(id))
  return own.map(({ id, name }) => ({
    path: `${featuredBase}${id}.livliv`,
    name:
      own.filter((other) => other.name === name).length > 1
        ? `${name} (${id})`
        : name,
  }))
}

export async function resolveLivLivModel(path: string): Promise<ModelSource> {
  if (/^https?:\/\//i.test(path)) return path
  if (!path.startsWith(localPrefix)) return buildUrl(path)
  const db = await openModelDatabase()
  const file = await db.get('models', path)
  if (!file) throw new Error('LivLiv model is missing from browser storage')
  return file
}

export function reportLivLivModelError(
  kind: 'ImportError' | 'ListError' | 'LoadError',
  error: unknown
) {
  logger.error(`LivLiv ${kind}:`, error)
  toastStore.getState().addToast({
    message: i18next.t(`LivLiv.${kind}`),
    type: 'error',
    tag: `livliv-${kind}`,
  })
}

/** 開いた .livliv をこのブラウザに保存して選ぶ。同じ名前のファイルは置き換える。 */
export async function selectLocalLivLivFile(file: File): Promise<void> {
  const importId = ++latestImport
  const previousPath = settingsStore.getState().selectedLivlivPath
  try {
    if (
      !isLivLivFileName(file.name) ||
      file.size === 0 ||
      file.size > maxPackageBytes
    ) {
      throw new Error('Expected a nonempty .livliv file of at most 200 MiB')
    }

    const path = localPrefix + file.name
    const db = await openModelDatabase()
    await db.put('models', file, path)
    const settings = settingsStore.getState()
    if (
      importId === latestImport &&
      settings.modelType === 'livliv' &&
      settings.selectedLivlivPath === previousPath
    ) {
      settingsStore.setState({ selectedLivlivPath: path })
    }
    useLocalLivLivRevision.setState((revision) => revision + 1, true)
  } catch (error) {
    if (importId === latestImport) reportLivLivModelError('ImportError', error)
  }
}
