# 環境変数一覧

## 概要

このページでは、AITuberKitで使用できるすべての環境変数を説明します。これらの環境変数は、`.env`ファイルに設定することで、アプリケーションの動作をカスタマイズできます。

::: tip
すべての環境変数のサンプルは `.env.example` ファイルに記載されています。このファイルをコピーして `.env` ファイルを作成してください。
:::

## 基本設定

詳細については[基本設定](/guide/basic-settings)をご覧ください。

```bash
# デフォルト言語の設定（以下のいずれかの値を指定）
# ja: 日本語, en: 英語, ko: 韓国語, zh: 中国語(繁体字), vi: ベトナム語
# fr: フランス語, es: スペイン語, pt: ポルトガル語, de: ドイツ語
# ru: ロシア語, it: イタリア語, ar: アラビア語, hi: ヒンディー語, pl: ポーランド語
NEXT_PUBLIC_SELECT_LANGUAGE=en

# 背景画像のパス
NEXT_PUBLIC_BACKGROUND_IMAGE_PATH=/bg-c.png

# 回答欄の表示設定（true/false）
NEXT_PUBLIC_SHOW_ASSISTANT_TEXT=true

# キャラクター名表示設定（true/false）
NEXT_PUBLIC_SHOW_CHARACTER_NAME=true

# 操作パネル表示設定（true/false）
NEXT_PUBLIC_SHOW_CONTROL_PANEL=true
```

## キャラクター設定

詳細については[キャラクター設定](/guide/character/common)をご覧ください。

### 共通設定

```bash
# キャラクター名
NEXT_PUBLIC_CHARACTER_NAME=ニケちゃん

# 使用するモデルタイプ（vrm または live2d）
NEXT_PUBLIC_MODEL_TYPE=vrm

# システムプロンプト
NEXT_PUBLIC_SYSTEM_PROMPT="あなたはニケという名前のAIアシスタントです。親しみやすく、明るい性格で話してください。適宜次のような感情タグを使って表情や声のトーンを変えてください。[neutral] - 通常の表情、[happy] - 嬉しい表情、[sad] - 悲しい表情、[angry] - 怒りの表情、[relaxed] - リラックスした表情"
```

### VRM設定

```bash
# 選択するVRMモデルのパス
NEXT_PUBLIC_SELECTED_VRM_PATH=/vrm/default.vrm
```

### Live2D設定

```bash
# 選択するLive2Dモデルのモデルファイルのパス
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

詳細については[AI設定](/guide/ai/common)をご覧ください。

### 共通設定

```bash
# AIサービスの選択
# openai, anthropic, google, azure, groq, cohere,
# mistralai, perplexity, fireworks, deepseek, localLlm, dify
NEXT_PUBLIC_SELECT_AI_SERVICE=openai

# 選択するAIモデル名
NEXT_PUBLIC_SELECT_AI_MODEL=gpt-4o-2024-11-20

# 過去のメッセージ保持数
NEXT_PUBLIC_MAX_PAST_MESSAGES=10

# 会話のランダム性を調整する温度パラメータ（0.0～2.0）
NEXT_PUBLIC_TEMPERATURE=0.7

# 最大トークン数
NEXT_PUBLIC_MAX_TOKENS=4096
```

### AIサービス設定

```bash
# OpenAI API キー
OPENAI_API_KEY=sk-...

# Anthropic API キー
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini API キー
GOOGLE_API_KEY=...

# サーチグラウンディング機能の有効化
NEXT_PUBLIC_USE_SEARCH_GROUNDING=true

# Azure OpenAI API キー
AZURE_API_KEY=...
# Azure OpenAI エンドポイント
AZURE_ENDPOINT="https://RESOURCE_NAME.openai.azure.com/openai/deployments/DEPLOYMENT_NAME/chat/completions?api-version=API_VERSION"

# Groq API キー
GROQ_API_KEY=...

# Cohere API キー
COHERE_API_KEY=...

# Mistral AI API キー
MISTRALAI_API_KEY=...

# Perplexity API キー
PERPLEXITY_API_KEY=...

# Fireworks API キー
FIREWORKS_API_KEY=...

# DeepSeek API キー
DEEPSEEK_API_KEY=...

# ローカルLLM URL
# ex. Ollama: http://localhost:11434/v1/chat/completions
# ex. LM Studio: http://localhost:1234/v1/chat/completions
NEXT_PUBLIC_LOCAL_LLM_URL=""
# ローカルLLMモデル
NEXT_PUBLIC_LOCAL_LLM_MODEL=""

# Dify API キー
DIFY_API_KEY=""
# Dify API URL
DIFY_URL=""
```

### リアルタイムAPI設定

```bash
# リアルタイムAPIモードの有効化
NEXT_PUBLIC_REALTIME_API_MODE=false

# Realtime APIを利用する場合はフロントエンドの環境変数に設定
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
NEXT_PUBLIC_AZURE_API_KEY=...
NEXT_PUBLIC_AZURE_ENDPOINT=...

# リアルタイムAPIモードのコンテンツタイプ（input_text or input_audio）
NEXT_PUBLIC_REALTIME_API_MODE_CONTENT_TYPE=input_text

# リアルタイムAPIモードの音声
# OpenAI: alloy, coral, echo, verse, ballad, ash, shimmer, sage
# Azure: alloy, amuch, breeze, cove, dan, echo, elan, ember, jupiter, marilyn, shimmer
NEXT_PUBLIC_REALTIME_API_MODE_VOICE=alloy
```

### オーディオモード設定

```bash
# オーディオモードの有効化
NEXT_PUBLIC_AUDIO_MODE=false

# Audio APIを利用する場合はフロントエンドの環境変数に設定
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# オーディオモードの入力タイプ（input_text or input_audio）
NEXT_PUBLIC_AUDIO_MODE_INPUT_TYPE=input_text

# オーディオモードの音声（alloy, coral, echo, verse, ballad, ash, shimmer, sage）
NEXT_PUBLIC_AUDIO_MODE_VOICE=alloy
```

### 外部連携モード設定

```bash
# 外部連携モードの有効化
NEXT_PUBLIC_EXTERNAL_LINKAGE_MODE=true
```

## 音声設定

詳細については[音声設定](/guide/voice-settings)をご覧ください。

```bash
# 使用する音声合成エンジン
# voicevox, koeiromap, google, stylebertvits2, aivis_speech,
# gsvitts, elevenlabs, openai, azure, nijivoice
NEXT_PUBLIC_SELECT_VOICE=voicevox

# VOICEVOX
# サーバーURL
VOICEVOX_SERVER_URL=http://localhost:50021
# 話者ID
NEXT_PUBLIC_VOICEVOX_SPEAKER=46
# 速度
NEXT_PUBLIC_VOICEVOX_SPEED=1.0
# ピッチ
NEXT_PUBLIC_VOICEVOX_PITCH=0.0
# 抑揚
NEXT_PUBLIC_VOICEVOX_INTONATION=1.0

# Koeiromap
# APIキー
NEXT_PUBLIC_KOEIROMAP_KEY=

# Google Text-to-Speech
# 認証用のJSONファイルのパス
GOOGLE_APPLICATION_CREDENTIALS="./credentials.json"
# APIキー
GOOGLE_TTS_KEY=""
# 言語/モデル設定
NEXT_PUBLIC_GOOGLE_TTS_TYPE=

# Style-Bert-VITS2
# サーバーURL
STYLEBERTVITS2_SERVER_URL=""
# APIキー
STYLEBERTVITS2_API_KEY=""
# モデルID
NEXT_PUBLIC_STYLEBERTVITS2_MODEL_ID=0
# スタイル
NEXT_PUBLIC_STYLEBERTVITS2_STYLE=Neutral
# SDP/DP混合比
NEXT_PUBLIC_STYLEBERTVITS2_SDP_RATIO=0.2
# 話速
NEXT_PUBLIC_STYLEBERTVITS2_LENGTH=1.0

# AivisSpeech
# サーバーURL
AIVIS_SPEECH_SERVER_URL=http://localhost:10101
# 話者ID
NEXT_PUBLIC_AIVIS_SPEECH_SPEAKER=888753760
# 速度
NEXT_PUBLIC_AIVIS_SPEECH_SPEED=1.0
# ピッチ
NEXT_PUBLIC_AIVIS_SPEECH_PITCH=0.0
# 抑揚
NEXT_PUBLIC_AIVIS_SPEECH_INTONATION=1.0

# GSVI TTS
# サーバーURL
NEXT_PUBLIC_GSVI_TTS_URL=http://127.0.0.1:5000/tts
# モデルID
NEXT_PUBLIC_GSVI_TTS_MODEL_ID=0
# バッチサイズ
NEXT_PUBLIC_GSVI_TTS_BATCH_SIZE=2
# 話速
NEXT_PUBLIC_GSVI_TTS_SPEECH_RATE=1.0

# ElevenLabs
# APIキー
ELEVENLABS_API_KEY=""
# ボイスID
ELEVENLABS_VOICE_ID=""

# OpenAI TTS
# APIキー
OPENAI_TTS_KEY=""
# ボイスタイプ
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# モデル
NEXT_PUBLIC_OPENAI_TTS_MODEL=tts-1
# 話速
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0

# Azure OpenAPI TTS
# APIキー
AZURE_TTS_KEY=""
# エンドポイント
AZURE_TTS_ENDPOINT=""
# ボイスタイプ
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# 話速
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0

# にじボイス
# APIキー
NIJIVOICE_API_KEY=""
# 話者ID
NEXT_PUBLIC_NIJIVOICE_ACTOR_ID=""
# 話速
NEXT_PUBLIC_NIJIVOICE_SPEED=1.0
# 感情レベル
NEXT_PUBLIC_NIJIVOICE_EMOTIONAL_LEVEL=0.0
# 音声の長さ
NEXT_PUBLIC_NIJIVOICE_SOUND_DURATION=1.0
```

## YouTube設定

詳細については[YouTube設定](/guide/youtube-settings)をご覧ください。

```bash
# YouTubeモードを有効にするかどうか（true/false）
NEXT_PUBLIC_YOUTUBE_MODE=false

# YouTubeのAPIキー
NEXT_PUBLIC_YOUTUBE_API_KEY=

# YouTubeのライブ配信ID
NEXT_PUBLIC_YOUTUBE_LIVE_ID=
```

## スライド設定

詳細については[スライド設定](/guide/slide-settings)をご覧ください。

```bash
# スライドモードの初期状態を設定します（true/false）
NEXT_PUBLIC_SLIDE_MODE=false
```

## その他の設定

### 高度な設定

詳細については[高度な設定](/guide/other/advanced-settings)をご覧ください。

```bash
# 背景映像の使用設定（true/false）
NEXT_PUBLIC_USE_VIDEO_AS_BACKGROUND=false

# 英単語を日本語で読み上げる設定（true/false）
NEXT_PUBLIC_CHANGE_ENGLISH_TO_JAPANESE=false

# タイムスタンプ含有設定（true/false）
NEXT_PUBLIC_INCLUDE_TIMESTAMP_IN_USER_MESSAGE=false

# 無音検出タイムアウト（秒）
NEXT_PUBLIC_NO_SPEECH_TIMEOUT=2.0
```

### API設定

詳細については[API設定](/guide/other/message-receiver)をご覧ください。

```bash
# 外部指示受け付け有効化設定（true/false）
NEXT_PUBLIC_MESSAGE_RECEIVER_ENABLED=false
```

### その他

```bash
# 紹介画面の表示設定（true/false）
NEXT_PUBLIC_SHOW_INTRODUCTION="true"
```
