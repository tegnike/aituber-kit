---
name: develop-main-release
description: aituber-kitでdevelop=>mainのPRをマージし、新しいマイナーバージョンをリリースする。フッターのver表記更新、PRチェックとCodeRabbit reviewThreads確認、PRマージ、ローカルmain最新化、軽量タグ作成・push、CodeRabbit文を除外したGitHub Release発行時に使用。
user-invocable: true
---

# develop => main マージ&リリーススキル

aituber-kitで `develop => main` PRをマージし、新しいマイナーバージョンのタグとGitHub Releaseを発行する。

## 基本方針

- 次のマイナーバージョンは、最新リリースタグ `vX.Y.Z` から `vX.(Y+1).0` とする。
- フッターの表示バージョンはPRマージ前に `develop` 側へコミットしてpushする。
- タグは軽量タグで作成する。
- GitHub Release本文は `develop => main` PR本文を転記するが、CodeRabbit自動生成ブロックとCodeRabbit由来の文言は含めない。
- main checkoutに未追跡のネストrepo等がある場合、checkoutせず `git branch -f main origin/main` で参照だけ更新する。
- 最終報告では、更新内容を関連するテーマごとにまとめ、詳細は入れ子のリストで簡潔に提示する。
- Discord共有用の文面はコードブロックに入れ、リリースURLはMarkdownリンクにせず裸URLで末尾に置く。
- 次の形式にする。

```markdown
## vX.Y.0

- XXXを改善
  - XXXに対応
  - XXXを修正
- XXXを追加
  https://github.com/tegnike/aituber-kit/releases/tag/vX.Y.0
```

## 手順

1. 対象PRと最新バージョンを確認する。

```bash
gh pr view <pr-number> --json number,url,title,state,baseRefName,headRefName,mergeStateStatus,body,statusCheckRollup
gh release list --limit 10
git ls-remote origin 'refs/tags/v*'
```

2. 次のマイナーバージョンを決める。

例: 最新が `v2.46.0` なら次は `v2.47.0`。

タグが既にある場合は止める。明示指示なしに既存タグを上書きしない。

```bash
git ls-remote --exit-code origin refs/tags/vX.Y.0
```

3. フッターの表示バージョンを更新する。

対象ファイル:

```text
src/components/settings/index.tsx
```

検索例:

```bash
rg -n "powered by ChatVRM from Pixiv / ver\\." src/components/settings/index.tsx
```

変更後、差分を確認してコミット・pushする。

```bash
git diff -- src/components/settings/index.tsx
git diff --check
git add src/components/settings/index.tsx
git commit -m "Bump footer version to X.Y.0"
git push origin HEAD:develop
```

4. PRチェックとレビュー状態を確認する。

```bash
gh pr checks <pr-number> --watch=false
gh pr view <pr-number> --json mergeStateStatus,statusCheckRollup,latestReviews
```

CodeRabbitはフラットなレビュー本文だけで判断しない。GraphQL `reviewThreads` で `isResolved == false` かつ `isOutdated == false` の現行スレッドが0件であることを確認する。

5. PRをマージする。

すべての必須チェックが通り、`mergeStateStatus` が `CLEAN` で、現行review threadが0件ならマージする。

```bash
gh pr merge <pr-number> --merge
gh pr view <pr-number> --json state,mergedAt,mergeCommit,url
```

6. ローカルmainを最新にする。

```bash
git fetch origin main develop --prune
git branch -f main origin/main
git rev-parse main origin/main
```

`main` が別worktreeでcheckout中の場合は、そのworktreeを確認してfast-forwardする。未追跡・未コミット変更を巻き込まない。

7. タグを作成してpushする。

マージcommitとフッター表示を確認してから軽量タグを付ける。

```bash
git show main:src/components/settings/index.tsx | rg -n "ver\\. X.Y.0"
git tag vX.Y.0 main
git push origin vX.Y.0
```

8. Release本文を作る。

PR本文を取得し、CodeRabbit自動生成ブロック以降を削除する。

削除マーカー:

```text
<!-- This is an auto-generated comment: release notes by coderabbit.ai -->
```

Release本文にはCodeRabbitコメント本文、CodeRabbit自動サマリー、`CodeRabbitの指摘` のようなボット由来表現を入れない。必要なら具体的な修正内容だけに言い換える。

9. GitHub Releaseを作成する。

```bash
gh release create vX.Y.0 --title vX.Y.0 --notes-file /tmp/aituber-vX.Y.0-release-notes.md --target <main-sha>
```

10. 最終確認を行う。

```bash
gh release view vX.Y.0 --json tagName,name,url,targetCommitish,isDraft,isPrerelease,body
git ls-remote origin refs/heads/main refs/tags/vX.Y.0
git rev-parse main origin/main vX.Y.0
```

`origin/main`、ローカル `main`、`vX.Y.0` が同じSHAを指していることを確認する。
