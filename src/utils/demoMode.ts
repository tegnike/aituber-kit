/**
 * デモモード判定ユーティリティ
 *
 * サーバーレス環境（Vercel等）でファイルシステムアクセスや
 * ローカルサーバー依存機能を非活性化するためのユーティリティ
 */

/**
 * デモモード時のAPIエラーレスポンス型
 */
export interface DemoModeErrorResponse {
  error: 'feature_disabled_in_demo_mode'
  message: string
}

/**
 * サーバーサイド用デモモード判定
 * @returns デモモードが有効な場合はtrue
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

/**
 * デモモード時のAPI拒否レスポンスを生成
 * @param featureName 非活性化された機能名
 * @returns エラーレスポンスオブジェクト
 */
export function createDemoModeErrorResponse(
  featureName: string
): DemoModeErrorResponse {
  return {
    error: 'feature_disabled_in_demo_mode',
    message: `The feature "${featureName}" is disabled in demo mode.`,
  }
}
