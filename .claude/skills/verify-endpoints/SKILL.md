---
name: verify-endpoints
description: 全AIプロバイダーのAPIエンドポイント（チャット・TTS・STT・Embedding）を動作確認し、レポートを出力する。
allowed-tools: Read, Bash, Grep, Glob, Task, Write
user-invocable: true
---

# AIプロバイダー エンドポイント動作確認スキル

全てのAIプロバイダーのエンドポイントに対してテストリクエストを送信し、動作状況をレポートします。

## 前提条件

- 開発サーバーが `http://localhost:3000` で起動していること
- `.env` または `.env.local` ファイルにAPIキーが設定されていること

## 実行手順

### 1. 開発サーバーの確認

まずサーバーが起動しているか確認します：

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ --max-time 5
```

- `200` が返れば起動中
- それ以外の場合は、ユーザーに `npm run dev` でサーバーを起動するよう案内して中断

### 2. 環境変数の確認

`.env` ファイルを読み込み、設定済みのAPIキーを特定します。以下の環境変数をチェック：

| プロバイダー | 環境変数                                 |
| ------------ | ---------------------------------------- |
| OpenAI       | `OPENAI_API_KEY`                         |
| Anthropic    | `ANTHROPIC_API_KEY`                      |
| Google       | `GOOGLE_API_KEY`                         |
| Azure        | `AZURE_API_KEY` + `AZURE_ENDPOINT`       |
| xAI          | `XAI_API_KEY`                            |
| Groq         | `GROQ_API_KEY`                           |
| Cohere       | `COHERE_API_KEY`                         |
| Mistral AI   | `MISTRALAI_API_KEY`                      |
| Perplexity   | `PERPLEXITY_API_KEY`                     |
| Fireworks    | `FIREWORKS_API_KEY`                      |
| DeepSeek     | `DEEPSEEK_API_KEY`                       |
| OpenRouter   | `OPENROUTER_API_KEY`                     |
| Dify         | `DIFY_API_KEY` + `DIFY_URL`              |
| OpenAI TTS   | `OPENAI_TTS_KEY` または `OPENAI_API_KEY` |
| Azure TTS    | `AZURE_TTS_KEY` + `AZURE_TTS_ENDPOINT`   |
| ElevenLabs   | `ELEVENLABS_API_KEY`                     |
| Cartesia     | `CARTESIA_API_KEY`                       |
| Google TTS   | `GOOGLE_TTS_KEY`                         |
| Koeiromap    | `NEXT_PUBLIC_KOEIROMAP_KEY`              |
| Aivis Cloud  | `AIVIS_CLOUD_API_KEY`                    |

**値が空文字列(`""`)のものは「未設定」として扱う。**

### 3. AIチャットエンドポイントのテスト（非ストリーミング）

`/api/ai/vercel/` エンドポイントに対して、設定済みの各プロバイダーでテストリクエストを送信します。

**注意: Next.jsの `trailingSlash: true` 設定により、全APIルートでトレイリングスラッシュ (`/`) が必須。スラッシュなしの場合 308 リダイレクトが返る。本スキル内の全curlコマンドはこれに対応済み。**

#### リクエスト形式

```bash
curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/ai/vercel/ \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello, respond with just OK"}],
    "aiService": "<SERVICE_NAME>",
    "model": "<DEFAULT_MODEL>",
    "stream": false,
    "temperature": 0.5,
    "maxTokens": 50
  }' \
  --max-time 30
```

#### 各プロバイダーのデフォルトモデル

| サービス名 | aiService    | デフォルトモデル                                    |
| ---------- | ------------ | --------------------------------------------------- |
| OpenAI     | `openai`     | `gpt-4.1-mini`                                      |
| Anthropic  | `anthropic`  | `claude-sonnet-4-5`                                 |
| Google     | `google`     | `gemini-2.5-flash`                                  |
| Azure      | `azure`      | ※ endpointのdeployment名を使用                      |
| xAI        | `xai`        | `grok-4`                                            |
| Groq       | `groq`       | `llama-3.3-70b-versatile`                           |
| Cohere     | `cohere`     | `command-a-03-2025`                                 |
| Mistral AI | `mistralai`  | `mistral-large-latest`                              |
| Perplexity | `perplexity` | `sonar-pro`                                         |
| Fireworks  | `fireworks`  | `accounts/fireworks/models/llama-v3p3-70b-instruct` |
| DeepSeek   | `deepseek`   | `deepseek-chat`                                     |
| OpenRouter | `openrouter` | `openai/gpt-4.1-mini`                               |

**判定基準：**

- HTTPステータス `200` かつレスポンスにテキストが含まれていれば **成功**
- HTTPステータス `400` で `EmptyAPIKey` → **APIキー未設定**（スキップ扱い）
- その他のエラー → **失敗**（エラーメッセージを記録）

### 4. AIチャットエンドポイントのテスト（ストリーミング）

主要プロバイダーについて、ストリーミングモード (`stream: true`) でも正常にレスポンスが返るか確認します。
ストリーミング固有の問題（イベント形式の不備、reasoning-delta欠落など）を検知する目的。

#### リクエスト形式

```bash
curl -s -N -X POST http://localhost:3000/api/ai/vercel/ \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Say OK"}],
    "aiService": "<SERVICE_NAME>",
    "model": "<DEFAULT_MODEL>",
    "stream": true,
    "temperature": 0.5,
    "maxTokens": 50
  }' \
  --max-time 30
```

**対象プロバイダー**: `openai`, `anthropic`, `google`（主要3社のみ）

**判定基準：**

- レスポンスに `"type":"text-delta"` が1つ以上含まれていれば **成功**
- 空レスポンスまたはエラーJSON → **失敗**

### 5. Reasoningストリーミングテスト

推論（reasoning/thinking）モードが正常に動作し、`reasoning-delta` イベントがストリーミングされることを確認します。

#### 5.1 OpenAI Reasoning（`o4-mini`）

条件：`OPENAI_API_KEY` が設定済み

```bash
curl -s -N -X POST http://localhost:3000/api/ai/vercel/ \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What is 15 multiplied by 17? Think carefully."}],
    "aiService": "openai",
    "model": "o4-mini",
    "stream": true,
    "reasoningMode": true,
    "reasoningEffort": "medium",
    "temperature": 1.0,
    "maxTokens": 512
  }' \
  --max-time 30
```

**判定基準：**

- ストリームに `"type":"reasoning-delta"` が1つ以上含まれていれば **成功**
- `reasoning-start` → `reasoning-end` のみで `reasoning-delta` がない → **失敗**（`providerOptions` に `reasoningSummary` が設定されていない可能性）
- エラーレスポンス → **失敗**

#### 5.2 Anthropic Thinking（`claude-3-7-sonnet-latest`）

条件：`ANTHROPIC_API_KEY` が設定済み

```bash
curl -s -N -X POST http://localhost:3000/api/ai/vercel/ \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What is 15 multiplied by 17?"}],
    "aiService": "anthropic",
    "model": "claude-3-7-sonnet-latest",
    "stream": true,
    "reasoningMode": true,
    "reasoningTokenBudget": 4096,
    "temperature": 1.0,
    "maxTokens": 512
  }' \
  --max-time 30
```

**判定基準：**

- ストリームに `"type":"reasoning-delta"` が1つ以上含まれていれば **成功**
- `reasoning-delta` がない → **失敗**
- エラーレスポンス → **失敗**

#### 5.3 Google Thinking（`gemini-2.5-flash`）

条件：`GOOGLE_API_KEY` が設定済み

```bash
curl -s -N -X POST http://localhost:3000/api/ai/vercel/ \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What is 15 multiplied by 17?"}],
    "aiService": "google",
    "model": "gemini-2.5-flash",
    "stream": true,
    "reasoningMode": true,
    "reasoningTokenBudget": 4096,
    "temperature": 1.0,
    "maxTokens": 512
  }' \
  --max-time 30
```

**判定基準：**

- ストリームに `"type":"reasoning-delta"` が1つ以上含まれていれば **成功**
- `reasoning-delta` がない → **失敗**
- エラーレスポンス → **失敗**

### 6. Difyエンドポイントのテスト

`DIFY_API_KEY` と `DIFY_URL` の両方が設定されている場合のみ実行：

```bash
curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/difyChat/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Hello, respond with just OK",
    "stream": false,
    "conversationId": ""
  }' \
  --max-time 30
```

### 7. カスタムAPIエンドポイントのテスト

`/api/ai/custom` エンドポイントは外部APIのURLが必要なため、自動テストはスキップする。
レポートには「外部URL未指定のためスキップ」と記載する。

### 8. TTSエンドポイントのテスト

各TTSエンドポイントにテストリクエストを送信します。短いテキスト「テスト」を使用。

#### 8.1 OpenAI TTS (`/api/openAITTS`)

条件：`OPENAI_TTS_KEY` または `OPENAI_API_KEY` が設定済み

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/openAITTS/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "テスト",
    "voice": "shimmer",
    "model": "tts-1",
    "speed": 1.0
  }' \
  --max-time 30
```

成功: ステータス `200`

#### 8.2 Azure OpenAI TTS (`/api/azureOpenAITTS`)

条件：`AZURE_TTS_KEY` と `AZURE_TTS_ENDPOINT` が設定済み

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/azureOpenAITTS/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "テスト",
    "voice": "alloy",
    "speed": 1.0
  }' \
  --max-time 30
```

#### 8.3 ElevenLabs (`/api/elevenLabs`)

条件：`ELEVENLABS_API_KEY` が設定済み

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/elevenLabs/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "test"
  }' \
  --max-time 30
```

#### 8.4 Google TTS (`/api/tts-google`)

条件：`GOOGLE_TTS_KEY` が設定済み

```bash
curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/tts-google/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "テスト",
    "ttsType": "ja-JP-Wavenet-A",
    "languageCode": "ja-JP"
  }' \
  --max-time 30
```

#### 8.5 Cartesia (`/api/cartesia`)

条件：`CARTESIA_API_KEY` が設定済み

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/cartesia/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "test",
    "language": "en"
  }' \
  --max-time 30
```

#### 8.6 Koeiromap (`/api/tts-koeiromap`)

条件：`NEXT_PUBLIC_KOEIROMAP_KEY` が設定済み

```bash
curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/tts-koeiromap/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "テスト",
    "speakerX": 0,
    "speakerY": 0,
    "style": "talk",
    "apiKey": ""
  }' \
  --max-time 30
```

※ `apiKey` は `.env` から取得した `NEXT_PUBLIC_KOEIROMAP_KEY` の値を使う

#### 8.7 Aivis Cloud API (`/api/tts-aivis-cloud-api`)

条件：`AIVIS_CLOUD_API_KEY` と `NEXT_PUBLIC_AIVIS_CLOUD_MODEL_UUID` が設定済み

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/tts-aivis-cloud-api/ \
  -H "Content-Type: application/json" \
  -d '{
    "text": "テスト",
    "modelUuid": "<MODEL_UUID>",
    "speed": 1.0
  }' \
  --max-time 30
```

#### 8.8 VOICEVOX (`/api/tts-voicevox`) - ローカルサービス

条件：VOICEVOXエンジンが起動しているか確認（デフォルト `localhost:50021`）

```bash
# まずローカルサーバーの稼働確認
curl -s -o /dev/null -w "%{http_code}" http://localhost:50021/version --max-time 5
```

起動中の場合のみテスト：

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/tts-voicevox/ \
  -H "Content-Type: application/json" \
  -d '{
    "text": "テスト",
    "speaker": 46,
    "speed": 1.0,
    "pitch": 0,
    "intonation": 1.0
  }' \
  --max-time 30
```

※ `speaker` は `.env` の `NEXT_PUBLIC_VOICEVOX_SPEAKER` の値を使用。`pitch` と `intonation` は必須パラメータ（未指定だと500エラー）。

#### 8.9 AivisSpeech (`/api/tts-aivisspeech`) - ローカルサービス

条件：AivisSpeechエンジンが起動しているか確認（デフォルト `localhost:10101`）

```bash
# まずローカルサーバーの稼働確認
curl -s -o /dev/null -w "%{http_code}" http://localhost:10101/version --max-time 5
```

起動中の場合のみテスト：

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/tts-aivisspeech/ \
  -H "Content-Type: application/json" \
  -d '{
    "text": "テスト",
    "speaker": 633572448,
    "speed": 1.0,
    "pitch": 0,
    "intonationScale": 1.0
  }' \
  --max-time 30
```

※ `speaker` は `.env` の `NEXT_PUBLIC_AIVIS_SPEECH_SPEAKER` の値を使用。`pitch` と `intonationScale` は必須パラメータ（未指定だと500エラー）。VOICEVOXでは `intonation`、AivisSpeechでは `intonationScale` とパラメータ名が異なる点に注意。

#### 8.10 Style-Bert-VITS2 (`/api/stylebertvits2`)

条件：`STYLEBERTVITS2_SERVER_URL` が設定済み（ローカルの場合はサーバー稼働確認も行う）

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/stylebertvits2/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "テスト",
    "stylebertvits2ModelId": "0",
    "stylebertvits2Style": "Neutral",
    "stylebertvits2SdpRatio": "0.2",
    "stylebertvits2Length": "1.0",
    "selectLanguage": "ja"
  }' \
  --max-time 30
```

**注意: GSVI TTSはクライアントサイドから直接外部サーバーを呼び出す方式のため、Next.js APIルートが存在しない。テスト対象外。**

### 9. Embeddingエンドポイントのテスト (`/api/embedding`)

条件：`OPENAI_API_KEY` が設定済み

```bash
curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/embedding/ \
  -H "Content-Type: application/json" \
  -d '{
    "text": "テスト"
  }' \
  --max-time 30
```

### 10. ローカルLLMサービスの確認

#### 10.1 Ollama

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:11434/api/tags --max-time 5
```

#### 10.2 LM Studio

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:1234/v1/models --max-time 5
```

稼働している場合は利用可能なモデル一覧も取得して表示する。

### 11. レポート出力

全テスト完了後、`reports/endpoints/` ディレクトリにMarkdownレポートを出力します。

**ファイル名**: `reports/endpoints/verify-YYYY-MM-DD-HHmmss.md`

#### レポート形式

```markdown
# AIプロバイダー エンドポイント動作確認レポート

実行日時: YYYY-MM-DD HH:mm:ss

## サマリー

| カテゴリ           | 成功  | 失敗  | スキップ | 合計  |
| ------------------ | ----- | ----- | -------- | ----- |
| AIチャット(batch)  | X     | X     | X        | X     |
| AIチャット(stream) | X     | X     | X        | X     |
| Reasoning          | X     | X     | X        | X     |
| TTS                | X     | X     | X        | X     |
| その他             | X     | X     | X        | X     |
| **合計**           | **X** | **X** | **X**    | **X** |

## AIチャットエンドポイント（非ストリーミング）

| プロバイダー | モデル            | ステータス  | 詳細          |
| ------------ | ----------------- | ----------- | ------------- |
| OpenAI       | gpt-4.1-mini      | ✅ 成功     | 200 OK        |
| Anthropic    | claude-sonnet-4-5 | ✅ 成功     | 200 OK        |
| Google       | gemini-2.5-flash  | ❌ 失敗     | 403 Forbidden |
| Azure        | -                 | ⏭️ スキップ | APIキー未設定 |
| ...          | ...               | ...         | ...           |

## AIチャットエンドポイント（ストリーミング）

| プロバイダー | モデル            | ステータス | 詳細                    |
| ------------ | ----------------- | ---------- | ----------------------- |
| OpenAI       | gpt-4.1-mini      | ✅ 成功    | text-delta イベント確認 |
| Anthropic    | claude-sonnet-4-5 | ✅ 成功    | text-delta イベント確認 |
| Google       | gemini-2.5-flash  | ❌ 失敗    | ストリームが空          |
| ...          | ...               | ...        | ...                     |

## Reasoningストリーミング

| プロバイダー | モデル                   | ステータス | reasoning-delta数 | 詳細                    |
| ------------ | ------------------------ | ---------- | ----------------- | ----------------------- |
| OpenAI       | o4-mini                  | ✅ 成功    | 45                | reasoning-delta確認済み |
| Anthropic    | claude-3-7-sonnet-latest | ✅ 成功    | 12                | reasoning-delta確認済み |
| Google       | gemini-2.5-flash         | ❌ 失敗    | 0                 | reasoning-delta未検出   |
| ...          | ...                      | ...        | ...               | ...                     |

## TTSエンドポイント

| プロバイダー | エンドポイント    | ステータス  | 詳細                   |
| ------------ | ----------------- | ----------- | ---------------------- |
| OpenAI TTS   | /api/openAITTS    | ✅ 成功     | 200 OK                 |
| VOICEVOX     | /api/tts-voicevox | ✅ 成功     | ローカルサーバー稼働中 |
| ElevenLabs   | /api/elevenLabs   | ⏭️ スキップ | APIキー未設定          |
| ...          | ...               | ...         | ...                    |

## ローカルサービス

| サービス    | URL             | ステータス | 詳細          |
| ----------- | --------------- | ---------- | ------------- |
| VOICEVOX    | localhost:50021 | ✅ 稼働中  | version X.X.X |
| AivisSpeech | localhost:10101 | ❌ 停止中  | 接続不可      |
| Ollama      | localhost:11434 | ✅ 稼働中  | N個のモデル   |
| LM Studio   | localhost:1234  | ❌ 停止中  | 接続不可      |

## その他

| エンドポイント | ステータス  | 詳細                        |
| -------------- | ----------- | --------------------------- |
| Embedding      | ✅ 成功     | 200 OK                      |
| Custom API     | ⏭️ スキップ | 外部URL未指定のためスキップ |

## エラー詳細

(失敗したテストの詳細なエラーメッセージをここに記載)
```

## 実行上の注意

- **APIコストに注意**: 各プロバイダーへのリクエストで少額のAPI利用料が発生する可能性がある（Reasoningテストは推論トークンを消費するため通常より高コスト）
- **タイムアウト**: 各リクエストは30秒のタイムアウトを設定
- **テストデータ**: 最小限のリクエスト（「テスト」「OK」等の短文）を使用してコストを最小化
- **並列実行禁止**: APIのレートリミットを避けるため、テストは順次実行する
- **ローカルサービス**: まずポートの疎通確認を行い、応答がない場合は即座にスキップ
- **トレイリングスラッシュ**: Next.jsの `trailingSlash: true` 設定により、**全APIルート**でトレイリングスラッシュ必須（なしだと308リダイレクト）
- **GSVI TTS**: クライアントサイド直接呼び出し方式のため、APIルートが存在しない。テスト対象外
- **Custom API**: 外部URLの指定が必要なため、自動テストはスキップ。レポートにはスキップとして記載

## テスト対象外のAPIルート

以下のエンドポイントはAIプロバイダーの動作確認の範囲外のため、このスキルではテストしない：

- `/api/ai/custom` - カスタムAPI（外部URL必須のためスキップ）
- `/api/whisper` - 音声認識（音声ファイル入力が必要）
- `/api/messages` - メッセージ処理
- `/api/get-vrm-list`, `/api/get-live2d-list`, `/api/get-pngtuber-list` - モデル一覧取得
- `/api/get-background-list`, `/api/get-image-list` - アセット一覧取得
- `/api/upload-image`, `/api/delete-image`, `/api/upload-vrm-list`, `/api/upload-background` - アセット管理
- `/api/update-voicevox-speakers`, `/api/update-aivis-speakers` - スピーカー情報更新
- `/api/getSlideFolders`, `/api/updateSlideData`, `/api/convertSlide` - スライド機能
- `/api/getSupplement`, `/api/convertMarkdown` - コンテンツ変換
- `/api/memory-files`, `/api/memory-restore` - メモリ管理
- `/api/save-chat-log` - チャットログ保存
- `/api/youtube/continuation` - YouTube連携

## 引数

`$ARGUMENTS` を使って動作を制御できます：

- `chat` - AIチャットエンドポイントのみテスト（batch + stream）
- `tts` - TTSエンドポイントのみテスト
- `reasoning` - Reasoningストリーミングテストのみ
- `local` - ローカルサービスの確認のみ
- `<provider名>` - 特定のプロバイダーのみテスト（例: `openai`, `voicevox`）
- 引数なし - 全エンドポイントをテスト
