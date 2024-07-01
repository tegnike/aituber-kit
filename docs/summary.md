# Project Structure

- nike-ChatVRM/
  - tailwind.config.js
  - LICENSE
  - output_sorted.json
  - marp.pdf
  - Dockerfile
  - marp.md
  - next.config.js
  - electron.mjs
  - input_sorted.json
  - test.py
  - README.md
  - .gitignore
  - package-lock.json
  - package.json
  - .env
  - watch.json
  - tsconfig.json
  - docker-compose.yml
  - postcss.config.js
  - .eslintrc.json
  - locales/
    - ja/
      - translation.json
    - zh/
      - translation.json
    - ko/
      - translation.json
    - en/
      - translation.json
  - docs/
    - vrm_licence_en.md
    - vrm_licence_zh.md
    - logo_licence_ko.md
    - README_ko.md
    - logo_licence_zh.md
    - logo_licence_en.md
    - README_en.md
    - README_zh.md
    - logo_licence.md
    - vrm_licence.md
    - vrm_licence_ko.md
  - .next/
  - public/
    - ogp.png
    - bg-c.png
    - github-mark-white.svg
    - AvatarSample_B.vrm
    - AvatarSample_B_old.vrm
    - idle_loop.vrma
  - .github/
    - workflows/
      - nextjs.yml
  - .git/
  - src/
    - features/
      - emoteController/
        - expressionController.ts
        - emoteConstants.ts
        - autoLookAt.ts
        - autoBlink.ts
        - emoteController.ts
      - lipSync/
        - lipSyncAnalyzeResult.ts
        - lipSync.ts
      - messages/
        - speakCharacter.ts
        - messages.ts
        - synthesizeStyleBertVITS2.ts
        - synthesizeVoiceGoogle.ts
        - synthesizeVoice.ts
      - chat/
        - localLLMChat.ts
        - anthropicChat.ts
        - openAiChat.ts
        - googleChat.ts
        - groqChat.ts
        - difyChat.ts
        - aiChatFactory.ts
      - constants/
        - systemPromptConstants.ts
        - koeiroParam.ts
      - vrmViewer/
        - viewerContext.ts
        - model.ts
        - viewer.ts
      - youtube/
        - conversationContinuityFunctions.ts
        - youtubeComments.ts
      - googletts/
        - googletts.ts
      - koeiromap/
        - koeiromap.ts
    - utils/
      - reduceTalkStyle.ts
      - englishToJapanese.json
      - wait.ts
      - buildUrl.ts
    - styles/
      - globals.css
    - components/
      - settings.tsx
      - chatLog.tsx
      - messageInput.tsx
      - link.tsx
      - speakers.json
      - meta.tsx
      - textButton.tsx
      - assistantText.tsx
      - codeLog.tsx
      - menu.tsx
      - messageInputContainer.tsx
      - iconButton.tsx
      - githubLink.tsx
      - introduction.tsx
      - vrmViewer.tsx
    - lib/
      - i18n.js
      - VRMAnimation/
        - VRMAnimation.ts
        - VRMAnimationLoaderPluginOptions.ts
        - VRMAnimationLoaderPlugin.ts
        - loadVRMAnimation.ts
        - VRMCVRMAnimation.ts
        - utils/
          - linearstep.ts
          - saturate.ts
          - arrayChunk.ts
      - VRMLookAtSmootherLoaderPlugin/
        - VRMLookAtSmoother.ts
        - VRMLookAtSmootherLoaderPlugin.ts
    - pages/
      - index.tsx
      - _document.tsx
      - _app.tsx
      - api/
        - anthropic.ts
        - chat.ts
        - groq.ts
        - google.ts
        - tts.ts
        - stylebertvits2.ts

# File Descriptions

## tailwind.config.js

### File Description
このファイルは、Tailwind CSSのカスタム設定を定義しています。テーマカラーやフォントファミリーなどをカスタマイズし、それらをTailwind CSSで利用できるようにしています。

### Imported Modules
- `@charcoal-ui/theme`
- `@charcoal-ui/tailwind-config`

### Functions
このファイルには関数の定義はありません。代わりに、Tailwind CSSの設定オブジェクトを`module.exports`としてエクスポートしています。


## LICENSE

### File Description
このファイルには、MITライセンスの完全なテキストが含まれています。MITライセンスはソフトウェアの自由な使用、コピー、変更、配布などを許可する許諾型のオープンソースライセンスです。

### Imported Modules
なし

### Functions
なし


## Dockerfile

### File Description
この Dockerfileは、Node.js アプリケーションをDockerコンテナ内で実行するための設定ファイルです。Node.js のバージョン 16 を使用し、アプリケーションのソースコードとパッケージ依存関係をコンテナにコピーし、アプリケーションをビルドしてから実行します。

### Imported Modules
このファイルではモジュールのインポートはありません。

### Functions
このファイルでは関数の定義はありません。代わりに、以下のDockerコマンドが記述されています:

- `FROM node:16`: Node.js 16 の公式イメージを使用することを指定しています。
- `WORKDIR /app`: コンテナ内の作業ディレクトリを `/app` に設定しています。
- `COPY package*.json ./`: `package.json` と `package-lock.json` をコンテナにコピーしています。
- `RUN npm ci`: パッケージ依存関係をインストールしています。
- `COPY . .`: アプリケーションのソースコードをコンテナにコピーしています。
- `RUN npm run build`: アプリケーションをビルドしています。
- `EXPOSE 3000`: コンテナの 3000 番ポートを公開することを指定しています。
- `CMD ["npm", "start"]`: コンテナ起動時に `npm start` コマンドを実行することを指定しています。


## next.config.js

### File Description
このファイルは、Next.jsアプリケーションの設定を定義するための構成ファイルです。Next.jsの動作を制御するための様々なオプションが設定されています。

### Imported Modules
インポートされているモジュールはありません。

### Functions
このファイルには関数定義はありません。代わりに、`nextConfig`オブジェクトが定義されており、Next.jsアプリケーションの構成オプションが設定されています。主な設定項目は以下の通りです:

- `reactStrictMode`: React の strict mode を有効にするかどうかを設定します。
- `assetPrefix`: アセットへのパスのプレフィックスを設定します。
- `basePath`: アプリケーションのベースパスを設定します。
- `trailingSlash`: URLの末尾にスラッシュを追加するかどうかを設定します。
- `publicRuntimeConfig`: ランタイム時に利用可能な公開設定を定義します。
- `optimizeFonts`: フォントの最適化を行うかどうかを設定します。

最後に、`module.exports = nextConfig`により、定義した構成オブジェクトがエクスポートされます。


## electron.mjs

### File Description
このファイルは、Electronアプリケーションのメインプロセスを設定するためのコードです。ウィンドウの作成、サイズの設定、開発モードと本番モードでの動作の切り替えなどの機能を提供しています。

### Imported Modules
- `electron` (app, BrowserWindow, screen)
- `path`
- `url` (`fileURLToPath`)
- `electron-is-dev`
- `wait-on`

### Functions
- `createWindow()`: メインウィンドウを作成し、開発モードと本番モードに応じて適切なURLからコンテンツを読み込みます。ウィンドウのサイズ、透明度、フレームの有無などのオプションも設定できます。


## test.py

### File Description
このスクリプトは、JSONファイルのキーを文字列の長さで降順にソートし、新しいJSONファイルに書き込みます。ソートされたJSONオブジェクトは、OrderedDictを使って保持されるため、キーの順序が維持されます。

### Imported Modules
- json (JSONデータを扱うためのモジュール)
- collections (OrderedDictクラスをインポートするため)

### Functions
- sort_json_keys_by_length(input_file, output_file)
  - 指定された入力JSONファイルを読み込み、キーを長さで降順にソートします。その後、ソートされたJSONデータを新しい出力JSONファイルに書き込みます。


## README.md

### File Description
このファイルは、AITuberキットのリポジトリの README ファイルです。AITuberキットは、AI キャラクターを使った会話や配信ができるアプリケーションです。アプリケーションの概要、使用方法、設定方法などが記載されています。

### Imported Modules
このファイルではモジュールはインポートされていません。

### Functions
このファイルには関数の定義はありません。


## .gitignore

### File Description
このファイルは、Gitリポジトリから無視するファイルやディレクトリを指定するための `.gitignore` ファイルです。特定のファイルやディレクトリをリポジトリに含めないことで、リポジトリのサイズを小さく保つことができます。

### Imported Modules
このファイルではモジュールをインポートしていません。

### Functions
このファイルでは関数を定義していません。代わりに、次のようなパターンに基づいてファイルやディレクトリを無視するよう指定しています:

- `/node_modules`、`/.pnp`、`.pnp.js`: Node.jsの依存関係ファイル
- `/coverage`: テストカバレッジレポートのディレクトリ
- `/.next/`、`/out/`、`/build`: Next.jsのビルド出力ディレクトリ
- `.DS_Store`、`*.pem`: macOSとPEM証明書ファイル
- `npm-debug.log*`、`yarn-debug.log*`、`yarn-error.log*`、`.pnpm-debug.log*`: デバッグログファイル
- `.env*.local`: ローカル環境設定ファイル
- `.vercel`: Vercelのデプロイ設定ファイル
- `*.tsbuildinfo`、`next-env.d.ts`: TypeScriptのビルド出力ファイル
- `credentials.json`: 資格情報ファイル
- `.tool-versions`: asdfバージョン管理ツールの設定ファイル


## package.json

### File Description
このファイルは、Next.js と Electron を使用した Chat-VRM アプリケーションのパッケージ構成を定義しています。スクリプトとして開発用、ビルド用、実行用、エクスポート用、リント用などが含まれています。また、必要な依存関係とDevDependenciesが列挙されています。

### Imported Modules
なし (このファイルではモジュールをインポートしていません)

### Functions
なし (このファイルでは関数を定義していません)


## .env

このファイルには関数定義や特定のモジュールのインポートはありません。代わりに、環境変数の設定が含まれています。

### File Description
このファイルは、アプリケーションで使用される環境変数を設定するためのものです。様々なサービスの認証キーやURL、その他の設定が含まれています。

### Imported Modules
なし

### Functions
なし


## watch.json

この内容はJSONファイルのようですね。ファイル内には関数やモジュールのインポートはありません。代わりに、JSONオブジェクトが定義されています。

### File Description
これはNext.jsアプリケーションの設定ファイルの一部のようです。`install`と`restart`プロパティは、ファイルの変更時にNext.jsの開発サーバーが自動的に再起動するファイルのリストを定義しています。`throttle`プロパティは、ファイル変更の監視間隔(ミリ秒単位)を設定しています。

### Imported Modules
なし

### Functions
なし


## tsconfig.json

### File Description
このファイルは、TypeScriptプロジェクトの設定を定義するTSConfigファイルです。コンパイラオプションやインクルード/エクスクルードするファイルの設定などが含まれています。

### Imported Modules
このファイルではモジュールがインポートされていません。

### Functions
このファイルには関数が定義されていません。代わりに、以下のプロパティが設定されています:

- `compilerOptions`: TypeScriptコンパイラのオプションを設定するオブジェクト
- `include`: コンパイルに含めるファイルのパターンを指定する配列
- `exclude`: コンパイルから除外するファイルのパターンを指定する配列

各プロパティの詳細は、TypeScriptの公式ドキュメントを参照してください。


## docker-compose.yml

### File Description
このファイルはDockerコンポーズファイルで、Docker環境におけるサービスの構成を定義しています。単一のアプリケーションサービスが設定されており、ビルド、ポートマッピング、ボリュームマウント、環境変数ファイルの読み込みが指定されています。

### Imported Modules
なし (このファイルはYAML形式で記述されており、モジュールのインポートは行われていません)

### Functions
なし (このファイルは構成ファイルであり、関数の定義は含まれていません)


## postcss.config.js

### File Description
このファイルは、PostCSS（CSSプリプロセッサツール）の設定ファイルです。Tailwind CSSおよびAutoPrefixerプラグインを読み込んでいます。

### Imported Modules
なし

### Functions
なし (このファイルには関数は定義されていません)


## .eslintrc.json

### File Description
このファイルは、Next.jsアプリケーションにおいて、Coreウェブバイタルのルールを拡張するための設定ファイルです。Coreウェブバイタルとは、ウェブページのパフォーマンスを測定する重要な指標のことです。

### Imported Modules
インポートされているモジュールはありません。

### Functions
関数は定義されていません。このファイルは単に設定情報を含むJSONファイルです。


## locales/zh/translation.json

### File Description
このファイルには、Webアプリケーションの様々な設定オプションが含まれています。ユーザーインターフェイスの言語、音声合成エンジン、AIサービスの選択、キャラクターモデルの選択など、アプリケーションの動作を制御する設定項目があります。

### Imported Modules
モジュールはインポートされていません。

### Functions
関数は定義されていません。このファイルはJSON形式の設定ファイルです。


## locales/ko/translation.json

このファイルは、多言語対応のWebアプリケーションの多数の設定値をJSON形式で定義しているようです。設定項目には、AI アシスタントの選択、APIキーの入力、キャラクターモデル、音声エンジンの選択、言語設定などがあります。

### File Description
多言語対応のWebアプリケーションの各種設定値をJSON形式で定義したファイルです。アプリケーションの動作を設定するための重要なファイルと思われます。

### Imported Modules
モジュールはインポートされていないようです。

### Functions
関数の定義はありません。キーと値のペアで設定値が定義されています。


## locales/en/translation.json

このファイルには実際のコードが含まれていないため、インポートされているモジュールや定義されている関数については説明できません。ただし、ファイルの内容を見ると、これは多言語対応のウェブアプリケーションの設定や文字列リソースを含むJSONファイルのようです。

### File Description
このファイルには、ウェブアプリケーションの様々な設定項目と、UIに表示されるテキストリソースが含まれています。設定項目には、外部接続モード、YouTube モード、会話の継続モードなどが含まれています。また、使用する AI サービスや音声合成エンジンの選択、キャラクター設定、会話履歴の管理など、アプリケーションの動作を制御する様々な設定が含まれています。

### Imported Modules
なし (JSONファイルなのでモジュールはインポートされていません)

### Functions
なし (JSONファイルなので関数は定義されていません)


## docs/vrm_licence_en.md

### File Description
このファイルは、GitHub リポジトリ [aituber-kit](https://github.com/tegnike/aituber-kit) で提供されている VRM モデルの利用規約を定めています。利用が許可される範囲と、禁止事項、免責事項、規約の変更について説明しています。

### Imported Modules
このファイルではモジュールがインポートされていません。

### Functions
このファイルでは関数が定義されていません。このファイルは利用規約の文書であり、実行可能なコードではありません。


## docs/vrm_licence_zh.md

### File Description
このファイルは、aituber-kitリポジトリで提供されているVRMモデルの使用規約を記述したものです。モデルの著作権、使用が許可される場合と禁止される場合、免責事項、規約の変更について説明しています。

### Imported Modules
モジュールはインポートされていません。

### Functions
関数は定義されていません。このファイルは使用規約を記述したドキュメントであり、コードは含まれていません。


## docs/logo_licence_ko.md

### File Description
このファイルは、aituber-kitリポジトリで使用されているロゴの利用規約について説明しています。ロゴの著作権、許可される使用方法、禁止される使用方法、免責事項、規約の変更、連絡先などが記載されています。

### Imported Modules
このファイルではモジュールがインポートされていません。

### Functions
このファイルには関数が定義されていません。内容はロゴの利用規約に関する説明のみです。


## docs/README_ko.md

### File Description
このファイルは、AITuber Kitと呼ばれるアプリケーションのリポジトリの説明をしています。AI キャラクターとの対話、YouTubeライブ配信への対応、外部アプリケーションとの統合などの機能を備えています。

### Imported Modules
このファイルには、モジュールのインポートはありません。

### Functions
このファイルには、関数の定義はありません。代わりに、このアプリケーションの概要や使用方法、設定の仕方などが説明されています。


## docs/logo_licence_zh.md

### File Description
このファイルは、aituber-kitリポジトリで使用されるトレードマークの使用条件を規定しています。トレードマークの著作権、許可された使用法、禁止された使用法、免責事項、利用規約の変更、連絡先などが記載されています。

### Imported Modules
このファイルはPythonコードではなくプレーンテキストファイルのため、モジュールはインポートされていません。

### Functions
このファイルは利用規約の文書なので、関数は定義されていません。


## docs/logo_licence_en.md

### File Description
このファイルは、[aituber-kit](https://github.com/tegnike/aituber-kit)リポジトリで使用されているロゴの利用規約を説明しています。ロゴの著作権、許可される使用方法、禁止される使用方法、免責事項、規約の変更、および問い合わせ先が記載されています。

### Imported Modules
このファイルではモジュールがインポートされていません。

### Functions
このファイルでは関数が定義されていません。主にロゴの利用規約に関する情報が記載されているテキストファイルです。


## public/github-mark-white.svg

このファイルは、GitHubのロゴをSVGフォーマットで表現したものです。SVGはスケーラブル・ベクター・グラフィックスの略で、XMLベースのマークアップ言語を使用してベクター画像を記述するためのフォーマットです。

### File Description
このファイルは、GitHubのロゴをSVGフォーマットで表現したものです。SVGは、ウェブ上で高解像度のグラフィックスを表示するために使用されます。

### Imported Modules
このSVGファイルには、外部のモジュールはインポートされていません。

### Functions
このファイルには関数は定義されていません。SVGファイルは、XMLベースのマークアップ言語を使用してベクター画像を記述するためのフォーマットであり、関数は含まれていません。


## .github/workflows/nextjs.yml

### File Description
このファイルはGitHub Actionsのワークフローファイルであり、Next.jsアプリケーションをGitHub Pagesにデプロイするための手順を定義しています。ソースコードのプッシュをトリガーにしてビルドとデプロイが実行されます。

### Imported Modules
インポートされているモジュールはありません。

### Functions
定義された関数はありませんが、以下の2つのジョブが定義されています:

- **build**: Node.jsの環境を設定し、Next.jsアプリケーションをビルドして静的ファイルを生成します。生成された静的ファイルをアーティファクトとしてアップロードします。

- **deploy**: buildジョブの成果物を使って、GitHub Pagesにデプロイを行います。


## src/features/emoteController/expressionController.ts

### File Description
このファイルは、VRMモデルの表情とリップシンクを管理するクラス `ExpressionController` を定義しています。表情の切り替えや、前の表情を0に戻すタイミングの制御、自動の目線追従や自動まばたきの機能を提供しています。

### Imported Modules
- `three` (エイリアス `THREE`)
- `@pixiv/three-vrm` から `VRM`、`VRMExpressionManager`、`VRMExpressionPresetName`
- `./autoLookAt` から `AutoLookAt`
- `./autoBlink` から `AutoBlink`

### Functions
- `constructor(vrm, camera)`: `ExpressionController` インスタンスを初期化します。`AutoLookAt` と `AutoBlink` を設定します。
- `playEmotion(preset)`: 指定された表情プリセットを適用します。前の表情を0に戻し、新しい表情を設定します。
- `lipSync(preset, value)`: リップシンクの表情プリセットと重みを設定します。前のリップシンクを0に戻します。
- `update(delta)`: 毎フレーム呼び出され、自動まばたきとリップシンクの更新を行います。


## src/features/emoteController/emoteConstants.ts

### File Description
このファイルは、瞬きに関連する2つの定数を定義しています。一つは瞬きで目を閉じている最大時間、もう一つは瞬きで目を開いている最大時間を表します。

### Imported Modules
このファイルではモジュールがインポートされていません。

### Functions
このファイルには関数が定義されていません。代わりに、以下の2つの定数が定義されています。

- `BLINK_CLOSE_MAX`: 瞬きで目を閉じている最大時間(0.12秒)を表す定数
- `BLINK_OPEN_MAX`: 瞬きで目を開いている最大時間(5秒)を表す定数


## src/features/emoteController/autoLookAt.ts

### File Description
このファイルは、Three.jsとVRMを使用して、VRMモデルの目線を制御するクラスを提供しています。目線の動きは、VRMLookAtSmootherによって制御されますが、より大きな目線の動きが必要な場合は、このクラスに実装する必要があります。

### Imported Modules
- `three` (インポート元: `"three"`)
- `VRM` (インポート元: `"@pixiv/three-vrm"`)

### Functions
- `AutoLookAt`: VRMモデルの目線を制御するクラス。コンストラクタでVRMインスタンスとカメラオブジェクトを受け取り、目線の対象となるオブジェクトを作成します。VRMの`lookAt`プロパティがある場合、そのターゲットを設定します。


## src/features/emoteController/autoBlink.ts

### File Description
このファイルは、VRMモデルの自動瞬きを制御するクラス `AutoBlink` を定義しています。このクラスは、`VRMExpressionManager` を使用して、モデルの「blink」という表情パラメータを制御することで、自動的に瞬きを生成します。

### Imported Modules
- `@pixiv/three-vrm` から `VRMExpressionManager` をインポート
- `./emoteConstants` から `BLINK_CLOSE_MAX`、`BLINK_OPEN_MAX` をインポート

### Functions
- **constructor(expressionManager)**: `AutoBlink` クラスのコンストラクタ。`VRMExpressionManager` のインスタンスを受け取り、初期状態を設定します。
- **setEnable(isAuto)**: 自動瞬きをオンまたはオフにします。オフにした場合、目が開くまでの時間(秒)を返します。
- **update(delta)**: 経過時間 `delta` を使用して自動瞬きの状態を更新します。
- **close()**: 瞬きを閉じる処理を行います。`blink` パラメータを1に設定し、次に目を開くまでの時間を計算します。
- **open()**: 瞬きを開く処理を行います。`blink` パラメータを0に設定し、次に目を閉じるまでの時間を計算します。


## src/features/emoteController/emoteController.ts

### File Description
このファイルは、VRMモデルの表情表現と口の動きを制御するための機能を提供するクラスを定義しています。EmoteControllerクラスは、ExpressionControllerクラスをラップし、感情表現のプリセットを適用したり、口の動きを同期したりする機能を提供します。

### Imported Modules
- `three`モジュールからインポートされたTHREE名前空間
- `@pixiv/three-vrm`モジュールから、VRMおよびVRMExpressionPresetName
- `./expressionController`から、ExpressionControllerクラス

### Functions
- `constructor(vrm, camera)`: VRMインスタンスとカメラオブジェクトを受け取り、ExpressionControllerインスタンスを初期化します。
- `playEmotion(preset)`: 指定された感情表現のプリセットを適用します。
- `lipSync(preset, value)`: 指定された感情表現のプリセットと値に基づいて、口の動きを同期します。
- `update(delta)`: 経過時間deltaに基づいて、表情の更新を行います。


## src/features/lipSync/lipSyncAnalyzeResult.ts

### File Description
このファイルは、リップシンク分析の結果を表すインターフェースを定義しています。`LipSyncAnalyzeResult`インターフェースには、音量を表す`volume`プロパティがあります。

### Imported Modules
インポートされているモジュールはありません。

### Functions
このファイルには関数の定義がありません。`LipSyncAnalyzeResult`インターフェースのみが定義されています。


## src/features/lipSync/lipSync.ts

### File Description
このファイルは、Web Audio APIを使用して音声データを解析し、リップシンクロナイゼーションに必要な情報を抽出するためのクラスを提供しています。音声の再生と解析のための機能が含まれています。

### Imported Modules
- `./lipSyncAnalyzeResult`からの`LipSyncAnalyzeResult`

### Functions
- `constructor(audio: AudioContext)`: AudioContextを受け取り、解析器を初期化します。
- `update(): LipSyncAnalyzeResult`: 音声データから音量を計算し、リップシンクロナイゼーションに必要な情報を提供します。
- `playFromArrayBuffer(buffer: ArrayBuffer, onEnded?: () => void)`: ArrayBufferから音声データをデコードし、再生します。再生が終了したときにコールバック関数を呼び出すこともできます。
- `playFromURL(url: string, onEnded?: () => void)`: URLから音声データをフェッチし、ArrayBufferとしてデコードした後、再生します。再生が終了したときにコールバック関数を呼び出すこともできます。


## src/features/messages/speakCharacter.ts

### File Description
このファイルは、様々な音声合成APIを使用して音声データを取得し、VRMモデルに話させるための機能を提供しています。英語から日本語への読み上げ変換、音声の調整、異なるAPIやパラメータの選択などの機能が含まれています。

### Imported Modules
- `@/utils/wait`
- `./synthesizeVoice`
- `./synthesizeVoiceGoogle`
- `./synthesizeStyleBertVITS2`
- `../vrmViewer/viewer`
- `./messages`
- `@/utils/englishToJapanese.json`

### Functions
- `createSpeakCharacter`: VRMモデルに話させる関数を返します。様々なオプションを指定できます。
- `convertEnglishToJapaneseReading`: 英語のテキストを、日本語の読み方に変換します。
- `getGoogleTtsType`: GoogleテキストToスピーチAPIで使用するボイスタイプを取得します。
- `getGppgleTtsType`: 言語コードからGoogleテキストToスピーチAPIのボイスタイプを取得します。
- `fetchAudio`: Koeiromap APIを使用して音声データを取得します。
- `fetchAudioVoiceVox`: VOICEVOX APIを使用して音声データを取得します。
- `fetchAudioGoogle`: GoogleテキストToスピーチAPIを使用して音声データを取得します。
- `fetchAudioStyleBertVITS2`: StyleBertVITS2 APIを使用して音声データを取得します。
- `testVoice`: VOICEVOXの音声をテストするための関数です。
- `fetchAudioVoiceGSVIApi`: GSVI TTSサーバーから音声データを取得します。


## src/features/messages/messages.ts

### File Description
このファイルは、テキストデータから感情表現と対話のペアを生成するための関数を提供しています。感情表現は、事前に定義された一連の表情プリセットから選択されます。対話は、音声合成のためのパラメータとテキストメッセージで構成されています。

### Imported Modules
- `@pixiv/three-vrm`からの`VRMExpression`と`VRMExpressionPresetName`
- `../constants/koeiroParam`からの`KoeiroParam`

### Functions
- `splitSentence`: 与えられたテキストを句読点で分割し、配列として返します。
- `textsToScreenplay`: テキストの配列と音声合成パラメータを受け取り、感情表現とメッセージのペアのリストを返します。感情表現は、テキスト内の特別なタグまたは前の感情表現から決定されます。
- `emotionToTalkStyle`: 感情表現を受け取り、対応する会話スタイル(talk、happy、sad、angry)を返します。


## src/features/messages/synthesizeStyleBertVITS2.ts

### File Description
このファイルは、StyleBertVITS2 APIを使用してテキストからオーディオファイルを合成する関数を提供しています。指定されたメッセージ、サーバーURL、モデルID、スタイル、言語を使用して、オーディオファイルを生成し、ArrayBufferオブジェクトとして返します。

### Imported Modules
モジュールはインポートされていません。

### Functions
- `synthesizeStyleBertVITS2Api`
  - 指定されたメッセージ、StyleBertVITS2サーバーURL、モデルID、スタイル、言語を使用して、オーディオファイルを合成します。
  - オーディオデータをArrayBufferオブジェクトとして返します。
  - エラーが発生した場合は、例外をスローします。


## src/features/messages/synthesizeVoiceGoogle.ts

### File Description
このファイルには、GoogleのText-to-Speech (TTS) APIを使用してテキストから音声を生成する関数が含まれています。

### Imported Modules
なし

### Functions

- `synthesizeVoiceGoogleApi(message: string, ttsType: string)`: 指定されたメッセージとTTSタイプを使用して、Google TTS APIを呼び出し、生成された音声データを取得します。この関数は非同期で実行され、音声データをPromiseとして返します。


## src/features/messages/synthesizeVoice.ts

### File Description
このファイルは、音声合成機能を提供するためのモジュールです。メッセージ、話者の特性、話し方のスタイルを指定して、対応する音声データを生成します。

### Imported Modules
- `@/utils/reduceTalkStyle` からの `reduceTalkStyle` 関数
- `../koeiromap/koeiromap` からの `koeiromapV0` 関数
- `../messages/messages` からの `TalkStyle` 型

### Functions
- `synthesizeVoice`: 指定されたメッセージ、話者の特性、話し方のスタイルに基づいて音声データを合成し、返します。
- `synthesizeVoiceApi`: APIキーを使用して、指定されたメッセージ、話者の特性、話し方のスタイル(無料版では制限あり)に基づいて音声データを合成し、返します。


## src/features/chat/localLLMChat.ts

### File Description
このファイルは、ローカルのLanguage Model (LLM) APIにリクエストを送信し、ストリーミング方式で応答を取得する関数を提供しています。

### Imported Modules
- `axios`: HTTPリクエストを送信するためのライブラリ
- `{ Message }`: メッセージオブジェクトをインポートしているモジュール

### Functions
- `getLocalLLMChatResponseStream(messages, localLlmUrl, model?)`: 
  - 指定されたメッセージ、ローカルLLM URL、モデル名を使用して、ローカルLLM APIにPOSTリクエストを送信します。
  - 応答データをストリーミング形式で読み取り、JSONデータを解析して、LLMの応答を1文字ずつ返すReadableStreamを生成します。


## src/features/chat/anthropicChat.ts

### File Description
このファイルは、Anthropic APIを使用してチャットレスポンスを取得するための関数を提供しています。1つの関数は完全なレスポンスを取得し、もう1つの関数はストリーミングレスポンスを取得します。

### Imported Modules
- `{ Message }` から `../messages/messages`

### Functions
- `getAnthropicChatResponse(messages, apiKey, model)`: 指定されたメッセージ、APIキー、モデルを使用してAnthropicからチャットレスポンスを取得する非同期関数。完全なレスポンスを返します。

- `getAnthropicChatResponseStream(messages, apiKey, model)`: 指定されたメッセージ、APIキー、モデルを使用してAnthropicからストリーミングチャットレスポンスを取得する非同期関数。ストリームを返します。


## src/features/chat/openAiChat.ts

### File Description
このファイルは、OpenAI APIを使用してチャットの応答を生成するための関数を提供しています。応答は一括で取得するか、ストリーミングで取得することができます。

### Imported Modules
- `{ OpenAI }` from "openai"
- `{ Message }` from "../messages/messages"
- `{ ChatCompletionMessageParam }` from "openai/resources"

### Functions
- `getOpenAIChatResponse`: 指定されたメッセージ、APIキー、モデルを使用して、OpenAI APIからチャットの応答を取得する関数。応答は一括で返されます。
- `getOpenAIChatResponseStream`: 指定されたメッセージ、APIキー、モデルを使用して、OpenAI APIからチャットの応答をストリーミングで取得する関数。応答はReadableStreamオブジェクトとして返されます。


## src/features/chat/googleChat.ts

### File Description
このファイルには、Google Generative AIを使用してチャットレスポンスを取得するための関数が含まれています。レスポンスをストリーミングで取得する機能も備えています。

### Imported Modules
- `@google/generative-ai`
- `../messages/messages`

### Functions
- `getGoogleChatResponse`: 与えられたメッセージ履歴、APIキー、モデル名を使って、Google Generative AIからチャットレスポンスを取得する非同期関数。
- `getGoogleChatResponseStream`: 与えられたメッセージ履歴、APIキー、モデル名を使って、Google Generative AIからチャットレスポンスをストリームで取得する非同期関数。
- `processMessages`: メッセージ履歴からシステムメッセージと履歴を抽出し、Google Generative AIの入力形式に変換する補助関数。


## src/features/chat/groqChat.ts

### File Description
このファイルは、Groq APIとやり取りするための非同期関数を提供しています。getGroqChatResponseは単一のレスポンスを取得し、getGroqChatResponseStreamはストリームからレスポンスを取得します。

### Imported Modules
- { Message } from "../messages/messages"

### Functions
- `getGroqChatResponse(messages, apiKey, model)`: 指定されたメッセージ、APIキー、モデルを使用して、Groq APIから単一のレスポンスを非同期的に取得します。

- `getGroqChatResponseStream(messages, apiKey, model)`: 指定されたメッセージ、APIキー、モデルを使用して、Groq APIからストリームレスポンスを非同期的に取得します。受信したデータをバッファリングし、JSONオブジェクトの形式で返します。


## src/features/chat/difyChat.ts

### File Description
このファイルは、APIキーとURLを使用して指定された会話IDとメッセージリストからDify Chatのレスポンスストリームを取得する関数を提供しています。レスポンスストリームを読み取り、新しい会話IDを設定する機能があります。

### Imported Modules
- `{ Message }` from "../messages/messages"

### Functions
- `getDifyChatResponseStream`: 与えられたメッセージ、APIキー、URL、会話ID、会話ID設定関数から、Dify Chatのレスポンススストリームを取得する非同期関数です。レスポンスを読み取り、新しい会話IDを設定することができます。


## src/features/chat/aiChatFactory.ts

### File Description
このファイルは、さまざまなAIサービスとやり取りするための機能を提供しています。AIサービスへの問い合わせを行い、そのレスポンスをストリームとして取得できます。サポートされているAIサービスは、OpenAI、Anthropic、Google、ローカルLLM、Groq、Difyfなどです。

### Imported Modules
- `@/features/messages/messages` からの `Message`
- `./openAiChat` からの `getOpenAIChatResponseStream`
- `./anthropicChat` からの `getAnthropicChatResponseStream`
- `./googleChat` からの `getGoogleChatResponseStream`
- `./localLLMChat` からの `getLocalLLMChatResponseStream`
- `./groqChat` からの `getGroqChatResponseStream`
- `./difyChat` からの `getDifyChatResponseStream`

### Functions
- `getAIChatResponseStream`: 指定されたAIサービスにメッセージを送信し、レスポンスをReadableStreamとして取得する関数。AIサービスの種類と設定情報に応じて、適切な関数を呼び出します。


## src/features/constants/systemPromptConstants.ts

### File Description
このファイルは、ユーザーとの会話において、人工知能エージェントが感情を表現する方法を定義しています。感情は5つの種類があり、それぞれ異なる感情状態を表す文字列によって示されます。また、会話文の書式と例が示されています。

### Imported Modules
このファイルではモジュールがインポートされていません。

### Functions
このファイルには関数が定義されていません。代わりに、`SYSTEM_PROMPT`という変数が定義されており、その中に人工知能エージェントの動作方法と会話例が記述されています。


## src/features/constants/koeiroParam.ts

### File Description
このファイルでは、音声合成システムの設定を表すデータ型 `KoeiroParam` と、その値を持つ定数が定義されています。`KoeiroParam` には、スピーカーの位置を表す `speakerX` と `speakerY` の2つのプロパティがあります。

### Imported Modules
インポートされているモジュールはありません。

### Functions
このファイルには関数の定義はありません。代わりに、以下の定数が定義されています:

- `DEFAULT_PARAM`: `KoeiroParam` の標準的な値を持つ定数
- `PRESET_A`: `KoeiroParam` のプリセットA
- `PRESET_B`: `KoeiroParam` のプリセットB
- `PRESET_C`: `KoeiroParam` のプリセットC
- `PRESET_D`: `KoeiroParam` のプリセットD


## src/features/vrmViewer/viewerContext.ts

### File Description
このファイルは、Reactのコンテクストを作成し、Viewerオブジェクトをそのコンテクストに提供しています。Viewerオブジェクトは別のファイルからインポートされています。

### Imported Modules
- react (createContextはreactモジュールから取得されています)
- ./viewer (Viewerクラスはこのファイルからインポートされています)

### Functions
このファイルには関数は定義されていません。ただし、新しいViewerオブジェクトのインスタンスが作成され、createContextを使ってViewerContextという名前のコンテクストが作成されています。


## src/features/vrmViewer/model.ts

### File Description
このファイルは、Three.jsライブラリを使用してVRMモデルの読み込み、アニメーション、リップシンク、表情制御などの機能を提供するクラスを定義しています。VRMモデルを管理し、アニメーションの再生、音声に同期したリップシンク、表情の制御などの機能を提供します。

### Imported Modules
- `three`: Three.jsライブラリのすべてのモジュール
- `@pixiv/three-vrm`: PixivのVRMローダープラグイン
- `three/examples/jsm/loaders/GLTFLoader`: GLTFローダー
- `../../lib/VRMAnimation/VRMAnimation`: VRMアニメーションライブラリ
- `@/lib/VRMLookAtSmootherLoaderPlugin/VRMLookAtSmootherLoaderPlugin`: VRMLookAtSmootherローダープラグイン
- `../lipSync/lipSync`: リップシンクライブラリ
- `../emoteController/emoteController`: 表情制御ライブラリ
- `../messages/messages`: メッセージ管理ライブラリ

### Functions
- `constructor(lookAtTargetParent: THREE.Object3D)`: コンストラクタ。lookAtTargetParentとLipSyncオブジェクトを初期化します。
- `loadVRM(url: string): Promise<void>`: 指定されたURLからVRMモデルを非同期的にロードします。
- `unLoadVrm()`: ロードされたVRMモデルを破棄します。
- `loadAnimation(vrmAnimation: VRMAnimation): Promise<void>`: 指定されたVRMアニメーションをロードし、再生します。
- `speak(buffer: ArrayBuffer, screenplay: Screenplay)`: 指定された音声バッファを再生し、リップシンクを行います。同時に、指定された表情も再生します。
- `update(delta: number): void`: リップシンク、表情制御、アニメーションの更新を行います。


## src/features/vrmViewer/viewer.ts

### File Description
このファイルは、Three.jsライブラリを使用して3Dビューアーを作成するためのクラス `Viewer` を定義しています。このクラスは、VRMモデルをロードし、アニメーションを再生し、カメラの操作やレンダリングを行うためのメソッドを提供しています。

### Imported Modules
- `three`: Three.jsライブラリの全てのモジュールをインポートしています。
- `./model`: カスタムモジュール `Model` をインポートしています。
- `@/lib/VRMAnimation/loadVRMAnimation`: VRMアニメーションをロードするためのユーティリティ関数をインポートしています。
- `@/utils/buildUrl`: URLを構築するためのユーティリティ関数をインポートしています。
- `three/examples/jsm/controls/OrbitControls`: Three.jsの `OrbitControls` クラスをインポートしています。

### Functions
- `constructor()`: `Viewer` クラスのインスタンスを初期化します。シーン、ライト、アニメーションクロックを設定します。
- `loadVrm(url: string)`: 指定されたURLからVRMモデルをロードし、シーンに追加します。また、アイドルアニメーションをロードします。
- `unloadVRM()`: 現在ロードされているVRMモデルをシーンから削除します。
- `setup(canvas: HTMLCanvasElement)`: レンダラーとカメラを設定し、指定されたCanvasエレメントにレンダリングを行います。
- `resize()`: ウィンドウのリサイズに応じてレンダラーとカメラの設定を更新します。
- `resetCamera()`: VRMモデルの頭の位置に基づいてカメラの位置を調整します。
- `update()`: アニメーションを更新し、レンダリングを行うためのメソッドです。requestAnimationFrameを使って再帰的に呼び出されます。


## src/features/youtube/conversationContinuityFunctions.ts

提供されたファイルの内容に基づいて、要求されたMarkdown形式の説明を作成しました。

### File Description
このファイルは、OpenAI APIおよびAnthropicの会話AIサービスを利用して、様々な状況に応じた応答を生成するための関数を提供しています。ユーザーの入力に基づいて、適切な会話コンテキストを構築し、AIモデルから最適な応答を取得する機能があります。また、会話の流れに合わせて話題を切り替えたり、発言者を判断したりする機能も含まれています。

### Imported Modules
- `@/features/messages/messages` (Message型のインポート)
- `@/features/chat/openAiChat` (`getOpenAIChatResponse`関数のインポート)
- `@/features/chat/anthropicChat` (`getAnthropicChatResponse`関数のインポート)

### Functions
- `fetchAIResponse`: クエリメッセージ、APIキー、選択したAIサービスとモデルに基づいて、OpenAI APIまたはAnthropicからの応答を取得する。
- `getLastMessages`: メッセージの配列から、指定された数の最新のユーザーとアシスタントのメッセージを取得し、文字列として返す。
- `getModifiedSystemMessage`: 与えられたシステムメッセージを修正し、キャラクター設定を含む新しいメッセージを返す。
- `getBestComment`: 会話履歴とYoutubeのコメントから、最も適切なコメントを選択する。
- `getMessagesForSleep`: システムプロンプトに基づいて、配信者が人が来るまで別の作業をすることを示す応答を生成するためのメッセージを取得する。
- `getAnotherTopic`: 最新の会話履歴から関連する別の話題を取得する。
- `getMessagesForNewTopic`: 新しい話題に切り替えるための応答を生成するためのメッセージを取得する。
- `checkIfResponseContinuationIsRequired`: 会話履歴から、次の発言者がアシスタントであるべきかどうかを判断する。
- `getMessagesForContinuation`: アシスタントが会話を継続するための応答を生成するためのメッセージを取得する。


## src/features/youtube/youtubeComments.ts

### File Description
このファイルは、YouTubeのライブチャットからコメントを取得し、それらのコメントを処理するための機能を提供しています。また、会話の継続性を維持するための様々な戦略が組み込まれています。

### Imported Modules
- `@/features/messages/messages` からの `Message` モジュール
- `@/features/youtube/conversationContinuityFunctions` から以下の関数をインポート:
  - `getBestComment`
  - `getMessagesForSleep`
  - `getAnotherTopic`
  - `getMessagesForNewTopic`
  - `checkIfResponseContinuationIsRequired`
  - `getMessagesForContinuation`

### Functions
- `getLiveChatId`: 指定された YouTube ライブ ID から対応する YouTube ライブチャット ID を取得します。
- `retrieveLiveComments`: 指定された YouTube ライブチャット ID からコメントを取得します。
- `fetchAndProcessComments`: YouTube のライブチャットからコメントを取得し、会話の継続性を維持するための様々な処理を行います。具体的には、最適なコメントを選択したり、新しいトピックを生成したり、スリープモードに入ったりするなどの機能があります。


## src/features/googletts/googletts.ts

### File Description
このファイルは、指定された文字列とテキスト音声変換(Text-to-Speech: TTS)の種類を受け取り、Google Cloud Text-to-Speechサービスを使ってオーディオコンテンツを合成する関数を提供しています。

### Imported Modules
- `@google-cloud/text-to-speech`

### Functions
- `googleTts(message, ttsType)`: 与えられた`message`文字列と`ttsType`を使って、Google Cloud Text-to-Speechサービスを介してオーディオコンテンツを合成します。音声言語はen-US、性別はFEMALEに設定されています。この関数は、合成されたオーディオコンテンツをPromiseで返します。


## src/features/koeiromap/koeiromap.ts

### File Description
このファイルは、音声合成APIである「Koeiromap」を利用するための関数を提供しています。2つの異なるバージョンのAPIを扱っており、それぞれ異なる関数が定義されています。

### Imported Modules
- `TalkStyle` from `"../messages/messages"`

### Functions
- `koeiromapV0(message, speakerX, speakerY, style)`: 指定された文字列、話者の座標、スタイルを使って音声合成を行い、合成された音声データを返します。
- `koeiromapFreeV1(message, speakerX, speakerY, style, apiKey)`: 指定された文字列、話者の座標、スタイル、APIキーを使って音声合成を行い、合成された音声データを返します。このバージョンはフリープランのAPIを利用しています。


## src/utils/reduceTalkStyle.ts

### File Description
このファイルは、音声合成サービス「koeiromap Free v1」の制限に対応するために、音声の話し方（声色）のパラメーターを制限する機能を提供しています。

### Imported Modules
インポートされているモジュールはありません。

### Functions
- `reduceTalkStyle(talkStyle: string): ReducedTalkStyle`
  - 与えられた `talkStyle` 文字列が `"talk"`, `"happy"`, または `"sad"` の場合は、それを `ReducedTalkStyle` 型として返します。それ以外の場合は `"talk"` を返します。これにより、koeiromap Free v1 の制限に対応した音声の話し方を選択できます。


## src/utils/wait.ts

### File Description
このファイルには、非同期の待機時間を作成する関数が1つ定義されています。指定されたミリ秒数だけ待機するPromiseを返します。

### Imported Modules
なし

### Functions
- `wait(ms: number)`: 指定されたミリ秒数(`ms`)だけ待機する新しいPromiseを返す非同期関数。


## src/utils/buildUrl.ts

### File Description
このファイルは、GitHubページにアプリケーションをデプロイする際に、アセットのURLを適切に構築するための関数を提供しています。

### Imported Modules
- `next/config`

### Functions
- `buildUrl(path: string): string`
  - この関数は、与えられたパス文字列に、アプリケーションのルートURLを付加したURLを返します。これにより、GitHubページにデプロイされたアプリケーションでアセットが正しく読み込まれるようになります。


## src/styles/globals.css

### File Description
このファイルは、Tailwind CSSのユーティリティクラスをインポートし、カスタムスタイルを定義しています。背景画像の配置、スライダーのスタイル、スクロールバーの非表示などの機能が含まれています。

### Imported Modules
なし

### Functions
なし


## src/components/settings.tsx

### File Description
このファイルは、チャットアプリケーションの設定画面用のReactコンポーネントを定義しています。様々な設定項目を扱っており、ユーザーはAIサービス、音声エンジン、キャラクターモデル、バックグラウンド画像などを選択できます。

### Imported Modules
- React
- useEffect (React)
- IconButton (カスタムコンポーネント)
- TextButton (カスタムコンポーネント)
- Message (カスタムコンポーネント)
- GitHubLink (カスタムコンポーネント)
- KoeiroParam, PRESET_A, PRESET_B, PRESET_C, PRESET_D (定数)
- Link (カスタムコンポーネント)
- i18n (i18next)
- useTranslation (react-i18next)
- speakers.json (音声データファイル)

### Functions
- `Settings`: メイン関数で、設定画面全体を構成するReactコンポーネントです。様々なプロップスを受け取り、ユーザーが設定を変更できるようにしています。
- `useEffect`: マウント時に、ローカルストレージから言語設定を取得し、状態を更新します。
- その他の関数は、プロップスとして渡されたイベントハンドラーです。


## src/components/chatLog.tsx

### File Description
このファイルは、ReactコンポーネントのためのChatLogとChatコンポーネントを定義しています。ChatLogコンポーネントは、メッセージの配列とキャラクター名を受け取り、それらをChatコンポーネントを使って表示します。ChatLogコンポーネントは、新しいメッセージが追加されるたびにスクロール位置を調整します。

### Imported Modules
- `react` (useEffect, useRefフックがインポートされています)
- `@/features/messages/messages` (Messageタイプがインポートされています)

### Functions
- `ChatLog`: メッセージの配列とキャラクター名を受け取り、メッセージをChatコンポーネントを使って表示するReactコンポーネントです。新しいメッセージが追加されるたびにスクロール位置を調整します。
- `Chat`: 個々のメッセージを表示するReactコンポーネントです。メッセージの役割(ユーザーまたはキャラクター)に応じて、異なるスタイルを適用します。


## src/components/messageInput.tsx

### File Description
このファイルは、チャットアプリケーションのユーザーインターフェイスにおける入力フィールドとボタンのコンポーネントを定義しています。ユーザーがテキストを入力したり、送信ボタンやマイクボタンを操作できるようになっています。

### Imported Modules
- `IconButton` から `./iconButton` をインポート
- `useTranslation` から `react-i18next` をインポート
- `useState`、`useEffect` から `react` をインポート

### Functions
- `MessageInput`: プロップスを受け取り、チャットの入力フィールドとボタンを含むコンポーネントを返します。入力フィールドの動作、ロードインジケーターの表示、ボタンのクリックハンドラーなどを処理します。
- `handleKeyPress`: テキストエリアでEnterキーが押された時の動作を処理する関数です。Shiftキーの有無によって改行orメッセージ送信を行います。


## src/components/link.tsx

### File Description
このファイルは、URLとラベルを受け取り、新しいウィンドウでそのURLを開くリンクを生成するReactコンポーネントを定義しています。リンクにはスタイルが適用されています。

### Imported Modules
インポートされているモジュールはありません。

### Functions
- `Link`: URLとラベルを受け取り、新しいウィンドウで指定のURLを開くリンクを生成するReactコンポーネント。リンクにはスタイルが適用されています。


## src/components/speakers.json

### File Description
このファイルは、様々な話者とそれぞれの話し方のIDをリストアップしたJSONデータです。話者の名前と話し方の種類が含まれています。

### Imported Modules
なし(モジュールがインポートされていない純粋なデータファイル)

### Functions
なし(関数が定義されていないデータファイル)


## src/components/meta.tsx

### File Description
このファイルは、Webアプリケーションのメタデータ（タイトル、説明、OGイメージなど）を設定するための React コンポーネントを定義しています。メタデータは主に検索エンジンの最適化やソーシャルメディアでのリンク共有に役立ちます。

### Imported Modules
- `buildUrl` from `@/utils/buildUrl` (使用されていない)
- `Head` from `next/head`

### Functions
- `Meta`: メタデータを含む `Head` コンポーネントを返す React 関数コンポーネント。タイトル、説明、OGイメージ、Twitter カードなどのメタデータを設定しています。


## src/components/textButton.tsx

### File Description
このファイルは、Reactコンポーネントとしてカスタムボタンを定義しています。ボタンのスタイルとプロパティを設定できます。

### Imported Modules
- `react` (暗黙的にインポート)

### Functions
- `TextButton`
  - `Props`型を使用して、HTMLButtonElementの属性を継承したReactコンポーネントを定義しています。
  - ボタンのスタイルをカスタマイズするCSSクラスを適用しています。
  - `props.children`でボタンのテキストコンテンツをレンダリングしています。


## src/components/assistantText.tsx

### File Description
このファイルは、React コンポーネントを定義しており、与えられたメッセージと文字名を表示するための AssistantText コンポーネントが含まれています。メッセージ内の特定の文字列パターンが削除されます。

### Imported Modules
なし

### Functions
- `AssistantText`: メッセージ、文字名、および文字名を表示するかどうかを指定するプロパティを受け取り、それらを適切なスタイルで表示する React コンポーネントを返します。メッセージ内の特定のパターン (`[名前]`) が削除されます。


## src/components/codeLog.tsx

### File Description
このファイルは、Reactコンポーネントを定義しています。`CodeLog`コンポーネントは、メッセージの配列を受け取り、それらをレンダリングします。`Chat`コンポーネントは、個々のメッセージをレンダリングする補助関数です。

### Imported Modules
- `useEffect`, `useRef` from 'react'
- `Message` from '@/features/messages/messages'
- `React` from 'react'

### Functions
- `CodeLog`: メッセージの配列を受け取り、それらをレンダリングするコンポーネント。スクロール位置を制御するロジックも含まれています。
- `Chat`: 個々のメッセージをレンダリングする補助関数。メッセージのロール(役割)に応じて、背景色やテキストの色を変更します。また、改行文字に基づいてメッセージを分割してレンダリングします。


## src/components/menu.tsx

### File Description
このファイルは、チャットUIコンポーネントを提供しています。様々な設定項目を管理し、チャットログ、システムプロンプト、各種キーを制御できます。また、キャラクターの音声出力やVRM表示も行えます。

### Imported Modules
- `./iconButton`: `IconButton`コンポーネントをインポート
- `@/features/messages/messages`: `Message`型をインポート
- `@/features/constants/koeiroParam`: `KoeiroParam`型をインポート
- `./chatLog`: `ChatLog`コンポーネントをインポート 
- `./codeLog`: `CodeLog`コンポーネントをインポート
- `react`: Reactコアとフックをインポート
- `./settings`: `Settings`コンポーネントをインポート
- `@/features/vrmViewer/viewerContext`: `ViewerContext`をインポート
- `./assistantText`: `AssistantText`コンポーネントをインポート
- `react-i18next`: i18n機能をインポート
- `@/features/messages/speakCharacter`: `testVoice`関数をインポート

### Functions
- `Menu`: メインのUIコンポーネント。設定項目の状態と更新関数を受け取り、UIを構築します。
- `handleChangeAIService`: AIサービスを変更するコールバック関数。
- `handleChangeSystemPrompt`: システムプロンプトを変更するコールバック関数。
- `handleOpenAiKeyChange`: OpenAI APIキーを変更するコールバック関数。
- `handleAnthropicKeyChange`: Anthropic APIキーを変更するコールバック関数。
- `handleGoogleKeyChange`: Google APIキーを変更するコールバック関数。
- `handleGroqKeyChange`: Groq APIキーを変更するコールバック関数。
- `handleChangeLocalLlmUrl`: ローカルLLMのURLを変更するコールバック関数。
- `handleDifyKeyChange`: DifyのAPIキーを変更するコールバック関数。
- `handleDifyUrlChange`: DifyのURLを変更するコールバック関数。
- `handleDifyConversationIdChange`: DifyのconversationIDを変更するコールバック関数。
- `handleChangeKoeiromapKey`: KoeiroMapのAPIキーを変更するコールバック関数。
- その他、様々な設定項目を変更するコールバック関数が定義されています。


## src/components/messageInputContainer.tsx

### File Description
このファイルは、テキスト入力と音声入力の両方を提供するReactコンポーネントです。音声認識が完了すると自動で送信され、返答文の生成中は入力を無効化します。

### Imported Modules
- `@/components/messageInput`
- `react`

### Functions
- `MessageInputContainer`: テキスト入力と音声入力を提供する主要なコンポーネント。
- `handleRecognitionResult`: 音声認識の結果を処理する関数。
- `handleRecognitionEnd`: 音声認識が終了した際の処理を行う関数。
- `handleClickMicButton`: マイクボタンがクリックされた際の処理を行う関数。
- `handleClickSendButton`: 送信ボタンがクリックされた際の処理を行う関数。

このファイルでは、Webブラウザの音声認識APIを使用して音声入力を実装しています。また、返答文の生成中はテキスト入力とマイク入力の両方を無効化し、生成が完了したらユーザーメッセージをクリアしています。


## src/components/iconButton.tsx

### File Description
このファイルは、Reactコンポーネント `IconButton` を定義しています。`IconButton` は、アイコンとラベルを持つボタンを表示するためのコンポーネントです。ボタンの外観は、CSSクラスで指定されています。

### Imported Modules
- `@charcoal-ui/icons`からの `KnownIconType`
- `react`からの `ButtonHTMLAttributes`

### Functions
- `IconButton`: このコンポーネントは、`iconName`、`isProcessing`、`label` などのプロパティを受け取り、ボタンを描画します。`isProcessing` が真の場合は、ローディングアイコンが表示されます。


## src/components/githubLink.tsx

### File Description
このファイルは、GitHubリポジトリへのリンクを表示するReactコンポーネントを提供しています。リンクは、画面の右上隅に常に表示され、ユーザーがリポジトリにアクセスできるようになっています。

### Imported Modules
- `next/image`: Next.jsの画像コンポーネントをインポートしています。
- `@/utils/buildUrl`: URL構築ユーティリティ関数をインポートしています。

### Functions
- `GitHubLink`: GitHubリポジトリへのリンクを表示するReactコンポーネントです。リンク自体は`<a>`タグで構成され、ホバー時とアクティブ時の背景色が変更されます。リンク内には、GitHubのロゴアイコンと"Fork me"というテキストが含まれています。


## src/components/introduction.tsx

### File Description
このファイルは、Reactコンポーネントの`Introduction`を定義しています。このコンポーネントは、アプリケーションの紹介画面を表示し、言語の選択やインストラクションの表示/非表示を制御します。

### Imported Modules
- `react`: Reactのコアライブラリ
- `./link`: カスタムのLinkコンポーネント
- `./iconButton`: カスタムのIconButtonコンポーネント
- `i18next`: 多言語対応ライブラリ
- `react-i18next`: React用のi18nextラッパー

### Functions
- `Introduction`: メインのReactコンポーネント。propsを受け取り、紹介画面を描画します。
- `handleDontShowIntroductionChange`: チェックボックスの状態が変更された際に呼ばれるコールバック関数。
- `updateLanguage`: 選択された言語に応じて、UIの言語とボイスの言語を更新する関数。
- `getVoiceLanguageCode`: 選択された言語コードに対応するボイス言語コードを取得する関数。


## src/components/vrmViewer.tsx

### File Description
このファイルは、VRMモデルを表示するReactコンポーネントを定義しています。コンポーネント内では、canvasの初期化とVRMモデルの読み込みを行っています。また、ドラッグ&ドロップ機能を実装し、新しいVRMファイルを読み込むことができます。

### Imported Modules
- `useContext`と`useCallback` from 'react'
- `ViewerContext` from '../features/vrmViewer/viewerContext'
- `buildUrl` from '@/utils/buildUrl'

### Functions
- `VrmViewer`: メインのコンポーネント関数。canvasの初期化、VRMモデルの読み込み、ドラッグ&ドロップイベントハンドラを設定しています。
- `canvasRef`: canvasの初期化とVRMモデルの読み込みを行うコールバック関数です。ドラッグ&ドロップイベントハンドラも設定しています。


## src/lib/i18n.js

### File Description
このファイルは、i18nextライブラリを使用して多言語対応のための設定を行っています。initReactI18nextプラグインを使用し、異なる言語のJSON翻訳ファイルをロードして、アプリケーション全体で利用できるようにしています。

### Imported Modules
- i18next
- react-i18next (initReactI18next)

### Functions
特に関数は定義されていません。ただし、i18n.init()メソッドを使用して以下の設定を行っています:
- 使用可能な言語とその翻訳ファイルの場所を指定
- デフォルトの言語(lng)と代替の言語(fallbackLng)を設定
- 値のエスケープ処理の有無(interpolation.escapeValue)を指定

最後に、設定済みのi18nインスタンスをエクスポートしています。


## src/lib/VRMAnimation/VRMAnimation.ts

### File Description
このファイルは、VRMアニメーションを作成するためのクラスとメソッドを提供しています。VRMアニメーションデータから、Three.jsの AnimationClip オブジェクトを生成することができます。

### Imported Modules
- `three`
- `@pixiv/three-vrm`

### Functions
- `constructor()`: VRMAnimationクラスのコンストラクタ。プロパティを初期化します。
- `createAnimationClip(vrm: VRM)`: 入力のVRMデータからThree.jsの AnimationClip オブジェクトを作成します。
- `createHumanoidTracks(vrm: VRM)`: VRMデータからヒューマノイドのアニメーショントラックを作成します。
- `createExpressionTracks(expressionManager: VRMExpressionManager)`: 表情のアニメーショントラックを作成します。
- `createLookAtTrack(trackName: string)`: 視線のアニメーショントラックを作成します。


## src/lib/VRMAnimation/VRMAnimationLoaderPluginOptions.ts

申し訳ありませんが、ファイルの内容が単なるインターフェイス定義しか含まれていないため、Functions セクションを記述することはできません。しかし、他の情報は次のように書くことができます。

### File Description
このファイルは、Three.jsのVRMAnimationLoaderPluginで使用されるオプションのインターフェイスを定義しています。VRMAnimationLoaderPluginはVRMアニメーションデータをロードするためのプラグインです。

### Imported Modules
このファイルではモジュールをインポートしていません。

### Functions
このファイルには関数が定義されていません。


## src/lib/VRMAnimation/VRMAnimationLoaderPlugin.ts

### File Description
This file appears to be a plugin for the three.js library, specifically designed to load and handle VRM (Virtual Reality Model) animations. It allows parsing and processing animation data from GLTF/VRM files, extracting information about bone transformations, expressions, and look-at animations.

### Imported Modules
- `three` (imported as `*` from "three")
- `GLTF`, `GLTFLoaderPlugin`, `GLTFParser` from "three/examples/jsm/loaders/GLTFLoader"
- `VRMAnimationLoaderPluginOptions` from "./VRMAnimationLoaderPluginOptions"
- `GLTF` (as `GLTFSchema`) from "@gltf-transform/core"
- `VRMCVRMAnimation` from "./VRMCVRMAnimation"
- `VRMHumanBoneName`, `VRMHumanBoneParentMap` from "@pixiv/three-vrm"
- `VRMAnimation` from "./VRMAnimation"
- `arrayChunk` from "./utils/arrayChunk"

### Functions
- `VRMAnimationLoaderPlugin` class:
  - Implements the `GLTFLoaderPlugin` interface.
  - Contains methods for parsing VRM animation data from GLTF files.
- `_createNodeMap` (private method):
  - Creates a map of node indices to human bone names, expression names, and the look-at node index.
- `_createBoneWorldMatrixMap` (private method):
  - Creates a map of human bone names to their corresponding world matrices.
- `_parseAnimation` (private method):
  - Parses an individual animation clip, extracting tracks for human bone transformations, expressions, and look-at animation.

Overall, this file provides functionality to load and process VRM animation data from GLTF files, allowing integration with the three.js library.


## src/lib/VRMAnimation/loadVRMAnimation.ts

### File Description
このファイルは、Three.jsライブラリを使用してVRMアニメーションをロードするための機能を提供しています。GLTFローダーにVRMAnimationLoaderPluginを登録し、指定されたURLからVRMアニメーションデータを非同期的にロードする関数が定義されています。

### Imported Modules
- `three/examples/jsm/loaders/GLTFLoader` からGLTFLoaderクラスをインポート
- `./VRMAnimation` からVRMAnimationクラスをインポート
- `./VRMAnimationLoaderPlugin` からVRMAnimationLoaderPluginクラスをインポート

### Functions
- `loadVRMAnimation(url: string)`: 指定されたURLからVRMアニメーションデータをロードし、VRMAnimationオブジェクトを返すPromiseを返します。ロード中にエラーが発生した場合はnullを返します。


## src/lib/VRMAnimation/VRMCVRMAnimation.ts

### File Description
このファイルは、VRMCVRMAnimationインターフェイスを定義しています。VRMCVRMAnimationインターフェイスは、VRMモデルのアニメーション情報を表すデータ構造です。

### Imported Modules
- `@pixiv/three-vrm`からVRMExpressionPresetNameとVRMHumanBoneNameをインポートしています。

### Functions
このファイルには関数の定義はありません。VRMCVRMAnimationインターフェイスを定義しているだけです。このインターフェイスには以下のプロパティが含まれています:

- `specVersion`: アニメーションデータの仕様バージョンを表す文字列
- `humanoid.humanBones`: VRMモデルの人体ボーンのノード番号を表すオブジェクト
- `expressions.preset`: 事前定義された表情のノード番号を表すオブジェクト
- `expressions.custom`: カスタム表情のノード番号を表すオブジェクト
- `lookAt`: 視線の向きを表すノード番号


## src/lib/VRMAnimation/utils/linearstep.ts

### File Description
このファイルは、2つの数値の範囲内で指定された値に対応する値を計算する関数`linearstep`をエクスポートしています。計算結果は`saturate`関数を使って0から1の範囲に制限されます。

### Imported Modules
- `./saturate`

### Functions
- `linearstep(a: number, b: number, t: number)`: 与えられた `a` と `b` の範囲内で `t` に対応する値を計算し、0から1の範囲に制限した値を返します。


## src/lib/VRMAnimation/utils/saturate.ts

### File Description
このファイルは、数値を0と1の間に制限する関数 `saturate` を定義しています。この関数は、指定された数値が0未満の場合は0、1を超える場合は1を返し、それ以外の場合は入力値をそのまま返します。

### Imported Modules
なし

### Functions
- `saturate(x: number)`: 与えられた数値 `x` を0と1の間に制限した値を返します。`x` が0未満の場合は0、1を超える場合は1、それ以外の場合は `x` をそのまま返します。


## src/lib/VRMAnimation/utils/arrayChunk.ts

### File Description
このファイルは、配列を指定された長さのチャンクに分割する関数`arrayChunk`を提供しています。この関数は、入力配列と個々のチャンクのサイズを受け取り、分割された配列のチャンクを含む新しい配列を返します。

### Imported Modules
このファイルではモジュールがインポートされていません。

### Functions
- `arrayChunk<T>(array: ArrayLike<T>, every: number): T[][]`
  - 与えられた配列`array`を`every`で指定された長さのチャンクに分割します。返り値は、分割された配列のチャンクを含む新しい配列です。


## src/lib/VRMLookAtSmootherLoaderPlugin/VRMLookAtSmoother.ts

### File Description
このファイルは、Three.jsとVRMHumanoidを使用した3Dキャラクターの視線制御を行うための機能を提供しています。VRMLookAtクラスを拡張し、ユーザーの方向を追跡しながらスムーズに視線を移動させる機能や、眼球のサッケード運動を追加する機能が実装されています。

### Imported Modules
- `@pixiv/three-vrm` から `VRMHumanoid`、`VRMLookAt`、`VRMLookAtApplier` をインポート
- `three` モジュールをインポート

### Functions
- `VRMLookAtSmoother`: `VRMLookAt` クラスを拡張したクラス。キャラクターの視線をユーザーの方向に向けさせ、スムーズな視線移動とサッケード運動を実現する機能を提供します。
  - `update(delta: number)`: 視線の更新を行う関数。ユーザーの向きに応じて視線をスムーズに移動させ、サッケード運動を発生させる。
  - `revertFirstPersonBoneQuat()`: レンダリング後に呼び出され、キャラクターの頭の回転をリセットする。


## src/lib/VRMLookAtSmootherLoaderPlugin/VRMLookAtSmootherLoaderPlugin.ts

### File Description
このファイルは、VRMのLookAtアニメーションをスムーズにするためのカスタムローダープラグインを提供しています。VRMLookAtSmootherLoaderPluginクラスは、VRMLookAtLoaderPluginクラスを継承し、VRMLookAtSmootherクラスを使用してLookAtアニメーションを滑らかにします。

### Imported Modules
- `@pixiv/three-vrm` から `VRMHumanoid`、`VRMLookAt`、`VRMLookAtLoaderPlugin` をインポートしています。
- `three/examples/jsm/loaders/GLTFLoader` から `GLTF` をインポートしています。
- `./VRMLookAtSmoother` から `VRMLookAtSmoother` をインポートしています。

### Functions
- `VRMLookAtSmootherLoaderPlugin` クラス
  - `name` プロパティを持ち、プラグインの名前を返します。
  - `afterRoot` メソッドは、GLTFロード後に実行されます。VRMHumanoidとVRMLookAtオブジェクトを取得し、VRMLookAtSmootherインスタンスを作成して、GLTFのユーザーデータに格納します。


## src/pages/index.tsx

### File Description
このファイルはReact.jsで書かれたWebアプリケーション用の主要なコンポーネントです。VRMモデルのビューアと、音声対話システムを統合しています。ユーザーはシステムプロンプトや言語、音声合成エンジンなどの設定を変更できます。

### Imported Modules
- `react`および関連モジュール
- `@/components/*`: 様々な機能を持つReactコンポーネント
- `@/features/*`: アプリケーションロジックが実装されたモジュール
- `@/lib/i18n`: 多言語対応ライブラリ
- `react-i18next`: i18nの実装に使用
- `@/utils/buildUrl`: URLを構築するユーティリティ関数

### Functions
- `Home`: アプリケーションの主要なコンポーネント。StateとコールバックでUIとロジックを制御する。
- `incrementChatProcessingCount`: チャット処理中のカウンターをインクリメントする。
- `decrementChatProcessingCount`: チャット処理中のカウンターをデクリメントする。
- `handleChangeChatLog`: チャットログを更新する。
- `handleChangeCodeLog`: コードログを更新する。
- `handleSpeakAi`: AIからの応答を音声合成して再生する。
- `processAIResponse`: AIからの応答を処理し、チャットログに追加する。
- `preProcessAIResponse`: processAIResponseのラッパー関数。
- `handleSendChat`: チャット入力を処理し、AIに送信する。
- `fetchAndProcessCommentsCallback`: YouTubeライブチャットのコメントを取得し、AIに送信する。


## src/pages/_document.tsx

### File Description
このファイルは、Next.jsアプリケーションのドキュメントコンポーネントを定義しています。このコンポーネントは、HTMLのレンダリングに使用され、GoogleFontsからフォントをインポートしています。

### Imported Modules
- `next/document`からの`Html`、`Head`、`Main`、`NextScript`

### Functions
- `Document()`
  - このファイルでは、`Document()`関数が唯一の関数として定義されています。
  - この関数は、HTML要素、ヘッド要素、本文要素を返します。
  - ヘッド要素には、GoogleFontsからフォントをインポートするためのリンクが含まれています。
  - 本文要素には、アプリケーションの主要なコンテンツを含む`Main`コンポーネントと、Next.jsの機能に必要な`NextScript`コンポーネントが含まれています。


## src/pages/_app.tsx

### File Description
Nextjs アプリケーションのエントリーポイントとして機能するファイルです。言語設定を自動的に行い、アプリケーションのコンポーネントをレンダリングします。

### Imported Modules
- `"@/styles/globals.css"` - グローバルな CSS スタイル
- `"next/app"` - Next.js アプリケーションの型定義
- `"@charcoal-ui/icons"` - アイコンライブラリ
- `"react"` - React ライブラリ
- `"../lib/i18n"` - i18n (インターナショナリゼーション) ライブラリ

### Functions
- `App` - Next.js アプリケーションのルートコンポーネント。言語設定を行い、アプリケーションのメインコンポーネントをレンダリングします。
  - ユーザーの言語設定を localStorage から読み取り、i18n ライブラリの言語を設定します。
  - localStorage に言語設定が保存されていない場合は、ブラウザの言語設定を使用して i18n ライブラリの言語を設定します。
  - `Component` プロップスで受け取ったメインコンポーネントをレンダリングします。


## src/pages/api/anthropic.ts

### File Description
このファイルは、Next.js APIルートで、Anthropic AIモデルとやり取りするためのエンドポイントを提供しています。クライアントからメッセージとAPIキーを受け取り、Anthropic SDKを使ってAIモデルを呼び出し、レスポンスを返します。レスポンスはストリーミングまたは一括で送信できます。

### Imported Modules
- `{ NextApiRequest, NextApiResponse }` from "next"
- `{ Anthropic }` from "@anthropic-ai/sdk"
- `{ Message }` from "@/features/messages/messages"

### Functions
- `handler(req: NextApiRequest, res: NextApiResponse)`: メインの関数で、APIリクエストを処理します。
  - クライアントから受け取ったメッセージ、APIキー、モデル、ストリームフラグを解析します。
  - Anthropicクライアントを初期化し、メッセージをAIモデルに渡します。
  - ストリーミングモードの場合は、レスポンスをストリーミングで送信します。
  - 通常モードの場合は、レスポンス全体をJSONで返します。


## src/pages/api/chat.ts

### File Description
この Node.js API ハンドラは、OpenAI の ChatGPT API とやり取りするために使用されます。API キーを受け取り、入力されたメッセージを ChatGPT に送信し、応答を返します。

### Imported Modules
- `openai` (OpenAI の公式ライブラリ)
- `next` (Next.js フレームワークに関連するタイプ定義)

### Functions
- `handler`: API エンドポイントの main 関数。OpenAI API キーの検証、API リクエストの送信、応答の返却を行います。


## src/pages/api/groq.ts

### File Description
このファイルは、Next.js APIルートとしてGroqへの問い合わせを処理するためのコードです。ユーザーからのメッセージを受け取り、Groqのモデルに送信し、応答を生成して返します。ストリーミングモードとノンストリーミングモードの両方をサポートしています。

### Imported Modules
- `{ NextApiRequest, NextApiResponse }` from "next"
- `Groq` from "groq-sdk"
- `{ Message }` from "@/features/messages/messages"

### Functions
- `handler(req: NextApiRequest, res: NextApiResponse)`: メインの関数です。ユーザーからのリクエストを処理し、Groqへの問い合わせを行い、応答を返します。ストリーミングモードとノンストリーミングモードの両方に対応しています。


## src/pages/api/tts.ts

確かにこのファイルについて説明しましょう。

### File Description
このファイルは、Next.js APIルートとしてマークされています。受信したリクエストに応じて、Koeiromap または Google Text-to-Speech (TTS) サービスを使用して音声データを生成し、応答としてクライアントに返します。

### Imported Modules
- `@/features/koeiromap/koeiromap` からの `koeiromapFreeV1` 関数
- `@/features/googletts/googletts` からの `googleTts` 関数

### Functions
- `handler` 関数はNext.jsのAPIルートハンドラーです。リクエストボディから必要なパラメータを取得し、TTSタイプに基づいて適切な音声合成関数を呼び出します。生成された音声データをJSONレスポンスとして返します。


## src/pages/api/stylebertvits2.ts

### File Description
このファイルは、Next.js APIルートハンドラーを定義しています。クライアントからのリクエストに応じて、指定されたテキストと音声スタイルパラメータを使ってStylebertVits2サーバーからオーディオデータを取得し、そのデータをレスポンスとして返します。

### Imported Modules
- `type { NextApiRequest, NextApiResponse } from "next"`

### Functions
- `handler(req: NextApiRequest, res: NextApiResponse<Data>)`: クライアントからのリクエストを処理する関数です。リクエストボディからパラメータを抽出し、StylebertVits2サーバーにリクエストを送信してオーディオデータを取得します。取得したオーディオデータをレスポンスとして返すか、エラーが発生した場合はエラーメッセージを返します。

