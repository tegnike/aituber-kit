# Receiver Registry API 仕様書

## 1. 文書情報

| 項目           | 内容                                    |
| -------------- | --------------------------------------- |
| 文書名         | AITuberKit Receiver Registry API 仕様書 |
| ステータス     | Implemented                             |
| 対象           | AITuberKit外部制御APIの実装者・利用者   |
| 作成日         | 2026-08-04                              |
| 対象バージョン | v2.69.0以降を想定                       |

## 2. 目的

AITuberKitを通常ブラウザ、OBS Browser Source、埋め込み画面などで複数起動した場合に、外部制御アプリケーションが次を実行できるようにする。

1. 現在接続中の受信インスタンスを列挙する。
2. 表示名、種別、対応機能、発話状態を確認する。
3. 発話、チャット、停止、プレゼンテーション操作を特定インスタンスへ配送する。
4. 既存の論理`clientId`を使う外部連携との後方互換性を維持する。

本APIは特定Producerに依存しない。番組、ゲーム、展示、講義などの業務ロジックや選択ポリシーはAITuberKitへ持ち込まない。

## 3. 非目標

- 外部制御アプリケーションの受信先選択UI
- 受信先の自動フェイルオーバーポリシー
- Producer固有の表示名、番組名、キャラクター名の生成
- Receiver情報のプロセス再起動をまたぐ永続化
- サーバーレス・複数Nodeプロセス間でのReceiver Registry共有
- ブラウザタブを閉じた後も同じ`receiverId`を再利用する保証

## 4. 用語

| 用語                 | 定義                                                                       |
| -------------------- | -------------------------------------------------------------------------- |
| Receiver             | 発話・チャット・プレゼンテーション命令を受信するAITuberKit画面インスタンス |
| `receiverId`         | Receiverの一時的なルーティングID。ブラウザタブまたはOBSインスタンス単位    |
| `configuredClientId` | AITuberKit設定に保存された論理クライアントID。複数Receiverで共有されうる   |
| Legacy receiver      | `receiverId`導入前の`clientId`だけで動作する互換経路                       |
| Producer             | AITuberKitを外部APIから制御するアプリケーション                            |

## 5. 責務分離

### 5.1 AITuberKit

- Receiverごとの一時IDを生成する。
- Receiverの接続状態を定期報告する。
- 接続中Receiverを認証付きAPIで列挙する。
- 指定されたReceiverのキューから命令を取得する。
- 既存`clientId`経路を互換目的で維持する。

### 5.2 Producer

- どのReceiverを使用するか決定する。
- 選択UI、選択履歴、フェイルオーバーを必要に応じて実装する。
- 切断済みReceiverを選択し続けず、一覧を再取得する。
- `capabilities`を確認してから機能を呼び出す。

## 6. Receiver IDライフサイクル

1. AITuberKit画面は初回起動時にランダムなセッションIDを生成する。
2. セッションIDを`sessionStorage`へ保存し、同じタブの再読込では再利用する。
3. `receiverId`は`aituber-receiver-<sessionId>`形式とする。
4. タブを閉じて新規作成した場合、通常は新しい`receiverId`になる。
5. Receiverは2秒間隔で状態を報告する。
6. 最終報告から10秒を超えたReceiverは一覧から除外する。

`receiverId`は永続的な端末IDではない。Producerは保存済みIDが一覧に存在しない場合、利用者へ再選択を促すか、自身のポリシーで別Receiverを選ぶ。

## 7. Receiver能力

| capability     | 意味                                                              |
| -------------- | ----------------------------------------------------------------- |
| `presentation` | 外部プレゼンテーションの登録済み資料を読込・制御できる            |
| `speech`       | `/api/v1/speak`または`/api/v1/messages`による直接発話を受信できる |
| `chat`         | `/api/v1/chat`または`ai_generate`メッセージを処理できる           |

`speech`と`chat`はMessage Receiver設定が有効な場合だけ公開する。`presentation`は外部制御APIへ接続しているReceiverで公開する。

## 8. Receiver一覧API

### 8.1 リクエスト

```http
GET /api/v1/receivers/
Authorization: Bearer <AITUBERKIT_API_KEY>
```

APIキー認証を必須とする。クエリ文字列のAPIキーは受け付けない。

### 8.2 レスポンス

```json
{
  "ok": true,
  "receivers": [
    {
      "receiverId": "aituber-receiver-7be9e2c4-57de-4ddb-a808-e85da6fb2387",
      "configuredClientId": "main-stage",
      "displayName": "Chrome a6fb2387",
      "kind": "browser",
      "capabilities": ["presentation", "chat", "speech"],
      "connected": true,
      "isSpeaking": false,
      "lastSeenAt": "2026-08-04T10:00:00.000Z"
    }
  ]
}
```

### 8.3 フィールド

| フィールド           | 型                             | 説明                                           |
| -------------------- | ------------------------------ | ---------------------------------------------- |
| `receiverId`         | string                         | 外部APIの配送先に使用する一時ID                |
| `configuredClientId` | string                         | AITuberKit設定由来の論理ID                     |
| `displayName`        | string                         | 選択UI向けの補助表示名。永続識別には使用しない |
| `kind`               | `browser` \| `obs` \| `legacy` | Receiver種別                                   |
| `capabilities`       | string[]                       | 対応機能                                       |
| `connected`          | true                           | 一覧掲載時点で接続中であることを示す           |
| `isSpeaking`         | boolean                        | 現在発話中か                                   |
| `lastSeenAt`         | ISO 8601 string                | 最終状態報告時刻                               |

一覧順は`lastSeenAt`の降順とする。

## 9. Receiverへの配送

配送先を指定する既存v1 APIは`receiverId`を優先ルーティングパラメータとして受け付ける。イベントAPIの絞り込みにも`receiverId`を使用できる。

```http
POST /api/v1/speak/?receiverId=aituber-receiver-...
GET /api/v1/presentation/status/?receiverId=aituber-receiver-...
```

JSON bodyを持つAPIでは次の形式も使用できる。

```json
{
  "receiverId": "aituber-receiver-...",
  "text": "このReceiverだけが発話します",
  "speechSessionId": "answer-stream-1"
}
```

ストリーミング生成した回答を複数回の`/api/v1/speak`へ分ける場合は、
同じ回答の全リクエストに共通の`speechSessionId`を指定する。Receiverは同じIDの
発話を同一のSpeakQueueセッションへFIFOで追加し、後続文による先行キューの破棄を防ぐ。
IDは1〜200文字とする。省略時は従来どおり、リクエストごとに独立した発話として扱う。

互換性のため`clientId`も継続して受け付ける。両方が指定された場合は`receiverId`を優先する。

優先順位は次のとおり。

1. JSON bodyの`receiverId`
2. JSON bodyの`clientId`
3. queryの`receiverId`
4. queryの`clientId`

## 10. Legacy互換

- 新しいAITuberKit画面はReceiver固有IDと従来の`configuredClientId`の両方について、
  認証付き`GET /api/v1/events/`を購読する。
- `message_queued`を受信したらメッセージを、`command_queued`または`stop_requested`を
  受信したらコマンドを即時取得する。SSE接続中は15秒ごとに取りこぼしを確認する。
- SSEが切断している間だけ、メッセージとコマンドを1秒ごとにポーリングし、
  250ミリ秒から最大5秒の指数バックオフでSSEへ再接続する。
- Receiver固有メッセージはAPIキー必須の`GET /api/v1/client/messages/?receiverId=...`から取得する。
- Legacy経路だけは後方互換のため既存の`GET /api/messages/?clientId=...`を使用する。
- Receiver固有のAssignmentが存在する場合、そのReceiverはLegacy Assignmentを処理しない。
- 同一`configuredClientId`を共有するタブのうち、Legacy経路は既存のタブリーダーだけが処理する。
- Receiver一覧に新形式Receiverが1件以上存在する場合、Legacy重複は一覧へ返さない。
- 新形式Receiverが存在しない場合、旧クライアントの状態報告を`kind: legacy`として返してよい。
- Producerは同一操作でReceiver経路とLegacy経路を混在させない。

## 11. セキュリティ

- Receiver一覧とv1制御APIは`AITUBERKIT_API_KEY`を必須とする。
- `displayName`は信頼済みHTMLとして扱わない。
- 状態報告から受け取る文字列は最大200文字へ制限する。
- 公開レスポンスにはAIモデル名、音声エンジン、システムプロンプト、APIキーを含めない。
- `receiverId`は認証情報ではない。IDを知っていてもAPIキーなしでは操作できない。

## 12. 実装制約

Receiver Registryは現在の`messageGateway`と同じNode.jsプロセス内メモリを使用する。複数プロセス構成やサーバーレス構成では共有されない。将来その構成をサポートする場合は、TTL付き共有ストアへ置き換える。

## 13. Producer非依存要件

AITuberKit本体へ次を追加してはならない。

- Morning Show、番組、ニュース、ゲームなど特定Producerの名称
- Producer固有の自動選択規則
- Producer固有のReceiver表示順
- 特定Producerだけに必要な永続化形式

AITuberKitはReceiverの事実を公開し、選択判断はProducerへ委ねる。
