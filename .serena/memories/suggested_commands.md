# 推奨コマンド

## 開発コマンド
```bash
npm run dev         # 開発サーバー起動 (http://localhost:3000)
npm run dev-https   # HTTPS開発サーバー起動
npm run build       # 本番用ビルド
npm run start       # 本番サーバー起動（build後）
npm run desktop     # Electronデスクトップアプリ実行
```

## テスト・品質管理
```bash
npm test            # テスト実行
npm run test:watch  # テスト監視モード
npm run test:coverage # カバレッジ付きテスト
npm run lint        # ESLint実行
npm run lint:fix    # ESLint自動修正
npm run format      # Prettier実行
```

## 一括コマンド（タスク完了時推奨）
```bash
npm run lint:fix && npm run format && npm run build
```

## セットアップ
```bash
npm install         # 依存関係インストール
cp .env.example .env # 環境変数設定
```

## システムコマンド（macOS）
- `ls` - ファイル一覧
- `cd` - ディレクトリ移動
- `grep` - テキスト検索
- `find` - ファイル検索