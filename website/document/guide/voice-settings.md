# 音声設定

## 概要

音声設定では、AIキャラクターの音声合成に関する設定を行います。様々な音声合成エンジンを選択し、声質やパラメータを調整することができます。

```bash
# 使用する音声合成エンジン
# voicevox, koeiromap, google, stylebertvits2, aivis_speech,
# gsvitts, elevenlabs, openai, azure, nijivoice
NEXT_PUBLIC_SELECT_VOICE=voicevox
```

::: warning 注意
リアルタイムAPIモードまたはオーディオモードが有効な場合、音声設定は使用されません。
:::

## 合成音声エンジンの選択

AIキャラクターが使用する音声合成エンジンを選択します。以下のエンジンがサポートされています：

- VOICEVOX：日本語に特化した高品質な音声合成エンジン
- Koeiromap：日本語向けの感情表現が豊かな音声合成エンジン
- Google Text-to-Speech：多言語に対応したGoogle Cloud Text-to-Speechサービス
- Style-Bert-VITS2：スタイル制御可能な高品質音声合成エンジン（日・英・中対応）
- AivisSpeech：Style-Bert-VITS2モデルが簡単に使用できる日本語音声合成エンジン
- GSVI TTS：カスタマイズ可能な音声合成エンジン
- ElevenLabs：多言語に対応した高品質音声合成サービス
- OpenAI TTS：多言語に対応したOpenAIの音声合成サービス
- Azure TTS：Microsoft Azureが提供する多言語音声合成サービス
- にじボイス：100種類以上の声を利用できる日本語向け音声合成サービス

## VOICEVOX

```bash
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
```

[VOICEVOX](https://voicevox.hiroshiba.jp/)は日本語に特化した高品質な音声合成エンジンです。

### サーバーURL

VOICEVOX Engine APIにアクセスするためのURLを設定します。ローカルでVOICEVOXを実行している場合の標準的なURLは `http://localhost:50021` です。

### 話者選択

VOICEVOXで利用可能な話者から選択します。「ボイスを試聴する」ボタンで選択した話者の音声をテスト再生できます。

### 音声パラメータ調整

- **話速**：0.5〜2.0の範囲で調整可能（値が大きいほど速く話します）
- **音高**：-0.15〜0.15の範囲で調整可能（値が大きいほど高い声になります）
- **抑揚**：0.0〜2.0の範囲で調整可能（値が大きいほど抑揚が強くなります）

## Koeiromap

```bash
# APIキー
NEXT_PUBLIC_KOEIROMAP_KEY=
```

[Koeiromap](https://koemotion.rinna.co.jp)は、日本語向けの感情表現が豊かな音声合成エンジンです。現在はKoemotionという名称に変更されています。

### APIキー

Koeiromap APIを使用するためのAPIキーを設定します。APIキーは[Koemotion](https://koemotion.rinna.co.jp)から取得できます。

### プリセットと調整

- **プリセット**：「かわいい」「元気」「かっこいい」「渋い」のプリセットから選択できます
- **x軸**：-10〜10の範囲で声質を調整します
- **y軸**：-10〜10の範囲で声質を調整します

## Google Text-to-Speech

```bash
# 認証用のJSONファイルのパス
GOOGLE_APPLICATION_CREDENTIALS="./credentials.json"
# APIキー
GOOGLE_TTS_KEY=""
# 言語/モデル設定
NEXT_PUBLIC_GOOGLE_TTS_TYPE=
```

Google Cloud Text-to-Speechは多言語に対応した音声合成サービスです。

### 設定

- **言語選択**：使用する言語/音声モデルを設定します
- **認証**：APIキーまたは認証用のJSONファイル（credentials.json）が必要です

詳細な音声モデルは[Google Cloud公式ドキュメント](https://cloud.google.com/text-to-speech/docs/voices)を参照してください。

## Style-Bert-VITS2

```bash
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
```

[Style-Bert-VITS2](https://github.com/litagin02/Style-Bert-VITS2)は、スタイル制御が可能な高品質音声合成エンジンです。日本語、英語、中国語に対応しています。

### サーバーURL

Style-Bert-VITS2サーバーのURLを設定します。

### APIキー

RunPod用で起動した場合に必要な項目です。基本的には設定不要です。

### 音声パラメータ調整

- **モデルID**：使用するモデルのIDを指定します
- **スタイル**：音声のスタイルを指定します（例：Neutral）
- **SDP/DP混合比**：0.0〜1.0の範囲で調整可能
- **話速**：0.0〜2.0の範囲で調整可能

## AivisSpeech

```bash
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
```

[AivisSpeech](https://aivis-project.com/)は日本語音声合成エンジンです。

### サーバーURL

AivisSpeechサーバーのURLを設定します。ローカルでAivisSpeechを実行している場合の標準的なURLは `http://localhost:10101` です。

### 話者選択

AivisSpeechで利用可能な話者から選択します。「話者リストを更新」ボタンで最新の話者リストを取得できます。

### 音声パラメータ調整

- **話速**：0.5〜2.0の範囲で調整可能（値が大きいほど速く話します）
- **話者選択**：利用可能な話者から選択します
- **話速**：0.5〜2.0の範囲で調整可能
- **音高**：-0.15〜0.15の範囲で調整可能
- **抑揚**：0.0〜2.0の範囲で調整可能

## GSVI TTS

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

GSVI TTSはカスタマイズ可能な音声合成エンジンです。

### サーバーURL

GSVI TTSサーバーのURLを設定します。ローカルでGSVI TTSを実行している場合の標準的なURLは `http://127.0.0.1:5000/tts` です。

### 音声パラメータ調整

- **モデルID**：使用するモデルのIDを指定します
- **バッチサイズ**：推論速度に影響します（1〜100、大きいほど速いが、メモリ使用量も増加）
- **話速**：0.5〜2.0の範囲で調整可能

## ElevenLabs

```bash
# APIキー
ELEVENLABS_API_KEY=""
# ボイスID
ELEVENLABS_VOICE_ID=""
```

[ElevenLabs](https://elevenlabs.io/api)は多言語に対応した高品質音声合成サービスです。

### APIキー

ElevenLabs APIを使用するためのAPIキーを設定します。

### ボイスID

使用する音声のIDを設定します（[ElevenLabs API](https://api.elevenlabs.io/v1/voices)から確認できます）

## OpenAI TTS

```bash
# APIキー
OPENAI_TTS_KEY=""
# ボイスタイプ
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# モデル
NEXT_PUBLIC_OPENAI_TTS_MODEL=tts-1
# 話速
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0
```

OpenAIの提供する多言語音声合成サービスです。

### APIキー

OpenAI APIを使用するためのAPIキーを設定します。

### 音声パラメータ調整

- **ボイスタイプ**：alloy、echo、fable、onyx、nova、shimmerから選択可能
- **モデル**：tts-1（標準）またはtts-1-hd（高品質）から選択可能
- **話速**：0.25〜4.0の範囲で調整可能

## Azure OpenAPI TTS

```bash
# APIキー
AZURE_TTS_KEY=""
# エンドポイント
AZURE_TTS_ENDPOINT=""
# ボイスタイプ
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# 話速
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0
```

Microsoft Azureが提供する多言語音声合成サービスです。

### APIキー

Azure TTS APIキーを設定します。

### エンドポイント

Azure TTSのエンドポイントURLを設定します。

### 音声パラメータ調整

- **ボイスタイプ**：使用する音声タイプを選択します
- **話速**：0.25〜4.0の範囲で調整可能

## にじボイス

```bash
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

[にじボイス](https://app.nijivoice.com/)は日本語向けの音声合成サービスです。

### APIキー

にじボイスAPIキーを設定します。

### 音声パラメータ調整

- **話者ID**：使用する話者を選択します
- **話速**：0.4〜3.0の範囲で調整可能。デフォルトでは、各キャラクターに推奨される話速が自動的に設定されます
- **感情レベル**：0〜1.5の範囲で調整可能
- **音声の長さ**：0〜1.7の範囲で調整可能
