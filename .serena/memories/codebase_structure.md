# コードベース構造

## 主要ディレクトリ構成
```
src/
├── components/     # Reactコンポーネント（VRMビューア、Live2D、チャットUI）
├── features/       # 機能別コアロジック
│   ├── chat/       # チャット機能（AIプロバイダー連携）
│   ├── messages/   # 音声合成（13種類のTTSエンジン）
│   ├── vrmViewer/  # VRM（3D）モデル管理
│   ├── constants/  # 定数・設定値
│   └── stores/     # Zustand状態管理
├── pages/          # Next.jsページ・APIルート
├── types/          # TypeScript型定義
├── utils/          # ユーティリティ関数
└── hooks/          # Reactカスタムフック
```

## 重要なファイル
- `aiChatFactory.ts` - AIプロバイダーファクトリー
- `aiModels.ts` - 動的モデル属性管理
- `speakQueue.ts` - TTS再生キュー管理
- `WebSocketManager.ts` - リアルタイム機能

## 設計パターン
- ファクトリーパターン（AI連携）
- メッセージキューパターン（音声処理）
- 機能別分離（features/）
- 型安全性重視（TypeScript strict）