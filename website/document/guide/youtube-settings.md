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
YouTubeモードを有効にすると、スライドモードは自動的に無効になります。また、YouTubeモードをオフにすると、YouTube再生も停止します。
:::

### モードの切り替え方法

設定画面上部の「**YouTubeモード**」ボタンをクリックすることで、モードのオン/オフを切り替えることができます。

## YouTube API設定

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

## 会話継続モード（ベータ版）

コメントが無いときにAIが自ら会話を継続するモードです。コメントがない状態が続いても、AIキャラクターが自発的に会話を展開します。

::: warning 対応AI制限
現在、このモードは以下のAIサービスのみ対応しています：

- OpenAI（GPT-4o, GPT-4-turbo）
- Anthropic Claude（Claude-3-opus, Claude-3.5-sonnet）
- Google Gemini
  :::

### 機能の詳細

会話継続モードでは、一定時間コメントがない場合にAIが過去の会話文脈を参照し、自然な会話の流れを維持するための新たな話題を提供します。

::: danger 注意点

- 一度の回答で複数回LLMを呼び出すため、API利用料が増加する可能性があります
- 外部連携モードまたはスライドモードが有効な場合は使用できません
- AIサービスとしてマルチモーダル対応（OpenAI、Anthropic、Google）以外を選択している場合は使用できません
  :::

### 使用方法

YouTubeモードが有効な状態で「会話継続モード」ボタンをクリックすることで、オン/オフを切り替えることができます。

## エラー対応と注意点

- **コメント取得エラー**: APIキーが無効または制限に達した場合、コメントが取得できない場合があります
- **レート制限**: YouTube Data APIには使用制限があるため、長時間の配信では制限に達する可能性があります
- **コメントフィルタリング**: コメントの最初の文字が「#」の場合、そのコメントは無視されます
- **リソース消費**: 長時間のライブ配信では、メモリ使用量が増加する可能性があります

## コメント処理の仕組み

AITuber Kitでは以下の流れでYouTubeコメントを処理します：

1. 設定された間隔で YouTube Data API v3 を使ってライブ配信からコメントを取得
2. 取得したコメントを処理キューに追加
3. キュー内のコメントを順次AIに送信し、応答を生成
4. 生成された応答をキャラクターに話させる

### ページネーション処理

YouTube APIからのコメント取得では、`youtubeNextPageToken`を使用したページネーション処理により、複数回のAPI呼び出しで全コメントを取得します。これにより、コメントが多い場合でも確実に処理できます。

### コメント不在時の処理

`youtubeNoCommentCount`カウンターを使用して、連続してコメントがない状態を検出します。会話継続モードが有効な場合、このカウンターが一定値に達するとAIが自発的に会話を続けます。

### 詳細な環境変数設定

環境変数の詳細については@環境変数一覧をご覧ください。
