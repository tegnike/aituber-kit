import * as THREE from 'three'
import {
  VRM,
  VRMExpressionManager,
  VRMExpressionPresetName,
} from '@pixiv/three-vrm'
import { AutoLookAt } from './autoLookAt'
import { AutoBlink } from './autoBlink'

/**
 * Expressionを管理するクラス
 *
 * 主に前の表情を保持しておいて次の表情を適用する際に0に戻す作業や、
 * 前の表情が終わるまで待ってから表情適用する役割を持っている。
 */
export class ExpressionController {
  private _autoLookAt: AutoLookAt
  private _autoBlink?: AutoBlink
  private _expressionManager?: VRMExpressionManager
  private _currentEmotion: VRMExpressionPresetName
  private _currentLipSync: {
    preset: VRMExpressionPresetName
    value: number
  } | null
  private _isExpressionManagerAvailable: boolean = false

  constructor(vrm: VRM, camera: THREE.Object3D) {
    console.log('🎭 ExpressionController初期化開始')

    this._autoLookAt = new AutoLookAt(vrm, camera)
    this._currentEmotion = 'neutral'
    this._currentLipSync = null

    // ExpressionManagerの存在確認と詳細ログ
    if (vrm.expressionManager) {
      this._expressionManager = vrm.expressionManager
      this._isExpressionManagerAvailable = true
      this._autoBlink = new AutoBlink(vrm.expressionManager)

      console.log('✅ ExpressionManager利用可能', {
        availableExpressions: this._getAvailableExpressions(),
        blendShapeGroupCount: Object.keys(
          vrm.expressionManager._blendShapeGroups || {}
        ).length,
      })
    } else {
      console.warn(
        '⚠️ ExpressionManagerが見つかりません。このVRMモデルは表情制御に対応していない可能性があります。'
      )
      this._isExpressionManagerAvailable = false
    }

    // LookAtの状態確認
    if (vrm.lookAt) {
      console.log('👁️ LookAt機能が利用可能です')
    } else {
      console.warn('⚠️ LookAt機能が見つかりません')
    }

    console.log('🎭 ExpressionController初期化完了', {
      hasExpressionManager: this._isExpressionManagerAvailable,
      hasLookAt: !!vrm.lookAt,
      hasAutoBlink: !!this._autoBlink,
    })
  }

  private _getAvailableExpressions(): string[] {
    if (!this._expressionManager) return []

    const expressions: string[] = []
    const presets = ['neutral', 'happy', 'angry', 'sad', 'relaxed', 'surprised']

    for (const preset of presets) {
      try {
        // プリセット表情が利用可能かテスト
        const expression =
          this._expressionManager._blendShapeGroups?.[
            preset as VRMExpressionPresetName
          ]
        if (expression) {
          expressions.push(preset)
        }
      } catch (error) {
        // テストでエラーが発生しても継続
      }
    }

    return expressions
  }

  public playEmotion(preset: VRMExpressionPresetName) {
    console.log(`🎭 表情変更要求: ${this._currentEmotion} → ${preset}`)

    if (!this._isExpressionManagerAvailable) {
      console.warn(
        '⚠️ ExpressionManagerが利用できません。表情変更をスキップします。'
      )
      return
    }

    try {
      // 現在の感情をリセット
      if (this._currentEmotion !== 'neutral') {
        console.log(`🔄 前の表情をリセット: ${this._currentEmotion}`)
        this._expressionManager?.setValue(this._currentEmotion, 0)
      }

      // ニュートラル表情の処理
      if (preset === 'neutral') {
        this._autoBlink?.setEnable(true)
        this._currentEmotion = preset
        console.log('😐 ニュートラル表情に設定、AutoBlink有効化')
        return
      }

      // 新しい表情の適用
      const blinkDisableTime = this._autoBlink?.setEnable(false) || 0
      this._currentEmotion = preset

      console.log(`😊 表情設定: ${preset} (${blinkDisableTime}秒後に適用)`)

      setTimeout(() => {
        try {
          this._expressionManager?.setValue(preset, 1)
          console.log(`✅ 表情適用完了: ${preset}`)
        } catch (error) {
          console.error('❌ 表情適用エラー:', error)
        }
      }, blinkDisableTime * 1000)
    } catch (error) {
      console.error(`❌ playEmotion処理エラー (${preset}):`, error)
    }
  }

  public lipSync(preset: VRMExpressionPresetName, value: number) {
    if (!this._isExpressionManagerAvailable) {
      // ExpressionManagerがない場合は何もしない（ログは出さない - 頻繁に呼ばれるため）
      return
    }

    try {
      // 前の口パクをリセット
      if (this._currentLipSync) {
        this._expressionManager?.setValue(this._currentLipSync.preset, 0)
      }

      // 新しい口パク設定
      this._currentLipSync = {
        preset,
        value,
      }

      // 必要に応じてデバッグログ（コメントアウト）
      // console.log(`👄 口パク設定: ${preset}, 音量: ${value.toFixed(3)}`)
    } catch (error) {
      console.error(`❌ lipSync処理エラー (${preset}, ${value}):`, error)
    }
  }

  public update(delta: number) {
    try {
      // AutoBlinkの更新
      if (this._autoBlink) {
        this._autoBlink.update(delta)
      }

      // 口パクの適用
      if (this._currentLipSync && this._isExpressionManagerAvailable) {
        // 感情に応じて口パクの重みを調整（より大きく開くように調整）
        const weight =
          this._currentEmotion === 'neutral'
            ? this._currentLipSync.value * 0.8  // 0.5から0.8に増加
            : this._currentLipSync.value * 0.6  // 0.25から0.6に増加

        this._expressionManager?.setValue(this._currentLipSync.preset, weight)

        // 必要に応じてデバッグログ（コメントアウト）
        // console.log(`👄 口パク更新: value=${this._currentLipSync.value.toFixed(3)}, weight=${weight.toFixed(3)}`)
      }
    } catch (error) {
      console.error('❌ ExpressionController.update処理エラー:', error)
    }
  }

  // 診断用メソッドを追加
  public getStatus() {
    return {
      hasExpressionManager: this._isExpressionManagerAvailable,
      currentEmotion: this._currentEmotion,
      hasCurrentLipSync: !!this._currentLipSync,
      lipSyncPreset: this._currentLipSync?.preset,
      lipSyncValue: this._currentLipSync?.value,
      hasAutoBlink: !!this._autoBlink,
      availableExpressions: this._getAvailableExpressions(),
    }
  }
}
