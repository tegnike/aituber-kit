# settingsストア バージョン付きマイグレーション基盤 設計ドキュメント

作成日: 2026-07-07（作業単位4 / F2）

## 課題

`src/features/stores/settings.ts` の `persist` 設定には `version`/`migrate` がなく、`merge` フックの中で `migratePersistedSettings` が**毎起動時に無条件で**古いフィールド名を文字列マッチ・`typeof`チェックで探す方式になっている。

- ユーザーのlocalStorageが「どの世代のスキーマか」を判別する手段がない
- 新しいマイグレーション条件を追加するたびに、既存の条件と干渉しないか目視で確認する必要がある（`migratePersistedSettings` のバグ修正が過去3連続で発生: `dcef5cef`, `77917bae`, `00f24261`）
- 完全に移行済みのユーザーでも毎回全条件を再評価しており、無駄な計算コストと「いつ削除して安全か」が不明な古い分岐が残り続ける

## 設計方針

zustand `persist` ミドルウェアが標準で提供する `version` + `migrate` オプションに乗せる。

- `version: CURRENT_SETTINGS_VERSION` を明示し、localStorageの `version` フィールドと比較。
- 既存の無条件マイグレーション条件を、**発生順に採番した独立ステップ関数**（`migrationSteps: Record<number, MigrationFn>`）に分解する。各ステップは「バージョン `N-1` → `N`」の変換のみを担当し、他のステップの内容を知らない。
- `migrate(persistedState, storedVersion)` は `storedVersion + 1` から `CURRENT_SETTINGS_VERSION` までのステップを順に適用する（`runSettingsMigrations`）。すでに最新バージョンのユーザーは `migrate` 自体が呼ばれず、起動コストがゼロになる。
- `merge` はマイグレーション後の状態と現在の初期値（env由来）を合成するだけの薄い関数に戻す。マイグレーションロジックとの責務混在を解消。

### 世代とステップの対応

現行の `migratePersistedSettings` にあった4つの無条件変換を、そのまま4ステップに分解する（意味的な変更は加えない）。

| version | 内容                                                                           |
| ------- | ------------------------------------------------------------------------------ |
| 1       | OpenAIモデル名の移行（`migrateOpenAIModelName`）                               |
| 2       | `presenceGreetingMessage`/`presenceDepartureMessage` → `*Phrases` 配列への変換 |
| 3       | `multiModalMode` → `enableMultiModal` への変換                                 |
| 4       | ゲーム実況設定のデフォルト補完 + 廃止フィールド（video buffer/delay）の削除    |
| 5       | OpenAI Audioモデル名の移行（`migrateOpenAIModelName`）                         |
| 6       | 保存済みOpenAI `reasoningEffort`を選択モデルの対応値へ補正                     |
| 7       | 廃止予定の文字起こしモデルを後継スナップショットへ移行                         |
| 8       | 廃止予定のRealtime APIモデルを2.1系の後継モデルへ移行                          |

導入前のユーザーは `version: 0`（zustandがオプション未指定時に自動付与する値）から全ステップを順に適用する。現在は `version: 8` として保存され、以降は新しいステップが追加されるまで再評価されない。

### 後方互換性

- `migrate` はロールバック（保存バージョン > `CURRENT_SETTINGS_VERSION`）でもクラッシュしないよう、ループ条件で自然にno-opとする。
- 各ステップは元の条件分岐をそのまま移植しており、`typeof`/`undefined` チェックによる冪等性を保つ。二重適用されても安全（テストで担保）。
- 新しいマイグレーションが必要になった場合は `CURRENT_SETTINGS_VERSION` をインクリメントし、`migrationSteps` に新しい番号のステップを追加するだけでよい。既存ステップの変更は不要。

## 完了条件（本ドキュメントのスコープ）

- [x] `version`/`migrate` を導入し、既存4条件をステップ関数に分解
- [x] 世代ごとのlocalStorageフィクスチャテスト（version 0〜5 → 6への遷移を検証）
- [x] 最新バージョンのデータに対して `migrate` が呼ばれない（=不要な再計算をしない）ことのテスト
- [x] `.env.example` とsettingsStoreのデフォルト値（`NEXT_PUBLIC_*`）の整合性を検出する静的テスト（S14）

`.env.example` のスキーマ自動生成（ロードマップで「理想」とされている、schema→`.env.example`生成）は本スコープに含めない。441キーの完全なスキーマ駆動化は別タスクとする。今回はドリフト検出（コードで参照されているのに`.env.example`にない変数、またはその逆）のみを静的テストとして追加する。
