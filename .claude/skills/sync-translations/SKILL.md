---
name: sync-translations
description: 日本語の翻訳ファイル（ja/translation.json）から他の言語ファイルに不足しているキーを同期する。翻訳キーの追加、翻訳ファイルの同期、i18nキーの更新時に使用。
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Task, TodoWrite
user-invocable: true
---

# 翻訳ファイル同期スキル

日本語の翻訳ファイル（`locales/ja/translation.json`）をマスターとして、他の言語ファイルに不足しているキーを同期します。

## 対象言語

以下の14言語ファイルを更新対象とします：

| 言語 | ファイルパス |
|------|-------------|
| 英語 | `locales/en/translation.json` |
| 中国語 | `locales/zh/translation.json` |
| 韓国語 | `locales/ko/translation.json` |
| フランス語 | `locales/fr/translation.json` |
| ドイツ語 | `locales/de/translation.json` |
| スペイン語 | `locales/es/translation.json` |
| イタリア語 | `locales/it/translation.json` |
| ポルトガル語 | `locales/pt/translation.json` |
| ロシア語 | `locales/ru/translation.json` |
| ポーランド語 | `locales/pl/translation.json` |
| タイ語 | `locales/th/translation.json` |
| ベトナム語 | `locales/vi/translation.json` |
| ヒンディー語 | `locales/hi/translation.json` |
| アラビア語 | `locales/ar/translation.json` |

## 実行手順

### 1. 日本語ファイルの読み込み

まず、マスターとなる日本語の翻訳ファイルを読み込みます：

```
locales/ja/translation.json
```

### 2. 不足キーの特定

各言語ファイルを読み込み、日本語ファイルに存在するが対象言語ファイルに存在しないキーを特定します。

**チェック対象：**
- トップレベルのキー（例：`MemorySettings`, `PNGTuber`）
- ネストされたオブジェクト内のキー（例：`PNGTuber.FileInfo`）

### 3. キーの追加

不足しているキーを以下のルールで追加します：

1. **新しいセクション（オブジェクト）の場合**：
   - 日本語ファイルでの位置を参考に、適切な場所に挿入
   - 前後のセクションを確認し、同じ順序で配置

2. **既存セクション内のキーの場合**：
   - そのセクション内の適切な位置に追加

3. **値の設定**：
   - 日本語の値をそのまま使用（翻訳は別プロセスで行う）
   - JSONの構造（ネスト、配列など）は保持

### 4. 進捗管理

TodoWriteツールを使用して、各言語ファイルの更新状況を追跡します。

## 注意事項

- **既存の翻訳は上書きしない**: 既に存在するキーの値は変更しない
- **JSON構造の保持**: インデント（2スペース）、末尾のカンマなどのフォーマットを維持
- **順序の一貫性**: 可能な限り日本語ファイルのキー順序に合わせる

## 使用例

```
/sync-translations
```

これにより、日本語ファイルに追加された新しいキーが全14言語ファイルに同期されます。

## 出力

処理完了後、以下の情報を報告します：

1. 更新した言語ファイルの一覧
2. 各ファイルに追加したキーの数
3. エラーが発生した場合はその詳細
