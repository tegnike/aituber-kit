# コードスタイル・規約

## TypeScript設定
- `strict: true`（厳格モード）
- `target: "es2015"`
- パスエイリアス: `@/*` → `./src/*`

## コードフォーマット（Prettier）
- シングルクォート: `true`
- セミコロン: `false`
- トレイリングカンマ: `"es5"`
- エンドオブライン: `"auto"`

## ESLint設定
- `next/core-web-vitals`
- `prettier`プラグイン使用
- Prettierエラーをエラーとして扱う

## ディレクトリ構成
- `/src/components/` - Reactコンポーネント
- `/src/features/` - 機能別コアロジック
- `/src/pages/api/` - Next.js APIルート
- `/src/stores/` - Zustand状態管理
- `/src/types/` - TypeScript型定義
- `/src/utils/` - ユーティリティ関数

## 設計パターン
- ファクトリーパターン（AIプロバイダー管理）
- 機能別ディレクトリ分割
- TypeScriptの型安全性重視