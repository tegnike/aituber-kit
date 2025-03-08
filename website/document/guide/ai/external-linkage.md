# 外部連携モード設定

## 概要

外部連携モードは、AITuberKitとWebSocketを介して外部アプリケーションと連携するための機能です。このモードを使うことで、外部のアプリケーションからテキストメッセージを送信し、AITuberKitのキャラクターに喋らせることができます。

::: warning ベータ版機能について
**この外部連携モードは現在ベータ版として提供されています。**

- 予告なく仕様が変更される可能性があります
- 動作が不安定な場合があります
- 本番環境での使用は十分にテストを行った上でご利用ください
- バグや問題を発見した場合は、フィードバックをいただけると幸いです
  :::

**環境変数**:

```bash
# 外部連携モードの有効化
NEXT_PUBLIC_EXTERNAL_LINKAGE_MODE=true
```

## 特徴と用途

外部連携モードには以下のような特徴と用途があります：

- 外部アプリケーションからのテキスト入力を受け付け
- カスタムアプリケーションとの連携
- 他のAI系サービスとの接続
- バーチャル配信の拡張機能として利用

## 制限事項

外部連携モードを有効にすると、以下の機能が無効になります：

- 会話継続モード
- リアルタイムAPIモード

また、外部連携モード有効時は以下の点に注意してください：

- AIの処理は外部アプリケーション側で行う必要があります
- AITuberKitはテキストの受信と音声・モーション生成のみを担当します

## 設定手順

1. AITuberKit設定画面で「外部連携モード」をONに設定
2. WebSocket接続が自動的に「ws://localhost:8000/ws」で開始されます
3. 外部アプリケーションからWebSocketで接続

## WebSocket通信フォーマット

外部アプリケーションからの入力フォーマット:

```json
{
  "text": "喋らせたいテキスト",
  "role": "assistant",
  "emotion": "neutral",
  "type": "message"
}
```

パラメータの説明:

- `text`: キャラクターに喋らせるテキスト内容（必須）
- `role`: メッセージの役割。通常は「assistant」を使用（必須）
- `emotion`: 感情表現（オプション、デフォルトは "neutral"）
  - 使用可能な値: "neutral", "happy", "sad", "angry", "relaxed"
- `type`: メッセージのタイプ（オプション）
  - "start" を使用すると新しい応答ブロックを開始します

例えば、以下のようなPythonコードで接続できます：

```python
import websocket
import json

def send_message(text, emotion="neutral"):
    ws = websocket.create_connection("ws://localhost:8000/ws")
    message = {
        "text": text,
        "role": "assistant",
        "emotion": emotion,
        "type": "message"
    }
    ws.send(json.dumps(message))
    ws.close()

send_message("こんにちは！元気ですか？", "happy")
```

## 接続状態の通知

WebSocket接続時には、画面上に以下のような通知が表示されます：

- 接続試行中: 「WebSocket接続を試行中です」
- 接続成功時: 「WebSocket接続に成功しました」
- エラー発生時: 「WebSocket接続エラーが発生しました」
- 接続終了時: 「WebSocket接続が終了しました」

接続に問題がある場合は、これらの通知を確認してください。

::: tip
外部連携モードを使用する場合は、ファイアウォールの設定でWebSocketポート（8000）を開放する必要がある場合があります。また、接続が切断された場合は2秒ごとに再接続を試みます。
:::
