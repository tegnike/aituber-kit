# リアルタイムAPI設定

## 概要

リアルタイムAPIは、OpenAIが提供する機能で、より自然で遅延の少ない対話体験を実現します。従来の処理フローを短縮し、音声入力から直接AIが応答することで、よりスムーズなコミュニケーションが可能になります。

**環境変数**:

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

## 対応モデル

リアルタイムAPIは、以下のモデルに対応しています：

- gpt-4o-realtime-preview-2024-12-17
- gpt-4o-mini-realtime-preview-2024-12-17
- gpt-4o-realtime-preview-2024-10-01

## 機能と特徴

### 仕組みと利点

リアルタイムAPIはWebsocket通信を活用して、従来のRESTful APIと比較して次のような利点があります：

- ほぼ遅延のないリアルタイム応答
- 音声のニュアンスや抑揚を反映した自然な応答
- 処理フローの短縮（音声→文字→AIテキスト→音声という変換ステップを削減）

### 処理フローの比較

**従来のフロー**：

1. ユーザーが音声で話しかける
2. 音声を文字起こししてテキストにする
3. テキストをAIに渡してテキストで回答を得る
4. テキストを音声に変換して再生する

**リアルタイムAPIのフロー**：

1. ユーザーが音声で話しかける
2. 音声をAIに渡して音声で回答を得る

## 設定方法

リアルタイムAPIを利用するには、以下の手順で設定します：

1. AIサービスとしてOpenAIまたはAzure OpenAIを選択
2. OpenAI APIキーを設定（Azure OpenAIの場合は関連設定も）
3. リアルタイムAPIモードをONに設定
4. 必要に応じて送信タイプと音声を選択

### 送信タイプ設定

リアルタイムAPIモードでは、2種類の送信方法から選択できます：

- **テキスト**：マイクで入力された音声をWeb Speech APIで文字起こしした後に送信
- **音声**：マイクからの音声データを直接Realtime APIに送信

::: warning 注意
リアルタイムAPIモードは、マイク入力のみ対応しています。テキスト入力はできません。
日本語の場合、「テキスト」送信タイプを選択すると音声認識精度が向上する場合があります。
:::

### ボイスタイプ設定

サービスごとに選択可能なボイスタイプが異なります：

**OpenAI**：

- alloy, coral, echo, verse, ballad, ash, shimmer, sage

**Azure OpenAI**：

- amuch, dan, elan, marilyn, breeze, cove, ember, jupiter, alloy, echo, shimmer

::: warning 注意
APIキー、Azure Endpoint、ボイスタイプ、AIモデル、キャラクター設定のキャラクタープロンプトを変更した場合は、更新ボタンを押してWebSocketセッションを再開する必要があります。
:::

## 接続状態の確認

設定画面を閉じた後、左上に接続状況が表示されます。「成功」と表示されていることを確認してください。「試みています」や「閉じられました」という表示がある場合は、APIキーが正しく設定されているか確認してください。

## 関数実行機能

リアルタイムAPIモードでは、関数実行（Function Calling）を利用できます。AIが特定の操作を実行するために使用します。

### 組み込み関数

デフォルトでは `get_current_weather` 関数が実装されており、「〇〇の現在の天気を教えて」と尋ねると天気情報を取得できます。

### カスタム関数の追加

1. **関数の定義**

`src/components/realtimeAPITools.json` ファイルに関数定義を追加：

```json
[
  {
    "type": "function",
    "name": "get_current_weather",
    "description": "Retrieves the current weather for a given timezone, latitude, longitude coordinate pair. Specify a label for the location.",
    "parameters": {
      "type": "object",
      "properties": {
        "latitude": {
          "type": "number",
          "description": "Latitude"
        },
        "longitude": {
          "type": "number",
          "description": "Longitude"
        },
        "timezone": {
          "type": "string",
          "description": "Timezone"
        },
        "location": {
          "type": "string",
          "description": "Name of the location"
        }
      },
      "required": ["timezone", "latitude", "longitude", "location"]
    }
  }
]
```

2. **関数の実装**

`src/components/realtimeAPITools.tsx` ファイルに実際の関数を実装：

```tsx
class RealtimeAPITools {
  async get_current_weather(
    latitude: number,
    longitude: number,
    timezone: string,
    location: string
  ): Promise<string> {
    // 関数の実装
    // ...
    return `天気情報: ${location}の現在の気温は${temperature}°C、天気は${weatherStatus}です。`
  }
}
```

::: tip
関数実行に時間がかかる場合、関数定義の `description` に以下の文言を追加することで、AIに関数実行前に一言伝えるよう促せます：

```
Please respond to the user before calling the tool.
```

また、キャラクター設定に以下を追加することも効果的です：

```
ツールを使用する場合は、必要に応じてユーザを待たせる旨を伝えてください。
```

:::

## 制限事項

- 現在OpenAIまたはAzure OpenAIのみ対応
- 外部連携モード、オーディオモード、Youtubeモードとの併用不可
- 日本語の音声認識精度が環境によって不安定な場合あり
- テキストデータと音声データの間に不整合が生じることがある
- 従来のテキストベースの感情制御（例：`[happy]こんにちは`）が使用できない
- 他のモデルと比較して高コスト

## 会話履歴の管理

リアルタイムAPIではセッション毎に会話履歴が保存され、セッション終了時に削除されます。「リアルタイムAPI設定を更新」ボタンを押すとセッションがリセットされ、会話履歴も消去されます。現在のAITuberKitでは、過去の会話履歴を新しいセッションに引き継ぐ機能は実装されていません。

::: warning 注意
セッション毎に会話が自動保存されるため、同じ画面で会話を続けると費用が増加します。利用後はブラウザをリロードすることをお勧めします。
:::
