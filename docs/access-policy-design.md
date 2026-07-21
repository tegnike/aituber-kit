# 統一アクセスポリシー設計ドキュメント

作成日: 2026-07-07 / v3（実装完了・実装時の判明事項を反映）/ ステータス: 実装済み

## 1. 背景と問題

AITuberKitのAPIルート（`src/pages/api/**`、全47ルート）には現在、互いを知らない4つの防御機構が併存している。

| #   | 機構                      | 実装                                         | 保護対象                   | 適用ルート数   |
| --- | ------------------------- | -------------------------------------------- | -------------------------- | -------------- |
| 1   | `guardServerSecretAccess` | `src/lib/api-services/serverSecretGuard.ts`  | サーバーenvのAPIキー・URL  | 18             |
| 2   | `isRestrictedMode`        | `src/utils/restrictedMode.ts`                | サーバーレス環境でのFS機能 | 31             |
| 3   | `requireApiKey`           | `src/features/api/http.ts`                   | 外部制御API `v1/*`         | 8              |
| 4   | Cloudflare WAFルール      | `.github/workflows/apply-cloudflare-waf.yml` | デモサイトのbot/悪用対策   | （ゾーン全体） |

これに加えて `serverUrlGuard.ts`（SSRF対策のURL検証）が3ルートだけに手書き適用されている。

### 構造的な問題

1. **適用が任意**: 各ルートが自分でガードを呼ぶ規約のため、呼び忘れが検出されない。実例: `tts-koeiromap.ts` はどの機構も未適用。メソッド検査に至っては14ルートで欠落。
2. **`usesServerSecret` の手書き重複**: 「クライアントが値を持ち込まず、サーバーenvに値がある場合はサーバー秘匿リソースを使う」という判定式が18ルートで微妙に異なる形で手書きされている（旧S7の対象）。
3. **WAFルールとコードの二重管理**: WAFの保護対象APIパス（`/api/ai/custom` 等の計6パス参照）がワークフローYAML内の式にハードコードされ、ルート側の実装と独立に変更される。2026-06-30〜07-01のhotfixチェーン（約20連続コミット + revert 1回）と、その後のembed用WAF許可の後追い修正5連発は、この二重管理の直接の帰結。なお、refererやチャレンジ条件などデプロイ固有のWAF条件は本質的にconfig管理であり、本設計で一元化するのは「どのAPIパスが保護/embed許可対象か」の部分である。
4. **エラー応答順序・シェイプの不統一**: 405ボディだけで6種類のシェイプが混在。パラメータ400とガード403の評価順もルートごとにバラバラで、エラー応答の差からサーバーenv設定の有無を外部から推測できる。
5. **デプロイ文脈が暗黙**: self-host / demo / embed / kiosk / 外部API という運用形態の違いが、env変数の組み合わせとして暗黙に表現されており、「この文脈でこのルートはどう振る舞うべきか」を一覧できる場所がない。

## 2. 設計ゴール

- **ポリシーモジュール1個**（`src/lib/accessPolicy/`）に全ルートの分類と防御要件を宣言的に集約する。
- 各ルートは `withAccessPolicy(policy, handler)` でラップするだけになる。
- WAFワークフローの保護対象APIパスを**同じポリシーテーブルから生成**する。
- デプロイ文脈ごとの許可/拒否がテストマトリクスとして固定される。
- 新ルート追加時、ポリシー未登録なら静的テストが落ちる（hotfixチェーンの構造的再発防止）。

**挙動の方針**: 「完全な現状維持」ではなく「**ガード評価をルートロジックより優先する統一順序**」を採用する（§8に意図的変更として全列挙）。順序統一により、エラー応答の差でenv設定有無を探れる情報漏えいも解消される。

非ゴール: 新機能の追加、audioモードの認証再構築（F3）、`/api/messages` legacy無認証キューの認証追加、ファイル書き込み系のself-host認可追加。

## 3. ポリシーモデル

「**リソース（何にアクセスするか）× デプロイ文脈（どの環境か）× 呼び出し元（誰が呼ぶか）**」の3軸で表現する。

### 3.1 リソース分類（ApiResource）

| リソース           | 意味                                                   | 現行の対応機構                       |
| ------------------ | ------------------------------------------------------ | ------------------------------------ |
| `server-secret`    | サーバーenv由来のAPIキー・エンドポイント・接続先URL    | `guardServerSecretAccess`            |
| `server-url`       | クライアント指定URLへのサーバー側fetch（SSRF面）       | `serverUrlGuard`                     |
| `fs-read`          | `public/` 配下等のファイル読み取り                     | `isRestrictedMode`                   |
| `fs-write`         | ファイル書き込み・削除                                 | `isRestrictedMode`                   |
| `external-control` | 外部制御API（キャラクター操作）                        | `requireApiKey` + `isRestrictedMode` |
| `client-proxy`     | クライアント持ち込みキーの中継のみ（保護リソースなし） | なし（明示分類が目的）               |

1ルートが複数リソースを持てる（例: `update-voicevox-speakers` = `fs-write` + `server-secret` + `server-url`）。

### 3.2 デプロイ文脈

文脈は排他的なenumではなく、env由来の**能力フラグの組**として表す（demo + embed のように重なるため）。

| フラグ                    | env                                    | 値                                               |
| ------------------------- | -------------------------------------- | ------------------------------------------------ |
| serverSecretMode          | `AITUBERKIT_SERVER_SECRET_ACCESS_MODE` | disabled（既定）/ protected / demo / unprotected |
| fileSystemAvailable       | `NEXT_PUBLIC_RESTRICTED_MODE`          | `!== 'true'`                                     |
| externalControlConfigured | `AITUBERKIT_API_KEY`                   | 設定有無                                         |

運用プロファイルとの対応（ドキュメント兼テストマトリクスの行）:

| プロファイル                  | serverSecretMode                                      | fileSystemAvailable           | externalControl | WAF               |
| ----------------------------- | ----------------------------------------------------- | ----------------------------- | --------------- | ----------------- |
| self-host（既定）             | disabled（envキー未設定なら実質client-proxyのみ）     | true                          | 任意            | なし              |
| self-host（サーバーキー利用） | unprotected または protected                          | true                          | 任意            | なし              |
| demo（aituberkit.com）        | demo                                                  | false（要実環境確認・下記注） | false           | 適用              |
| embed（nikechan.com埋め込み） | demo                                                  | false（同上）                 | false           | 適用 + embed skip |
| kiosk                         | （UI層の制限のみ。APIポリシー上は上記いずれかに従属） | —                             | —               | —                 |
| 外部API利用                   | 任意                                                  | 任意                          | true            | —                 |

> **注（レビューM4）**: demoプロファイルを restricted とすると、WAFで embed 許可されている `/api/save-chat-log` と矛盾する可能性がある（restricted時の同ルートの実挙動がfs拒否かSupabase経路かに依存）。マトリクステストを書く前に `save-chat-log.ts` の restricted 分岐を読んで確定させる。マトリクスの「demo=restricted」仮定が誤りだった場合はこの表を先に直す（誤った仮定を固定するテストを作らない）。

kioskモードはパスコード・NGワード等クライアントUI層の制御であり、API側の防御には寄与しない（＝kiosk有効でもAPI防御は他フラグで決まる）ことをここで明文化する。

VOICEVOX・AivisSpeech・Style-Bert-VITS2・GSVI TTS・LM Studio・Ollamaで使う既定ループバックURLは互換性のため例外とする。`disabled` でも、AITuberKitへの接続元・接続先URLの両方がループバックである同一マシン利用に限って許可し、リモート要求やプライベートネットワーク宛てURLは従来どおりガードする。GSVI TTSはブラウザから直接接続せず、`/api/tts-gsvi`を経由する。VOICEVOXの話者一覧更新では既存の固定JSONをフォールバックとして残す。

デプロイ文脈の解決は既存ガード関数が各自envを読む現行構造を維持する（enforce内に第二のenv解釈レイヤーを作らない — レビューm2）。プロファイル表はテストとドキュメントの語彙であり、実行時の分岐点ではない。

### 3.3 呼び出し元

| 呼び出し元                     | 判定                                                | 使う機構                                    |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------- |
| 同一オリジンのブラウザ         | `sec-fetch-site` + Origin/Host比較（demoモード）    | `guardServerSecretAccess`                   |
| Bearerトークン保持クライアント | `Authorization: Bearer`（protectedモード / v1 API） | `guardServerSecretAccess` / `requireApiKey` |
| 埋め込み元サイト（embed）      | WAF層のreferer判定 + demoモードのsame-origin        | WAF + `guardServerSecretAccess`             |
| 外部（未認証）                 | 上記以外                                            | 拒否またはclient-proxyのみ                  |

## 4. モジュール構成

```
src/lib/accessPolicy/
├── types.ts             # ApiResource / RoutePolicy / SecretPolicy
├── routePolicies.ts     # ★全47ルートの宣言テーブル（単一の真実の源）
├── secretPairs.ts       # computeUsesServerSecret() 共通ヘルパー（S7吸収）
├── guardLocalLlmUrl.ts  # LM Studio / Ollamaの動的URL検証
└── withAccessPolicy.ts  # PolicyGate / 高階関数エントリポイント

scripts/waf/
├── waf.config.json         # デプロイ固有値（hosts, embedオリジン, 静的パス等）
└── generate-waf-rules.mjs  # routePolicies + config → Cloudflareルール配列を生成
```

制約: `routePolicies.ts` はWAF生成スクリプトが Node 24 のTS type stripping で直接importするため、
**消去可能なTS構文のみ（enum等禁止）・`@/` パスエイリアス不使用・`import type` 以外のimport禁止**とする。
この制約自体を静的テストで強制する（§7.2-4）。

### 4.1 ルート宣言（RoutePolicy）

```ts
type SecretPair = { source: 'body' | 'query'; key: string; envVars: string[] }

type SecretPolicy =
  | { kind: 'none' }
  | { kind: 'pairs'; pairs: SecretPair[] } // 宣言的評価: pairのいずれかが「クライアント未提供かつenv有り」
  | { kind: 'always' } // 常時ガード（tts-google / save-chat-log / update-*-speakers）
  | { kind: 'dynamic' } // ルート内で gate.guardServerSecret() を呼ぶ義務

interface RoutePolicy {
  path: string // '/api/tts-voicevox'
  featureName: string // ガードのfeatureName（現行値を維持）
  methods: Array<'GET' | 'POST' | 'DELETE'>
  resources: ApiResource[]
  secret: SecretPolicy
  serverUrl?: {
    source: 'body' | 'query'
    key: string // 例: 'serverUrl'
    envVar: string // 例: 'VOICEVOX_SERVER_URL'
    allowLocalLoopback?: true // プロキシを介さない同一マシン利用に限る互換例外
  }
  restrictedBehavior: 'deny' | 'in-route' | 'none'
  // 'deny': ラッパー内で403（feature_disabled_in_restricted_mode）
  // 'in-route': ルート側でマニフェストfallback等を実施（fs-read一覧系）
  // 'none': restrictedモードと無関係
  waf?: { challenge?: boolean; embedAllowed?: boolean }
}
```

`kind: 'dynamic'` を使うルートと理由（レビューB2/M1で宣言的表現の限界が確定したもの）:

| ルート                                        | 理由                                                                                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/ai/vercel`, `/api/youtube/continuation` | サービス名からenv変数名を動的合成（`{SERVICE}_KEY` 等）                                                                                       |
| `/api/ai/custom`                              | env優先（他ルートと逆方向）の解決順                                                                                                           |
| `/api/whisper`                                | `bodyParser: false`。multipart手動パース後でないと `openaiKey` が得られない                                                                   |
| `/api/stylebertvits2`                         | `STYLEBERTVITS2_API_KEY` の解決が「サーバー設定URL使用時のみ」に条件結合 + RunPod専用例外。URL検証もルート内の既存実装を維持                  |
| `/api/difyChat`                               | 実装時に判明（移行エージェントの等価性検証で検出）: `apiKey` の解決が「クライアントURL不使用時のみ」に条件結合しており pairs では非等価になる |

### 4.2 withAccessPolicy（エントリポイント）

`if (!result.ok) return` の書き忘れというバグクラスを構造的に排除するため、高階関数形式を採用する（レビューM5）。

```ts
interface PolicyGate {
  usesServerSecret: boolean // pairs/always評価の結果（dynamicでは常にfalse）
  serverUrl?: URL // serverUrl宣言があるルート: 解決済みURL
  isProtectedServerResource: boolean // serverUrl宣言があるルートのみ意味を持つ
  guardServerSecret(
    usesServerSecret: boolean,
    options?: { allowLocalLoopbackUrl?: URL }
  ): boolean
  // dynamicルート専用の遅延ガード。falseなら403/429送信済みなので即return
}

function withAccessPolicy(
  policy: RoutePolicy,
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    gate: PolicyGate
  ) => unknown | Promise<unknown>
): NextApiHandler
```

ラッパー内のチェック順序（**統一順序** — 現行ルート間で不揃いだった順序をこれに揃える。差分は§8）:

1. **メソッド検査**: `policy.methods` 外は 405 `{ error: 'Method not allowed' }`（現行多数派 + `http.ts` の `sendMethodNotAllowed` と同一シェイプ）
2. **restrictedモード**: `restrictedBehavior === 'deny'` かつ制限モード → 403 `createRestrictedModeErrorResponse(featureName)`（現行と同一シェイプ）
3. **external-control**: `requireApiKey()`（503/401、現行と同一シェイプ）
4. **server-url検証**（宣言がある場合）:
   - env設定URL（`envVar`）が存在してパース不能 → 400（現行 `tts-voicevox.ts` の挙動を保存 — レビューm8）
   - クライアント提供URLを `isHttpUrl` で検証 → 不正は400
   - `isAllowedConfiguredOrListedUrl` で `isProtectedServerResource` / `isAllowedPublicUrl` を判定 → 許可外のpublic URLは400
   - LM Studio / Ollamaは、プライベートIPに加えて単一ラベルのLANマシン名と`.local` mDNS名も保護対象URLとして扱う。公開FQDNはallowlist未登録なら400
5. **server-secret**:
   - `kind: 'pairs'`: `computeUsesServerSecret(pairs)` または `isProtectedServerResource` が真なら `guardServerSecretAccess()`
   - `kind: 'always'`: 無条件で `guardServerSecretAccess()`
   - `kind: 'dynamic'`: ここでは何もしない。ルートが `gate.guardServerSecret()` を呼ぶ（呼んでいることを静的テストで強制 — §7.2-3）。動的な接続先URLを扱うルートは、検証済みURLを `allowLocalLoopbackUrl` として渡せる
   - ただし `allowLocalLoopback` を宣言したルートは、`disabled` かつリクエスト元Host・ソケット接続元がループバックで、接続先URLが同一マシン（ループバック、NICのIP、OSホスト名）を指す場合のみガードを省略する。Next.jsが直接接続にも補完する `X-Forwarded-For` / `X-Forwarded-Host` は、値がすべてループバックの場合に限り許容する
   - 外部IPを含む `X-Forwarded-For`、非ループバックの `X-Forwarded-Host`、Next.jsが補完しない `Forwarded` / `X-Real-IP` / `CF-Connecting-IP` がある場合はプロキシ経由と判断して例外を無効化する。リバースプロキシ環境では `protected` / `demo` / `unprotected` の明示的な運用モードを使用する
6. すべて通過 → `handler(req, res, gate)` を実行

エラーレスポンスのシェイプは既存関数（`createRestrictedModeErrorResponse` / `rejectServerSecretAccess` / `requireApiKey`）をそのまま呼ぶことで保存する。

誤用対策（レビューB3/M5）:

- `guardServerSecret()` は `kind: 'dynamic'` 以外で呼ばれたら throw（二重ガードの防止）
- `kind: 'dynamic'` のルートファイルが `guardServerSecret(` を含むことをgrep静的テストで強制
- `routePolicies` は `satisfies Record<KnownApiPath, RoutePolicy>` でキーをリテラル型固定し、各ルートファイルが自分のパスのpolicyを参照していることを静的テストで検査

### 4.3 移行後のルートの形

```ts
// 例: src/pages/api/cartesia.ts（宣言的ルート）
export default withAccessPolicy(
  routePolicies['/api/cartesia'],
  async (req, res) => {
    // 既存のビジネスロジック（バリデーション・fetch・レスポンス）のみ
  }
)

// 例: src/pages/api/ai/vercel.ts（dynamicルート）
export default withAccessPolicy(
  routePolicies['/api/ai/vercel'],
  async (req, res, gate) => {
    // ... aiService から usesServerSecret を計算（computeUsesServerSecret ヘルパー使用）...
    if (!gate.guardServerSecret(usesServerSecret)) return
    // ...
  }
)
```

`export const config`（whisperの `bodyParser: false` 等）は従来どおりルートファイルに残す。

## 5. 全ルート分類表（47ルート）

resources列の略記: **SS**=server-secret, **SU**=server-url, **FR**=fs-read, **FW**=fs-write, **EC**=external-control, **CP**=client-proxy
（v2でコード突合検証済み。restricted列は実挙動で確定）

| path                          | methods   | resources          | secret                                                           | restricted                                          | waf              |
| ----------------------------- | --------- | ------------------ | ---------------------------------------------------------------- | --------------------------------------------------- | ---------------- |
| /api/ai/custom                | POST      | SS, SU             | dynamic                                                          | none                                                | challenge, embed |
| /api/ai/vercel                | POST      | SS, SU             | dynamic                                                          | none                                                | embed            |
| /api/azureOpenAITTS           | POST      | SS                 | pairs: apiKey→AZURE_TTS_KEY, endpoint→AZURE_TTS_ENDPOINT         | none                                                | —                |
| /api/cartesia                 | POST      | SS                 | pairs: apiKey→CARTESIA_API_KEY, voiceId→CARTESIA_VOICE_ID        | none                                                | —                |
| /api/convertMarkdown          | POST      | FR                 | none                                                             | in-route                                            | —                |
| /api/convertSlide             | POST      | FW, CP             | none（apiKeyはクライアント必須）                                 | deny                                                | —                |
| /api/delete-image             | DELETE    | FW                 | none                                                             | deny                                                | —                |
| /api/difyChat                 | POST      | SS, SU             | dynamic（apiKey解決が「クライアントURL不使用時のみ」に条件結合） | none                                                | —                |
| /api/elevenLabs               | POST      | SS                 | pairs: apiKey→ELEVENLABS_API_KEY, voiceId→ELEVENLABS_VOICE_ID    | none                                                | —                |
| /api/embedding                | POST      | SS                 | pairs: apiKey→OPENAI_EMBEDDING_KEY/OPENAI_API_KEY                | none                                                | —                |
| /api/get-background-list      | GET       | FR                 | none                                                             | in-route                                            | —                |
| /api/get-image-list           | GET       | FR                 | none                                                             | in-route                                            | —                |
| /api/get-live2d-list          | GET       | FR                 | none                                                             | in-route                                            | —                |
| /api/get-pngtuber-list        | GET       | FR                 | none                                                             | in-route                                            | —                |
| /api/get-pose-list            | GET       | FR                 | none                                                             | in-route                                            | —                |
| /api/get-vrm-list             | GET       | FR                 | none                                                             | in-route                                            | —                |
| /api/getSlideFolders          | GET       | FR                 | none                                                             | in-route                                            | —                |
| /api/getSupplement            | GET       | FR                 | none                                                             | in-route                                            | —                |
| /api/memory-files             | GET       | FR                 | none                                                             | in-route（`{ files: [] }` を返す）                  | —                |
| /api/memory-restore           | POST      | FR                 | none                                                             | deny                                                | —                |
| /api/messages                 | GET, POST | EC(legacy, 無認証) | none                                                             | deny                                                | —                |
| /api/openAITTS                | POST      | SS                 | pairs: apiKey→OPENAI_TTS_KEY/OPENAI_API_KEY                      | none                                                | —                |
| /api/save-chat-log            | POST      | FW, SS             | always（SUPABASE_URL/SERVICE_ROLE_KEY）                          | deny（restricted時の実挙動を移行時に確定 — §3.2注） | embed            |
| /api/stylebertvits2           | POST      | SS, SU             | dynamic                                                          | none                                                | —                |
| /api/tts-aivis-cloud-api      | POST      | SS                 | pairs: apiKey→AIVIS_CLOUD_API_KEY                                | none                                                | challenge, embed |
| /api/tts-aivisspeech          | POST      | SS, SU             | pairs: serverUrl→AIVIS_SPEECH_SERVER_URL                         | none                                                | —                |
| /api/tts-google               | POST      | SS                 | always（GOOGLE_TTS_KEY）                                         | none                                                | —                |
| /api/tts-gsvi                 | POST      | SS, SU             | pairs: serverUrl→GSVI_TTS_URL                                    | none                                                | —                |
| /api/tts-koeiromap            | POST      | CP                 | none                                                             | none                                                | —                |
| /api/tts-voicevox             | POST      | SS, SU             | pairs: serverUrl→VOICEVOX_SERVER_URL                             | none                                                | —                |
| /api/update-aivis-speakers    | POST      | FW, SS, SU         | always                                                           | deny                                                | —                |
| /api/update-pose-rotation     | POST      | FW                 | none                                                             | deny                                                | —                |
| /api/update-voicevox-speakers | POST      | FW, SS, SU         | always                                                           | deny                                                | —                |
| /api/updateSlideData          | POST      | FW                 | none                                                             | deny                                                | —                |
| /api/upload-background        | POST      | FW                 | none                                                             | deny                                                | —                |
| /api/upload-image             | POST      | FW                 | none                                                             | deny                                                | —                |
| /api/upload-vrm-list          | POST      | FW                 | none                                                             | deny                                                | —                |
| /api/whisper                  | POST      | SS                 | dynamic（bodyParser: false）                                     | none                                                | —                |
| /api/youtube/continuation     | POST      | SS, SU             | dynamic                                                          | none                                                | —                |
| /api/v1/chat                  | POST      | EC                 | none                                                             | deny                                                | —                |
| /api/v1/events                | GET       | EC                 | none                                                             | deny                                                | —                |
| /api/v1/messages              | POST      | EC                 | none                                                             | deny                                                | —                |
| /api/v1/speak                 | POST      | EC                 | none                                                             | deny                                                | —                |
| /api/v1/status                | GET       | EC                 | none                                                             | deny                                                | —                |
| /api/v1/stop                  | POST      | EC                 | none                                                             | deny                                                | —                |
| /api/v1/client/commands       | GET       | EC                 | none                                                             | deny                                                | —                |
| /api/v1/client/status         | POST      | EC                 | none                                                             | deny                                                | —                |

注:

- `serverUrl` 宣言を持つのは `/api/tts-voicevox`, `/api/tts-aivisspeech`, `/api/tts-gsvi`（body.serverUrl）と `/api/update-voicevox-speakers`, `/api/update-aivis-speakers`（query.serverUrl）。`stylebertvits2` はdynamicとしてルート内の既存URL検証（RunPod例外含む）を維持。`ai/vercel` / `youtube/continuation` のLM Studio・Ollama URLは `guardLocalLlmUrl` で検証する。`difyChat` / `ai/custom` のURLはユーザーSaaS/任意API接続先のため許可リスト検証は課さない（現行どおり。SSRF面はSSリソースのガードで在圏化されている旨をここに明記）。
- `/api/messages` は認証のないlegacyキュー。現状の挙動を保存しつつ `EC(legacy)` として明示分類し、将来 `requireApiKey` 配下に統合する候補としてマークする（本タスクでは変更しない）。
- `resources` に SU を含むルートは「`serverUrl` 宣言を持つ」か「ルート内で `serverUrlGuard` を参照している」ことを静的テストで要求する（レビューm7の一般化）。

## 6. WAFルールの導出

### 6.1 現状

3ルール（`aituberkit-nikechan-embed-skip` / `aituberkit-browser-clearance` / `aituberkit-protected-api-clearance`）の式がワークフローYAML内にハードコードされ、以下がコードと二重管理:

- protected-api-clearance の対象パス: `/api/ai/custom`, `/api/tts-aivis-cloud-api`
- embed skip の許可APIパス: `/api/ai/custom`, `/api/ai/vercel`, `/api/tts-aivis-cloud-api`, `/api/save-chat-log`

browser-clearance ルールと embed-skip の静的アセット条件は完全にデプロイ固有であり、テーブル由来にはならない（configに置く）。

### 6.2 新方式

- `scripts/waf/waf.config.json`: デプロイ固有値（zone hosts, embedオリジン, 静的アセットパス群, referer条件）を保持
- `scripts/waf/generate-waf-rules.mjs`: `routePolicies.ts` を直接import（Node 24 type stripping）し、`waf.challenge` / `waf.embedAllowed` からAPIパスリストを導出してルール配列を組み立てる。`--print` でJSON出力（テスト用）
- ワークフロー変更: `actions/checkout@v4` + `actions/setup-node@v4`（`node-version: '24.x'`、`test.yml` と同一）を追加し、インラインheredocを `node scripts/waf/generate-waf-rules.mjs` 呼び出しに置換（apply/removeの制御フローは現行維持）
- **等価性保証**（レビューM2対応）: `in {…}` 集合のパス順序は現行式が不規則なため、byte一致ではなく**意味的等価**で検証する。テストは現行のハードコード式をフィクスチャとして保持し、`in {…}` 集合をパースして集合比較、それ以外の部分は文字列一致で比較する
- スナップショットテストは ts-jest import ではなく **`child_process` でスクリプトを実際に実行**して出力を検証する（type strippingの互換性検証を兼ねる — レビューM2/M3）

### 6.3 残存する運用ギャップ（レビューm4）

WAFは `workflow_dispatch` 手動適用のままなので、`routePolicies` 変更後にWAF再適用を忘れる乖離は残る。本タスクでは「生成が同一定義由来であること」までをスコープとし、自動diff検出ジョブは将来課題として記録する。

## 7. テスト計画

### 7.1 ラッパー単体テスト（リソース × デプロイ文脈マトリクス）

`mockServerSecretGuard` ヘルパーを再利用。

- server-secret: disabled→403 / protected+Bearer→許可 / demo同一オリジン→許可 / demoレート超過→429 / unprotected→許可 / クライアントキー持込（pairs全滅）→ガード非発動
- secret kind別: pairs（部分持込の組合せ）/ always / dynamic（`guardServerSecret` 呼び出しの遅延発動、非dynamicでの呼び出しthrow）
- fs-write deny: restricted→403 / 通常→通過
- external-control: キー未設定→503 / 不一致→401 / 一致→許可 / restricted→403
- server-url: private/設定済みURL→ガード発動 / 許可リスト→通過 / 許可外public→400 / 非HTTP→400 / env設定URLパース不能→400
- メソッド外→405（統一シェイプ）

### 7.2 静的テスト（`apiRouteStaticChecks.test.ts` を拡張）

1. `src/pages/api/**` の全ファイルが `routePolicies` に登録されている（fs走査 vs テーブルの突合、両方向）
2. 全ルートのdefault exportが `withAccessPolicy(` でラップされている（grep、例外リストは最終的に空）
3. `secret.kind === 'dynamic'` のルートファイルが `gate.guardServerSecret(` を呼んでいる
4. `routePolicies.ts` のimportが `import type` のみである（WAF生成のtype stripping互換性の保証）
5. `resources` にSUを含むルートは `serverUrl` 宣言を持つか `serverUrlGuard` を参照している
6. （既存）Nodeランタイムルートで `new Response` をreturnしない

静的テスト1は**Stage 1で導入**し、未移行ルートを縮小allowlistとして持つ（レビューm1。移行の進捗がテストで可視化され、完了時にallowlistが空になる）。

### 7.3 既存ルートテストの扱い

移行後も既存テスト（`tts-voicevox.test.ts` / `azureOpenAITTS.test.ts` 等）を維持するが、§8の意図的変更（405シェイプ、ガード優先順序）に該当するassertは**変更理由をコミットに明記した上で更新**する。「既存テストgreen」は挙動保存の証明ではなく回帰検知の補助と位置づける（レビューB1指摘）。§8の順序変更ケースは新規テストで固定する。

### 7.4 WAF生成テスト

§6.2の等価性検証（child_process実行 + 集合比較）。

## 8. 意図的な挙動変更（これ以外は現状維持）

| #   | 変更                                                                                                                                                                                                                                | 影響                                                                                                                                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **ガード評価をルートロジックより優先する統一順序**の採用                                                                                                                                                                            | (a) 現行「パラメータ400 → ガード403」だったルート（`azureOpenAITTS`, `cartesia` 等）で、ガード拒否条件下のパラメータ不足リクエストが 400→403 に変わる。(b) v1系8ルートで restricted時のメソッド違反が 403→405 に変わる。いずれもガード優先の方がセキュリティ上正しく（エラー差分によるenv設定有無の推測を防ぐ）、既存クライアントはエラーコードで分岐していない |
| 2   | **メソッド検査の全ルート適用**（現行14ルートで欠落: cartesia, elevenLabs, get-\*-list系5, getSlideFolders, stylebertvits2, tts-aivis-cloud-api, tts-aivisspeech, tts-google, tts-koeiromap, tts-voicevox）                          | 想定外メソッドが現行の500/400/素通りから405に変わる                                                                                                                                                                                                                                                                                                             |
| 3   | **405ボディの統一**: `{ error: 'Method not allowed' }`（現行最多数派 + `sendMethodNotAllowed` と同一）に統一。現行6種類のシェイプ（`message` キー派11ルート、`Method Not Allowed` 大文字派8ルート、difyChat独自シェイプ等）が変わる | ステータスコードは405で不変。既存テストのassert更新が必要                                                                                                                                                                                                                                                                                                       |
| 4   | **S13**: `azureOpenAITTS.ts` の `endpoint` を `isHttpUrl` で検証し、抽出した `deploymentName` を `/^[A-Za-z0-9._-]+$/` に制限。違反は400                                                                                            | env/ユーザー由来URLの無検証パース解消（serverUrlGuard前例の適用）                                                                                                                                                                                                                                                                                               |
| 5   | `tts-koeiromap.ts` のポリシー登録（client-proxy分類 + メソッド検査）                                                                                                                                                                | #2に包含。サーバー秘匿リソースは使わないため拒否強化はなし                                                                                                                                                                                                                                                                                                      |
| 6   | ファイル書き込み系ルートは「self-hostでは無認可」のまま**明示的に**分類・文書化                                                                                                                                                     | 挙動変更なし。認可追加はself-hostの既存UX（設定画面からのアップロード）を壊すため行わない。将来の締め付けはF3以降の判断                                                                                                                                                                                                                                         |

`src/features/stores/home.ts` の `isRestrictedMode` 参照（クライアント漏出の指摘）について:
`NEXT_PUBLIC_RESTRICTED_MODE` はビルド時にクライアントバンドルへインライン展開されるため動作上は正しい。
`utils/restrictedMode.ts` に「クライアント/サーバー両用の低レベルフラグ読み取り」である旨をコメントで明文化するに留める（挙動変更なし）。

## 9. 移行手順（実装ステージ）

1. **Stage 1**: `src/lib/accessPolicy/` コアモジュール + ラッパー単体テスト + 静的テスト（登録allowlist方式で導入）
2. **Stage 2**: ルート移行（グループ単位、各グループ後にテスト実行、allowlistを縮小）
   - 2a: fs-read一覧系（8） / 2b: fs-write系 + save-chat-log（9）
   - 2c: 宣言的pairsのTTS系 + embedding（8） / 2d: serverUrl宣言系（4）
   - 2e: dynamic系（ai/vercel, ai/custom, youtube/continuation, whisper, stylebertvits2）+ difyChat
   - 2f: v1系（8）+ messages / 2g: 残り（convertMarkdown, convertSlide, tts-koeiromap, tts-google）
3. **Stage 3**: WAF生成スクリプト + ワークフロー変更 + 等価性テスト
4. **Stage 4**: デプロイ文脈マトリクステスト + allowlist空化の確認
5. **Stage 5**: S13（azureOpenAITTS検証強化）

各ステージは独立してテスト可能。未移行ルートは現行ガードのまま動くため、Stage 2の途中で中断しても不整合は起きない（新旧経路は同一のガード実装・同一env・同一rate-limitストアを共有する）。

## 10. 完了条件（ロードマップF1の再掲）

- [x] ポリシーモジュール1個（`src/lib/accessPolicy/`: types / routePolicies / secretPairs / withAccessPolicy）
- [x] 全ルートの分類表（本ドキュメント§5 + `routePolicies.ts` が実体。47ルート全て移行済み、静的テストのallowlistは空）
- [x] WAFワークフローが同一定義から生成される（`scripts/waf/generate-waf-rules.mjs` + 移行前ルールとの意味的等価テスト）
- [x] デプロイ文脈ごとのテスト（`withAccessPolicy.test.ts` のリソース×モードマトリクス + `deployContextMatrix.test.ts` の運用プロファイル別テスト）
- [x] 新ルート追加時: ポリシー未登録だと静的テストが落ちる（hotfixチェーンの構造的再発防止）

## 付録: レビュー履歴

- v1 → v2: 2系統レビュー（分類表のコード突合 / 設計批判レビュー）を実施。主な変更: 「順序完全保存」を放棄し「ガード優先統一順序」を意図的変更として計上（B1）、whisper/stylebertvits2をdynamic化（B2/M1）、高階関数 `withAccessPolicy` 採用と dynamic時の `guardServerSecret` 強制（B3/M5）、WAF等価性検証を集合比較化 + setup-node明記（M2/M3）、405統一先を多数派シェイプに変更（M6）、restricted列の確定（コード突合）、静的テストのallowlist方式導入（m1）。
- v2 → v3（実装完了）: difyChatをdynamicへ変更（pairs宣言が実コードの条件結合と非等価であることを移行時の等価性検証で検出）、memory-filesのrestricted挙動をin-routeに確定、S13実装（endpoint URL検証 + deploymentName文字種制限 + テスト4件）、既存テストの405シェイプassertを統一シェイプに更新（vercel / custom / save-chat-log / update-\*-speakers / youtube/continuation / updateSlideData / embedding の8ファイル）。
