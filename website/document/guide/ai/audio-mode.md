# オーディオモード設定

## 概要

AITuberKitでは、OpenAIが提供するAudio API機能を活用して、テキストまたは音声入力に対して自然な音声で応答するオーディオモードを利用できます。このモードは、リアルタイムAPIモードとは異なる機能として提供されています。

**環境変数**:

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

## 対応モデル

オーディオモードでは、以下のモデルに対応しています：

- gpt-4o-audio-preview-2024-12-17
- gpt-4o-mini-audio-preview-2024-12-17
- gpt-4o-audio-preview-2024-10-01

## 設定方法

オーディオモードを利用するには、以下の手順で設定します：

1. AIサービスとしてOpenAIを選択
2. OpenAI APIキーを設定
3. オーディオモードをONに設定
4. 必要に応じて入力タイプと音声を選択

### 送信タイプ設定

オーディオモードでは、2種類の送信方法から選択できます：

- **テキスト**：マイクで入力された音声をWeb Speech APIで文字起こしした後に送信
- **音声**：マイクからの音声データを直接Realtime APIに送信

### 音声タイプ設定

オーディオモードでは、以下の音声タイプが選択可能です：

- alloy, coral, echo, verse, ballad, ash, shimmer, sage

各音声には異なる特性があり、キャラクターに合わせて最適な声を選択できます。

## 制限事項

- 現在OpenAIのサービスのみ対応
- 外部連携モード、リアルタイムAPIモードとの併用不可
- 他のモードよりもAPI利用料金が高くなる場合あり
