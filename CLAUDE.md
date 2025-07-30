# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## プロジェクト概要

AITuberKitは、インタラクティブなAIキャラクターをVTuber機能付きで作成するためのWebアプリケーションツールキットです。複数のAIプロバイダー、キャラクターモデル（VRM/Live2D）、音声合成エンジンをサポートしています。

## よく使うコマンド

### 開発

```bash
npm run dev         # 開発サーバーを起動 (http://localhost:3000)
npm run build       # 本番用ビルド
npm run start       # 本番サーバーを起動
npm run desktop     # Electronデスクトップアプリとして実行
```

### テスト・品質

```bash
npm test           # すべてのテストを実行
npm run lint:fix && npm run format && npm run build  # lint修正+フォーマット+ビルドを一括実行
```

### セットアップ

```bash
npm install        # 依存関係をインストール（Node.js 20.0.0+、npm 10.0.0+が必要）
cp .env.example .env  # 環境変数を設定
```

## アーキテクチャ

### 技術スタック

- **フレームワーク**: Next.js 14.2.5 + React 18.3.1
- **言語**: TypeScript 5.0.2（strictモード）
- **スタイリング**: Tailwind CSS 3.4.14
- **状態管理**: Zustand 4.5.4
- **テスト**: Jest + React Testing Library

### 主なディレクトリ

- `/src/components/` - Reactコンポーネント（VRMビューア、Live2D、チャットUI）
- `/src/features/` - コアロジック（チャット、音声合成、メッセージ）
- `/src/pages/api/` - Next.js APIルート
- `/src/stores/` - Zustandによる状態管理
- `/public/` - 静的アセット（モデル、背景など）

### AI連携ポイント

- **チャット**: `/src/features/chat/` - 複数プロバイダー対応のファクトリーパターン
- **音声**: `/src/features/messages/synthesizeVoice*.ts` - 13種類のTTSエンジン
- **モデル**: VRM（3D）は`/src/features/vrmViewer/`、Live2D（2D）もサポート

### 重要なパターン

1. **AIプロバイダーファクトリー**: `aiChatFactory.ts`が各LLMプロバイダーを管理し、`/src/features/constants/aiModels.ts`で動的な属性ベースのモデル管理を実現
2. **メッセージキュー**: `speakQueue.ts`がTTS再生を順次処理し、マルチモーダル対応のため動的なモデル属性チェックを実施
3. **WebSocket**: `/src/utils/WebSocketManager.ts`でリアルタイム機能を提供
4. **i18n**: `next-i18next`による多言語対応

## 開発ガイドライン

### .cursorrulesより

- 既存のUI/UXデザインを無断で変更しない
- 明示的な許可なくパッケージバージョンをアップグレードしない
- 機能追加前に重複実装がないか確認する
- 既存のディレクトリ構成に従う
- APIクライアントは`app/lib/api/client.ts`に集約すること

### 言語ファイル更新ルール

- **言語ファイルの更新は日本語（`/locales/ja/`）のみ行う**
- 他の言語ファイル（en、ko、zh等）は手動で更新しない
- 翻訳は別途専用のプロセスで管理される

### テスト

- テストは`__tests__`ディレクトリに配置
- Node.js環境用にcanvasをモック化済み
- Jestのパターンマッチで特定テストを実行可能

### 環境変数

必要なAPIキーは利用機能によって異なります（OpenAI、Google、Azure等）。全てのオプションは`.env.example`を参照してください。

**設定画面の項目を追加・更新した場合は、必要に応じて新しい環境変数を`.env.example`の適切な項目に追加してください。**

## ライセンスについて

- v2.0.0以降は独自ライセンス
- 非商用利用は無料
- 商用利用には別途ライセンスが必要
- キャラクターモデルの利用には個別のライセンスが必要
