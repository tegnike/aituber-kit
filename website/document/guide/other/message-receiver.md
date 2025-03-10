# API設定

## 概要

外部からAIキャラクターへの指示を受け付けるための設定です。この機能を有効にすると、専用のAPIを通じてAIキャラクターに発言させることができます。

**環境変数**:

```bash
# 外部指示受け付け有効化設定（true/false）
NEXT_PUBLIC_MESSAGE_RECEIVER_ENABLED=false
```

## 機能の有効化

外部からの指示を受け付ける機能のON/OFFを切り替えることができます。ONにすると、クライアントIDが自動的に生成されます。

:::tip ヒント
生成されたクライアントIDは、外部からのメッセージ送信時に必要となります。
:::

## メッセージ送信ページ

有効化されると、「メッセージ送信ページを開く」リンクが表示されます。このページから、AIキャラクターへの発言を外部から指示することができます。

メッセージ送信ページでは以下の3つの方法でメッセージを送信できます：

### 1. AIキャラクターにそのまま発言させる（direct_send）

- 入力したメッセージをそのままAIキャラクターに発言させます
- 複数のメッセージを送信した場合は、順番に処理されます
- 音声モデルはAITuberKitの設定で選択したものが使用されます

**APIリクエスト例**:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages": ["こんにちは、今日もいい天気ですね。", "今日の予定を教えてください。"]}' \
  'http://localhost:3000/api/messages/?clientId=YOUR_CLIENT_ID&type=direct_send'
```

### 2. AIで回答を生成してから発言させる（ai_generate）

- 入力したメッセージからAIが回答を生成し、その回答をAIキャラクターに発言させます
- 複数のメッセージを送信した場合は、順番に処理されます
- AIモデルおよび音声モデルはAITuberKitの設定で選択したものが使用されます
- システムプロンプトの設定方法：
  - AITuberKitのシステムプロンプトを使用する場合は `useCurrentSystemPrompt: true` を設定
  - カスタムのシステムプロンプトを使用する場合は `systemPrompt` パラメータに指定し、`useCurrentSystemPrompt: false` を設定
- 過去の会話履歴を読み込ませる場合は、システムプロンプトまたはユーザーメッセージの任意の位置に `[conversation_history]` という文字列を含めることができます

**APIリクエスト例**:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"systemPrompt": "You are a helpful assistant.", "useCurrentSystemPrompt": false, "messages": ["今日の予定を教えてください。"]}' \
  'http://localhost:3000/api/messages/?clientId=YOUR_CLIENT_ID&type=ai_generate'
```

### 3. ユーザー入力を送信する（user_input）

- 送信したメッセージはAITuberKitの入力フォームから入力された場合と同じ処理がされます
- 複数のメッセージを送信した場合は、順番に処理されます
- AIモデルおよび音声モデルはAITuberKitの設定で選択したものが使用されます
- システムプロンプトや会話履歴はAITuberKitの値が使用されます

**APIリクエスト例**:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages": ["こんにちは、今日もいい天気ですね。", "今日の予定を教えてください。"]}' \
  'http://localhost:3000/api/messages/?clientId=YOUR_CLIENT_ID&type=user_input'
```

## APIレスポンス

各APIリクエストに対するレスポンスは、リクエストの処理結果を含むJSONオブジェクトとして返されます。レスポンスには、処理されたメッセージや処理状況に関する情報が含まれます。

:::tip ヒント
メッセージ送信ページでは、各送信方法のフォームの下部にレスポンス表示エリアがあり、APIからのレスポンスを確認することができます。
:::

## 注意点

- クライアントIDは外部からのアクセスを制限するために使用されます。第三者に漏洩しないよう注意してください。
- 大量のメッセージを短時間に送信すると、処理が遅延する可能性があります。
- 外部からの指示を受け付ける機能は、セキュリティ上のリスクを伴います。信頼できる環境でのみ有効化してください。
