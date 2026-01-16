---
description: PRをローカルにチェックアウトしてdevelopブランチをマージする
allowed-tools: Bash, Read, Edit, Glob, Grep, TodoWrite
---

# PR マージワークフロー

指定されたPRをローカルにチェックアウトし、developブランチをマージします。

## 引数

`$ARGUMENTS` - PR番号またはPRのURL（必須）

## 実行手順

### 1. PR情報の取得

```bash
gh pr view <PR番号> --json headRefName,headRepository,headRepositoryOwner,title
```

PR番号はURLから抽出可能（例: `https://github.com/owner/repo/pull/123` → `123`）

### 2. PRブランチのチェックアウト

```bash
gh pr checkout <PR番号>
```

このコマンドでフォークからのPRも自動的に処理される。

### 3. developブランチをマージ

```bash
git merge develop
```

### 4. マージ結果の確認

#### コンフリクトがない場合
- `git status` で状態を確認
- `git log --oneline -3` で最新コミットを確認
- 完了を報告

#### コンフリクトがある場合

1. **コンフリクトファイルの特定**
   ```bash
   git status
   ```
   `both modified:` と表示されるファイルがコンフリクト箇所

2. **コンフリクト内容の確認**
   - 対象ファイルを `Read` ツールで読み込む
   - `<<<<<<<`, `=======`, `>>>>>>>` マーカーを探す
   - HEAD側（現在のブランチ）とdevelop側の変更を比較

3. **コンフリクトの解決**
   - 両方の変更を適切に統合する
   - `Edit` ツールでマーカーを削除し、正しいコードに修正
   - 原則として両方の変更を保持するが、文脈に応じて判断

4. **解決後の処理**
   ```bash
   git add <解決したファイル>
   git commit -m "Merge branch 'develop' into <PR branch name>"
   ```

5. **最終確認**
   ```bash
   git status
   git log --oneline -3
   ```

## コンフリクト解決のガイドライン

- **翻訳ファイル（locales/）**: 両方のキーを保持。重複キーは新しい値を採用
- **package.json / package-lock.json**: 両方の依存関係を保持し、`npm install` で整合性を確認
- **コード変更**: 両方の変更意図を理解し、機能が両立するよう統合
- **設定ファイル**: 両方の設定を含めるか、ユーザーに確認

## 注意事項

- マージ後はリモートにプッシュしない（ユーザーが明示的に指示した場合のみ）
- コンフリクト解決に自信がない場合はユーザーに確認を求める
- 大量のコンフリクトがある場合は、一覧を提示してユーザーと方針を相談する
