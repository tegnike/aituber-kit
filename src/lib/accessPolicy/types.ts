/**
 * 統一アクセスポリシーの型定義
 *
 * 設計ドキュメント: docs/access-policy-design.md
 *
 * 注意: このファイルと routePolicies.ts は WAF 生成スクリプト
 * (scripts/waf/generate-waf-rules.mjs) が Node の type stripping で
 * 直接 import するため、消去可能な TS 構文のみを使用し（enum 禁止）、
 * ランタイム import を持たないこと。
 */

export type ApiHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

/**
 * ルートがアクセスするリソースの分類
 * - server-secret: サーバーenv由来のAPIキー・エンドポイント・接続先URL
 * - server-url: クライアント指定URLへのサーバー側fetch（SSRF面）
 * - fs-read: ファイルシステム読み取り
 * - fs-write: ファイル書き込み・削除
 * - external-control: 外部制御API（キャラクター操作）
 * - client-proxy: クライアント持ち込みキーの中継のみ（保護リソースなし）
 */
export type ApiResource =
  | 'server-secret'
  | 'server-url'
  | 'fs-read'
  | 'fs-write'
  | 'external-control'
  | 'client-proxy'

/**
 * usesServerSecret 判定の1ペア:
 * クライアントが key を提供せず、envVars のいずれかが設定されていれば
 * サーバー秘匿リソースを使うと判定する。
 *
 * onlyIfAbsent（S18）: 指定した場合、そのフィールド（別の source/key）を
 * クライアントが提供しているとこのペア自体を評価しない（false扱い）。
 * 「他フィールドが未指定の場合のみenvを見る」という条件結合
 * （difyChat.ts の apiKey 判定が url 未指定時のみ有効、等）を表現するための
 * ゲート条件。参照先の値自体は envVars 判定には使わない。
 */
export type SecretPair = {
  source: 'body' | 'query'
  key: string
  envVars: string[]
  onlyIfAbsent?: { source: 'body' | 'query'; key: string }
}

/**
 * server-secret ガードの発動方式
 * - none: ガード不要（サーバー秘匿リソースを使わない）
 * - pairs: SecretPair の宣言的評価で発動を判定
 * - always: 無条件で guardServerSecretAccess を通す
 * - dynamic: ルート内で gate.guardServerSecret() を呼ぶ義務を負う
 *   （宣言的に表現できない解決ロジックを持つルート専用）
 */
export type SecretPolicy =
  | { kind: 'none' }
  | { kind: 'pairs'; pairs: SecretPair[] }
  | { kind: 'always' }
  | { kind: 'dynamic' }

/**
 * クライアント指定サーバーURLの検証宣言。
 * 解決順: クライアント値 → envVar → defaultUrl
 */
export type ServerUrlPolicy = {
  source: 'body' | 'query'
  key: string
  envVar: string
  defaultUrl: string
}

/**
 * 制限モード（NEXT_PUBLIC_RESTRICTED_MODE=true）時の挙動
 * - deny: ラッパー内で403（feature_disabled_in_restricted_mode）
 * - in-route: ルート側でマニフェストfallback等を実施
 * - none: 制限モードと無関係
 */
export type RestrictedBehavior = 'deny' | 'in-route' | 'none'

export type WafPolicy = {
  /** aituberkit-protected-api-clearance ルールの対象パス */
  challenge?: boolean
  /** aituberkit-nikechan-embed-skip ルールで許可するAPIパス */
  embedAllowed?: boolean
}

export type RoutePolicy = {
  /** '/api/...' 形式。src/pages/api 配下のファイルパスと一致すること（静的テストで検証） */
  path: string
  /** guardServerSecretAccess の featureName（現行値を維持） */
  featureName: string
  /** 制限モード拒否時の機能名（featureName と異なる場合のみ指定） */
  restrictedFeatureName?: string
  methods: ApiHttpMethod[]
  resources: ApiResource[]
  secret: SecretPolicy
  serverUrl?: ServerUrlPolicy
  restrictedBehavior: RestrictedBehavior
  /** external-control ルートの Bearer 認証（v1系）。legacy無認証の /api/messages は未指定 */
  requiresApiKey?: true
  waf?: WafPolicy
}
