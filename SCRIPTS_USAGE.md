# サーバー管理スクリプト使用方法 / Server Management Scripts Usage

AITuberKitのサーバー管理を簡単にするためのシェルスクリプト群です。

## スクリプト一覧 / Scripts List

### 1. `start.sh` - サーバー起動

サーバーを起動します。初回起動時は依存関係の自動インストールも行います。

```bash
# 開発モードで起動（デフォルト）
./start.sh

# 本番モードで起動
NODE_ENV=production ./start.sh
```

**機能 / Features:**

- Node.jsバージョンチェック（v20.0.0以上必要）
- 依存関係の自動インストール（`node_modules`がない場合）
- 開発モード: `npm run dev`を実行
- 本番モード: `npm run build` → `npm start`を実行

### 2. `restart.sh` - サーバー再起動

実行中のサーバーを停止してから新しいサーバーを起動します。

```bash
./restart.sh
```

**機能 / Features:**

- 既存プロセスの検出・停止（グレースフル停止 → 必要に応じて強制終了）
- PIDファイルによるプロセス管理
- バックグラウンドでの新サーバー起動
- 起動確認とログ出力

### 3. `stop.sh` - サーバー停止

実行中のサーバーを停止します。

```bash
./stop.sh
```

**機能 / Features:**

- PIDファイルベースの停止処理
- グレースフル停止（30秒タイムアウト）
- 必要に応じた強制終了
- Next.jsプロセスの検出・停止オプション

### 4. `run-daemon.sh` - デーモン管理（推奨）

より高度なプロセス管理機能を提供します。

```bash
# デーモンとして起動
./run-daemon.sh start

# ステータス確認
./run-daemon.sh status

# ログのリアルタイム表示
./run-daemon.sh logs

# 再起動
./run-daemon.sh restart

# 停止
./run-daemon.sh stop
```

**機能 / Features:**

- 完全なデーモンモード実行
- 詳細なステータス表示（PID、メモリ、CPU使用量）
- 分離されたログファイル（標準出力・エラー出力）
- 起動確認とヘルスチェック
- リソース使用量表示

## ファイル管理 / File Management

### 生成されるファイル / Generated Files

- `aituber-kit.pid`: プロセスIDを保存するファイル
- `aituber-kit.log`: サーバーのログファイル（restart.sh使用時）

### ファイルのクリーンアップ / File Cleanup

```bash
# ログファイルとPIDファイルを手動削除
rm -f aituber-kit.log aituber-kit.pid
```

## 使用例 / Usage Examples

### 基本的な使用パターン / Basic Usage Pattern

```bash
# 1. 初回起動
./start.sh

# 2. 設定変更後の再起動
./restart.sh

# 3. サーバー停止
./stop.sh
```

### デーモンモード（推奨）/ Daemon Mode (Recommended)

```bash
# 1. デーモンとして起動
./run-daemon.sh start

# 2. ステータス確認
./run-daemon.sh status

# 3. ログ監視
./run-daemon.sh logs

# 4. 停止
./run-daemon.sh stop
```

### npmスクリプト経由での実行 / Via npm Scripts

```bash
# 通常のスクリプト
npm run server:start
npm run server:restart
npm run server:stop

# デーモンモード
npm run daemon:start
npm run daemon:status
npm run daemon:logs
npm run daemon:restart
npm run daemon:stop
```

### 本番環境での使用 / Production Usage

```bash
# 本番モードで起動
NODE_ENV=production ./start.sh

# 本番環境での再起動
NODE_ENV=production ./restart.sh
```

### トラブルシューティング / Troubleshooting

```bash
# ログの確認
tail -f aituber-kit.log

# プロセスの手動確認
ps aux | grep next

# ポート使用状況の確認
lsof -i :3000

# 強制的に全てのNext.jsプロセスを停止
pkill -f "next"
```

## 環境要件 / Requirements

- **Node.js**: v20.0.0以上 / v20.0.0 or higher
- **npm**: v10.0.0以上 / v10.0.0 or higher
- **OS**: Linux, macOS, Windows (WSL)

## 注意事項 / Notes

1. **権限**: スクリプトに実行権限が必要です

   ```bash
   chmod +x *.sh
   ```

2. **ポート**: デフォルトでポート3000を使用します

3. **ログ**: `restart.sh`を使用した場合のみログファイルが生成されます

4. **PID管理**: 複数のサーバーを同時に実行する場合は、それぞれ異なるディレクトリで実行してください

5. **本番環境**: 本番環境では適切なプロセスマネージャー（PM2、systemd等）の使用を推奨します

## トラブルシューティング / Troubleshooting

### よくある問題 / Common Issues

1. **"Permission denied" エラー**

   ```bash
   chmod +x start.sh restart.sh stop.sh
   ```

2. **"Port already in use" エラー**

   ```bash
   ./stop.sh  # 既存プロセスを停止
   # または
   lsof -ti:3000 | xargs kill
   ```

3. **Node.jsバージョンエラー**

   ```bash
   # Node Version Manager使用の場合
   nvm use 20
   # またはnodeのアップデート
   ```

4. **プロセスが停止しない**
   ```bash
   # 手動での強制停止
   pkill -9 -f "next"
   rm -f aituber-kit.pid
   ```

## 拡張 / Extensions

これらのスクリプトは基本的な機能を提供しています。より高度な機能が必要な場合は：

- **PM2**: プロセスマネージャーとしてPM2を使用
- **systemd**: Linuxシステムサービスとして設定
- **Docker**: コンテナ化での実行
- **CI/CD**: 自動デプロイメントとの連携

詳細については、AITuberKitの[ドキュメント](https://docs.aituberkit.com/)を参照してください。
