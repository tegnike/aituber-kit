/**
 * github pagesに公開時にアセットを読み込めるようにするため、
 * 環境変数を見てURLにリポジトリ名を追加する
 */
export function buildUrl(path: string): string {
  const root = process.env.NEXT_PUBLIC_BASE_PATH || ''

  // 空白などの特殊文字を含むパスを適切にエンコード
  // ただし、パス区切り文字（/）はエンコードしない
  // 二重エンコードを防止する
  const encodedPath = path
    .split('/')
    .map((segment) => {
      try {
        const decoded = decodeURIComponent(segment)
        if (decoded !== segment) {
          // 既にエンコード済みの場合はそのまま返す
          return segment
        }
      } catch {
        // デコード失敗=エンコードされていない、または不正な形式
      }
      return encodeURIComponent(segment)
    })
    .join('/')

  return root + encodedPath
}
