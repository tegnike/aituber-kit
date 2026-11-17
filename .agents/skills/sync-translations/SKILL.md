---
name: sync-translations
description: 日本語の翻訳ファイル（ja/translation.json）から他の言語ファイルに不足しているキーを同期し、READMEの変更も多言語READMEに反映する。翻訳キーの追加、翻訳ファイルの同期、i18nキーの更新、READMEの多言語同期時に使用。
user-invocable: true
---

# 翻訳ファイル同期スキル

日本語の翻訳ファイル（`locales/ja/translation.json`）をマスターとして、他の言語ファイルに不足しているキーを同期します。

## 対象言語

以下の15言語ファイルを更新対象とします：

| 言語             | ファイルパス                     |
| ---------------- | -------------------------------- |
| 英語             | `locales/en/translation.json`    |
| 中国語（簡体字） | `locales/zh-CN/translation.json` |
| 中国語（繁体字） | `locales/zh-TW/translation.json` |
| 韓国語           | `locales/ko/translation.json`    |
| フランス語       | `locales/fr/translation.json`    |
| ドイツ語         | `locales/de/translation.json`    |
| スペイン語       | `locales/es/translation.json`    |
| イタリア語       | `locales/it/translation.json`    |
| ポルトガル語     | `locales/pt/translation.json`    |
| ロシア語         | `locales/ru/translation.json`    |
| ポーランド語     | `locales/pl/translation.json`    |
| タイ語           | `locales/th/translation.json`    |
| ベトナム語       | `locales/vi/translation.json`    |
| ヒンディー語     | `locales/hi/translation.json`    |
| アラビア語       | `locales/ar/translation.json`    |

## 実行手順

### 1. 変更範囲とUI表示漏れの確認

まず、翻訳JSONだけでなく、画面に出る文言を追加・変更したコードも確認します。

```bash
git status --short
git diff --name-only
rg -n "isJa\\s*\\?|i18n\\.language === 'ja'|i18n\\.language === \"ja\"|Search settings|Easy setup|Start here|Display settings|Detailed .* settings|Optional features|Choose a category|Core settings" src/components src/features src/pages
```

**必ず確認すること：**

- `isJa ? '日本語' : 'English'` のような2言語だけの分岐
- `i18n.language === 'ja' ? ... : ...` のUI文言
- `placeholder`、`aria-label`、`title`、`alt`、ボタン文言、見出し、説明文の直書き
- 新規UI・リデザイン・設定画面の文言が `t('...')` を通らず表示されていないか

**対応ルール：**

- UIに表示される文言は、原則として `t('KeyName')` に置き換える
- まず `locales/ja/translation.json` に日本語キーを追加し、その後このスキルで15言語へ同期する
- ブランド名、モデル名、API名、プロトコル名、画像パス、CSSクラス、テストIDなど翻訳すべきでない文字列は除外する
- 既存UIの大規模なi18nリファクタは、今回の変更箇所・スクリーンショットで見えている範囲・新規追加UIに絞る

### 2. 日本語ファイルの読み込み

まず、マスターとなる日本語の翻訳ファイルを読み込みます：

```text
locales/ja/translation.json
```

### 3. 不足キーの特定

各言語ファイルを1つずつ読み込み、日本語ファイルに存在するが対象言語ファイルに存在しないキーを特定します。

**チェック対象：**

- トップレベルのキー（例：`MemorySettings`, `PNGTuber`）
- ネストされたオブジェクト内のキー（例：`PNGTuber.FileInfo`）

### 4. キーの追加と翻訳

不足しているキーを以下のルールで追加します：

1. **新しいセクション（オブジェクト）の場合**：
   - 日本語ファイルでの位置を参考に、適切な場所に挿入
   - 前後のセクションを確認し、同じ順序で配置

2. **既存セクション内のキーの場合**：
   - そのセクション内の適切な位置に追加

3. **値の設定（重要）**：
   - **必ず対象言語に翻訳して設定する**（日本語のまま入れない）
   - UIラベル、説明文、エラーメッセージ等を各言語の自然な表現に翻訳する
   - `{{count}}`、`{{min}}`、`{{max}}` 等のプレースホルダーはそのまま保持する
   - JSONの構造（ネスト、配列など）は保持する

### 5. 効率的な処理方法

- Node.jsスクリプト（`node -e`）を使って不足キーの検出・マージを行うと効率的
- 1言語ずつ処理し、不足キーの検出 → 翻訳値の設定 → ファイル書き込みの流れで進める
- 最後に全言語の検証を行い、不足キーが0であることを確認する

### 6. UI表示漏れの再検証

翻訳JSON同期後、変更したUIファイルを再検索して、英語・日本語の直書き分岐が残っていないか確認します。

```bash
git diff --name-only | xargs rg -n "isJa\\s*\\?|i18n\\.language === 'ja'|i18n\\.language === \"ja\"|Search settings|Easy setup|Start here|Display settings|Detailed .* settings|Optional features|Choose a category|Core settings"
```

さらに、翻訳キーの不足が0であることを確認します。

```bash
node - <<'NODE'
const fs = require('fs')
const langs = ['en','zh-CN','zh-TW','ko','fr','de','es','it','pt','ru','pl','th','vi','hi','ar']
function walk(o, p = [], out = []) {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    for (const k of Object.keys(o)) walk(o[k], [...p, k], out)
  } else {
    out.push(p.join('.'))
  }
  return out
}
function has(o, path) {
  let current = o
  for (const part of path.split('.')) {
    if (!current || typeof current !== 'object' || !(part in current)) return false
    current = current[part]
  }
  return true
}
let total = 0
let keys = []
try {
  const ja = JSON.parse(fs.readFileSync('locales/ja/translation.json', 'utf8'))
  keys = walk(ja)
} catch (error) {
  console.error(`ja: ${error.message}`)
  process.exit(1)
}
if (keys.length > 0) {
  for (const lang of langs) {
    try {
      const obj = JSON.parse(fs.readFileSync(`locales/${lang}/translation.json`, 'utf8'))
      const missing = keys.filter((key) => !has(obj, key))
      total += missing.length
      console.log(`${lang}: ${missing.length}`)
    } catch (error) {
      process.exitCode = 1
      console.error(`${lang}: ${error.message}`)
    }
  }
}
console.log(`total missing: ${total}`)
NODE
```

可能なら、対象UIのスクリーンショットまたはビルドで、選択中の非日本語言語でも見出し・説明文・ボタンがその言語で表示されることを確認します。

## 注意事項

- **既存の翻訳は上書きしない**: 既に存在するキーの値は変更しない
- **JSON構造の保持**: インデント（2スペース）のフォーマットを維持
- **順序の一貫性**: 可能な限り日本語ファイルのキー順序に合わせる
- **翻訳品質**: UIに表示される文字列なので、各言語の自然な表現を心がける

## 使用例

```text
/sync-translations
```

これにより、日本語ファイルに追加された新しいキーが全15言語ファイルに翻訳付きで同期されます。

## Part 2: 多言語READMEの同期

翻訳ファイルの同期に加えて、日本語の `README.md` の変更を `docs/` 配下の多言語READMEにも反映します。

### 対象ファイル

| 言語             | ファイルパス           |
| ---------------- | ---------------------- |
| 英語             | `docs/README_en.md`    |
| 中国語（簡体字） | `docs/README_zh-CN.md` |
| 中国語（繁体字） | `docs/README_zh-TW.md` |
| 韓国語           | `docs/README_ko.md`    |
| ポーランド語     | `docs/README_pl.md`    |

### 実行手順

1. **差分の確認**: `git diff origin/main -- README.md` で日本語READMEの変更内容を確認する
2. **各言語READMEの読み込み**: 5つの多言語READMEファイルを読み込む
3. **変更の反映**: 日本語READMEの変更箇所を各言語に翻訳して反映する。以下のカテゴリに分類して対応：
   - **テキスト変更**: 既存の説明文の更新 → 各言語の対応箇所を翻訳して更新
   - **セクション追加**: 新しいセクションの追加 → 各言語に翻訳して同じ位置に挿入
   - **リンク追加**: プロモーションサイト等のリンク追加 → リンクテキストを翻訳して追加
   - **HTML変更**: スポンサー一覧等のHTML → そのまま同じHTMLを追加（翻訳不要）

### 注意事項

- **パス参照の違い**: docs配下のREADMEでは画像パスが `../public/` になる（ルートREADMEは `./public/`）
- **言語リンクの違い**: 各READMEのヘッダーにある言語切替リンクは言語ごとに異なるため変更しない
- **コードブロック**: コマンドやコード例は翻訳せずそのまま使用する
- **5言語を並行処理**: Agentツールで5言語を並列に処理すると効率的

## 出力

処理完了後、以下の情報を報告します：

1. 更新した言語ファイルの一覧
2. 各ファイルに追加したキーの数
3. UIコード側で `t('...')` 化した文言・ファイルの一覧
4. 多言語READMEの更新内容の要約
5. 検証結果（不足キー0、JSON parse、UI直書き検索、lint/build等）
6. エラーが発生した場合はその詳細
