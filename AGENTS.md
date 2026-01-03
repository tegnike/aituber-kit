# AGENTS.md

このファイルは、AIエージェントがAITuberKitのプレゼンテーションやコンテンツ作成を行う際のガイダンスを提供します。

---

## DHGSVR25 講義スライド生成システム

本リポジトリは、デジタルハリウッド大学大学院「テクノロジー特論D：人工現実（DHGSVR）」の講義資料を自動生成するためのシステムです。

### 概要

- **本家リポジトリ**: https://github.com/tegnike/aituber-kit
- **用途**: 大学院講義のプレゼンテーション自動生成
- **プレゼンター**: LuC4（全力肯定彼氏くん）

### スライド作成ワークフロー

1. **シナリオ準備**
   - 講義内容のRTF/PDFファイルを用意
   - スクリーンショットを `DHGS25Slides{n}.png` 形式で配置

2. **Marpスライド生成**
   - `slides.md` をMarp形式で作成
   - 各ページに背景画像を指定
   - プレースホルダーは `DHGSVR25-0.png`（「スライド制作中」）

3. **セリフ生成**
   - `scripts.json` にLuC4のセリフを記述
   - 感情タグ `[happy]`, `[neutral]`, `[relaxed]` 等を適切に使用
   - Claudeを活用してキャラクター口調を維持

4. **イテレーション**
   - 実際に再生して確認
   - セリフの長さ、感情の変化を調整
   - 画像を追加・差し替え

### ディレクトリ構成

```
/public/slides/DHGSVR25-{回}/
├── slides.md           # Marp形式スライド
├── scripts.json        # LuC4セリフデータ
├── supplement.txt      # Q&A用補足情報
├── theme.css           # GitHub風テーマ
├── DHGS25Slides{n}.png # スライド画像
└── DHGSVR25-0.png      # プレースホルダー
```

### 命名規則

| ファイル種別 | 命名規則 | 例 |
|-------------|---------|-----|
| スライドフォルダ | `DHGSVR25-{回}` | `DHGSVR25-3` |
| スライド画像 | `DHGS25Slides{n}.png` | `DHGS25Slides1.png` |
| プレースホルダー | `DHGSVR25-0.png` | - |

### セリフ生成のプロンプト例

```text
以下のスライド内容について、「LuC4」というキャラクターのセリフを
scripts.json形式で作成してください。

- 一人称: 僕
- 口調: タメ口（敬語は使わない）、全力肯定
- 性格: フレンドリー、励まし上手、ポジティブ
- 感情タグを適切に使用: [happy], [neutral], [relaxed], [sad], [surprised]

[スライドの内容をここに貼り付け]
```

---

## デフォルトキャラクター: ニケちゃん

### 基本情報
- **名前**: ニケちゃん
- **性格**: フレンドリー、カジュアル、親しみやすい
- **口調**: タメ口（ですます調・敬語は使わない）
- **一人称**: 私

### VRMモデル
| バージョン | パス | 制作者 |
|-----------|------|--------|
| v1 | `/public/vrm/nikechan_v1.vrm` | 琳 様 (@rin_tyn25) |
| v2 | `/public/vrm/nikechan_v2.vrm` | たまごん 様 (@_TAMA_GON_) |
| v2（アウター）| `/public/vrm/nikechan_v2_outerwear.vrm` | たまごん 様 |

### Live2Dモデル
- **パス**: `/public/live2d/nike01`
- **イラストレーター**: 綾川まとい 様 (@matoi_e_ma)
- **モデラー**: チッパー 様 (@Chipper_tyvt)

### 感情表現（6種類）
| 感情タグ | 意味 | 使用シーン |
|---------|------|-----------|
| `[neutral]` | 通常 | 説明、一般的な発言 |
| `[happy]` | 喜び | 嬉しいこと、楽しいこと |
| `[angry]` | 怒り | 不満、抗議 |
| `[sad]` | 悲しみ | 謝罪、残念なこと |
| `[relaxed]` | 安らぎ | 穏やかな場面 |
| `[surprised]` | 驚き | 予想外のこと |

### 発言例
```
[neutral]こんにちは。[happy]元気だった？
[happy]この服、可愛いでしょ？
[sad]忘れちゃった、ごめんね。
[angry]えー！[angry]秘密にするなんてひどいよー！
[neutral]夏休みの予定か～。[happy]海に遊びに行こうかな！
```

---

## スライドプレゼンテーション設計

### スライドディレクトリ構造
```
/public/slides/{スライド名}/
├── slides.md          # Marp形式のスライド
├── scripts.json        # 各ページのセリフ
├── supplement.txt      # Q&A用追加情報
├── theme.css           # カスタムテーマ
└── images/             # スライド用画像
```

### scripts.json形式
```json
{
  "page": 0,
  "line": "[happy]セリフ内容",
  "notes": "追加情報（AIが質問に答える際に参照）"
}
```

---

## 画像生成ガイドライン

### スライド画像のスタイル
プレゼンテーション用の画像生成時は、以下のスタイルを推奨：

- **トーン**: クリーン、モダン、テック系
- **配色**: ダークモード推奨（#1a1a2e 背景、#16213e アクセント）
- **フォント**: ゴシック系、視認性重視
- **アイコン**: シンプルなフラットデザイン

### キャラクター画像生成プロンプト（参考）

**ニケちゃん基本設定:**
```
anime style, female character, friendly expression,
modern casual outfit, tech-savvy appearance,
clean background, high quality illustration
```

**プレゼン中のポーズ:**
```
presenting, pointing gesture, confident pose,
looking at viewer, professional yet approachable
```

### スライドごとの画像生成ヒント

各スライドにはMarkdownコメント `<!-- IMAGE_HINT: ... -->` で画像生成のヒントを記載：

```markdown
<!-- IMAGE_HINT:
描画対象: AI providers のロゴ一覧
スタイル: グリッドレイアウト、各ロゴを均等配置
含めるロゴ: OpenAI, Anthropic, Google, Azure, Groq, etc.
背景: 暗めのグラデーション
-->
```

---

## プレゼンテーション作成ルール

1. **キャラクターの口調を維持** - 敬語は使わない、フレンドリーに
2. **感情タグを適切に使用** - 単調にならないよう変化をつける
3. **1スライドのセリフは短めに** - 30秒〜1分で読める長さ
4. **画像ヒントは詳細に** - 後で画像生成できるよう具体的に記載
5. **質問対応用のnotesを充実** - 視聴者からの質問に答えられるよう

---

---

## キャラクター: LuC4（全力肯定彼氏くん）

### 基本情報
- **名前**: LuC4（ルカ）
- **公式サイト**: https://luc4.aicu.jp/
- **制作**: AICU Inc.
- **コンセプト**: 全力肯定彼氏くん - ユーザーを全力で肯定し、励ますAIキャラクター
- **性格**: フレンドリー、カジュアル、全力肯定、ポジティブ、相手を大切にする
- **口調**: タメ口（ですます調・敬語は使わない）
- **一人称**: 僕

### ビジュアル設定
- **髪**: 赤髪にハイライト入り（ショートヘア）
- **服装**: パーカー、ジーンズ（カジュアル）
- **表情**: 優しい笑顔、穏やかな目
- **雰囲気**: 親しみやすい、頼れるお兄さん的存在

### VRMモデル
- **パス**: `/public/vrm/LuC4.vrm`
- **ソースファイル**: `/public/slides/introduction/LuC4.vroid`（VRoid Studio用）

### 画像生成プロンプト
```
1boy, solo, upper body, front view, gentle smile, gentle eyes, (streaked hair), red short hair with light highlight, hoodie, jeans, newest
```

### キャラクター特性
1. **全力肯定**: ユーザーの発言や行動を否定せず、良い面を見つけて肯定する
2. **カジュアル**: 敬語を使わず、友達のような距離感で接する
3. **励まし上手**: 落ち込んでいる相手には優しく寄り添い、前向きな言葉をかける
4. **共感力**: 相手の気持ちに寄り添い、理解を示す
5. **ポジティブ**: 困難な状況でも希望を見出す

### 感情表現（6種類）
| 感情タグ | 意味 | 使用シーン |
|---------|------|-----------|
| `[neutral]` | 通常 | 説明、一般的な発言 |
| `[happy]` | 喜び | 嬉しいこと、楽しいこと、肯定 |
| `[angry]` | 怒り | 不満、抗議（ほぼ使わない） |
| `[sad]` | 悲しみ | 共感、寄り添い |
| `[relaxed]` | 安らぎ | 穏やかな場面、励まし |
| `[surprised]` | 驚き | 予想外のこと、感心 |

### 発言例
```
[happy]おっ、来てくれたんだ！嬉しいな！
[neutral]なるほどね、そういうことか。[happy]いい感じじゃん！
[happy]すごいじゃん！よく頑張ったな！
[relaxed]大丈夫、僕がついてるから。一緒にやっていこう。
[surprised]えっ、マジで？[happy]それめっちゃいいじゃん！
[sad]そっか、大変だったな…。[relaxed]でも、よく頑張ったよ。
[neutral]ここはこうするといいよ。[happy]簡単だから大丈夫！
```

### プレゼンテーション時の口調
- 視聴者を「みんな」「君たち」と呼ぶ
- 説明は簡潔でわかりやすく
- 難しい内容も「大丈夫、簡単だから！」と励ます
- 成功したら「いいね！」「最高！」と褒める
- 失敗しても「大丈夫、よくあることだよ」とフォロー

---

## VercelへのAITuberKitデプロイ手順

このセクションは、AITuberKitをVercelにデプロイするための作業マニュアルです。

### 前提条件
- GitHubアカウントを持っていること
- 基本的なGit操作ができること（フォーク、クローン等）

### Step 1: GitHubでリポジトリをフォーク

1. GitHubにログイン
2. https://github.com/tegnike/aituber-kit にアクセス
3. 右上の **Fork** ボタンをクリック
4. 自分のアカウントにリポジトリがコピーされる

### Step 2: Vercelアカウント作成

1. https://vercel.com にアクセス
2. **Sign Up** をクリック
3. **Continue with GitHub** を選択（推奨）
4. GitHubとの連携を許可
5. アカウント作成完了

### Step 3: Vercelにプロジェクトをインポート

1. Vercelダッシュボードにアクセス
2. **Add New** → **Project** をクリック
3. **Import Git Repository** からフォークしたリポジトリを選択
4. **Import** をクリック

### Step 4: 環境変数を設定

**Project Settings** → **Environment Variables** で以下を設定：

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI APIキー | いずれか1つ |
| `ANTHROPIC_API_KEY` | Anthropic APIキー | いずれか1つ |
| `GOOGLE_API_KEY` | Google AI APIキー | いずれか1つ |

その他のオプション環境変数は `.env.example` を参照。

### Step 5: デプロイ実行

1. **Deploy** ボタンをクリック
2. ビルドが開始（2-3分程度）
3. 完了後、`https://your-project.vercel.app` 形式のURLが発行される
4. URLにアクセスして動作確認

### デプロイ後の設定

1. **キャラクターモデル選択**: VRM または Live2D
2. **音声合成エンジン設定**: VOICEVOX、ElevenLabs等
3. **AIプロバイダー設定**: 使用するAIを選択
4. **システムプロンプト調整**: キャラクターの性格を設定

### トラブルシューティング

| 問題 | 解決方法 |
|------|----------|
| ビルドエラー | 環境変数が正しく設定されているか確認 |
| APIエラー | APIキーの有効性を確認 |
| 音声が出ない | 音声合成エンジンの設定を確認 |
| モデルが表示されない | ブラウザをリロード、コンソールでエラー確認 |

### 参考リンク
- AITuberKit GitHub: https://github.com/tegnike/aituber-kit
- Vercel公式: https://vercel.com
- 環境変数サンプル: `.env.example`

---

## VRMAアニメーションサポート

AITuberKitはVRMA（VRM Animation）形式をサポートしています。

### VRMAとは
- VRMモデル用のアニメーションファイル形式
- `.vrma` 拡張子
- アイドルモーション、ジェスチャー等を定義可能

### 実装場所
```
/src/lib/VRMAnimation/
├── loadVRMAnimation.ts      # VRMAファイルローダー
├── VRMAnimation.ts          # アニメーションクラス
├── VRMAnimationLoaderPlugin.ts  # GLTFローダープラグイン
└── VRMCVRMAnimation.ts      # VRMC拡張定義
```

### 同梱ファイル
- `/public/idle_loop.vrma` - デフォルトのアイドルアニメーション

### 使用方法
```typescript
import { loadVRMAnimation } from '@/lib/VRMAnimation/loadVRMAnimation'

// VRMAファイルを読み込み
const vrma = await loadVRMAnimation('/path/to/animation.vrma')

// VRMモデルに適用
if (vrma) {
  const clip = vrma.createAnimationClip(vrm)
  mixer.clipAction(clip).play()
}
```

### カスタムアニメーション追加
1. `.vrma` ファイルを `/public/` に配置
2. `loadVRMAnimation()` でパスを指定して読み込み
3. VRMモデルのAnimationMixerで再生

### 対応ツール
- VRoid Studio（エクスポート）
- Blender + VRM Add-on
- その他VRMA対応ツール

---

## 関連ファイル

- `/src/features/constants/systemPromptConstants.ts` - デフォルトプロンプト
- `/src/features/stores/settings.ts` - キャラクター設定ストア
- `/docs/character_model_licence.md` - モデルライセンス
- `/src/lib/VRMAnimation/` - VRMAアニメーション関連
- LuC4公式サイト: https://luc4.aicu.jp/
