# 環境変数一覧

このページでは、AITuberKitで使用できるすべての環境変数を説明します。これらの環境変数は、`.env`ファイルに設定することで、アプリケーションの動作をカスタマイズできます。

::: tip
すべての環境変数のサンプルは `.env.example` ファイルに記載されています。このファイルをコピーして `.env` ファイルを作成してください。
:::

## 言語設定

```bash
# デフォルト言語の設定（以下のいずれかの値を指定）
# ja: 日本語, en: 英語, ko: 韓国語, zh: 中国語(繁体字), vi: ベトナム語
# fr: フランス語, es: スペイン語, pt: ポルトガル語, de: ドイツ語
# ru: ロシア語, it: イタリア語, ar: アラビア語, hi: ヒンディー語, pl: ポーランド語
NEXT_PUBLIC_SELECT_LANGUAGE=en
```

## 背景設定

```bash
# 背景画像のパス（公開ディレクトリからの相対パス）
NEXT_PUBLIC_BACKGROUND_IMAGE_PATH=/bg-c.png

# 動画を背景として使用するかどうか（true/false）
NEXT_PUBLIC_USE_VIDEO_AS_BACKGROUND=false
```

## キャラクター設定

### 基本設定

```bash
# キャラクター名
NEXT_PUBLIC_CHARACTER_NAME=AITuber

# 使用するモデルタイプ（vrm または live2d）
NEXT_PUBLIC_MODEL_TYPE=vrm

# システムプロンプト
NEXT_PUBLIC_SYSTEM_PROMPT="あなたはAITuberという名前のAIアシスタントです。親しみやすく、明るい性格で話してください。適宜次のような感情タグを使って表情や声のトーンを変えてください。[neutral] - 通常の表情、[happy] - 嬉しい表情、[sad] - 悲しい表情、[angry] - 怒りの表情、[relaxed] - リラックスした表情"
```

### VRMモデル設定

```bash
# 選択するVRMモデルのパス
NEXT_PUBLIC_SELECTED_VRM_PATH=/vrm/default.vrm
```

### Live2Dモデル設定

```bash
# 選択するLive2Dモデルのパス
NEXT_PUBLIC_SELECTED_LIVE2D_PATH=/live2d/modername/model3.json

# 感情設定（カンマ区切りで複数指定可能）
NEXT_PUBLIC_NEUTRAL_EMOTIONS=Neutral
NEXT_PUBLIC_HAPPY_EMOTIONS=Happy,Happy2
NEXT_PUBLIC_SAD_EMOTIONS=Sad,Sad2,Troubled
NEXT_PUBLIC_ANGRY_EMOTIONS=Angry,Focus
NEXT_PUBLIC_RELAXED_EMOTIONS=Relaxed

# モーショングループ設定
NEXT_PUBLIC_IDLE_MOTION_GROUP=Idle
NEXT_PUBLIC_NEUTRAL_MOTION_GROUP=Neutral
NEXT_PUBLIC_HAPPY_MOTION_GROUP=Happy
NEXT_PUBLIC_SAD_MOTION_GROUP=Sad
NEXT_PUBLIC_ANGRY_MOTION_GROUP=Angry
NEXT_PUBLIC_RELAXED_MOTION_GROUP=Relaxed
```

## AI設定

### AIサービス選択

```bash
# AIサービスの選択
# 選択肢: openai, anthropic, google, azure, groq, cohere, mistralai, perplexity, fireworks, localLlm, dify, deepseek
NEXT_PUBLIC_SELECT_AI_SERVICE=openai

# 選択したAIサービスのモデル
NEXT_PUBLIC_SELECT_AI_MODEL=gpt-4o-2024-11-20

# 過去のメッセージ保持数
NEXT_PUBLIC_MAX_PAST_MESSAGES=10

# 会話のランダム性を調整する温度パラメータ（0.0～2.0）
NEXT_PUBLIC_TEMPERATURE=0.7
```

### APIキー

```bash
# OpenAI API キー
OPENAI_API_KEY=

# Anthropic API キー
ANTHROPIC_API_KEY=

# Google API キー
GOOGLE_API_KEY=

# Azure OpenAI API キー
AZURE_API_KEY=

# Azure OpenAI エンドポイント
AZURE_API_ENDPOINT=

# Groq API キー
GROQ_API_KEY=

# Cohere API キー
COHERE_API_KEY=

# Mistral AI API キー
MISTRALAI_API_KEY=

# Perplexity API キー
PERPLEXITY_API_KEY=

# Fireworks API キー
FIREWORKS_API_KEY=

# DeepSeek API キー
DEEPSEEK_API_KEY=

# Dify API キー
DIFY_API_KEY=
```

### リアルタイムAPIモード

```bash
# リアルタイムAPIモードの有効化
NEXT_PUBLIC_REALTIME_API_MODE=false

# リアルタイムAPIモードのコンテンツタイプ（input_text or input_audio）
NEXT_PUBLIC_REALTIME_API_MODE_CONTENT_TYPE=input_text

# リアルタイムAPIモードの音声
# OpenAI: alloy, echo, fable, onyx, nova, shimmer
# Azure OpenAI: alloy, amuch, breeze, cove, dan, echo, elan, ember, jupiter, marilyn, shimmer
NEXT_PUBLIC_REALTIME_API_MODE_VOICE=alloy
```

### オーディオモード

```bash
# オーディオモードの有効化
NEXT_PUBLIC_AUDIO_MODE=false

# オーディオモードの入力タイプ（input_text or input_audio）
NEXT_PUBLIC_AUDIO_MODE_INPUT_TYPE=input_text

# オーディオモードの音声（alloy, echo, fable, onyx, nova, shimmer）
NEXT_PUBLIC_AUDIO_MODE_VOICE=alloy
```

### 外部連携モード

```bash
# 外部連携モードの有効化
NEXT_PUBLIC_EXTERNAL_LINKAGE_MODE=false
```

### マルチモーダル設定

```bash
# サーチグラウンディング機能の有効化（Google Gemini 1.5 / 2.0 モデルのみ対応）
NEXT_PUBLIC_USE_SEARCH_GROUNDING=false
```

### 追加サービス設定

```bash
# ローカルLLM URL
NEXT_PUBLIC_LOCAL_LLM_URL=http://localhost:8000

# Dify API URL
NEXT_PUBLIC_DIFY_URL=https://api.dify.ai/v1

# Dify会話ID（空の場合は新規会話を開始）
NEXT_PUBLIC_DIFY_CONVERSATION_ID=
```

## YouTube設定

```bash
# YouTubeモードを有効にするかどうか
NEXT_PUBLIC_YOUTUBE_MODE=false

# YouTube API キー
NEXT_PUBLIC_YOUTUBE_API_KEY=

# YouTube ライブ配信ID
NEXT_PUBLIC_YOUTUBE_LIVE_ID=
```

## 音声設定

### 合成音声エンジン選択

```bash
# 使用する音声合成エンジン
# 選択肢: voicevox, koeiromap, google, stylebertvits2, aivis_speech, gsvitts, elevenlabs, openai, azure, nijivoice
NEXT_PUBLIC_SELECT_VOICE=voicevox

# 英単語を日本語で読み上げるかどうか（true/false）
NEXT_PUBLIC_CHANGE_ENGLISH_TO_JAPANESE=false

# 無音検出タイムアウト（秒）- 0秒で無効化
NEXT_PUBLIC_NO_SPEECH_TIMEOUT=3.0
```

### VOICEVOXの設定

```bash
# VOICEVOX話者ID
NEXT_PUBLIC_VOICEVOX_SPEAKER=46

# VOICEVOX速度
NEXT_PUBLIC_VOICEVOX_SPEED=1.0

# VOICEVOXピッチ
NEXT_PUBLIC_VOICEVOX_PITCH=0.0

# VOICEVOX抑揚
NEXT_PUBLIC_VOICEVOX_INTONATION=1.0
```

### Koeiromapの設定

```bash
# Koeiromap APIキー
NEXT_PUBLIC_KOEIROMAP_KEY=
```

### Google TTSの設定

```bash
# Google TTSの言語/モデル設定
NEXT_PUBLIC_GOOGLE_TTS_TYPE=
```

### Style-Bert-VITS2の設定

```bash
# モデルID
NEXT_PUBLIC_STYLEBERTVITS2_MODEL_ID=0

# スタイル
NEXT_PUBLIC_STYLEBERTVITS2_STYLE=Neutral

# SDP/DP混合比
NEXT_PUBLIC_STYLEBERTVITS2_SDP_RATIO=0.2

# 話速
NEXT_PUBLIC_STYLEBERTVITS2_LENGTH=1.0
```

### AivisSpeechの設定

```bash
# 話者ID
NEXT_PUBLIC_AIVIS_SPEECH_SPEAKER=888753760

# 話速
NEXT_PUBLIC_AIVIS_SPEECH_SPEED=1.0

# 音高
NEXT_PUBLIC_AIVIS_SPEECH_PITCH=0.0

# 抑揚
NEXT_PUBLIC_AIVIS_SPEECH_INTONATION=1.0
```

### GSVI TTSの設定

```bash
# サーバーURL
NEXT_PUBLIC_GSVI_TTS_URL=http://127.0.0.1:5000/tts

# モデルID
NEXT_PUBLIC_GSVI_TTS_MODEL_ID=0

# バッチサイズ
NEXT_PUBLIC_GSVI_TTS_BATCH_SIZE=2

# 話速
NEXT_PUBLIC_GSVI_TTS_SPEECH_RATE=1.0
```

### OpenAI TTSの設定

```bash
# ボイスタイプ（alloy, echo, fable, onyx, nova, shimmer）
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer

# モデル（tts-1, tts-1-hd）
NEXT_PUBLIC_OPENAI_TTS_MODEL=tts-1

# 話速
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0
```

## スライド設定

```bash
# スライドモードの初期状態を設定します（true/false）
NEXT_PUBLIC_SLIDE_MODE=false
```

## その他の設定

### 高度な設定

```bash
# アシスタントテキスト表示設定（true/false）
NEXT_PUBLIC_SHOW_ASSISTANT_TEXT=true

# キャラクター名表示設定（true/false）
NEXT_PUBLIC_SHOW_CHARACTER_NAME=true

# 英単語を日本語で読み上げる設定（true/false）
NEXT_PUBLIC_CHANGE_ENGLISH_TO_JAPANESE=false

# 操作パネル表示設定（true/false）
NEXT_PUBLIC_SHOW_CONTROL_PANEL=true

# ユーザー発言にタイムスタンプを含める設定（true/false）
NEXT_PUBLIC_INCLUDE_TIMESTAMP_IN_USER_MESSAGE=false

# 無音検出タイムアウト（秒）
NEXT_PUBLIC_NO_SPEECH_TIMEOUT=2.0

# 背景映像の使用設定（true/false）
NEXT_PUBLIC_USE_VIDEO_AS_BACKGROUND=false
```

### メッセージレシーバー設定

```bash
# メッセージレシーバー機能の有効化設定（true/false）
NEXT_PUBLIC_MESSAGE_RECEIVER_ENABLED=false

# クライアントID（自動生成される値）
NEXT_PUBLIC_CLIENT_ID=
```

::: tip
詳細な設定内容については、各設定ページを参照してください：

- @AIサービス設定
- @リアルタイムAPI設定
- @外部連携モード設定
- @音声設定
- @その他の設定
  :::
