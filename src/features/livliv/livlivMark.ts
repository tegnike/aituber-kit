import type { ModelSource } from '@livliv-dev/player'

/**
 * AITuberKit 向けに、パッケージが頼む LivLiv のロゴだけを外した model.json を返す。
 * Player 0.5.1 にロゴを消す設定はなく、描く印は watermark で決まる。
 * kind が livliv のとき（精選キャラクターは右下、無料プランはキャラクターの上にも）だけ none にする。
 * 旧形式では文字列 "LivLiv" が同じロゴを指す。利用者自身の文字（kind: text や別の文字列）は残す。
 * 変える必要がなければ null を返し、呼び出し側は元のバイト列をそのまま使う。
 *
 * ロゴを外す根拠: LivLiv の開発者が「AITuberKit では LivLiv ロゴを配信画面に表示する必要は
 * ない」と回答し、この処理自体も同じ開発者が実装した。
 * https://github.com/tegnike/aituber-kit/pull/639#issuecomment-7102830591
 */
export function manifestWithoutLivLivServiceLogo(text: string): string | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    return null

  const model = parsed as Record<string, unknown>
  const meta = model.meta
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const watermark = (meta as Record<string, unknown>).watermark
    if (
      !watermark ||
      typeof watermark !== 'object' ||
      Array.isArray(watermark) ||
      (watermark as Record<string, unknown>).kind !== 'livliv'
    ) {
      return null
    }
    ;(meta as Record<string, unknown>).watermark = { kind: 'none' }
    return JSON.stringify(model)
  }

  if (model.watermark !== 'LivLiv') return null
  delete model.watermark
  return JSON.stringify(model)
}

/** ブラウザの Blob は text() を持つ。jsdom の Blob は FileReader だけなので、テストも同じ関数で読む。 */
function readBlobText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') return blob.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () =>
      reject(reader.error ?? new Error('Could not read model.json'))
    reader.readAsText(blob)
  })
}

function modelJsonPath(files: ReadonlyMap<string, Blob>): string | undefined {
  return [...files.keys()]
    .filter((name) => name === 'model.json' || name.endsWith('/model.json'))
    .sort((a, b) => a.length - b.length)[0]
}

/** メモリ上のファイルだけを変える。サーバーや保存済みの元ファイルには書き戻さない。 */
export async function filesWithoutLivLivServiceLogo(
  files: Map<string, Blob>
): Promise<Map<string, Blob>> {
  const jsonPath = modelJsonPath(files)
  const blob = jsonPath ? files.get(jsonPath) : undefined
  if (!jsonPath || !blob) return files
  const next = manifestWithoutLivLivServiceLogo(await readBlobText(blob))
  if (next === null) return files
  const copy = new Map(files)
  copy.set(jsonPath, new Blob([next], { type: 'application/json' }))
  return copy
}

/**
 * 読み込み直前のソース。Player は頼まれた印を自分のキャンバスへ描くため、
 * ここで外したロゴは配信やキャプチャにも乗らない。
 */
export async function prepareLivLivPlaybackSource(
  source: ModelSource,
  signal?: AbortSignal
): Promise<ModelSource> {
  const { modelFiles } = await import('@livliv-dev/player')
  return filesWithoutLivLivServiceLogo(await modelFiles(source, { signal }))
}
