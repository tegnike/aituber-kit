/**
 * Live2D機能制限ユーティリティ
 *
 * Live2D Cubism SDKはLive2D Inc.とのライセンス契約が必要なため、
 * 環境変数で明示的に有効化しない限りLive2D機能を無効にする
 */

/**
 * Live2D制限時のAPIエラーレスポンス型
 */
export interface Live2DRestrictionErrorResponse {
  error: 'live2d_feature_disabled'
  message: string
}

/**
 * サーバーサイド/クライアントサイド用Live2D有効判定
 * @returns Live2D機能が有効な場合はtrue
 */
export function isLive2DEnabled(): boolean {
  return process.env.NEXT_PUBLIC_LIVE2D_ENABLED === 'true'
}

/**
 * Live2D無効時のAPI拒否レスポンスを生成
 * @returns エラーレスポンスオブジェクト
 */
export function createLive2DRestrictionErrorResponse(): Live2DRestrictionErrorResponse {
  return {
    error: 'live2d_feature_disabled',
    message:
      'Live2D features are disabled. Set NEXT_PUBLIC_LIVE2D_ENABLED=true to enable (requires Live2D Inc. license agreement).',
  }
}
