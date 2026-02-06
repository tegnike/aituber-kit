/**
 * 制限モード判定ユーティリティ
 *
 * サーバーレス環境（Vercel等）でファイルシステムアクセスや
 * ローカルサーバー依存機能を非活性化するためのユーティリティ
 */

/**
 * 制限モード時のAPIエラーレスポンス型
 */
export interface RestrictedModeErrorResponse {
  error: 'feature_disabled_in_restricted_mode'
  message: string
}

/**
 * サーバーサイド用制限モード判定
 * @returns 制限モードが有効な場合はtrue
 */
export function isRestrictedMode(): boolean {
  return process.env.NEXT_PUBLIC_RESTRICTED_MODE === 'true'
}

/**
 * 制限モード時のAPI拒否レスポンスを生成
 * @param featureName 非活性化された機能名
 * @returns エラーレスポンスオブジェクト
 */
export function createRestrictedModeErrorResponse(
  featureName: string
): RestrictedModeErrorResponse {
  return {
    error: 'feature_disabled_in_restricted_mode',
    message: `The feature "${featureName}" is disabled in restricted mode.`,
  }
}
