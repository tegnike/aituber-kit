# YouTube設定

## 概要

YouTubeのライブ配信からコメントを取得し、AIキャラクターが応答する機能を提供します。ユーザーからのコメントを自動で拾い上げ、AIによる返答を生成することができます。

**環境変数**:

```bash
# YouTubeモードを有効にするかどうか（true/false）
NEXT_PUBLIC_YOUTUBE_MODE=false

# YouTubeのAPIキー
NEXT_PUBLIC_YOUTUBE_API_KEY=

# YouTubeのライブ配信ID
NEXT_PUBLIC_YOUTUBE_LIVE_ID=
```

## YouTubeモード

YouTubeモードを有効にすると、YouTubeのライブ配信からコメントを取得して、AIキャラクターが自動的に応答できるようになります。

::: warning 注意
YouTubeモードを有効にすると、いくつかの機能が自動的に無効になります。
:::

### YouTube API設定

YouTubeのAPIを利用するための設定です。

### YouTube APIキー

YouTubeのAPIを使用するためのAPIキーを設定します。YouTubeのコメント取得には、Google Cloud PlatformのAPIキーが必要です。

::: tip APIキーの取得方法

1. [Google Cloud Platform](https://console.cloud.google.com/)にアクセスし、アカウントを作成またはログインします
2. プロジェクトを作成します
3. 「APIとサービス」>「ライブラリ」から「YouTube Data API v3」を有効にします
4. 「認証情報」から「認証情報を作成」>「APIキー」でAPIキーを生成します
5. 生成されたAPIキーをこの設定欄に入力します
   :::

### YouTube Live ID

コメントを取得したいYouTubeライブ配信のIDを入力します。この値はYouTubeライブ配信のURLから取得できます。

例：YouTube URLが `https://www.youtube.com/watch?v=abcdefghijk` の場合、Live IDは `abcdefghijk` です。

::: warning 注意
YouTube Live IDはチャンネルIDではなく、特定のライブ配信のIDです。
:::

### 使い方

YouTubeモードを有効にすると、画面左上にYouTubeモードのボタンが表示されます。

![YouTubeモード](/images/youtube_s045n.png)

このボタンをクリックすることで、コメント取得のオン/オフを切り替えることができます。

::: warning 注意
YouTube Live IDはチャンネルIDではなく、特定のライブ配信のIDです。
:::

### コメント処理の仕組み

AITuber Kitでは以下の流れでYouTubeコメントを処理します：

1. 設定された間隔で YouTube Data API v3 を使ってライブ配信からコメントを取得
2. 取得したコメントを処理キューに追加
3. キュー内のコメントを順次AIに送信し、応答を生成
4. 生成された応答をキャラクターに話させる

### エラー対応と注意点

- **コメント取得エラー**: APIキーが無効または制限に達した場合、コメントが取得できない場合があります
- **レート制限**: YouTube Data APIには使用制限があるため、長時間の配信では制限に達する可能性があります
- **コメントフィルタリング**: コメントの最初の文字が「#」の場合、そのコメントは無視されます
- **リソース消費**: 長時間のライブ配信では、メモリ使用量が増加する可能性があります

## 会話継続モード（ベータ版）

コメントが無いときにAIが自ら会話を継続するモードです。コメントがない状態が続いても、AIキャラクターが自発的に会話を展開します。

::: warning ベータ版について
**この会話継続モードは現在ベータ版として提供されています。**

- 予告なく仕様が変更される可能性があります
- 動作が不安定な場合があります
- 本番環境での使用は十分にテストを行った上でご利用ください
- バグや問題を発見した場合は、フィードバックをいただけると幸いです
  :::

### 対応AIサービス

- OpenAI
- Anthropic Claude
- Google Gemini

### 機能の詳細

会話継続モードでは、一定時間コメントがない場合にAIが過去の会話文脈を参照し、自然な会話の流れを維持するための新たな話題を提供します。

### 注意点

::: warning 利用コストについて

- 一度の回答で複数回LLMを呼び出すため、API利用料が増加する可能性があります
  :::

### 使用方法

YouTubeモードが有効な状態で「会話継続モード」ボタンをクリックすることで、オン/オフを切り替えることができます。
