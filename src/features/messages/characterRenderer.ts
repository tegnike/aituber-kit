import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { Talk } from './messages'
import { Live2DHandler } from './live2dHandler'
import { PNGTuberHandler } from '@/features/pngTuber/pngTuberHandler'
import { livlivRenderer } from '@/features/livliv/livlivRuntime'

export type PlaybackObserver = {
  onPlaybackStart?: () => void
}

/**
 * VRM / Live2D / PNGTuber / LivLiv が共有する speak() 系メソッドの共通インターフェース。
 * PNGTuberは talk.emotion / talk.motion を無視するが、型としては同じシグネチャで受け取る（対応しないだけ）。
 * LivLiv は感情タグを setExpression に渡し、モーションタグは使わない。
 */
export interface CharacterRenderer {
  speak(
    buffer: ArrayBuffer,
    talk: Talk,
    isNeedDecode?: boolean,
    observer?: PlaybackObserver
  ): Promise<void>
  speakPcm16Stream?(
    stream: ReadableStream<Uint8Array>,
    talk: Talk,
    sampleRate: number,
    observer?: PlaybackObserver
  ): Promise<void>
  stopSpeaking(): void | Promise<void>
  resetToIdle(): void | Promise<void>
}

/**
 * 現在のmodelType設定に対応するCharacterRendererを返す。
 * VRMはビューアにモデルが読み込まれていない場合nullを返す。
 */
export function getCharacterRenderer(): CharacterRenderer | null {
  const ss = settingsStore.getState()

  if (ss.modelType === 'live2d') {
    return {
      speak: (buffer, talk, isNeedDecode, observer) =>
        observer
          ? Live2DHandler.speak(buffer, talk, isNeedDecode, observer)
          : Live2DHandler.speak(buffer, talk, isNeedDecode),
      stopSpeaking: () => Live2DHandler.stopSpeaking(),
      resetToIdle: () => Live2DHandler.resetToIdle(),
    }
  }

  if (ss.modelType === 'pngtuber') {
    return {
      speak: (buffer, talk, isNeedDecode, observer) =>
        observer
          ? PNGTuberHandler.speak(buffer, talk, isNeedDecode, observer)
          : PNGTuberHandler.speak(buffer, talk, isNeedDecode),
      stopSpeaking: () => PNGTuberHandler.stopSpeaking(),
      resetToIdle: () => PNGTuberHandler.resetToIdle(),
    }
  }

  if (ss.modelType === 'livliv') {
    return livlivRenderer
  }

  const model = homeStore.getState().viewer.model
  if (!model) return null

  return {
    speak: (buffer, talk, isNeedDecode, observer) =>
      observer
        ? model.speak(buffer, talk, isNeedDecode, observer)
        : model.speak(buffer, talk, isNeedDecode),
    speakPcm16Stream: (stream, talk, sampleRate, observer) =>
      model.speakPcm16Stream(stream, talk, sampleRate, observer),
    stopSpeaking: () => {
      model.stopSpeaking()
      if (model.poseManager?.isActive) {
        model.poseManager?.resetToIdle(model)
      }
    },
    resetToIdle: async () => {
      await model.playEmotion('neutral')
      if (model.poseManager?.isActive) {
        model.poseManager?.resetToIdle(model)
      }
    },
  }
}
