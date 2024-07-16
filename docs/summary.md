# Project Structure

- nike-ChatVRM/
  - tailwind.config.js
  - LICENSE
  - output_sorted.json
  - Dockerfile
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
    - summary.md
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
  - scripts/
    - analyze_issue.py
  - .github/
    - workflows/
      - issue-analyzer.yml
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

<answer>

### File Description
このファイルは、Tailwind CSSの設定ファイルです。カスタムテーマを定義し、ダークモードを有効にし、コンテンツのパスを指定しています。また、カスタムカラーパレット、フォントファミリー、そしてプラグインの設定も含まれています。@charcoal-ui/themeと@charcoal-ui/tailwind-configを使用してベースの設定を作成し、それを拡張しています。

### Imported Modules
- @charcoal-ui/theme
- @charcoal-ui/tailwind-config
- @tailwindcss/line-clamp

### Functions
- createTailwindConfig: Tailwind CSSの設定を生成する関数。バージョンとテーマを指定して使用されています。

### その他の重要な設定
- darkMode: ダークモードが有効化されています。
- content: コンパイル対象のファイルパスが指定されています。
- presets: createTailwindConfig関数を使用してベース設定を生成しています。
- theme.extend: カスタムカラーとフォントファミリーを定義しています。
- plugins: @tailwindcss/line-clampプラグインが追加されています。

</answer>


## Dockerfile

<answer>

### File Description
このファイルはDockerfileで、Node.jsアプリケーションのコンテナ化に使用されます。Node.js 16をベースイメージとし、アプリケーションの依存関係をインストールし、ソースコードをコピーしてビルドします。最後に、アプリケーションを起動するための設定が含まれています。

### Imported Modules
このDockerfileには、特定のモジュールのインポートは含まれていません。代わりに、Node.jsアプリケーションの構築と実行に必要な手順が記述されています。

### Functions
Dockerfileには関数の定義は含まれていませんが、主要なステップを以下に示します：

- FROM: ベースイメージとしてnode:16を指定
- WORKDIR: 作業ディレクトリを/appに設定
- COPY: package.jsonとpackage-lock.jsonをコピー
- RUN: npm ciで依存関係をインストール
- COPY: アプリケーションのソースコードをコピー
- RUN: npm run buildでアプリケーションをビルド
- EXPOSE: 3000番ポートを公開
- CMD: npm startでアプリケーションを起動

</answer>


## next.config.js

<answer>

### File Description
このファイルはNext.jsの設定ファイルです。Next.jsアプリケーションの動作を制御するための様々なオプションが定義されています。環境変数を利用してベースパスを設定し、フォント最適化やReactの厳格モードなど、アプリケーションの挙動に関する重要な設定が含まれています。

### Imported Modules
- import('next').NextConfig（型定義のみのインポート）

### Functions
このファイルには明示的に定義された関数はありませんが、`nextConfig`オブジェクトが以下の設定を含んでいます：

- reactStrictMode: Reactの厳格モードを有効にする設定
- assetPrefix: アセットのプレフィックスを環境変数から設定
- basePath: アプリケーションのベースパスを環境変数から設定
- trailingSlash: URLの末尾にスラッシュを追加するオプション
- publicRuntimeConfig: 公開ランタイム設定でrootパスを環境変数から設定
- optimizeFonts: フォント最適化を無効にする設定

</answer>


## electron.mjs

<answer>

### File Description
このファイルはElectronアプリケーションのメインプロセスを設定するためのものです。アプリケーションウィンドウの作成、設定、および表示を管理し、開発環境と本番環境での動作の違いを処理します。セキュリティ設定や透明性、影の有無などのウィンドウの視覚的特性も制御しています。

### Imported Modules
- electron (app, BrowserWindow, screen)
- path
- url (fileURLToPath)
- electron-is-dev
- wait-on

### Functions

- createWindow: メインウィンドウを作成し、設定するための非同期関数です。ウィンドウのサイズ、セキュリティ設定、透明性などを設定し、開発モードと本番モードで適切なコンテンツを読み込みます。

### Event Listeners

- app.on('ready', createWindow): アプリケーションが準備できたときにcreateWindow関数を呼び出すイベントリスナーです。

### Notable Configurations

- ウィンドウは初期状態で非表示に設定され、'ready-to-show'イベント後に表示されます。
- セキュリティ設定として、nodeIntegrationはfalse、contextIsolationはtrueに設定されています。
- 開発モードでは localhost:3000 からコンテンツを読み込み、本番モードではファイルから読み込みます。
- ウィンドウは透明で影がなく、開発者ツールは無効化されています。

</answer>


## package.json

<answer>

### File Description
このファイルは、chat-vrmというプロジェクトのpackage.jsonファイルです。プロジェクトの設定、依存関係、スクリプト、開発環境に関する情報が含まれています。Next.js、React、Three.js、そしてElectronを使用したデスクトップアプリケーション開発のためのセットアップが行われています。また、AI関連のライブラリも含まれており、チャットボットやVRM（バーチャルリアリティモデル）機能を持つアプリケーションの開発を示唆しています。

### Imported Modules
このファイルは直接モジュールをインポートしていませんが、プロジェクトの依存関係として以下のモジュールが指定されています：

#### Dependencies
- @anthropic-ai/sdk
- @charcoal-ui/icons
- @google-cloud/text-to-speech
- @google/generative-ai
- @tailwindcss/line-clamp
- axios
- eslint
- groq-sdk
- i18next
- next
- node-fetch
- openai
- react
- react-dom
- react-i18next
- three
- typescript

#### DevDependencies
- @charcoal-ui/tailwind-config
- @gltf-transform/core
- @pixiv/three-vrm
- autoprefixer
- electron
- electron-is-dev
- npm-run-all
- postcss
- tailwindcss
- wait-on

### Functions
このファイルは設定ファイルであるため、直接的な関数定義は含まれていません。しかし、以下のスクリプトコマンドが定義されています：

- dev: Next.jsの開発サーバーを起動
- build: Next.jsのプロジェクトをビルド
- start: プロジェクトをビルドし、起動
- export: Next.jsのプロジェクトを静的ファイルとしてエクスポート
- lint: ESLintを使用してコードのリンティングを実行
- electron: ローカルホストの待機後、Electronアプリケーションを起動
- desktop: Next.jsの開発サーバーとElectronアプリケーションを並行して起動（デスクトップアプリ開発用）

</answer>


## watch.json

<answer>
### File Description
このファイルは、おそらくVercelの設定ファイル（vercel.json）です。デプロイメントの設定を定義しており、ファイルの変更時の動作や再起動の条件、スロットリングの設定を指定しています。主に、インストール時に含めるファイル、再起動時に監視するファイル、そしてスロットリングの時間間隔を設定しています。

### Imported Modules
このJSONファイルには明示的なモジュールのインポートはありません。

### Functions
このJSONファイルには関数の定義はありません。代わりに、以下の主要な設定セクションがあります：

- install: パッケージのインストール時に含めるファイルを指定
- restart: アプリケーションの再起動をトリガーするファイルを指定
- throttle: デプロイメントの更新頻度を制限する時間間隔（ミリ秒単位）を設定

</answer>


## tsconfig.json

<answer>
### File Description
このファイルは、TypeScript設定ファイル（tsconfig.json）です。Next.jsプロジェクトのTypeScript設定を定義しており、コンパイラオプションや含めるファイル、除外するファイルなどを指定しています。この設定は、プロジェクト全体のTypeScriptの動作や、コード補完、型チェックなどの開発体験を制御します。

### Imported Modules
このファイルは設定ファイルであるため、直接モジュールをインポートしていません。

### Functions
このファイルは設定ファイルであるため、関数定義は含まれていません。代わりに、以下の主要な設定セクションがあります：

- compilerOptions: TypeScriptコンパイラの動作を制御する様々なオプションを設定しています。
  - target: コンパイル後のJavaScriptのバージョンを指定（ES2015）
  - lib: 使用するTypeScriptの型定義ライブラリを指定
  - allowJs: JavaScriptファイルのコンパイルを許可
  - strict: 厳格な型チェックを有効化
  - jsx: JSXのコンパイル方法を指定（preserve）
  - paths: モジュールのインポートパスのエイリアスを設定（@/で./src/を参照）

- include: コンパイル対象に含めるファイルパターンを指定
- exclude: コンパイル対象から除外するディレクトリを指定（node_modules）

これらの設定により、Next.jsプロジェクトでTypeScriptを効果的に使用するための環境が構築されます。
</answer>


## docker-compose.yml

<answer>
### File Description
このファイルは、Docker Composeの設定ファイル（docker-compose.yml）です。アプリケーションの開発環境をDockerコンテナで構築するための設定が記述されています。主に、アプリケーションサービスの構成、ポート転送、ボリュームマウント、環境変数の設定などが定義されています。

### Imported Modules
このファイルはDocker Composeの設定ファイルであるため、特定のプログラミング言語のモジュールのインポートは含まれていません。

### Functions
このファイルはYAML形式の設定ファイルであり、プログラミング言語の関数は含まれていません。代わりに、以下のようなサービス設定が定義されています：

- app: アプリケーションサービスの設定
  - build: カレントディレクトリからDockerイメージをビルド
  - ports: ホストの3000番ポートをコンテナの3000番ポートにマッピング
  - volumes: カレントディレクトリをコンテナ内の/appディレクトリにマウント
  - env_file: .envファイルから環境変数を読み込む
</answer>


## postcss.config.js

<answer>
### File Description
このファイルは、PostCSSの設定ファイルです。モジュールエクスポート構文を使用して、Tailwind CSSとAutoprefixerの2つのプラグインを設定しています。これは、プロジェクトでのCSS処理をカスタマイズするために使用され、通常は`postcss.config.js`という名前で保存されます。

### Imported Modules
このファイルには明示的なモジュールのインポートはありません。ただし、以下のプラグインが設定されています：
- tailwindcss
- autoprefixer

### Functions
このファイルには明示的に定義された関数はありません。代わりに、設定オブジェクトをエクスポートしています。このオブジェクトは、PostCSSで使用するプラグインを指定しています。

- `plugins`: オブジェクトとして定義され、使用するPostCSSプラグインを指定します。
  - `tailwindcss`: Tailwind CSSフレームワークを使用するためのプラグイン
  - `autoprefixer`: ベンダープレフィックスを自動的に追加するプラグイン
</answer>


## src/features/emoteController/expressionController.ts

<answer>

### File Description
このファイルは、VRMモデルの表情制御を行うための`ExpressionController`クラスを定義しています。主に感情表現、リップシンク、自動まばたき、自動視線制御などの機能を提供し、VRMモデルの表情をリアルタイムで管理・更新する役割を果たします。THREE.jsとVRMライブラリを使用して3Dモデルの表情を制御します。

### Imported Modules
- THREE from "three"
- VRM, VRMExpressionManager, VRMExpressionPresetName from "@pixiv/three-vrm"
- AutoLookAt from "./autoLookAt"
- AutoBlink from "./autoBlink"

### Functions
- constructor: VRMモデルとカメラオブジェクトを受け取り、ExpressionControllerのインスタンスを初期化します。
- playEmotion: 指定された感情プリセットを再生し、現在の感情状態を更新します。
- lipSync: リップシンクのプリセットと値を設定し、現在のリップシンク状態を更新します。
- update: デルタ時間を受け取り、まばたきとリップシンクの状態を更新します。

</answer>


## src/features/emoteController/emoteConstants.ts

<answer>
### File Description
このファイルは、瞬きに関連する定数を定義しています。具体的には、瞬きの際の目を閉じている最大時間と開いている最大時間を秒単位で指定しています。これらの定数は、おそらくアニメーションや視覚効果、あるいはユーザーインターフェースの反応時間などに使用されることが想定されます。

### Imported Modules
このファイルには外部モジュールのインポートは含まれていません。

### Functions
このファイルには関数の定義は含まれていません。代わりに、以下の定数が定義されています：

- BLINK_CLOSE_MAX: 瞬きで目を閉じている最大時間（0.12秒）を定義しています。
- BLINK_OPEN_MAX: 瞬きで目を開いている最大時間（5秒）を定義しています。

これらの定数は`export`キーワードを使用して定義されており、他のファイルからインポートして使用できるようになっています。
</answer>


## src/features/emoteController/autoLookAt.ts

<answer>

### File Description
このファイルは、3DキャラクターモデルのVRM（Virtual Reality Model）の目線制御を行うためのクラス `AutoLookAt` を定義しています。THREE.jsとVRMライブラリを使用して、カメラに追従する目標オブジェクトを作成し、VRMの視線をそのオブジェクトに向けるように設定しています。サッケード（急速な目の動き）はVRMLookAtSmootherで処理されるため、このクラスではより大きな目の動きを実装することが想定されています。

### Imported Modules
- THREE from "three"
- VRM from "@pixiv/three-vrm"

### Functions
- constructor(vrm: VRM, camera: THREE.Object3D): AutoLookAtクラスのコンストラクタ。VRMモデルとカメラオブジェクトを受け取り、視線の目標となるオブジェクトを作成し、VRMの視線制御を設定します。

### Classes
- AutoLookAt: 目線を制御するクラス。コンストラクタで視線の目標オブジェクトを作成し、VRMモデルの視線をその目標に向けるように設定します。

</answer>


## src/features/emoteController/autoBlink.ts

<answer>

### File Description
このファイルは、3DモデルのVRMキャラクターの自動瞬きを制御するためのクラス `AutoBlink` を定義しています。VRMの表情管理を利用して、瞬きのタイミングや目の開閉状態を管理し、自然な瞬きアニメーションを実現します。また、感情表現との連携や手動制御のオプションも提供しています。

### Imported Modules
- VRMExpressionManager from "@pixiv/three-vrm"
- BLINK_CLOSE_MAX from "./emoteConstants"
- BLINK_OPEN_MAX from "./emoteConstants"

### Functions
- constructor: VRMExpressionManagerを受け取り、AutoBlinkクラスの初期設定を行います。
- setEnable: 自動瞬きのON/OFFを切り替え、目が閉じている場合は開くまでの時間を返します。
- update: 一定の時間間隔で呼び出され、瞬きの状態を更新します。
- close: 目を閉じる動作を実行し、blinkの値を1に設定します。
- open: 目を開く動作を実行し、blinkの値を0に設定します。

</answer>


## src/features/emoteController/emoteController.ts

<answer>

### File Description
このファイルは、VRMモデルの感情表現を制御するための`EmoteController`クラスを定義しています。主にExpressionを操作することで、VRMキャラクターの表情や口の動きを制御します。このクラスは、外部から簡単に感情表現や口の動きを制御できるインターフェースを提供しています。

### Imported Modules
- THREE from "three"
- VRM, VRMExpressionPresetName from "@pixiv/three-vrm"
- ExpressionController from "./expressionController"

### Functions
- constructor(vrm: VRM, camera: THREE.Object3D): EmoteControllerクラスのインスタンスを初期化し、ExpressionControllerを作成します。
- playEmotion(preset: VRMExpressionPresetName): 指定された感情プリセットを再生します。
- lipSync(preset: VRMExpressionPresetName, value: number): 口の動きを同期させるために使用され、指定されたプリセットと値で口の表現を制御します。
- update(delta: number): 時間経過に基づいて表情の更新を行います。

</answer>


## src/features/lipSync/lipSyncAnalyzeResult.ts

<answer>
### File Description
このファイルは、リップシンク（口の動きと音声の同期）の分析結果を表現するためのTypeScriptインターフェースを定義しています。`LipSyncAnalyzeResult`というインターフェースが定義されており、音量（volume）の情報を含んでいます。このインターフェースは、リップシンク分析の結果を構造化されたデータとして扱うために使用されると考えられます。

### Imported Modules
このファイルには外部モジュールのインポート文が含まれていません。

### Functions
このファイルには関数の定義は含まれていません。代わりに、以下のインターフェースが定義されています：

- `LipSyncAnalyzeResult`: リップシンク分析の結果を表すインターフェース。現在は`volume`（音量）プロパティのみを含んでいます。
</answer>


## src/features/lipSync/lipSync.ts

<answer>

### File Description
このファイルは、音声の口の動きを同期させる（リップシンク）機能を実装するためのクラス `LipSync` を定義しています。音声データの分析、再生、および音量の計算を行う機能が含まれており、音声ファイルのURL or ArrayBufferから音声を再生し、リアルタイムで音量を分析することができます。

### Imported Modules
- LipSyncAnalyzeResult (from "./lipSyncAnalyzeResult")

### Functions
- constructor: AudioContextを受け取り、AnalyserNodeとFloat32Arrayを初期化します。
- update: 現在の音声データを分析し、音量を計算して返します。
- playFromArrayBuffer: ArrayBufferから音声を再生し、必要に応じて再生終了時のコールバックを設定します。
- playFromURL: URLから音声ファイルを取得し、再生を開始します。再生終了時のコールバックも設定可能です。

### Constants
- TIME_DOMAIN_DATA_LENGTH: 時間領域データの長さを2048に設定しています。

### Class Properties
- audio: AudioContext
- analyser: AnalyserNode
- timeDomainData: Float32Array

</answer>


## src/features/messages/speakCharacter.ts

<answer>

### File Description
このファイルは、テキストを音声に変換し、3Dキャラクターに喋らせるための機能を提供しています。複数の音声合成APIや言語に対応しており、英語から日本語への変換機能も含まれています。主にVRMビューアーと連携して動作し、キャラクターのアニメーションや表情変更と同期して音声を再生する機能を実装しています。

### Imported Modules
- wait (from "@/utils/wait")
- synthesizeVoiceApi (from "./synthesizeVoice")
- synthesizeVoiceGoogleApi (from "./synthesizeVoiceGoogle")
- synthesizeStyleBertVITS2Api (from "./synthesizeStyleBertVITS2")
- Viewer (from "../vrmViewer/viewer")
- Screenplay, Talk (from "./messages")
- englishToJapanese (from '@/utils/englishToJapanese.json')

### Functions
- createSpeakCharacter: キャラクターの発話処理を生成する関数。音声合成と再生のロジックを含む。
- convertEnglishToJapaneseReading: 英語のテキストを日本語の読み方に変換する関数。
- getGoogleTtsType: Google TTSの音声タイプを選択言語に基づいて取得する関数。
- getGppgleTtsType: 言語コードに基づいてGoogle TTSの音声タイプを返す関数。
- fetchAudio: KoeiroAPI を使用して音声データを取得する関数。
- fetchAudioVoiceVox: VOICEVOX API を使用して音声データを取得する関数。
- fetchAudioGoogle: Google TTS API を使用して音声データを取得する関数。
- fetchAudioStyleBertVITS2: StyleBertVITS2 API を使用して音声データを取得する関数。
- testVoice: VOICEVOXを使用してテスト音声を再生する関数。
- fetchAudioVoiceGSVIApi: GSVI TTS API を使用して音声データを取得する関数。

</answer>


## src/features/messages/messages.ts

<answer>

### File Description
このファイルは、VRMモデルの表情制御と発話テキストの処理を行うためのユーティリティ関数を提供しています。ChatGPT APIのメッセージ形式、発話スタイル、感情表現などの型定義が含まれており、テキストを感情表現付きの台本（Screenplay）に変換する機能が実装されています。

### Imported Modules
- VRMExpression, VRMExpressionPresetName from "@pixiv/three-vrm"
- KoeiroParam from "../constants/koeiroParam"

### Functions
- splitSentence: 与えられたテキストを文単位で分割する関数。句読点や改行を基準に分割します。
- textsToScreenplay: 文章の配列をScreenplay（感情表現と発話内容のセット）の配列に変換する関数。テキスト内の感情タグを解析し、適切な表情と発話スタイルを設定します。
- emotionToTalkStyle: 感情（EmotionType）を対応する発話スタイル（TalkStyle）に変換する関数。

### Types and Constants
- Message: ChatGPT APIのメッセージ形式を定義する型
- TalkStyle: 発話スタイルを定義する型（"talk", "happy", "sad", "angry", "fear", "surprised"）
- Talk: 発話内容と話者の位置情報を含む型
- EmotionType: VRMモデルの感情表現を定義する型
- Screenplay: 感情表現と発話内容をセットにした型
- talkStyles: 利用可能な発話スタイルの配列
- emotions: 利用可能な感情表現の配列

</answer>


## src/features/messages/synthesizeStyleBertVITS2.ts

<answer>

### File Description
このファイルは、StyleBertVITS2 APIを利用して音声合成を行う非同期関数を定義しています。関数は指定されたパラメータを使用してAPIリクエストを構築し、サーバーに送信します。レスポンスとして音声データのバッファを返し、エラー処理も行っています。

### Imported Modules
このファイルでは明示的なインポート文は見られません。ただし、`fetch` APIを使用していることから、ブラウザ環境またはNode.jsのfetchポリフィルを想定していると考えられます。

### Functions
- synthesizeStyleBertVITS2Api: StyleBertVITS2 APIを使用して音声合成を行う非同期関数です。指定されたメッセージ、サーバーURL、モデルID、スタイル、言語を使用してAPIリクエストを送信し、音声データのバッファを返します。エラーが発生した場合は例外をスローします。

</answer>


## src/features/messages/synthesizeVoiceGoogle.ts

<answer>

### File Description
このファイルは、Google Text-to-Speech (TTS) APIを使用して音声合成を行う非同期関数を定義しています。関数は指定されたメッセージとTTSタイプを使用してAPIリクエストを作成し、生成された音声データを返します。この機能は、テキストを音声に変換するアプリケーションで使用されることが想定されています。

### Imported Modules
このファイルには明示的なインポート文はありませんが、以下の組み込み関数やオブジェクトを使用しています：
- `fetch`: ブラウザやNode.jsの組み込みAPI
- `JSON`: JavaScriptの組み込みオブジェクト

### Functions
- synthesizeVoiceGoogleApi: Google TTS APIを使用して音声を合成する非同期関数。指定されたメッセージとTTSタイプを使用してAPIリクエストを送信し、生成された音声データを返します。

</answer>


## src/features/messages/synthesizeVoice.ts

<answer>

### File Description
このファイルは音声合成に関する機能を提供しています。主に2つの関数を定義しており、1つは直接音声合成を行う関数、もう1つはAPIを介して音声合成を行う関数です。音声合成には「koeiromap」と呼ばれる技術が使用されており、話者の位置や話し方のスタイルを指定して音声を生成することができます。

### Imported Modules
- reduceTalkStyle (from "@/utils/reduceTalkStyle")
- koeiromapV0 (from "../koeiromap/koeiromap")
- TalkStyle (from "../messages/messages")

### Functions
- synthesizeVoice: メッセージ、話者のX座標とY座標、話し方のスタイルを受け取り、koeiromapV0を使用して音声を合成します。
- synthesizeVoiceApi: メッセージ、話者の座標、スタイル、APIキーを受け取り、APIを介して音声合成を行います。無料版向けに感情表現を制限し、サーバーサイドで音声合成を実行します。

</answer>


## src/features/chat/localLLMChat.ts

<answer>

### File Description
このファイルは、ローカルLLM（Large Language Model）とのチャット応答をストリーミング形式で取得する機能を提供しています。主に非同期関数を使用してAPIリクエストを行い、受信したデータをリアルタイムで処理し、ReadableStreamとして返します。これにより、大量のテキストデータを効率的に扱うことができます。

### Imported Modules
- axios: HTTPリクエストを行うためのライブラリ
- Message: '../messages/messages'から importされた型定義

### Functions
- getLocalLLMChatResponseStream: ローカルLLMに対してチャットリクエストを送信し、応答をストリーミング形式で取得する非同期関数。受信したデータを解析し、必要な内容をReadableStreamとして返す。引数として messages（メッセージの配列）、localLlmUrl（ローカルLLMのURL）、model（オプションのモデル指定）を受け取る。

</answer>


## src/features/chat/anthropicChat.ts

<answer>

### File Description
このファイルは、Anthropic APIとの通信を行うための関数を提供しています。主に2つの関数が定義されており、1つは通常のレスポンスを取得し、もう1つはストリーミングレスポンスを処理します。これらの関数は、メッセージ、APIキー、モデル名を受け取り、Anthropic APIにリクエストを送信して結果を返します。

### Imported Modules
- Message (from "../messages/messages")

### Functions
- getAnthropicChatResponse: Anthropic APIに非ストリーミングリクエストを送信し、単一のレスポンスを取得します。
- getAnthropicChatResponseStream: Anthropic APIにストリーミングリクエストを送信し、リアルタイムでレスポンスを処理するためのReadableStreamを返します。この関数は、ストリームデータを解析し、コンテンツブロックやエラーメッセージを適切に処理します。

</answer>


## src/features/chat/openAiChat.ts

<answer>

### File Description
このファイルは、OpenAI APIを使用してチャット応答を生成するための関数を提供しています。主に2つの関数が定義されており、1つは通常のチャット応答を取得し、もう1つはストリーミング形式でチャット応答を取得します。これらの関数は、APIキー、メッセージ履歴、使用するモデルを入力として受け取り、OpenAIのChatGPTモデルを利用して応答を生成します。

### Imported Modules
- OpenAI (from "openai")
- Message (from "../messages/messages")
- ChatCompletionMessageParam (from "openai/resources")

### Functions
- getOpenAIChatResponse: OpenAI APIを使用して単一のチャット応答を非同期で取得します。APIキー、メッセージ履歴、モデルを入力として受け取り、生成された応答メッセージを返します。

- getOpenAIChatResponseStream: OpenAI APIを使用してストリーミング形式でチャット応答を非同期で取得します。APIキー、メッセージ履歴、モデルを入力として受け取り、ReadableStreamオブジェクトを返します。このストリームは、生成された応答を小さな断片に分けて提供します。

</answer>


## src/features/chat/googleChat.ts

<answer>
### File Description
このファイルは、Google Generative AIを使用してチャットレスポンスを生成するための関数を提供しています。通常のレスポンスとストリーミングレスポンスの両方をサポートしており、メッセージの履歴を処理し、システムメッセージを適切に扱う機能も含まれています。ファイルの前半にはコメントアウトされた以前のバージョンのコードが残されています。

### Imported Modules
- GoogleGenerativeAI from "@google/generative-ai"
- Message from "../messages/messages"

### Functions
- getGoogleChatResponse: Google Generative AIを使用して単一のチャットレスポンスを生成します。メッセージ履歴、APIキー、モデル名を受け取り、テキストレスポンスを返します。

- getGoogleChatResponseStream: ストリーミング形式でGoogle Generative AIのレスポンスを生成します。メッセージ履歴、APIキー、モデル名を受け取り、ReadableStreamとしてレスポンスを返します。

- processMessages: 入力されたメッセージ配列を処理し、システムメッセージを抽出し、チャット履歴を適切な形式に変換します。内部ヘルパー関数として使用されています。

</answer>


## src/features/chat/groqChat.ts

<answer>

### File Description
このファイルは、Groq APIと通信するためのユーティリティ関数を提供しています。主に、チャットメッセージの送信とレスポンスの取得を行う2つの関数が定義されています。1つは通常のレスポンス取得用、もう1つはストリーミングレスポンス用です。特に、ストリーミングレスポンス用の関数では、受信したデータの処理と整形を行っています。

### Imported Modules
- Message (from "../messages/messages")

### Functions
- getGroqChatResponse: Groq APIにチャットメッセージを送信し、レスポンスを非ストリーミング形式で取得します。
- getGroqChatResponseStream: Groq APIにチャットメッセージを送信し、レスポンスをストリーミング形式で取得します。受信したデータを処理し、整形して返します。

</answer>


## src/features/chat/difyChat.ts

<answer>

### File Description
このファイルは、Dify APIを使用してチャットレスポンスのストリーミングを行う機能を提供しています。主に`getDifyChatResponseStream`関数を定義し、メッセージ配列、APIキー、URL、会話IDを入力として受け取り、ストリーミングレスポンスを返します。また、Server-Sent Events (SSE)形式のレスポンスを解析し、ReadableStreamとして返す処理も含まれています。

### Imported Modules
- Message (from "../messages/messages")

### Functions
- getDifyChatResponseStream: Dify APIを使用してチャットレスポンスのストリーミングを行う非同期関数。APIリクエストの送信、レスポンスの解析、ReadableStreamの生成を行います。

</answer>


## src/features/chat/aiChatFactory.ts

<answer>

### File Description
このファイルは、複数のAIサービス（OpenAI、Anthropic、Google、LocalLLM、Groq、Dify）とのチャットインターフェースを提供するモジュールです。各サービスの設定と通信を管理し、統一されたインターフェースを通じてAIチャットレスポンスのストリームを取得する機能を実装しています。サービスの選択と設定を柔軟に行えるようになっており、異なるAIプロバイダーを簡単に切り替えることができます。

### Imported Modules
- Message (from "@/features/messages/messages")
- getOpenAIChatResponseStream (from "./openAiChat")
- getAnthropicChatResponseStream (from "./anthropicChat")
- getGoogleChatResponseStream (from "./googleChat")
- getLocalLLMChatResponseStream (from "./localLLMChat")
- getGroqChatResponseStream (from "./groqChat")
- getDifyChatResponseStream (from "./difyChat")

### Functions
- getAIChatResponseStream: 指定されたAIサービスに基づいてチャットレスポンスのストリームを取得する関数。サービスタイプ、メッセージ、および設定を入力として受け取り、適切なサービス固有の関数を呼び出してレスポンスを返します。

### Types and Interfaces
- AIService: サポートされているAIサービスの型定義（"openai" | "anthropic" | "google" | "localLlm" | "groq" | "dify"）
- AIServiceConfig: 各AIサービスの設定情報を含むインターフェース。キー、モデル、URL、および特定のサービス（Dify）に必要な追加パラメータを定義しています。

</answer>


## src/features/constants/systemPromptConstants.ts

<answer>
### File Description
このファイルは、会話AIシステムのプロンプト設定を定義しています。SYSTEM_PROMPTという定数に、AIが人間のように振る舞い、感情を持って会話するための詳細な指示が含まれています。プロンプトには、感情の種類、会話文の書式、および会話例が具体的に示されており、AIの応答方法を規定しています。

### Imported Modules
このファイルには明示的にインポートされているモジュールはありません。

### Functions
このファイルには関数の定義はありません。代わりに、SYSTEM_PROMPTという定数が定義されています。

- SYSTEM_PROMPT: AIシステムに対する指示を含む文字列定数。AIが人間らしく会話するための詳細なガイドラインを提供しています。この定数は、感情表現、会話の書式、応答例、および会話スタイルに関する指示を含んでいます。

</answer>


## src/features/constants/koeiroParam.ts

<answer>
### File Description
このファイルは、音声合成に関連するパラメータを定義しています。`KoeiroParam`という型を定義し、その型を使用して複数のプリセットパラメータを設定しています。これらのパラメータは、話者の特性を表現するためのX座標とY座標を含んでおり、音声の特徴を調整するために使用されると考えられます。

### Imported Modules
このファイルには外部モジュールのインポートはありません。

### Functions
このファイルには関数の定義はありません。代わりに、以下の定数が定義されています：

- `DEFAULT_PARAM`: デフォルトのパラメータ設定を定義しています。
- `PRESET_A`: プリセットAのパラメータ設定を定義しています。
- `PRESET_B`: プリセットBのパラメータ設定を定義しています。
- `PRESET_C`: プリセットCのパラメータ設定を定義しています。
- `PRESET_D`: プリセットDのパラメータ設定を定義しています。

各定数は`KoeiroParam`型を持ち、`speakerX`と`speakerY`の値を設定しています。これらは音声合成の話者特性を調整するためのプリセット値として使用されると推測されます。
</answer>


## src/features/vrmViewer/viewerContext.ts

<answer>
### File Description
このファイルはReactアプリケーションのコンテキスト設定に関するものです。`Viewer`クラスのインスタンスを作成し、それをReactのコンテキストとして提供するための設定を行っています。このコンテキストは、アプリケーション全体で`Viewer`インスタンスを共有するために使用されると考えられます。

### Imported Modules
- createContext (from 'react')
- Viewer (from './viewer')

### Functions
このファイルには明示的に定義された関数はありませんが、以下の重要な操作が行われています：

- Viewerインスタンスの作成: `new Viewer()`を使用して`Viewer`クラスのインスタンスを作成しています。
- コンテキストの作成: `createContext`を使用して`ViewerContext`という名前のReactコンテキストを作成しています。このコンテキストは`viewer`オブジェクトを含んでいます。
</answer>


## src/features/vrmViewer/model.ts

<answer>
### File Description
このファイルは3Dキャラクターを管理するための`Model`クラスを定義しています。VRMファイルの読み込み、アニメーションの適用、リップシンク、感情表現などの機能を提供し、3Dキャラクターの制御と更新を行います。Three.jsとVRMライブラリを使用して、インタラクティブな3Dキャラクター表示を実現しています。

### Imported Modules
- THREE (three.js)
- VRM, VRMLoaderPlugin, VRMUtils (@pixiv/three-vrm)
- GLTFLoader (three/examples/jsm/loaders/GLTFLoader)
- VRMAnimation (../../lib/VRMAnimation/VRMAnimation)
- VRMLookAtSmootherLoaderPlugin (@/lib/VRMLookAtSmootherLoaderPlugin/VRMLookAtSmootherLoaderPlugin)
- LipSync (../lipSync/lipSync)
- EmoteController (../emoteController/emoteController)
- Screenplay (../messages/messages)

### Functions
- constructor: `Model`クラスのインスタンスを初期化し、`LipSync`オブジェクトを作成します。
- loadVRM: VRMファイルを非同期で読み込み、初期化します。
- unLoadVrm: 読み込まれたVRMモデルを解放します。
- loadAnimation: VRMアニメーションを読み込み、適用します。
- speak: 音声を再生し、リップシンクと表情アニメーションを行います。
- update: キャラクターの状態（リップシンク、表情、アニメーション）を更新します。
</answer>


## src/features/vrmViewer/viewer.ts

<answer>

### File Description
このファイルは、Three.jsを使用した3Dビューワーを実装する`Viewer`クラスを定義しています。VRMモデルの読み込み、表示、アニメーション、カメラ制御などの機能を提供し、WebGLを使用してブラウザ上で3Dモデルを表示するための主要なコンポーネントです。Reactアプリケーションでの使用を想定しており、後からcanvas要素を設定できる柔軟な設計になっています。

### Imported Modules
- THREE (from "three")
- Model (from "./model")
- loadVRMAnimation (from "@/lib/VRMAnimation/loadVRMAnimation")
- buildUrl (from "@/utils/buildUrl")
- OrbitControls (from "three/examples/jsm/controls/OrbitControls")

### Functions
- constructor(): Viewerクラスのインスタンスを初期化し、シーン、ライト、クロックを設定します。
- loadVrm(url: string): 指定されたURLからVRMモデルを読み込み、シーンに追加します。また、アイドルアニメーションも読み込みます。
- unloadVRM(): 現在読み込まれているVRMモデルをシーンから削除します。
- setup(canvas: HTMLCanvasElement): Reactで管理されているCanvas要素を使用してレンダラー、カメラ、コントロールを設定します。
- resize(): キャンバスの親要素のサイズに合わせてレンダラーとカメラのアスペクト比を調整します。
- resetCamera(): VRMモデルのhead位置を参照してカメラ位置を調整します。
- update(): アニメーションフレームごとにモデルの更新とレンダリングを行います。

</answer>


## src/features/youtube/conversationContinuityFunctions.ts

<answer>
### File Description
このファイルは、AIアシスタントを用いたチャットシステムの主要な機能を提供するモジュールです。OpenAIやAnthropicのAIサービスを利用して、ユーザーとの対話を管理し、適切な応答を生成します。また、YouTubeコメントの処理や新しい話題の生成、会話の継続判断など、多岐にわたる機能を実装しています。

### Imported Modules
- Message (from "@/features/messages/messages")
- getOpenAIChatResponse (from "@/features/chat/openAiChat")
- getAnthropicChatResponse (from "@/features/chat/anthropicChat")

### Functions
- fetchAIResponse: 指定されたAIサービス（OpenAIまたはAnthropic）を使用して、AIの応答を取得します。
- getLastMessages: 指定された数の最新メッセージを取得し、文字列として返します。
- getModifiedSystemMessage: システムメッセージを受け取り、修正したシステムメッセージを返します。
- getBestComment: ユーザーのコメントとYouTubeのコメントを受け取り、最適なコメントを返します。
- getMessagesForSleep: システムプロンプトを受け取り、休憩用のメッセージを返します。
- getAnotherTopic: メッセージを受け取り、最新の4つのメッセージを使用して別の話題を取得します。
- getMessagesForNewTopic: メッセージを受け取り、新しい話題のためのメッセージを取得します。
- checkIfResponseContinuationIsRequired: メッセージを受け取り、次の発言者を判断します。
- getMessagesForContinuation: システムプロンプトとメッセージを受け取り、継続のためのメッセージを取得します。
</answer>


## src/features/youtube/youtubeComments.ts

<answer>

### File Description
このファイルはYouTubeのライブチャット機能と連携し、コメントの取得、処理、およびAIを使用した会話の継続性を管理するための機能を提供しています。主にライブチャットIDの取得、コメントの取得と処理、そしてAIを活用した会話の継続や新しいトピックの生成を行います。また、コメントが少ない状況でのAIの振る舞いも制御しています。

### Imported Modules
- Message (from "@/features/messages/messages")
- getBestComment, getMessagesForSleep, getAnotherTopic, getMessagesForNewTopic, checkIfResponseContinuationIsRequired, getMessagesForContinuation (from "@/features/youtube/conversationContinuityFunctions")

### Functions
- getLiveChatId: YouTubeのライブストリームIDからライブチャットIDを取得する
- retrieveLiveComments: 指定されたライブチャットIDから最新のコメントを取得する
- fetchAndProcessComments: コメントの取得、処理、およびAIを使用した会話の継続性を管理する主要な関数
- (Typeの定義) YouTubeComment: ユーザー名、アイコンURL、コメント内容を含むYouTubeコメントの型定義
- (Typeの定義) YouTubeComments: YouTubeCommentの配列型

</answer>


## src/features/googletts/googletts.ts

<answer>
### File Description
このファイルは、Google Cloud Text-to-Speech APIを使用してテキストを音声に変換する機能を提供しています。`googleTts`という非同期関数が定義されており、指定されたメッセージと音声タイプを使用して音声合成を行います。この関数は、英語（アメリカ）の女性の声で音声を生成し、LINEAR16形式でエンコードします。

### Imported Modules
- @google-cloud/text-to-speech

### Functions
- googleTts: テキストメッセージと音声タイプを受け取り、Google Cloud Text-to-Speech APIを使用して音声を合成します。合成された音声データをバイナリ形式で返します。

</answer>


## src/features/koeiromap/koeiromap.ts

<answer>

### File Description
このファイルは、音声合成APIである「こえいろマップ」を利用するための関数を定義しています。2つのバージョン（V0とV1）のAPIインターフェースを提供し、テキストを音声に変換する機能を実装しています。各関数は、メッセージ、話者の位置、話し方のスタイルなどのパラメータを受け取り、APIにリクエストを送信して音声データを取得します。

### Imported Modules
- TalkStyle (from "../messages/messages")

### Functions
- koeiromapV0: こえいろマップAPIのV0バージョンを使用して、テキストを音声に変換する関数。話者の位置とスタイルを指定可能。
- koeiromapFreeV1: こえいろマップAPIのV1バージョンを使用して、テキストを音声に変換する関数。V0と同様のパラメータに加え、APIキーが必要。

</answer>


## src/utils/reduceTalkStyle.ts

<answer>
### File Description
このファイルは、koeiromap Free v1の制限に対応した声色パラメータを扱うための機能を提供しています。具体的には、制限された声色タイプの定義と、与えられた声色パラメータを制限された範囲内に変換する関数を含んでいます。これにより、koeiromap Free v1の仕様に合わせた声色の制御が可能になります。

### Imported Modules
このファイルでは外部モジュールのインポートは行われていません。

### Functions
- reduceTalkStyle: 与えられた声色パラメータ（talkStyle）を、koeiromap Free v1で使用可能な制限された声色タイプ（"talk", "happy", "sad"）のいずれかに変換します。指定された声色が制限範囲外の場合、デフォルトとして"talk"を返します。

### Types
- ReducedTalkStyle: koeiromap Free v1の制限に対応した声色タイプを定義するカスタム型です。"talk", "happy", "sad"の3つの文字列リテラル型のユニオンとして定義されています。
</answer>


## src/utils/wait.ts

<answer>
### File Description
このファイルは、非同期的な待機機能を提供する単一の関数 `wait` を定義しています。この関数は、指定されたミリ秒数だけプログラムの実行を一時停止させるためのユーティリティ関数です。Promiseを使用して非同期処理を実装しており、TypeScriptの型注釈も適用されています。

### Imported Modules
このファイルには外部モジュールのインポートはありません。

### Functions
- wait: 指定されたミリ秒数だけ非同期的に待機する関数です。Promiseを返し、setTimeoutを使用して遅延を実現します。
</answer>


## src/utils/buildUrl.ts

<answer>

### File Description
このファイルは、GitHub Pagesで公開される際にアセットを正しく読み込むためのユーティリティ関数を提供しています。環境変数を使用してリポジトリ名をURLに追加することで、正しいパスを生成します。Next.jsの設定を利用して、動的にURLを構築する機能を実装しています。

### Imported Modules
- getConfig from "next/config"

### Functions
- buildUrl: 与えられたパスに対して、環境変数に基づいてリポジトリ名を追加したURLを構築します。GitHub Pagesでのアセット読み込みを適切に行うために使用されます。

</answer>


## src/styles/globals.css

<answer>

### File Description
このファイルは、TailwindCSSを使用したスタイリングの設定ファイルです。基本的なTailwindディレクティブの導入、bodyタグのグローバルスタイル、カスタムコンポーネントスタイル（特にinput-range要素用）、そしてユーティリティクラスの定義が含まれています。全体的に、ウェブアプリケーションの視覚的な一貫性と特定の機能（スクロールバーの非表示など）を提供することを目的としています。

### Imported Modules
- @tailwind base
- @tailwind components
- @tailwind utilities

### Functions
このファイルには明示的な関数定義は含まれていません。代わりに、以下のような主要なスタイル定義が含まれています：

- body: 背景画像の設定（位置、固定、サイズ、繰り返しなし）
- .input-range: カスタムレンジ入力要素のスタイリング（外観、背景色、サイズ、形状）
- .input-range::-webkit-slider-thumb: レンジ入力のスライダーサムのカスタマイズ（サイズ、色、形状）
- .scroll-hidden: スクロールバーを非表示にするユーティリティクラス

これらのスタイル定義は、特定のHTML要素やクラスに適用されるスタイルルールを提供し、ウェブページの視覚的な外観と動作を制御します。

</answer>


## src/components/settings.tsx

<answer>

### File Description
このファイルは、React コンポーネントの `Settings` を定義しています。このコンポーネントは、AI チャットボットのさまざまな設定を管理するための UI を提供します。言語選択、AI サービスの選択、音声合成エンジンの設定、キャラクター設定、YouTube モードなど、多岐にわたる設定項目を含んでいます。また、国際化（i18n）にも対応しており、多言語サポートを提供しています。

### Imported Modules
- React, useEffect
- IconButton
- TextButton
- Message
- GitHubLink
- KoeiroParam, PRESET_A, PRESET_B, PRESET_C, PRESET_D
- Link
- i18n
- useTranslation
- speakers

### Functions
- Settings: メインのコンポーネント関数。多数のプロップを受け取り、設定画面の UI をレンダリングします。各設定項目の状態管理と変更ハンドラを含みます。

- useEffect フック: ローカルストレージから言語設定を読み込み、適用します。

- 条件付きレンダリング関数:
  - AI サービス選択に基づいて異なる設定フィールドを表示
  - 音声エンジン選択に基づいて異なる設定オプションを表示
  - YouTube モードの有効/無効に応じて追加設定を表示

- イベントハンドラ関数:
  - 言語選択、AI サービス選択、音声エンジン選択などの変更を処理
  - 各種設定値の更新を処理（API キー、URL、モデル ID など）
  - テストボイス再生、チャットログリセットなどのアクションを処理

</answer>


## src/components/chatLog.tsx

<answer>

### File Description
このファイルはReactコンポーネントを定義しており、チャットログを表示するためのUIを実装しています。主要なコンポーネントとして`ChatLog`と`Chat`があり、メッセージの表示、自動スクロール、ユーザーと文字（キャラクター）の区別、コードブロックの表示などの機能を提供しています。スタイリングにはTailwind CSSが使用されています。

### Imported Modules
- useEffect (from 'react')
- useRef (from 'react')
- Message (from '@/features/messages/messages')

### Functions
- ChatLog: メッセージの配列を受け取り、チャットログ全体を表示するコンポーネント。自動スクロール機能を実装しています。
- Chat: 個々のチャットメッセージを表示するコンポーネント。ユーザー、キャラクター、コードブロックの表示を区別し、適切なスタイリングを適用します。

### Components
- ChatLog: プロップスとして`messages`と`characterName`を受け取り、チャットログ全体を表示します。
- Chat: プロップスとして`role`、`message`、`characterName`を受け取り、個々のチャットメッセージを表示します。

</answer>


## src/components/messageInput.tsx

<answer>

### File Description
このファイルは、React コンポーネントの `MessageInput` を定義しています。ユーザーがメッセージを入力し、音声入力や送信を行うためのインターフェースを提供します。コンポーネントは、テキストエリア、マイクボタン、送信ボタンを含み、多言語対応や入力中の状態管理、動的な行数調整などの機能を備えています。

### Imported Modules
- IconButton (from "./iconButton")
- useTranslation (from 'react-i18next')
- useState, useEffect (from 'react')

### Functions
- MessageInput: メインのコンポーネント関数。ユーザー入力、マイク録音状態、チャット処理状態などのプロップスを受け取り、メッセージ入力インターフェースをレンダリングします。
- handleKeyPress: テキストエリアでのキー入力を処理する関数。Enterキーでの送信、Shift+Enterでの改行、Backspaceでの行数調整などを行います。

### Hooks
- useTranslation: 多言語対応のための翻訳機能を提供します。
- useState(rows): テキストエリアの行数を管理します。
- useState(loadingDots): ローディング表示のドットアニメーションを管理します。
- useEffect: チャット処理中のローディングドットアニメーションを制御します。

</answer>


## src/components/link.tsx

<answer>

### File Description
このファイルは、ReactコンポーネントとしてLinkを定義しています。Linkコンポーネントは、外部リンクを生成するための再利用可能なコンポーネントです。URLとラベルを受け取り、スタイル付けされたアンカータグを返します。このコンポーネントは、一貫したリンクスタイルとセキュリティ設定を提供し、アプリケーション全体で使用できるように設計されています。

### Imported Modules
このファイルには明示的なインポート文がありません。ただし、Reactの機能を使用しているため、暗黙的にReactがインポートされていると考えられます。

### Functions
- Link: 外部リンクを生成するReactコンポーネント。URLとラベルをプロプスとして受け取り、スタイル付けされたアンカータグを返します。このコンポーネントは、新しいタブでリンクを開き、セキュリティ属性を設定し、ホバー時のスタイルも定義しています。

</answer>


## src/components/speakers.json

<answer>

### File Description
このファイルは、音声合成システムで使用される話者（キャラクター）とそのIDを定義したJSONデータです。各エントリーは話者名とそのバリエーション（例：通常、感情表現など）、および対応する数値IDを含んでいます。このデータは、音声合成システムで特定の話者や音声スタイルを選択する際に使用される可能性が高いです。

### Imported Modules
このファイルには明示的にインポートされているモジュールはありません。純粋なJSONデータ構造のみが含まれています。

### Functions
このファイルには関数の定義は含まれていません。代わりに、以下のような構造を持つJSONオブジェクトの配列が定義されています：

- 各オブジェクトは `speaker` と `id` の2つのキーを持ちます。
- `speaker` は話者名とそのバリエーション（存在する場合）を示す文字列です。
- `id` は各話者に割り当てられた一意の数値識別子です。

主な話者カテゴリーには以下のようなものがあります：

- 四国めたん（6つのバリエーション）
- ずんだもん（6つのバリエーション）
- 春日部つむ、雨晴はう、波音リツ（各1つのバリエーション）
- 玄野武宏（2つのバリエーション）
- 白上虎太郎（5つのバリエーション）
- 九州そら（5つのバリエーション）
- WhiteCUL（4つのバリエーション）
- No.7（3つのバリエーション）
- ナースロボ＿タイプＴ（4つのバリエーション）
- 猫使アル（3つのバリエーション）
- 猫使ビィ（3つのバリエーション）

その他、複数の個別キャラクターが含まれています。

</answer>


## src/components/meta.tsx

<answer>

### File Description
このファイルは、Next.jsアプリケーションのメタデータを設定するためのReactコンポーネントを定義しています。主にSEOとソーシャルメディア共有のための`<meta>`タグを生成し、Webページのタイトル、説明、OGP（Open Graph Protocol）情報、Twitterカード情報を設定します。AITuberキットに関する基本的なメタ情報を提供しています。

### Imported Modules
- buildUrl (from "@/utils/buildUrl")
- Head (from "next/head")

### Functions
- Meta: ページのメタデータを設定するReactコンポーネント。タイトル、説明、画像URLを定義し、それらを使用してHTMLの`<head>`セクション内に適切な`<meta>`タグを生成します。このコンポーネントは、SEO最適化とソーシャルメディア共有のための重要な情報を提供します。

</answer>


## src/components/textButton.tsx

<answer>
### File Description
このファイルは、Reactコンポーネントとして`TextButton`を定義しています。`TextButton`は、カスタマイズ可能なスタイルを持つボタンコンポーネントで、主にプライマリーアクションに使用されることを想定しています。コンポーネントは再利用可能で、プロップスを通じて柔軟にカスタマイズできるように設計されています。

### Imported Modules
- ButtonHTMLAttributes (from "react")

### Functions
- TextButton: Reactの関数コンポーネントとして定義されています。HTMLボタン要素のプロパティを受け取り、スタイリングされたボタンを返します。ボタンには、ホバー、アクティブ、無効状態など、様々な状態に応じたスタイルが適用されています。
</answer>


## src/components/assistantText.tsx

<answer>
### File Description
このファイルは、React componentを定義しています。`AssistantText`というコンポーネントで、アシスタントのメッセージを表示するためのUIを提供します。特徴として、キャラクター名の表示/非表示の切り替え、メッセージのスタイリング、そして特定のパターンのテキスト（角括弧内の英字）を除去する機能があります。

### Imported Modules
このファイルには明示的なインポート文がありませんが、Reactを使用していることが暗示されています。

### Functions
- AssistantText: メッセージ、キャラクター名、キャラクター名の表示有無を受け取り、スタイリングされたメッセージボックスをレンダリングします。メッセージ内の特定パターン（[...]）を除去し、条件に応じてキャラクター名を表示します。
</answer>


## src/components/codeLog.tsx

<answer>

### File Description
このファイルは、Reactを使用したチャットログ表示コンポーネントを定義しています。`CodeLog`コンポーネントはメッセージの一覧を表示し、自動スクロール機能を備えています。また、`Chat`コンポーネントは個々のメッセージの表示を担当し、メッセージの種類（コード、出力、実行中、アシスタント、その他）に応じて適切なスタイルを適用します。

### Imported Modules
- useEffect (from 'react')
- useRef (from 'react')
- Message (from '@/features/messages/messages')
- React (from 'react')

### Functions
- CodeLog: メッセージの一覧を表示するメインコンポーネント。自動スクロール機能を実装し、各メッセージを`Chat`コンポーネントでレンダリングします。
- Chat: 個々のメッセージを表示するコンポーネント。メッセージの種類（role）に応じて背景色やテキスト色を変更し、適切なレイアウトで表示します。コード、出力、実行中のメッセージは特別な処理を行います。

</answer>


## src/components/menu.tsx

<answer>
### File Description
このファイルは、React コンポーネントとして `Menu` を定義しています。このコンポーネントは、AIアシスタントのチャットインターフェース、設定、およびVRMモデルの操作を含む複雑なユーザーインターフェースを管理します。ユーザーがAIサービス、音声設定、YouTubeモード、WebSocketモードなどの様々な設定を調整できるようにし、チャットログやコードログの表示も制御します。

### Imported Modules
- IconButton
- Message
- KoeiroParam
- ChatLog
- CodeLog
- React, useCallback, useContext, useRef, useState
- Settings
- ViewerContext
- AssistantText
- useTranslation
- testVoice

### Functions
- Menu: メインのコンポーネント関数。多数のpropsを受け取り、UI全体を構築します。
- handleChangeAIService: AIサービスの変更を処理します。
- handleChangeSystemPrompt: システムプロンプトの変更を処理します。
- handleOpenAiKeyChange: OpenAI APIキーの変更を処理します。
- handleAnthropicKeyChange: Anthropic APIキーの変更を処理します。
- handleGoogleKeyChange: Google APIキーの変更を処理します。
- handleGroqKeyChange: Groq APIキーの変更を処理します。
- handleChangeLocalLlmUrl: ローカルLLM URLの変更を処理します。
- handleDifyKeyChange: Dify APIキーの変更を処理します。
- handleDifyUrlChange: Dify URLの変更を処理します。
- handleDifyConversationIdChange: Dify会話IDの変更を処理します。
- handleChangeKoeiromapKey: Koeiromap APIキーの変更を処理します。
- handleVoicevoxSpeakerChange: VOICEVOX話者の変更を処理します。
- handleChangeGoogleTtsType: Google TTS タイプの変更を処理します。
- handleChangeStyleBertVits2ServerUrl: StyleBertVits2サーバーURLの変更を処理します。
- handleChangeStyleBertVits2ModelId: StyleBertVits2モデルIDの変更を処理します。
- handleChangeStyleBertVits2Style: StyleBertVits2スタイルの変更を処理します。
- handleYoutubeApiKeyChange: YouTube API キーの変更を処理します。
- handleYoutubeLiveIdChange: YouTube ライブIDの変更を処理します。
- handleChangeKoeiroParam: Koeiro パラメータの変更を処理します。
- handleWebSocketMode: WebSocketモードの切り替えを処理します。
- handleConversationContinuityMode: 会話継続モードの切り替えを処理します。
- handleClickOpenVrmFile: VRMファイル選択ダイアログを開きます。
- handleClickOpenBgFile: 背景画像ファイル選択ダイアログを開きます。
- handleClickTestVoice: 音声テストを実行します。
- handleChangeVrmFile: 選択されたVRMファイルを処理します。
- handleChangeBgFile: 選択された背景画像ファイルを処理します。
- handleChangeGSVITtsServerUrl: GSVI TTS サーバーURLの変更を処理します。
- handleChangeGSVITtsModelId: GSVI TTS モデルIDの変更を処理します。
- handleChangeGSVITtsBatchSize: GSVI TTS バッチサイズの変更を処理します。
- handleChangeG


## src/components/messageInputContainer.tsx

<answer>

### File Description
このファイルは、React環境でテキスト入力と音声入力機能を提供するMessageInputContainerコンポーネントを定義しています。音声認識機能を利用し、ユーザーの発言を自動的にテキストに変換し、チャット処理を開始する機能を実装しています。また、チャット処理中は入力を無効化するなど、ユーザー体験を向上させる機能も含まれています。

### Imported Modules
- MessageInput (from "@/components/messageInput")
- useState, useEffect, useCallback (from "react")

### Functions
- MessageInputContainer: メインのコンポーネント関数。テキスト入力、音声入力、およびチャット処理の制御を行います。
- handleRecognitionResult: 音声認識の結果を処理し、テキストを更新およびチャット処理を開始する関数。
- handleRecognitionEnd: 音声認識の終了を処理する関数。
- handleClickMicButton: マイクボタンのクリックイベントを処理し、音声認識の開始/停止を制御する関数。
- handleClickSendButton: 送信ボタンのクリックイベントを処理し、チャット処理を開始する関数。

</answer>


## src/components/iconButton.tsx

<answer>

### File Description
このファイルは、React用のカスタムIconButtonコンポーネントを定義しています。ボタンにアイコンと任意のラベルを表示し、処理中の状態も表現できます。スタイリングにはTailwind CSSのクラスを使用し、ボタンの外観をカスタマイズしています。

### Imported Modules
- KnownIconType from "@charcoal-ui/icons"
- ButtonHTMLAttributes from "react"

### Functions
- IconButton: アイコン付きのボタンコンポーネントを作成する関数。プロップスとして受け取ったアイコン名、処理中の状態、ラベルを元にボタンをレンダリングします。ボタンのスタイルはTailwind CSSクラスで定義され、処理中はアイコンが"24/Dot"に変更されます。

</answer>


## src/components/githubLink.tsx

<answer>

### File Description
このファイルは、GitHubリポジトリへのリンクを表示するReactコンポーネント「GitHubLink」を定義しています。コンポーネントは、ページの右上に固定された位置に表示され、GitHubアイコンと「Fork me」テキストを含むボタンを描画します。このボタンをクリックすると、新しいタブでGitHubリポジトリが開きます。

### Imported Modules
- Image (from 'next/image')
- buildUrl (from "@/utils/buildUrl")

### Functions
- GitHubLink: GitHubリポジトリへのリンクを含むボタンを描画するReactコンポーネント関数。絶対位置指定でページ右上に配置され、GitHubアイコンと「Fork me」テキストを表示します。

</answer>


## src/components/introduction.tsx

<answer>
### File Description
このファイルは、React アプリケーションの導入画面コンポーネントを定義しています。多言語対応（i18n）を実装し、アプリケーションの概要、使用技術、ソースコードリポジトリへのリンクなどを表示します。また、言語選択機能や「次回から表示しない」オプションも提供しています。

### Imported Modules
- useState, useCallback (from "react")
- Link (from "./link")
- IconButton (from "./iconButton")
- i18n (from "i18next")
- useTranslation, Trans (from 'react-i18next')

### Functions
- Introduction: メインのコンポーネント関数。導入画面の全体的な構造とロジックを定義しています。
- handleDontShowIntroductionChange: 「次回から表示しない」チェックボックスの状態変更を処理する関数です。
- updateLanguage: 選択された言語に基づいて、アプリケーションの言語設定を更新する関数です。
- getVoiceLanguageCode: 選択された言語コードに対応する音声言語コードを返す関数です。

### Component Props
- dontShowIntroduction: 導入画面を表示するかどうかを制御するブール値
- onChangeDontShowIntroduction: dontShowIntroduction の状態を変更するコールバック関数
- selectLanguage: 現在選択されている言語コード
- setSelectLanguage: 言語コードを設定する関数
- setSelectVoiceLanguage: 音声言語コードを設定する関数

### Key Features
- 多言語対応: i18next を使用して、複数言語での表示に対応しています。
- 条件付きレンダリング: opened 状態に基づいて導入画面の表示/非表示を切り替えます。
- 外部リンク: アプリケーションに関連する技術やリソースへのリンクを提供しています。
- 言語自動更新: 言語選択時に自動的に UI と音声言語を更新します。
- レスポンシブデザイン: Tailwind CSS クラスを使用して、レスポンシブなデザインを実現しています。
</answer>


## src/components/vrmViewer.tsx

<answer>
### File Description
このファイルは、React環境でVRMビューワーを実装するコンポーネントを定義しています。主な機能として、3Dキャンバス上にVRMモデルを表示し、ドラッグ＆ドロップによるモデルの動的な差し替えを可能にしています。ViewerContextを使用してビューワーの状態を管理し、キャンバス要素の設定やVRMモデルのロードを行っています。

### Imported Modules
- useContext (react)
- useCallback (react)
- ViewerContext (../features/vrmViewer/viewerContext)
- buildUrl (@/utils/buildUrl)

### Functions
- VrmViewer: メインのコンポーネント関数。VRMビューワーのUIとロジックを定義しています。
- canvasRef: useCallbackで最適化されたコールバック関数。キャンバス要素の設定、VRMモデルのロード、ドラッグ＆ドロップイベントの処理を行います。

### Key Features
- キャンバス要素の設定とVRMモデルの初期ロード
- ドラッグ＆ドロップによるVRMモデルの動的な差し替え機能
- フルスクリーンサイズのキャンバス表示
</answer>


## src/lib/i18n.js

<answer>

### File Description
このファイルはi18nextライブラリを使用して多言語サポートを設定するための設定ファイルです。英語、日本語、中国語、韓国語の翻訳リソースを定義し、デフォルト言語を日本語に設定しています。React アプリケーションで国際化（i18n）を実装するための基本的な設定が含まれています。

### Imported Modules
- i18n (from "i18next")
- initReactI18next (from "react-i18next")

### Functions
このファイルには明示的に定義された関数はありませんが、i18nの設定を行う重要な処理があります：

- i18n.use().init(): i18nの初期化を行い、言語リソースの設定、デフォルト言語の指定、フォールバック言語の設定、補間オプションの設定を行っています。この処理により、アプリケーション全体で多言語サポートが有効になります。

注意点：
- 言語リソースは別ファイル（JSONファイル）から読み込まれています。
- デフォルト言語とフォールバック言語は日本語（'ja'）に設定されています。
- 補間時にエスケープ処理を無効にしています（escapeValue: false）。

</answer>


## src/lib/VRMAnimation/VRMAnimation.ts

<answer>

### File Description
このファイルは、VRMアニメーションを扱うためのクラス `VRMAnimation` を定義しています。THREE.jsとVRMライブラリを使用して、3Dモデルのアニメーションを管理し、ボーンの移動、回転、表情、視線の動きなどを制御します。アニメーションクリップの作成や、各種トラックの生成機能を提供し、VRMモデルのアニメーション制御を容易にします。

### Imported Modules
- THREE from "three"
- VRM, VRMExpressionManager, VRMHumanBoneName from "@pixiv/three-vrm"

### Functions
- constructor: VRMAnimationクラスのインスタンスを初期化し、各種プロパティを設定します。
- createAnimationClip: 与えられたVRMモデルに基づいてアニメーションクリップを作成します。ヒューマノイド、表情、視線のトラックを含みます。
- createHumanoidTracks: VRMモデルのヒューマノイドボーンに対応するアニメーショントラックを生成します。回転と移動のトラックを扱います。
- createExpressionTracks: VRMモデルの表情管理者を使用して、表情のアニメーショントラックを生成します。
- createLookAtTrack: 視線制御用のアニメーショントラックを生成します。存在しない場合はnullを返します。

</answer>


## src/lib/VRMAnimation/VRMAnimationLoaderPluginOptions.ts

<answer>
### File Description
このファイルは、VRMアニメーションローダープラグインのオプションを定義するTypeScriptインターフェースを含んでいます。`VRMAnimationLoaderPluginOptions`というインターフェースが宣言されていますが、現時点では空の定義となっています。これは、将来的にオプションを追加する可能性を示唆しています。

### Imported Modules
このファイルには外部モジュールのインポートはありません。

### Functions
このファイルには関数の定義はありません。代わりに、以下のインターフェースが定義されています：

- VRMAnimationLoaderPluginOptions: 現在は空のインターフェースとして定義されています。将来的にVRMアニメーションローダープラグインのオプションを追加するための準備として使用される可能性があります。
</answer>


## src/lib/VRMAnimation/VRMAnimationLoaderPlugin.ts

<answer>

### File Description
このファイルは、VRMアニメーションをロードするためのThree.jsプラグインを実装しています。VRMCVRMAnimationという拡張を解析し、GLTFファイルからVRMアニメーションデータを抽出して処理します。主にヒューマノイド、表情、視線のアニメーションに対応しており、ボーンの階層構造やワールド座標変換を考慮しています。

### Imported Modules
- * as THREE from "three"
- GLTF, GLTFLoaderPlugin, GLTFParser from "three/examples/jsm/loaders/GLTFLoader"
- VRMAnimationLoaderPluginOptions from "./VRMAnimationLoaderPluginOptions"
- GLTF as GLTFSchema from "@gltf-transform/core"
- VRMCVRMAnimation from "./VRMCVRMAnimation"
- VRMHumanBoneName, VRMHumanBoneParentMap from "@pixiv/three-vrm"
- VRMAnimation from "./VRMAnimation"
- arrayChunk from "./utils/arrayChunk"

### Functions
- constructor: VRMAnimationLoaderPluginクラスのコンストラクタ。GLTFParserとオプションを受け取ります。
- afterRoot: GLTFファイルのルートノード処理後に呼び出される非同期メソッド。VRMアニメーションの解析と変換を行います。
- _createNodeMap: VRMCVRMAnimationオブジェクトからノードマップを作成します。ヒューマノイド、表情、視線のインデックスと名前のマッピングを行います。
- _createBoneWorldMatrixMap: ボーンのワールド行列マップを作成する非同期メソッド。GLTFシーンのワールド行列を更新し、各ボーンのワールド行列を取得します。
- _parseAnimation: アニメーションクリップを解析し、VRMAnimationオブジェクトに変換します。ヒューマノイド、表情、視線のトラックを処理し、必要な座標変換を行います。

</answer>


## src/lib/VRMAnimation/loadVRMAnimation.ts

<answer>

### File Description
このファイルは、VRMアニメーションをロードするための機能を提供しています。GLTFLoaderを使用してVRMアニメーションファイルを非同期的にロードし、カスタムのVRMAnimationLoaderPluginを使用して処理します。主な機能は、指定されたURLからVRMアニメーションを読み込み、VRMAnimationオブジェクトとして返すことです。

### Imported Modules
- GLTFLoader from 'three/examples/jsm/loaders/GLTFLoader'
- VRMAnimation from './VRMAnimation'
- VRMAnimationLoaderPlugin from './VRMAnimationLoaderPlugin'

### Functions
- loadVRMAnimation: 指定されたURLからVRMアニメーションを非同期的にロードし、最初のVRMAnimationオブジェクトを返します。アニメーションが見つからない場合はnullを返します。

</answer>


## src/lib/VRMAnimation/VRMCVRMAnimation.ts

<answer>
### File Description
このファイルは、VRMアニメーションのインターフェースを定義しています。VRM（Virtual Reality Model）のヒューマノイド、表情、視線に関する設定を構造化されたデータとして表現するためのTypeScriptインターフェースが含まれています。このインターフェースは、VRMファイルのアニメーションデータを扱う際の型定義として使用されることが想定されています。

### Imported Modules
- @pixiv/three-vrm
  - VRMExpressionPresetName
  - VRMHumanBoneName

### Functions
このファイルには関数の定義は含まれていません。代わりに、以下のインターフェースが定義されています：

- VRMCVRMAnimation: VRMアニメーションのデータ構造を定義するインターフェース。specVersion、humanoid、expressions、lookAtの各プロパティを持ち、VRMモデルのアニメーション設定を表現します。

注：このインターフェースは、VRMモデルのボーン、表情、視線のアニメーション設定を構造化されたオブジェクトとして表現するために使用されます。各プロパティは特定のアニメーション要素（例：ヒューマノイドのボーン、プリセット表情、カスタム表情、視線）に対応しています。
</answer>


## src/lib/VRMAnimation/utils/linearstep.ts

<answer>
### File Description
このファイルは、線形補間のステップ関数（linearstep）を実装しています。外部モジュールから`saturate`関数をインポートし、それを利用して`linearstep`関数を定義しています。この関数は、与えられた範囲内で入力値を0から1の間に正規化する線形補間を行います。

### Imported Modules
- `saturate` (from './saturate')

### Functions
- linearstep: 3つの数値パラメータ（a, b, t）を受け取り、tをaとbの間で線形に補間した結果を返します。結果は0から1の範囲に制限されます（saturate関数により）。この関数は、値の滑らかな遷移やアニメーションなどに使用できます。
</answer>


## src/lib/VRMAnimation/utils/saturate.ts

<answer>

### File Description
このファイルは、数値を0.0から1.0の範囲に制限する関数 `saturate` を定義しています。この関数はTypeScriptで書かれており、数値処理や色彩操作などで使用される可能性が高い汎用的なユーティリティ関数です。

### Imported Modules
このファイルには外部モジュールのインポートはありません。

### Functions
- saturate: 入力された数値を0.0から1.0の範囲に制限します。入力値が0.0未満の場合は0.0を、1.0を超える場合は1.0を返します。それ以外の場合は入力値をそのまま返します。この関数は、例えば色の彩度調整や正規化された値の処理に使用できます。

</answer>


## src/lib/VRMAnimation/utils/arrayChunk.ts

<answer>

### File Description
このファイルは、配列を指定されたサイズのチャンク（部分配列）に分割する`arrayChunk`関数を定義しています。この関数はジェネリック型を使用しており、任意の型の配列に対して適用可能です。関数のドキュメンテーションには使用例が含まれており、関数の動作を明確に示しています。

### Imported Modules
このファイルには外部モジュールのインポートはありません。

### Functions
- arrayChunk: 与えられた配列を指定された要素数ごとのチャンクに分割する関数です。ArrayLike<T>型の入力配列と分割サイズを受け取り、T[][]型（二次元配列）を返します。

</answer>


## src/lib/VRMLookAtSmootherLoaderPlugin/VRMLookAtSmoother.ts

<answer>

### File Description
このファイルは、VRMモデルの視線制御を拡張する`VRMLookAtSmoother`クラスを定義しています。主な機能として、ユーザーの方向へのスムーズな視線追従、頭部の回転を含めた視線制御、そして眼球のサッケード運動（急速な眼球運動）の模倣があります。これにより、より自然でリアルな視線動作を実現しています。

### Imported Modules
- @pixiv/three-vrm: VRMHumanoid, VRMLookAt, VRMLookAtApplier
- three: THREE

### Functions
- constructor(humanoid: VRMHumanoid, applier: VRMLookAtApplier): VRMLookAtSmootherクラスのコンストラクタ。初期化時にサッケードを有効にします。

- update(delta: number): 毎フレーム呼び出される更新関数。アニメーションによる視線制御、ユーザー向きの視線制御、サッケード運動の適用を行います。

- revertFirstPersonBoneQuat(): レンダリング後に頭部の回転を元に戻す関数。ユーザーターゲットが設定されている場合に使用します。

- lookAt(target: THREE.Vector3): （親クラスから継承）指定された位置を見るように視線を設定する関数。

### Additional Notes
- このクラスは`VRMLookAt`を拡張しており、既存の機能に加えて、よりリアルな視線制御を実現しています。
- サッケード運動、スムージング、ユーザー向きの制限など、細かな調整が可能なパラメータが多数用意されています。
- THREE.jsのベクトルや四元数を活用して、3D空間での複雑な回転計算を行っています。

</answer>


## src/lib/VRMLookAtSmootherLoaderPlugin/VRMLookAtSmootherLoaderPlugin.ts

<answer>

### File Description
このファイルは、VRMモデルのLookAt機能にスムージング効果を追加するためのローダープラグインを定義しています。`VRMLookAtSmootherLoaderPlugin`クラスは`VRMLookAtLoaderPlugin`を拡張し、GLTFファイルの読み込み後に`VRMLookAtSmoother`を適用します。これにより、VRMモデルの視線の動きがよりスムーズになります。

### Imported Modules
- `@pixiv/three-vrm`: VRMHumanoid, VRMLookAt, VRMLookAtLoaderPlugin
- `three/examples/jsm/loaders/GLTFLoader`: GLTF
- `./VRMLookAtSmoother`: VRMLookAtSmoother

### Functions
- `name`: プラグインの名前を返すゲッター関数。"VRMLookAtSmootherLoaderPlugin"を返します。
- `afterRoot`: GLTFファイルの読み込み後に呼び出される非同期関数。VRMHumanoidとVRMLookAtが存在する場合、VRMLookAtSmootherを作成し、元のLookAt設定をコピーして適用します。

</answer>


## src/pages/index.tsx

<answer>

### File Description
このファイルは、React/Next.jsを使用したVRMビューアーアプリケーションのメインコンポーネントを定義しています。AIチャット機能、音声合成、YouTubeコメント処理、WebSocket通信など、多岐にわたる機能を統合しています。ユーザーインターフェース、状態管理、外部APIとの連携を担当し、インタラクティブなVRMキャラクターとのコミュニケーションを可能にします。

### Imported Modules
- react (useCallback, useContext, useEffect, useState, useRef)
- @/components/vrmViewer
- @/features/vrmViewer/viewerContext
- @/features/messages/messages
- @/features/messages/speakCharacter
- @/components/messageInputContainer
- @/features/constants/systemPromptConstants
- @/features/constants/koeiroParam
- @/features/chat/aiChatFactory
- @/components/introduction
- @/components/menu
- @/components/meta
- @/lib/i18n
- react-i18next
- @/features/youtube/youtubeComments
- @/utils/buildUrl

### Functions
- Home: メインコンポーネント。アプリケーション全体の状態管理と機能統合を行う。
- incrementChatProcessingCount: チャット処理カウントを増加させる。
- decrementChatProcessingCount: チャット処理カウントを減少させる。
- handleChangeChatLog: チャットログの特定のメッセージを更新する。
- handleChangeCodeLog: コードログの特定のメッセージを更新する。
- handleSpeakAi: AIの発話を処理し、音声を生成・再生する。
- processAIResponse: AIからの応答を処理し、チャットログに追加する。
- preProcessAIResponse: AIレスポンス処理の前処理を行う。
- handleSendChat: ユーザーのチャット入力を処理し、AIレスポンスを生成する。
- fetchAndProcessCommentsCallback: YouTubeコメントを取得し処理する。
- setupWebsocket: WebSocket接続をセットアップする。

</answer>


## src/pages/_document.tsx

<answer>

### File Description
このファイルは、Next.jsアプリケーションのカスタムDocumentコンポーネントを定義しています。主な目的は、アプリケーション全体のHTML構造をカスタマイズし、外部フォントを読み込むことです。特に、Google Fontsからの「M PLUS 2」と「Montserrat」フォントの読み込みを設定しています。

### Imported Modules
- Html (from "next/document")
- Head (from "next/document")
- Main (from "next/document")
- NextScript (from "next/document")

### Functions
- Document: アプリケーションのカスタムDocumentコンポーネントを定義する関数です。HTMLの基本構造を設定し、外部フォントのリンクを追加しています。

</answer>


## src/pages/_app.tsx

<answer>
### File Description
このファイルは Next.js アプリケーションのエントリーポイントとなる `_app.js` コンポーネントを定義しています。グローバルスタイルの適用、多言語対応の初期化、およびユーザーの言語設定の管理を行っています。特に、ローカルストレージを利用して言語設定を保存し、ブラウザの言語設定に基づいてデフォルト言語を設定する機能が実装されています。

### Imported Modules
- "@/styles/globals.css"
- AppProps (from "next/app")
- "@charcoal-ui/icons"
- React, useEffect, useState (from 'react')
- i18n (from '../lib/i18n')

### Functions
- App: このコンポーネントは Next.js アプリケーションのルートコンポーネントとして機能します。ページコンポーネントをラップし、言語設定の初期化とグローバルスタイルの適用を行います。useEffect フックを使用して、コンポーネントのマウント時に言語設定を読み込み、適用します。

</answer>


## src/pages/api/anthropic.ts

<answer>

### File Description
このファイルは、Next.jsのAPIルートハンドラーとして機能し、Anthropic APIを利用してメッセージの処理と応答の生成を行います。ユーザーからのリクエストを受け取り、メッセージをストリーミングまたは一括で処理し、適切な応答を返します。また、メッセージの統合や整理も行っています。

### Imported Modules
- NextApiRequest, NextApiResponse (from "next")
- Anthropic (from "@anthropic-ai/sdk")
- Message (from "@/features/messages/messages")

### Functions
- handler: メインのAPIハンドラー関数。リクエストを処理し、Anthropic APIを使用してメッセージを生成します。ストリーミングモードと非ストリーミングモードの両方をサポートしています。

  この関数内では以下のような処理が行われています：
  - リクエストボディからメッセージ、APIキー、モデル、ストリーミングフラグを取得
  - Anthropicクライアントの初期化
  - システムメッセージとユーザーメッセージの分離
  - ユーザーメッセージの統合（同じロールの連続したメッセージを結合）
  - ストリーミングモードの場合、イベントストリームとしてレスポンスを送信
  - 非ストリーミングモードの場合、一括でメッセージを生成し、JSONレスポンスとして送信

</answer>


## src/pages/api/chat.ts

<answer>

### File Description
このファイルはNext.jsのAPIルートハンドラーを実装しています。OpenAI APIを使用してGPT-3.5-turboモデルとのチャットを行う機能を提供しています。APIキーの検証、OpenAI APIの設定、チャット完了リクエストの送信、および結果の返送を行います。ただし、現在はすべてのコードがコメントアウトされており、実際には機能していません。

### Imported Modules
- Configuration (from "openai")
- OpenAIApi (from "openai")
- NextApiRequest (from "next")
- NextApiResponse (from "next")

### Functions
- handler: Next.jsのAPIルートハンドラー関数です。APIキーの検証、OpenAI APIの設定、チャット完了リクエストの送信、結果の処理を行います。

### Types
- Data: APIレスポンスの型定義で、messageプロパティを持つオブジェクトです。

### Notable Features
- APIキーはリクエストボディまたは環境変数から取得します。
- APIキーが設定されていない場合、400エラーを返します。
- GPT-3.5-turboモデルを使用してチャット完了を生成します。
- 生成されたメッセージ内容またはエラーメッセージをレスポンスとして返します。

</answer>


## src/pages/api/groq.ts

<answer>
### File Description
このファイルは、Next.js APIルートハンドラーとして機能し、Groq AIモデルを使用してチャット完了を生成します。ストリーミングと非ストリーミングの両方のレスポンスをサポートし、システムメッセージとユーザーメッセージを処理して、AIモデルに適切な形式で送信します。また、エラー処理と連続したメッセージの統合機能も含まれています。

### Imported Modules
- NextApiRequest (from "next")
- NextApiResponse (from "next")
- Groq (from "groq-sdk")
- Message (from "@/features/messages/messages")

### Functions
- handler: メインのAPIハンドラー関数。リクエストを処理し、Groq APIを使用してチャット完了を生成します。ストリーミングと非ストリーミングの両方のレスポンスをサポートし、エラー処理も行います。

### Key Features
1. メッセージの統合: 連続した同じロールのメッセージを1つのメッセージに統合します。
2. ストリーミングサポート: クライアントにリアルタイムでレスポンスを送信する機能があります。
3. エラー処理: Groq APIのエラーを適切に処理し、クライアントに返します。
4. 動的なモデル選択: リクエストボディからモデルを指定できます。
5. システムメッセージの処理: システムメッセージを特別に扱い、他のユーザーメッセージと区別します。
</answer>


## src/pages/api/tts.ts

<answer>

### File Description
このファイルは、Next.js APIルートのハンドラー関数を定義しています。音声合成のリクエストを処理し、KoeiromapまたはGoogle TTSを使用して音声を生成します。クライアントからのパラメータに基づいて適切な音声合成方法を選択し、生成された音声データをJSON形式で返します。

### Imported Modules
- koeiromapFreeV1 (from "@/features/koeiromap/koeiromap")
- googleTts (from "@/features/googletts/googletts")
- NextApiRequest, NextApiResponse (from "next")

### Functions
- handler: Next.js APIルートのメインハンドラー関数。HTTPリクエストを受け取り、クライアントからのパラメータに基づいて音声合成を実行し、結果を返します。関数の主な処理は以下の通りです：
  1. リクエストボディからパラメータを抽出
  2. 指定された音声合成タイプ（KoeiromapまたはGoogle TTS）に基づいて適切な関数を呼び出し
  3. 生成された音声データをJSON形式でレスポンスとして返す

</answer>


## src/pages/api/stylebertvits2.ts

<answer>

### File Description
このファイルは、Next.jsのAPIルートハンドラーを定義しています。主な機能は、クライアントからのリクエストを受け取り、外部の音声生成サーバーにリクエストを転送し、生成された音声データをクライアントに返すことです。エラーハンドリングも実装されており、音声生成に失敗した場合はエラーメッセージを返します。

### Imported Modules
- NextApiRequest (from "next")
- NextApiResponse (from "next")

### Functions
- handler: この非同期関数は、APIリクエストを処理します。クライアントから送信されたパラメータを使用して外部の音声生成サーバーにリクエストを送信し、生成された音声データをクライアントに返します。エラーが発生した場合は、適切なエラーレスポンスを返します。

</answer>

