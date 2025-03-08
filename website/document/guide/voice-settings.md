# 音声設定

## 概要

音声設定では、AIキャラクターの音声合成に関する設定を行います。様々な音声合成エンジンを選択し、声質やパラメータを調整することができます。

```bash
# 使用する音声合成エンジン（'voicevox', 'koeiromap', 'google', 'stylebertvits2', 'aivis_speech', 'gsvitts', 'elevenlabs', 'openai', 'azure', 'nijivoice'）
NEXT_PUBLIC_SELECT_VOICE=voicevox
```

::: warning 注意
リアルタイムAPIモードまたはオーディオモードが有効な場合、音声設定は使用されません。
:::

## 合成音声エンジンの選択

AIキャラクターが使用する音声合成エンジンを選択します。以下のエンジンがサポートされています：

- VOICEVOX：日本語に特化した高品質な音声合成エンジン
- Koeiromap：日本語向けの感情表現が豊かな音声合成エンジン
- Google TTS：多言語に対応したGoogle Cloud Text-to-Speechサービス
- Style-Bert-VITS2：スタイル制御可能な高品質音声合成エンジン（日・英・中対応）
- AivisSpeech：日本語音声合成エンジン
- GSVI TTS：カスタマイズ可能な音声合成エンジン
- ElevenLabs：多言語に対応した高品質音声合成サービス
- OpenAI TTS：多言語に対応したOpenAIの音声合成サービス
- Azure TTS：Microsoft Azureが提供する多言語音声合成サービス
- にじボイス：日本語向け音声合成サービス

## VOICEVOX

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
# Koeiromap APIキー
NEXT_PUBLIC_KOEIROMAP_KEY=
```

[Koeiromap](https://koemotion.rinna.co.jp)は、日本語向けの感情表現が豊かな音声合成エンジンです。

### APIキー

Koeiromap APIを使用するためのAPIキーを設定します。APIキーは[Koemotion](https://koemotion.rinna.co.jp)から取得できます。

### プリセットと調整

- **プリセット**：「かわいい」「元気」「かっこいい」「渋い」のプリセットから選択できます
- **x軸**：-10〜10の範囲で声質を調整します
- **y軸**：-10〜10の範囲で声質を調整します

## Google TTS

```bash
# Google TTSの言語/モデル設定
NEXT_PUBLIC_GOOGLE_TTS_TYPE=
```

Google Cloud Text-to-Speechは多言語に対応した音声合成サービスです。

### 設定

- **言語選択**：使用する言語/音声モデルを設定します
- **認証**：APIキーまたは認証用のJSONファイル（credentials.json）が必要です

詳細な音声モデルは[Google Cloud公式ドキュメント](https://cloud.google.com/text-to-speech/docs/voices)を参照してください。

## Style-Bert-VITS2

```bash
# Style-Bert-VITS2の設定
NEXT_PUBLIC_STYLEBERTVITS2_MODEL_ID=0
NEXT_PUBLIC_STYLEBERTVITS2_STYLE=Neutral
NEXT_PUBLIC_STYLEBERTVITS2_SDP_RATIO=0.2
NEXT_PUBLIC_STYLEBERTVITS2_LENGTH=1.0
```

[Style-Bert-VITS2](https://github.com/litagin02/Style-Bert-VITS2)は、スタイル制御が可能な高品質音声合成エンジンです。日本語、英語、中国語に対応しています。

### 設定

- **サーバーURL**：Style-Bert-VITS2サーバーのURLを設定します
- **APIキー**：必要に応じてAPIキーを設定します
- **モデルID**：使用するモデルのIDを指定します
- **スタイル**：音声のスタイルを指定します（例：Neutral）
- **SDP/DP混合比**：0.0〜1.0の範囲で調整可能
- **話速**：0.0〜2.0の範囲で調整可能

## AivisSpeech

```bash
# AivisSpeechの設定
NEXT_PUBLIC_AIVIS_SPEECH_SPEAKER=888753760
NEXT_PUBLIC_AIVIS_SPEECH_SPEED=1.0
NEXT_PUBLIC_AIVIS_SPEECH_PITCH=0.0
NEXT_PUBLIC_AIVIS_SPEECH_INTONATION=1.0
```

[AivisSpeech](https://aivis-project.com/)は日本語音声合成エンジンです。

### 設定

- **サーバーURL**：AivisSpeechサーバーのURLを設定します（標準：http://localhost:10101）
- **話者選択**：利用可能な話者から選択します
- **話速**：0.5〜2.0の範囲で調整可能
- **音高**：-0.15〜0.15の範囲で調整可能
- **抑揚**：0.0〜2.0の範囲で調整可能

「話者リストを更新」ボタンで最新の話者リストを取得できます。

## GSVI TTS

```bash
# GSVI TTSの設定
NEXT_PUBLIC_GSVI_TTS_URL=http://127.0.0.1:5000/tts
NEXT_PUBLIC_GSVI_TTS_MODEL_ID=0
NEXT_PUBLIC_GSVI_TTS_BATCH_SIZE=2
NEXT_PUBLIC_GSVI_TTS_SPEECH_RATE=1.0
```

GSVI TTSはカスタマイズ可能な音声合成エンジンです。

### 設定

- **サーバーURL**：GSVI TTSサーバーのURLを設定します
- **モデルID**：使用するモデルのIDを指定します
- **バッチサイズ**：推論速度に影響します（1〜100、大きいほど速いが、メモリ使用量も増加）
- **話速**：0.5〜2.0の範囲で調整可能

## ElevenLabs

```bash
# ElevenLabsの設定（APIキーとボイスID）
# ElevenLabs APIキー（要取得）
```

[ElevenLabs](https://elevenlabs.io/api)は多言語に対応した高品質音声合成サービスです。

### 設定

- **APIキー**：ElevenLabs APIを使用するためのAPIキーを設定します
- **ボイスID**：使用する音声のIDを設定します（[API](https://api.elevenlabs.io/v1/voices)から確認できます）

## OpenAI TTS

```bash
# OpenAI TTSの設定
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
NEXT_PUBLIC_OPENAI_TTS_MODEL=tts-1
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0
```

OpenAIの提供する多言語音声合成サービスです。

### 設定

- **APIキー**：OpenAI APIキーを設定します（AIサービスでOpenAIを選択している場合は不要）
- **ボイスタイプ**：alloy、echo、fable、onyx、nova、shimmerから選択可能
- **モデル**：tts-1（標準）またはtts-1-hd（高品質）から選択可能
- **話速**：0.25〜4.0の範囲で調整可能

## Azure TTS

```bash
# Azure TTSの設定（APIキー、エンドポイント、ボイスタイプ、話速）
# Azure TTS APIキー（要取得）
# Azure TTSエンドポイント
# Azure TTSボイスタイプ
```

Microsoft Azureが提供する多言語音声合成サービスです。

### 設定

- **APIキー**：Azure TTS APIキーを設定します
- **エンドポイント**：Azure TTSのエンドポイントURLを設定します
- **ボイスタイプ**：使用する音声タイプを選択します
- **話速**：0.25〜4.0の範囲で調整可能

## にじボイス

```bash
# にじボイスの設定（APIキー、話者ID、話速、感情レベル、音声の長さ）
# にじボイスAPIキー（要取得）
# にじボイス話者ID
```

[にじボイス](https://app.nijivoice.com/)は日本語向けの音声合成サービスです。

### 設定

- **APIキー**：にじボイスAPIキーを設定します
- **話者ID**：使用する話者を選択します
- **話速**：0.4〜3.0の範囲で調整可能
- **感情レベル**：0〜1.5の範囲で調整可能
- **音声の長さ**：0〜1.7の範囲で調整可能

キャラクターによっては推奨される話速が自動的に設定されます。

## 音声認識設定

```bash
# 無音検出タイムアウト（秒）- 0秒で無効化
NEXT_PUBLIC_NO_SPEECH_TIMEOUT=3.0
```

AITuberKitでは、ユーザーの音声入力を認識するためのWebブラウザ標準のSpeech Recognition APIを使用しています。

### 無音検出タイムアウト

音声入力時に無音状態が続いた場合、自動的に入力を終了するまでの時間を設定できます。

- **タイムアウト時間**：秒単位で設定（0秒に設定すると無音検出による自動送信を無効化）
- **環境変数**：`NEXT_PUBLIC_NO_SPEECH_TIMEOUT`（デフォルト：3.0秒）

::: tip ヒント
無音検出タイムアウトは「その他」設定ページからも調整できます。
:::

## オーディオモード

オーディオモードは、AIによる音声入力の直接処理を可能にする機能です。このモードが有効なときは、通常の音声設定ではなく、オーディオモード専用の設定が使用されます。

オーディオモードの詳細については[AI設定の外部連携モード](/guide/ai/external-linkage)をご参照ください。

### 入力タイプ

- **テキスト**：テキスト入力として処理
- **音声**：音声入力として処理（OpenAI Whisperを使用）

### ボイスタイプ

OpenAI TTSのボイスタイプから選択可能（alloy、echo、fable、onyx、nova、shimmer）

## リアルタイムAPIモード

リアルタイムAPIモードはリアルタイムでの会話を実現するための機能です。このモードが有効なときは、通常の音声設定ではなく、リアルタイムAPI専用の設定が使用されます。

リアルタイムAPIモードの詳細については[AI設定のリアルタイムAPI](/guide/ai/realtime-api)をご参照ください。

::: warning 注意
音声設定、リアルタイムAPIモード、オーディオモードは相互に排他的な関係にあります。リアルタイムAPIモードまたはオーディオモードが有効な場合、通常の音声設定は使用されません。
:::
