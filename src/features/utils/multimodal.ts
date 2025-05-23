import { multiModalModels } from '../constants/aiModels'
import settingsStore from '../stores/settings'

/**
 * 現在選択されているモデルがマルチモーダル対応かどうかを判定する
 * @returns マルチモーダル対応の場合true、そうでない場合false
 */
export const isCurrentModelMultiModal = (): boolean => {
  const ss = settingsStore.getState()
  const currentModel = ss.selectAIModel

  return multiModalModels.includes(currentModel as any)
}
