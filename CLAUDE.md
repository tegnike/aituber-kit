# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## プロジェクト概要

AITuberKitは、インタラクティブなAIキャラクターをVTuber機能付きで作成するためのWebアプリケーションツールキットです。16種類のAIプロバイダー、3種類のキャラクターモデル（VRM/Live2D/PNGTuber）、11種類の音声合成エンジンをサポートし、YouTube配信、キオスクモード、人感検知など多彩な機能を備えています。

## よく使うコマンド

### 開発

```bash
npm run dev           # 開発サーバーを起動 (http://localhost:3000)
npm run dev-https     # HTTPS付き開発サーバー
npm run build         # 本番用ビルド
npm run start         # ビルド+本番サーバーを起動
npm run desktop       # Electronデスクトップアプリとして実行（dev+electron並列起動）
```

### テスト・品質

```bash
npm test              # すべてのテストを実行
npm run test:watch    # テストウォッチモード
npm run test:coverage # カバレッジ付きテスト
npm run lint:fix && npm run format && npm run build  # lint修正+フォーマット+ビルドを一括実行
```

### セットアップ

```bash
npm install           # 依存関係をインストール
cp .env.example .env  # 環境変数を設定
```

**動作要件**: Node.js `24.x`、npm `^11.6.2`

## アーキテクチャ

### 技術スタック

- **フレームワーク**: Next.js ^15.5.9 + React 18.3.1
- **言語**: TypeScript 5.0.2（strictモード）
- **スタイリング**: Tailwind CSS ^3.4.19（CSS変数ベースの6テーマ対応、darkMode: class）
- **状態管理**: Zustand 4.5.4（persist + 排他制御ミドルウェア）
- **AI SDK**: Vercel AI SDK ^6.0.6 + 各プロバイダーSDK
- **3Dレンダリング**: Three.js ^0.167.1 + @pixiv/three-vrm ^3.4.4
- **2Dレンダリング**: pixi.js ^7.4.2 + pixi-live2d-display-lipsyncpatch
- **テスト**: Jest ^29.7.0 + React Testing Library ^16.3.1
- **Lint/Format**: ESLint ^9.39.2（Flat Config）+ Prettier ^3.7.4
- **i18n**: i18next ^23.6.0 + react-i18next（16言語対応）
- **デスクトップ**: Electron ^39.2.7

### ディレクトリ構造

```
src/
├── __mocks__/              # テスト用モック（canvas, Three.js等）
├── __tests__/              # テストファイル（機能別に分類）
├── components/             # UIコンポーネント
│   ├── common/             # 共通コンポーネント
│   └── settings/           # 設定画面（14タブ構成）
│       └── modelProvider/  # AIプロバイダー設定サブコンポーネント
├── constants/              # 定数定義
├── features/               # コアビジネスロジック
│   ├── chat/               # AIチャット（ファクトリーパターン）
│   ├── constants/          # AI モデル定義・設定型
│   ├── emoteController/    # 感情表現・表情制御（VRM用）
│   ├── idle/               # アイドルモード
│   ├── kiosk/              # キオスクモード
│   ├── lipSync/            # リップシンク解析
│   ├── memory/             # RAG/長期記憶（IndexedDB + Embedding）
│   ├── messages/           # メッセージ処理・TTS音声合成（11エンジン）
│   ├── pngTuber/           # PNGTuberエンジン
│   ├── presence/           # 人感検知型定義
│   ├── slide/              # スライド機能
│   ├── stores/             # Zustandストア群
│   ├── vrmViewer/          # VRM 3Dビューア
│   └── youtube/            # YouTube連携
├── hooks/                  # カスタムフック（音声認識、テーマ、キオスク等）
├── lib/                    # ライブラリ
│   ├── VRMAnimation/       # VRMアニメーション読み込み・再生
│   ├── VRMLookAtSmootherLoaderPlugin/  # VRM視線スムージング
│   ├── api-services/       # APIサービス実装
│   └── mastra/             # Mastra AIワークフロー（YouTube会話継続）
├── pages/                  # Next.jsページ・APIルート
│   └── api/                # APIエンドポイント（AI, TTS, STT, ファイル管理等）
├── styles/                 # グローバルCSS
├── types/                  # カスタム型定義
└── utils/                  # ユーティリティ（WebSocket, 音声処理, テキスト処理等）
```

### AIチャットシステム

**ファクトリーパターン**: `aiChatFactory.ts` → 設定に基づきプロバイダーを自動選択

| ルーティング                      | 対応プロバイダー                                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `vercelAIChat.ts` (Vercel AI SDK) | openai, anthropic, google, azure, xai, groq, cohere, mistralai, perplexity, fireworks, deepseek, openrouter, lmstudio, ollama, custom-api |
| `openAIAudioChat.ts`              | openai（audioMode時）                                                                                                                     |
| `difyChat.ts`                     | dify                                                                                                                                      |

**サーバー側**: `/api/ai/vercel.ts`（Edge Runtime、`createAIRegistry`で動的プロバイダー登録）

**モデル管理** (`/src/features/constants/aiModels.ts`):

- `ModelInfo` 属性ベース管理（multiModal, reasoningEfforts, reasoningTokenBudget）
- `modelDefinitions` マスターデータから `aiModels`, `defaultModels`, `multiModalModels` を導出
- ヘルパー関数群: `isMultiModalModel()`, `isReasoningModel()`, `isSearchGroundingModel()` 等

### 音声合成（TTS）- 11エンジン

| エンジン         | synthesizeファイル                | APIルート                  |
| ---------------- | --------------------------------- | -------------------------- |
| VOICEVOX         | `synthesizeVoiceVoicevox.ts`      | `/api/tts-voicevox`        |
| AivisSpeech      | `synthesizeVoiceAivisSpeech.ts`   | `/api/tts-aivisspeech`     |
| Aivis Cloud API  | `synthesizeVoiceAivisCloudApi.ts` | `/api/tts-aivis-cloud-api` |
| Koeiromap        | `synthesizeVoiceKoeiromap.ts`     | `/api/tts-koeiromap`       |
| Google TTS       | `synthesizeVoiceGoogle.ts`        | `/api/tts-google`          |
| Style-Bert-VITS2 | `synthesizeStyleBertVITS2.ts`     | `/api/stylebertvits2`      |
| GSVI TTS         | `synthesizeVoiceGSVI.ts`          | 直接呼び出し               |
| ElevenLabs       | `synthesizeVoiceElevenlabs.ts`    | `/api/elevenLabs`          |
| Cartesia         | `synthesizeVoiceCartesia.ts`      | `/api/cartesia`            |
| OpenAI TTS       | `synthesizeVoiceOpenAI.ts`        | `/api/openAITTS`           |
| Azure OpenAI TTS | `synthesizeVoiceAzureOpenAI.ts`   | `/api/azureOpenAITTS`      |

### 音声認識（STT）- 3モード

| モード          | フック                           | 技術                                     |
| --------------- | -------------------------------- | ---------------------------------------- |
| ブラウザ        | `useBrowserSpeechRecognition.ts` | Web Speech API                           |
| Whisper         | `useWhisperRecognition.ts`       | OpenAI Whisper API                       |
| リアルタイムAPI | `useRealtimeVoiceAPI.ts`         | OpenAI Realtime API + Web Speech API併用 |

統合フック: `useVoiceRecognition.ts` が設定に基づき自動選択

### キャラクターモデル - 3タイプ

| タイプ      | 技術                          | 主要ファイル                                         |
| ----------- | ----------------------------- | ---------------------------------------------------- |
| VRM (3D)    | Three.js + @pixiv/three-vrm   | `features/vrmViewer/model.ts`, `viewer.ts`           |
| Live2D (2D) | pixi.js + pixi-live2d-display | `components/Live2DComponent.tsx`, `live2DViewer.tsx` |
| PNGTuber    | Canvas描画                    | `features/pngTuber/pngTuberEngine.ts`                |

**発話フロー**: `speakCharacter()` → `SpeakQueue`（シングルトン、セッションID管理） → モデル別再生

### 状態管理（Zustand ストア）

| ストア         | ファイル                            | 永続化 | 役割                                                   |
| -------------- | ----------------------------------- | ------ | ------------------------------------------------------ |
| settingsStore  | `features/stores/settings.ts`       | ○      | 全設定（APIKeys, ModelProvider, Character, General等） |
| homeStore      | `features/stores/home.ts`           | △      | チャットログ、ビューアインスタンス、処理状態           |
| menuStore      | `features/stores/menu.ts`           | ×      | UI表示状態、アクティブタブ                             |
| slideStore     | `features/stores/slide.ts`          | △      | スライド再生状態                                       |
| toastStore     | `features/stores/toast.ts`          | ×      | 通知管理                                               |
| imagesStore    | `features/stores/images.ts`         | △      | 画像配置・レイヤー管理                                 |
| websocketStore | `features/stores/websocketStore.ts` | ×      | WebSocket接続管理                                      |

**排他制御システム** (`exclusionMiddleware.ts` + `exclusionRules.ts`):
17のルールで設定間の相互排他性を保証（例: realtimeAPIMode ON → audioMode OFF）

### 特殊機能

#### Realtime API (`components/useRealtimeAPI.tsx`)

- OpenAI/Azure Realtime APIへのWebSocket接続
- PCM16音声フォーマット、function calling対応
- 対応モデル: `gpt-realtime`, `gpt-realtime-mini`

#### RAG/長期記憶 (`features/memory/`)

- IndexedDB + OpenAI `text-embedding-3-small`（1536次元）
- コサイン類似度ベースの検索 → システムプロンプトに自動追記
- ファイルベースのバックアップ/復元対応

#### YouTube連携 (`features/youtube/`)

- YouTube Data API v3 / わんコメ（OneComme）の2ソース
- Mastraワークフローによる会話継続モード（状態評価→継続/新トピック/スリープ分岐）

#### キオスクモード (`features/kiosk/`)

- デジタルサイネージ向けフルスクリーン表示
- パスコード認証、NGワードフィルタ、入力長制限、ガイダンスメッセージ

#### 人感検知 (`hooks/usePresenceDetection.ts`)

- face-api.js（TinyFaceDetectorモデル）によるカメラ顔検出
- 状態遷移: idle → detected → greeting → conversation-ready → idle
- 感度設定（low:500ms/medium:300ms/high:150ms）、挨拶/離脱フレーズ

#### アイドルモード (`features/idle/`, `hooks/useIdleMode.ts`)

- 3つの発話ソース: 定型フレーズ、時間帯別挨拶、AI自動生成
- インターバル（10-300秒）でキャラクターが自動発話

#### スライド機能 (`features/slide/`)

- Marpit（Markdown→HTML+CSS）形式のプレゼンテーション
- 自動再生モード（スクリプト読み上げ→次スライド遷移）

#### AIエージェント/ツール

- Realtime API: function calling（`realtimeAPITools.json/tsx`、現在: 天気取得）
- Vercel AI SDK: ツールイベント処理（`tool-input-*`, `tool-output-available`）
- Mastra: YouTube会話継続ワークフロー（`/src/lib/mastra/`）

### 設定画面（14タブ）

description, based, character, ai, voice, speechInput, youtube, slide, images, memory, presence, idle, kiosk, other

## 開発ガイドライン

### コーディング規約

- 既存のUI/UXデザインを無断で変更しない
- 明示的な許可なくパッケージバージョンをアップグレードしない
- 機能追加前に重複実装がないか確認する
- 既存のディレクトリ構成に従う
- **パスエイリアス**: `@/*` → `./src/*`
- **コードスタイル**: シングルクォート、セミコロンなし、ES5トレイリングカンマ（Prettier設定）

### 言語ファイル更新ルール

- **言語ファイルの更新は日本語（`/locales/ja/`）のみ行う**
- 他の言語ファイル（en、ko、zh-CN、zh-TW等）は手動で更新しない
- 翻訳は別途専用のプロセスで管理される
- 対応16言語: ja, en, zh-CN, zh-TW, ko, vi, fr, es, pt, de, ru, it, ar, hi, pl, th

### テスト

- テストは`src/__tests__/`ディレクトリに配置（機能別にサブディレクトリ）
- Node.js環境用にcanvas、Three.jsをモック化済み
- Jestのパターンマッチで特定テストを実行可能
- テスト環境: `jest-environment-jsdom` + `ts-jest`

### 環境変数

- 必要なAPIキーは利用機能によって異なります。全てのオプションは`.env.example`を参照
- **設定画面の項目を追加・更新した場合は、`.env.example`の適切な項目にも追加すること**
- サーバーサイドAPIキー（`OPENAI_API_KEY`等）とフロントエンド設定（`NEXT_PUBLIC_*`）を区別
- settingsStoreのほぼ全設定項目が`NEXT_PUBLIC_*`環境変数で初期値を設定可能

### 新しいAIプロバイダーの追加

1. `@ai-sdk/*` パッケージを追加
2. `/src/pages/api/ai/vercel.ts` の `createAIRegistry` にプロバイダーを登録
3. `/src/features/constants/settings.ts` の `AIService` 型にサービス名を追加
4. `/src/features/constants/aiModels.ts` の `modelDefinitions` にモデル情報を追加
5. `/src/features/chat/aiChatFactory.ts` のルーティングに追加（Vercel AI SDK対応ならそのまま）
6. 設定画面コンポーネントにUIを追加

### 新しいTTSエンジンの追加

1. `/src/features/messages/synthesizeVoice*.ts` に合成関数を作成
2. `/src/pages/api/` にAPIルートを作成（必要に応じて）
3. `/src/features/constants/settings.ts` の `AIVoice` 型にエンジン名を追加
4. `/src/features/messages/speakCharacter.ts` の分岐に追加
5. 設定画面の `voice.tsx` にUI追加

### 排他制御ルールの追加

新しいモード設定を追加する場合、`/src/features/stores/exclusionRules.ts` に排他制御ルールを追加し、相互排他的な設定の整合性を保証すること。

## 重要な注意事項

- **Electron本番モード**: `electron.mjs`の本番モードファイルパスがプレースホルダーのまま（開発用途のみ）
- **Live2D Cubism Core**: `public/scripts/live2dcubismcore.min.js` を動的ロード（ライセンス制約あり）
- **デモモード**: `demoMode.ts` によるデモモード判定機能あり
- **ストアマイグレーション**: `settingsStore` の `onRehydrateStorage` でOpenAIモデル名マイグレーション等を実行

## ライセンスについて

- v2.0.0以降は独自ライセンス
- 非商用利用は無料
- 商用利用には別途ライセンスが必要
- キャラクターモデルの利用には個別のライセンスが必要
