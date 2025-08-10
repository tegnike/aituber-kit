# AITuberKit Docker本番デプロイメントガイド

## 概要

このドキュメントでは、AITuberKitをDockerを使用してサーバーに本番デプロイする方法と、セキュリティ対策について詳しく説明します。

## 🚀 デプロイ方法

### 1. 前提条件

#### システム要件
- **OS**: Ubuntu 20.04 LTS 以上（推奨）
- **CPU**: 2コア以上
- **メモリ**: 4GB以上（推奨: 8GB）
- **ディスク**: 20GB以上の空き容量
- **ネットワーク**: 安定したインターネット接続

#### 必要なソフトウェア
```bash
# Docker のインストール
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose のインストール
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# その他必要なツール
sudo apt update
sudo apt install -y curl jq bc
```

### 2. プロジェクトの準備

```bash
# リポジトリのクローン
git clone https://github.com/your-repo/aituber-kit.git
cd aituber-kit

# 本番用環境変数ファイルの設定
cp .env.production .env.production.local
vim .env.production.local  # 必要な値を設定
```

### 3. 重要な設定項目

#### `.env.production.local`で必ず変更が必要な項目：

```bash
# セキュリティ
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
POSTGRES_PASSWORD="strong-postgres-password-change-this"
REDIS_PASSWORD="strong-redis-password-change-this"

# ドメイン設定
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXTAUTH_URL="https://your-domain.com"

# API キー（使用するサービスのみ設定）
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
# ... その他必要なAPIキー
```

#### nginx設定の調整：

`nginx/conf.d/aituber.conf`でドメイン名を変更：
```nginx
server_name your-actual-domain.com;
```

### 4. デプロイの実行

```bash
# デプロイスクリプトを実行
./scripts/deploy.sh production deploy
```

### 5. SSL証明書の設定

初回デプロイ時、Let's Encryptの証明書が自動で取得されます。手動で実行する場合：

```bash
# 証明書の取得
docker-compose -f docker-compose.production.yml run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  --email your-email@example.com -d your-domain.com --agree-tos
```

## 🔒 セキュリティ対策

### 1. アプリケーションレベルのセキュリティ

#### Content Security Policy (CSP)
- XSSアタックを防ぐためのCSPヘッダーを設定済み
- 信頼できるソースからのみリソースの読み込みを許可

#### Rate Limiting（レート制限）
- API呼び出しの頻度制限を実装
- DDoS攻撃の緩和

#### CORS設定
- 適切なCROS（Cross-Origin Resource Sharing）ポリシーを設定
- 不正なドメインからのアクセスを制限

### 2. インフラレベルのセキュリティ

#### SSL/TLS暗号化
- Let's Encryptを使用した無料SSL証明書
- TLS 1.2以上のみをサポート
- HSTS（HTTP Strict Transport Security）の強制

#### ファイアウォール設定
```bash
# UFWファイアウォールの設定例
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

#### Docker セキュリティ
- 非rootユーザーでのコンテナ実行
- 最小権限の原則に基づくファイルアクセス制限
- 定期的なセキュリティスキャン

### 3. 認証・認可

#### API キーの管理
- 環境変数での秘密情報管理
- APIキーの定期的なローテーション
- 最小権限での各APIの設定

#### セッション管理
- 安全なセッショントークンの生成
- セッションの適切な無効化

### 4. ログ・監視

#### セキュリティログ
- アクセスログの記録と分析
- 異常なアクセスパターンの検出
- ログの改ざん防止

#### 監視アラート
```bash
# システム監視の実行
./scripts/monitoring.sh health
```

## ⚠️ セキュリティリスクと対策

### 高リスク項目

#### 1. APIキーの露出
**リスク**: APIキーが公開リポジトリや設定ファイルに含まれる
**対策**:
- 環境変数での管理
- `.env.production.local`をGitignoreに追加
- シークレット管理システムの使用（AWS Secrets Manager等）

#### 2. 不正なファイルアップロード
**リスク**: 悪意のあるファイルのアップロード
**対策**:
- ファイルタイプの厳格な制限
- アップロードサイズの制限（20MB）
- ウイルススキャンの実装

#### 3. SQL インジェクション
**リスク**: データベースへの不正アクセス
**対策**:
- パラメータ化クエリの使用
- 入力データの検証・サニタイズ
- 最小権限でのデータベースアクセス

### 中リスク項目

#### 4. セッションハイジャック
**リスク**: セッショントークンの盗用
**対策**:
- HTTPS通信の強制
- セッショントークンの定期的な更新
- セキュアなCookie設定

#### 5. ブルートフォース攻撃
**リスク**: 認証情報の総当たり攻撃
**対策**:
- レート制限の実装
- アカウントロックアウト機能
- 強力なパスワードポリシー

### 低リスク項目

#### 6. 情報漏洩
**リスク**: システム情報の不適切な開示
**対策**:
- エラーメッセージの適切な処理
- デバッグ情報の本番環境での無効化
- 不要なHTTPヘッダーの除去

## 📊 監視・メンテナンス

### 定期メンテナンス

#### 自動実行の設定
```bash
# cronでの定期実行設定
sudo crontab -e

# 毎日午前3時にメンテナンス実行
0 3 * * * /path/to/aituber-kit/scripts/monitoring.sh maintenance

# 毎時間のヘルスチェック
0 * * * * /path/to/aituber-kit/scripts/monitoring.sh health
```

#### SSL証明書の自動更新
```bash
# 毎月1日にSSL証明書更新
0 0 1 * * /path/to/aituber-kit/scripts/monitoring.sh ssl
```

### ログ分析

#### アクセスログの監視
```bash
# 異常なアクセスパターンの検出
tail -f logs/nginx-access.log | grep -E "(404|500|403)"

# IPアドレス別のアクセス統計
awk '{print $1}' logs/nginx-access.log | sort | uniq -c | sort -nr | head -10
```

### バックアップ

#### 自動バックアップの設定
```bash
# 毎日午前2時にバックアップ実行
0 2 * * * /path/to/aituber-kit/scripts/monitoring.sh backup
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. アプリケーションが起動しない
```bash
# ログの確認
docker-compose -f docker-compose.production.yml logs app

# 一般的な解決方法
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --force-recreate
```

#### 2. SSL証明書のエラー
```bash
# 証明書の確認
./scripts/monitoring.sh ssl

# 証明書の手動更新
docker-compose -f docker-compose.production.yml run --rm certbot renew
```

#### 3. データベース接続エラー
```bash
# PostgreSQL の状態確認
docker-compose -f docker-compose.production.yml ps postgres

# データベースの再起動
docker-compose -f docker-compose.production.yml restart postgres
```

## 🔄 アップデート手順

### アプリケーションの更新

```bash
# 1. 現在の状態をバックアップ
./scripts/monitoring.sh backup

# 2. 最新コードの取得
git pull origin main

# 3. 新しいイメージのビルドとデプロイ
./scripts/deploy.sh production deploy

# 4. ヘルスチェック
./scripts/monitoring.sh health
```

## 📝 チェックリスト

### デプロイ前チェック

- [ ] 環境変数の設定完了
- [ ] ドメイン名の設定完了
- [ ] SSL証明書の設定準備
- [ ] ファイアウォール設定完了
- [ ] バックアップ戦略の確立

### セキュリティチェック

- [ ] APIキーの適切な管理
- [ ] HTTPS通信の強制
- [ ] レート制限の有効化
- [ ] ファイルアップロード制限の設定
- [ ] ログ監視の設定

### 運用チェック

- [ ] 自動バックアップの設定
- [ ] 監視アラートの設定
- [ ] SSL証明書自動更新の設定
- [ ] ログローテーションの設定

## 🆘 サポート・連絡先

技術的な問題やセキュリティに関する懸念がある場合は、以下のリソースをご利用ください：

- **GitHub Issues**: [プロジェクトのIssues](https://github.com/your-repo/aituber-kit/issues)
- **セキュリティ報告**: security@your-domain.com
- **ドキュメント**: [公式ドキュメント](https://docs.your-domain.com)

---

**注意**: このドキュメントは一般的なガイドラインです。実際の本番環境では、組織のセキュリティポリシーやコンプライアンス要件に従って適切にカスタマイズしてください。