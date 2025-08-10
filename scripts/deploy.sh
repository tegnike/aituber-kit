#!/bin/bash

# AITuberKit 本番デプロイメントスクリプト
# 使用方法: ./scripts/deploy.sh [environment] [action]
# 例: ./scripts/deploy.sh production deploy

set -e  # エラー時に停止

# 設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/deploy_$(date +%Y%m%d_%H%M%S).log"

# 環境設定
ENVIRONMENT=${1:-production}
ACTION=${2:-deploy}

# ログディレクトリの作成
mkdir -p "$PROJECT_ROOT/logs"

# ログ関数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
    exit 1
}

# 必須ファイルの確認
check_prerequisites() {
    log "前提条件をチェック中..."
    
    # Docker Composeファイルの確認
    if [[ ! -f "$PROJECT_ROOT/docker-compose.production.yml" ]]; then
        error "docker-compose.production.yml が見つかりません"
    fi
    
    # 環境変数ファイルの確認
    if [[ ! -f "$PROJECT_ROOT/.env.production" ]]; then
        error ".env.production が見つかりません"
    fi
    
    # Dockerfileの確認
    if [[ ! -f "$PROJECT_ROOT/Dockerfile.production" ]]; then
        error "Dockerfile.production が見つかりません"
    fi
    
    # Docker と Docker Compose の確認
    if ! command -v docker &> /dev/null; then
        error "Dockerがインストールされていません"
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Composeがインストールされていません"
    fi
    
    log "前提条件チェック完了"
}

# 環境変数の検証
validate_environment() {
    log "環境変数を検証中..."
    
    local env_file="$PROJECT_ROOT/.env.production"
    local required_vars=(
        "NEXTAUTH_SECRET"
        "NEXT_PUBLIC_APP_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$env_file" || grep -q "^${var}=your-" "$env_file"; then
            error "環境変数 $var が設定されていないか、デフォルト値のままです"
        fi
    done
    
    log "環境変数検証完了"
}

# バックアップ作成
create_backup() {
    log "バックアップを作成中..."
    
    local backup_dir="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # データベースバックアップ（PostgreSQLを使用している場合）
    if docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" ps postgres | grep -q "Up"; then
        log "PostgreSQLデータベースをバックアップ中..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" exec -T postgres \
            pg_dump -U "$POSTGRES_USER" aituber > "$backup_dir/database.sql"
    fi
    
    # アップロードファイルのバックアップ
    if [[ -d "$PROJECT_ROOT/public/images/uploaded" ]]; then
        cp -r "$PROJECT_ROOT/public/images/uploaded" "$backup_dir/uploaded_images"
    fi
    
    # ログファイルのバックアップ
    if [[ -d "$PROJECT_ROOT/logs" ]]; then
        cp -r "$PROJECT_ROOT/logs" "$backup_dir/logs"
    fi
    
    log "バックアップ完了: $backup_dir"
}

# SSL証明書の設定
setup_ssl() {
    log "SSL証明書を設定中..."
    
    # Let's Encrypt証明書の初回取得
    if [[ ! -d "$PROJECT_ROOT/certbot/conf/live" ]]; then
        log "Let's Encrypt証明書を初回取得中..."
        
        # 一時的にnginxを起動してcertbotを実行
        docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" up -d nginx
        
        # ドメイン名を.env.productionから取得
        local domain=$(grep "NEXT_PUBLIC_APP_URL" "$PROJECT_ROOT/.env.production" | cut -d'=' -f2 | sed 's|https://||' | sed 's|/||')
        local email=$(grep "your-email@example.com" "$PROJECT_ROOT/docker-compose.production.yml" || echo "admin@$domain")
        
        if [[ "$domain" == "your-domain.com" ]]; then
            error "ドメイン名を.env.productionで設定してください"
        fi
        
        docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" run --rm certbot \
            certonly --webroot -w /var/www/certbot \
            --email "$email" -d "$domain" --agree-tos --non-interactive
    fi
    
    log "SSL証明書設定完了"
}

# アプリケーションのデプロイ
deploy_application() {
    log "アプリケーションをデプロイ中..."
    
    cd "$PROJECT_ROOT"
    
    # イメージのビルド
    log "Dockerイメージをビルド中..."
    docker-compose -f docker-compose.production.yml build --no-cache
    
    # サービスの起動
    log "サービスを起動中..."
    docker-compose -f docker-compose.production.yml up -d
    
    # ヘルスチェック
    log "ヘルスチェック実行中..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            log "アプリケーションが正常に起動しました"
            break
        fi
        
        attempt=$((attempt + 1))
        log "ヘルスチェック試行 $attempt/$max_attempts..."
        sleep 10
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        error "アプリケーションの起動に失敗しました"
    fi
    
    log "デプロイ完了"
}

# サービス停止
stop_services() {
    log "サービスを停止中..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" down
    log "サービス停止完了"
}

# ログ表示
show_logs() {
    log "ログを表示します..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" logs -f
}

# メイン処理
main() {
    log "AITuberKit デプロイメント開始 (環境: $ENVIRONMENT, アクション: $ACTION)"
    
    case "$ACTION" in
        "deploy")
            check_prerequisites
            validate_environment
            create_backup
            setup_ssl
            deploy_application
            ;;
        "stop")
            stop_services
            ;;
        "logs")
            show_logs
            ;;
        "backup")
            create_backup
            ;;
        *)
            echo "使用方法: $0 [environment] [deploy|stop|logs|backup]"
            exit 1
            ;;
    esac
    
    log "操作完了"
}

# シグナルハンドリング
trap 'error "スクリプトが中断されました"' INT TERM

# メイン処理実行
main "$@"