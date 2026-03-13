import { v4 as uuidv4 } from 'uuid'

const LOCAL_STORAGE_KEY = 'aituber-kit-session-id'

/**
 * ブラウザ固有のセッションIDを取得する。
 * localStorageに存在しなければ新規生成して保存する。
 */
export const getSessionId = (): string => {
  if (typeof window === 'undefined') return ''

  let sessionId = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!sessionId) {
    sessionId = uuidv4()
    localStorage.setItem(LOCAL_STORAGE_KEY, sessionId)
  }
  return sessionId
}

/**
 * セッションIDをリセットする。
 * 次回getSessionId()呼び出し時に新しいIDが生成される。
 */
export const resetSessionId = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LOCAL_STORAGE_KEY)
}
