# DHGSVR25 講義解説生成システム

> **本リポジトリは [AITuber-kit](https://github.com/tegnike/aituber-kit) をベースにした講義解説生成システムです。**
>
> A web application for chatting with AI characters that anyone can easily set up and deploy.

![AITuber.png](public/backgrounds/AITuber.png)

## デモ・リンク

- **デモサイト**: https://aituberkit.shirai.as/
- **開発ブログ**: http://j.aicu.ai/s260103
- **GitHub**: https://github.com/kaitas/aituber-kit

## 概要

AIキャラクター「LuC4（全力肯定彼氏くん）」が講義スライドを自動でプレゼンテーションするシステムです。

- **プレゼンター**: LuC4 - https://luc4.aicu.jp/
- **制作**: AICU Inc.
- **講義**: DHGSVR25（人工現実2025）

## クイックスタート

### 必要環境

- Node.js 20.0.0 以上
- npm 10.0.0 以上

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/kaitas/aituber-kit.git
cd aituber-kit

# 環境変数ファイルを作成
cp .env.example .env

# .env を編集してAPIキーを設定（どれか1つでOK）
# OPENAI_API_KEY=sk-xxxxx
# ANTHROPIC_API_KEY=sk-ant-xxxxx
# GOOGLE_API_KEY=AIzaxxxxx

# パッケージインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 を開く

### その他のコマンド

```bash
npm run build    # 本番用ビルド
npm run lint     # コード品質チェック
npm test         # テスト実行
```

## おすすめ環境変数設定

Vercel などにデプロイする際の推奨設定です（APIキー除く）。

### 基本設定

| 環境変数名 | 値 | 説明 |
|-----------|-----|------|
| `NEXT_PUBLIC_SELECT_LANGUAGE` | `ja` | 言語設定 |
| `NEXT_PUBLIC_SHOW_INTRODUCTION` | `false` | 初回ダイアログ非表示 |
| `NEXT_PUBLIC_SHOW_CONTROL_PANEL` | `false` | コントロールパネル非表示 |
| `NEXT_PUBLIC_SHOW_ASSISTANT_TEXT` | `true` | 字幕表示 |

### キャラクター設定

| 環境変数名 | 値 | 説明 |
|-----------|-----|------|
| `NEXT_PUBLIC_CHARACTER_NAME` | `全力肯定彼氏くん[LuC4]` | キャラクター名 |
| `NEXT_PUBLIC_MODEL_TYPE` | `vrm` | モデルタイプ |
| `NEXT_PUBLIC_SELECTED_VRM_PATH` | `/vrm/LuC4.vrm` | VRMファイルパス |
| `NEXT_PUBLIC_FIXED_CHARACTER_POSITION` | `true` | 位置固定 |
| `NEXT_PUBLIC_CHARACTER_POSITION_X` | `0.200` | X座標 |
| `NEXT_PUBLIC_CHARACTER_POSITION_Y` | `1.616` | Y座標 |
| `NEXT_PUBLIC_CHARACTER_POSITION_Z` | `1.455` | Z座標 |
| `NEXT_PUBLIC_CHARACTER_SCALE` | `1.000` | スケール |

### AI設定

| 環境変数名 | 値 | 説明 |
|-----------|-----|------|
| `NEXT_PUBLIC_SELECT_AI_SERVICE` | `google` | AIサービス |
| `NEXT_PUBLIC_SELECT_AI_MODEL` | `gemini-2.0-flash` | AIモデル |
| `NEXT_PUBLIC_MAX_PAST_MESSAGES` | `10` | 会話履歴保持数 |
| `NEXT_PUBLIC_TEMPERATURE` | `0.7` | 応答のランダム性 |

### 音声設定

| 環境変数名 | 値 | 説明 |
|-----------|-----|------|
| `NEXT_PUBLIC_SELECT_VOICE` | `google` | 音声合成エンジン |
| `NEXT_PUBLIC_GOOGLE_TTS_TYPE` | `ja-JP-Neural2-B` | 音声タイプ |

### スライドモード設定

| 環境変数名 | 値 | 説明 |
|-----------|-----|------|
| `NEXT_PUBLIC_SLIDE_MODE` | `true` | スライドモード有効 |
| `NEXT_PUBLIC_DEFAULT_SLIDE_DOCS` | `DHGSVR25-3` | デフォルトスライド |

### アナリティクス・通知

| 環境変数名 | 値 | 説明 |
|-----------|-----|------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Google Analytics ID |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` | Slack通知URL |

### その他

| 環境変数名 | 値 | 説明 |
|-----------|-----|------|
| `NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES` | `true` | 環境変数優先 |
| `NEXT_PUBLIC_BACKGROUND_IMAGE_PATH` | `/backgrounds/AITuber.png` | 背景画像 |

## 講義スライド

| 回 | タイトル | フォルダ |
|----|---------|---------|
| 第3回 | Webポートフォリオの制作 | `/public/slides/DHGSVR25-3/` |

### スライド構成

```
/public/slides/DHGSVR25-{回}/
├── slides.md           # Marp形式スライド
├── scripts.json        # セリフデータ（感情タグ付き）
├── audio/              # 事前生成音声（MP3）
├── supplement.txt      # Q&A用補足情報
├── theme.css           # カスタムテーマ
└── DHGS25Slides{n}.png # スライド画像
```

## プレゼンテーションモード

1. 設定画面（⚙️）を開く
2. **スライドモード** をオン
3. スライドフォルダを選択
4. **開始** をクリック

LuC4が自動でスライドを説明します。

### 機能

- 事前生成MP3音声の再生
- 句読点で分割された字幕表示
- Google Analytics でページ閲覧トラッキング
- 最終ページ到達時の Slack 通知
- Ctrl+H でUIを非表示

## 本家 AITuber-kit について

詳細な機能、設定、カスタマイズについては本家リポジトリを参照してください。

- **GitHub**: https://github.com/tegnike/aituber-kit
- **ドキュメント**: https://docs.aituberkit.com/
- **デモサイト**: https://aituberkit.com

### 主な機能

- AIキャラクターとの対話
- VRM/Live2D キャラクターモデル
- 複数のLLMプロバイダー対応
- 多彩な音声合成エンジン

## ライセンス

本家 AITuber-kit のライセンスに準拠します。

- 非商用利用: 無料
- 商用利用: 別途ライセンス必要

詳細: https://github.com/tegnike/aituber-kit/blob/main/LICENSE

## リンク

- **デモサイト**: https://aituberkit.shirai.as/
- **開発ブログ**: http://j.aicu.ai/s260103
- **本家 AITuber-kit**: https://github.com/tegnike/aituber-kit
- **LuC4 公式**: https://luc4.aicu.jp/
- **AICU Inc.**: https://corp.aicu.ai/
