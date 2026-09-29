# 花詩ましょ：VercelとWindowsで配信する

このforkには、ましょの6表情、滑らかな口パク、公開可能な本番初期値を含めています。
6表情はキャラクター設定から手動で切り替えます。発言内容に合わせた自動表情切り替えは含めません。
Vercelはアプリ配信と会話AIのAPI中継、WindowsはChromeでのキャラクター表示・VOICEVOX・OBSを担当します。
Macからの映像・音声ミラーリングは不要です。

## 1. Vercelへデプロイ

1. この変更が入ったブランチを、自分のGitHubリポジトリへ反映します。
2. [VercelのNew Project](https://vercel.com/new)で `hayasaki-shunsuke/aituber-kit` をImportします。
3. デプロイ対象がこの変更を含むブランチであることを確認します。
4. FrameworkはNext.js、Root Directoryはリポジトリ直下、Node.jsは24.xを使います。
5. Install Commandは `npm ci`、Build Commandは `npm run build`。`vercel.json`にも同じ値を設定済みです。Output Directoryは自動設定のままです。
6. Deploy後、WindowsのChromeで固定のプロジェクトURL（例：`https://自分のプロジェクト.vercel.app`）を開きます。

ましょの表示、口パク、日本語、VOICEVOXのブラウザ直接接続、ファイル書き込み制限は `.env.production` に設定済みです。
このファイルにはAPIキーやトークンを入れません。必要ならVercelのEnvironment Variablesで初期値を上書きして再デプロイします。
ブラウザに保存済みの設定は初期値より優先されるため、既にアクセスしたブラウザでは画面から設定を変更してください。

### 会話AIのAPIキー

公開サイト共通のキーは配布しません。Windowsの設定画面で、自分のAPIキーを入力します。
初期値はOpenAI / カスタムモデル `gpt-6-luna`、Reasoning Mode有効・effort `none`、最大出力256トークンです。別のサービスやモデルへ変更できます。
APIキー入力前は有料AIの会話は動きません。API利用料は別途発生します。

`AITUBERKIT_SERVER_SECRET_ACCESS_MODE=disabled` はサーバー側に置いた共有キーの利用を拒否する設定で、サイト自体のログイン制限ではありません。
自分専用の画面にする場合はVercelのDeployment Protectionで対象URLを保護し、Windowsでログインして利用します。
将来サーバー側に共有キーを置く場合は認証を含む構成に変更してください。`NEXT_PUBLIC_*` にAPIキーは設定しません。

## 2. WindowsのVOICEVOXを起動

1. [VOICEVOX](https://voicevox.hiroshiba.jp/)をWindowsへインストールして起動します。
2. Chromeで `http://127.0.0.1:50021/version` を開き、バージョンが返ることを確認します。
3. `http://127.0.0.1:50021/setting` を開きます。
4. Allow Originに、手順1の固定URLのOrigin（`https://...`、パスや末尾の `/` は付けない）だけを追加します。
5. 保存してVOICEVOXのエンジンを再起動します。

既定のCORS方針 `localapps` は維持します。全Origin許可やポート開放、公開トンネルは不要です。
VercelのプレビューURLはデプロイごとに変わるため、配信には固定のプロジェクトURLか独自ドメインを使います。

## 3. Vercelの画面から声を出す

1. VOICEVOXと同じWindowsのChromeで公開URLを開きます。
2. 音声設定でVOICEVOXを選び、接続方式を「このPCのブラウザから直接」にします。
3. 接続先は空欄（既定 `http://127.0.0.1:50021`）か同じURLを指定します。
4. 「話者リストを更新」を押し、Chromeのローカルネットワークアクセスを許可します。
5. 話者は初期値の小夜/SAYO（46）などから選びます。利用する音声の規約とクレジット表記を確認してください。
6. テスト音声を再生し、声と口パクを確認してからAIとの会話を試します。

最初の再生はブラウザ画面の操作後に行ってください。Chromeの自動再生制限があるためです。
ブラウザ直接モードの話者取得は、Vercel上のファイルへ書き込みません。取得した一覧は画面内で利用し、ページを再読込すると同梱の一覧へ戻ります。選んだ話者IDなどの設定はブラウザに保存します。

`127.0.0.1` は画面を開いているPC自身を指します。MacでこのURLを開くとMacのVOICEVOXへ接続します。
直接モードは同一PCのloopbackだけに対応します。別PCのLAN IPや外部サーバーへ会話文を送る用途には使いません。
従来のローカルAITuberKitは「サーバー経由」を引き続き利用できます。

## 4. OBS・YouTubeを確認

1. WindowsのOBSでChromeの画面をキャプチャします。
2. Chromeから再生されるましょの音声をOBSへ取り込みます。
3. 短い録画を作り、表情・口パク・声・音量を確認します。
4. AITuberKitのYouTube設定で対象配信とコメント取得を設定します。
5. 自動発話とYouTube連携は、手動会話が成功してから有効にします。初期値では無効です。

WindowsのブラウザとVOICEVOXは配信中も起動しておきます。Vercelへ置いただけで常時配信されるわけではありません。

## 更新と切り戻し

コード・素材を変更してGitHubの連携ブランチへ反映するとVercelが再デプロイします。
表情などの素材を追加・更新するときは、先に対象ファイルをGitに追加し、その後リポジトリ直下で次を実行します。

```sh
node scripts/generate-asset-manifest.js
```

生成された `src/constants/assetManifest.json` もコミットします。このスクリプトはGit追跡対象のみを列挙します。
Vercelのビルドでは、コミット済みの一覧を利用します。ブラウザのアップロードで素材を永続保存する構成ではありません。
問題が出たらVercelの前のDeploymentへ戻せます。VOICEVOXの直接接続を止める場合は接続方式をサーバー経由へ戻しますが、VercelサーバーからWindowsのlocalhostへは接続できません。

## 接続できないとき

| 症状                              | 確認する点                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| versionも開けない                 | WindowsのVOICEVOXが起動しているか、ポートが50021か                                                 |
| versionは開けるが公開画面から失敗 | Allow Originが公開画面の正確なOriginと一致するか、Chromeでローカルネットワークアクセスを許可したか |
| サーバー経由でlocalhost接続が失敗 | 接続方式をブラウザ直接にする。VercelのlocalhostはWindowsではない                                   |
| 話者リスト更新が無効              | ブラウザ直接を選択する。サーバー経由の更新は制限モードでは使えない                                 |
| ましょが一覧にない                | 6表情がGitHubにあり、素材追加後のassetManifestも反映されているか                                   |
| 古い設定で起動する                | ブラウザ保存値が優先される。設定画面で変更する                                                     |
| AIから返事がない                  | APIキー、モデル利用権限・残高、AI設定を確認する                                                    |

## 検証の範囲

2026-09-30時点で、次を確認しました。

- Node.js 24で `npm run build` 成功。本番コードは `tsconfig.build.json` で型検査します。
- `npm run lint -- --quiet` 成功。警告は残っています。
- PNGTuber描画・表情切替、素材一覧、VOICEVOXの従来経路/ブラウザ直接接続、音声設定UI、設定保存/読込の関連8スイート・125テスト成功。
- Macのブラウザから同じMacのVOICEVOXへ接続し、テスト音声の再生完了を確認。1280×800と390×844で表示を確認。
- ルートの `tsc --noEmit` は未変更の既存テスト23ファイルにある123件の型エラーで失敗します。テスト全体の型修正は今回の変更に含めず、本番コードの型検査を無効化する設定も使用していません。

本番ビルドとMacブラウザでの確認は、WindowsのChromeやVercel HTTPS環境でのCORS/LNA許可を保証しません。
実際の公開後、Windowsで手順3と録画確認を行う必要があります。

## 参照

- [AITuberKitのデプロイ](https://docs.aituberkit.com/guide/deployment)
- [AITuberKitの制限モード](https://docs.aituberkit.com/guide/restricted-mode)
- [VOICEVOX EngineのCORS設定](https://github.com/VOICEVOX/voicevox_engine#cors-設定)
- [Chromeのローカルネットワークアクセス](https://developer.chrome.com/blog/local-network-access)
- [Vercel Hobbyの利用条件](https://vercel.com/docs/plans/hobby)：非商用の個人利用限定。AITuberKitの商用利用条件とは別です。
