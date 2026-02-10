# Node.js バージョンの不整合を解消する

## 概要

プロジェクトのドキュメント・package.jsonでは Node.js `24.x` を要件としているが、CI/CDワークフローとDockerfileは Node.js `20` を使用しており、開発環境とCI/本番環境でバージョンが不一致になっている。

## 背景

- **指摘元**: PR #497 CodeRabbitレビュー（docs/README_en.md:124）
- **Next.js 15の公式サポート範囲**: `^18.18.0 || ^19.8.0 || >= 20.0.0`
- Node.js 24.xは2025年10月にLTSとなるバージョンで、Next.js 15で動作する

## 現在の状態

### Node.js 24.x と記載しているファイル

| ファイル               | 行  | 記載内容                              |
| ---------------------- | --- | ------------------------------------- |
| `package.json`         | 118 | `"node": "24.x"`（enginesフィールド） |
| `README.md`            | 136 | `- Node.js: 24.x`                     |
| `CLAUDE.md`            | 37  | `**動作要件**: Node.js 24.x`          |
| `docs/README_en.md`    | 122 | `- Node.js: 24.x`                     |
| `docs/README_zh-CN.md` | 122 | `- Node.js: 24.x`                     |
| `docs/README_zh-TW.md` | 122 | `- Node.js: 24.x`                     |
| `docs/README_ko.md`    | 122 | `- Node.js: 24.x`                     |
| `docs/README_pl.md`    | 122 | `- Node.js: 24.x`                     |

### Node.js 20 を使用しているファイル

| ファイル                                | 行  | 記載内容                                     |
| --------------------------------------- | --- | -------------------------------------------- |
| `.github/workflows/test.yml`            | 22  | `node-version: '20'`                         |
| `.github/workflows/lint-and-format.yml` | 18  | `node-version: '20'`                         |
| `Dockerfile`                            | 1-2 | コメント「Node.js 20を使用」+ `FROM node:20` |

### 付随する不整合

| ファイル                                | 行  | 問題                                                                        |
| --------------------------------------- | --- | --------------------------------------------------------------------------- |
| `.github/workflows/test.yml`            | 20  | `actions/setup-node@v3`（`lint-and-format.yml`は`@v4`で不統一）             |
| `.github/workflows/lint-and-format.yml` | 21  | `npm install`を使用（`test.yml`は`npm ci`で不統一、lockfile差分リスクあり） |

### 未設定

- `.nvmrc` ファイルが存在しない

## 影響

- 開発者がドキュメントに従い Node.js 24.x を使用しても、CI は Node.js 20 でテストされるため、24.x固有の機能を使ったコードがCIでは検出されず本番で問題になる可能性がある
- 逆に Node.js 20 で廃止予定のAPIを使っていてもCIでは警告が出ないが、24.xの開発者環境ではエラーになる可能性がある

## 方針: 案A（CI/Dockerを24.xに統一）を採用

package.jsonのenginesが `24.x` であり、ドキュメント8ファイルが24.xを明記しているため、CI/Dockerをドキュメントに合わせる方針とする。

### 変更一覧

#### 1. CI/CDワークフロー

**`.github/workflows/test.yml`**（3箇所）:

- L20: `actions/setup-node@v3` → `actions/setup-node@v4`（バージョン統一+Node 24対応）
- L22: `node-version: '20'` → `node-version: '24'`
- L23: `cache: 'npm'` → `node-version-file: '.nvmrc'` + `cache: 'npm'`（.nvmrcからバージョン読み込み）

**`.github/workflows/lint-and-format.yml`**（2箇所）:

- L18: `node-version: '20'` → `node-version-file: '.nvmrc'`（.nvmrcからバージョン読み込み）
- L21: `npm install` → `npm ci`（lockfile差分による `git diff --exit-code` 失敗を防止）

#### 2. Dockerfile

**`Dockerfile`**（2箇所）:

- L1: `# ベースイメージとしてNode.js 20を使用` → `# ベースイメージとしてNode.js 24を使用`
- L2: `FROM node:20` → `FROM node:24`

#### 3. バージョン固定ファイル新規作成

**`.nvmrc`**（新規作成）:

```
24
```

CIの `node-version-file: '.nvmrc'` と連動し、バージョンの一元管理を実現する。

### 変更しないファイル（確認済み・変更不要）

以下のファイルは既に `24.x` と記載されており、変更不要:

- `package.json:118` — `"node": "24.x"`
- `README.md:136` — `- Node.js: 24.x`
- `CLAUDE.md:37` — `**動作要件**: Node.js 24.x`
- `docs/README_en.md:122` — `- Node.js: 24.x`
- `docs/README_zh-CN.md:122` — `- Node.js: 24.x`
- `docs/README_zh-TW.md:122` — `- Node.js: 24.x`
- `docs/README_ko.md:122` — `- Node.js: 24.x`
- `docs/README_pl.md:122` — `- Node.js: 24.x`

## 変更ファイルサマリー

| ファイル                                | 操作 | 変更内容                                                |
| --------------------------------------- | ---- | ------------------------------------------------------- |
| `.github/workflows/test.yml`            | 修正 | setup-node@v4化、node-version→24、node-version-file追加 |
| `.github/workflows/lint-and-format.yml` | 修正 | node-version→.nvmrc参照、npm install→npm ci             |
| `Dockerfile`                            | 修正 | コメント+FROM行をnode:24に                              |
| `.nvmrc`                                | 新規 | `24`                                                    |

**変更ファイル数**: 4ファイル（修正3 + 新規1）

## リスクと対策

| リスク                                                | 対策                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Node 24でネイティブモジュール（canvas等）のビルド失敗 | CIで即座に検出される。失敗時はcanvasバージョン更新で対応                              |
| Docker Hub の `node:24` イメージの安定性              | LTSリリース前はCurrentリリースを使用。安定版リリース後に `-slim` 等への切り替えを検討 |
| `npm ci` 化による lint-and-format の挙動変化          | `npm ci` はlockfileに忠実なインストールを行うため、むしろ再現性が向上する             |

## 備考

- npm バージョン（`^11.6.2`）は package.json の engines に明記済み
- 他の言語ドキュメント（ja以外）は翻訳プロセスで管理されるため、本計画では直接変更しない（CLAUDE.mdの開発ガイドラインに従う）
