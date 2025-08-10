#!/bin/bash

# AITuberKit 監視・メンテナンススクリプト
# 使用方法: ./scripts/monitoring.sh [action]
# 例: ./scripts/monitoring.sh health

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ACTION=${1:-health}

# システムの健全性チェック
check_system_health() {
    echo "=== システム健全性チェック ==="
    
    # Docker サービス状態
    echo "Docker サービス状態:"
    docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" ps
    echo ""
    
    # リソース使用状況
    echo "リソース使用状況:"
    echo "CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
    echo "メモリ使用率: $(free | grep Mem | awk '{printf("%.2f%%", $3/$2 * 100.0)}')"
    echo "ディスク使用率: $(df -h / | awk 'NR==2 {print $5}')"
    echo ""
    
    # アプリケーション健全性
    echo "アプリケーション健全性:"
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        echo "✅ アプリケーション: 正常"
        curl -s http://localhost:3000/api/health | jq .
    else
        echo "❌ アプリケーション: 異常"
    fi
    echo ""
    
    # SSL証明書の有効期限
    echo "SSL証明書の有効期限:"
    if [[ -f "$PROJECT_ROOT/certbot/conf/live/*/fullchain.pem" ]]; then
        cert_path=$(find "$PROJECT_ROOT/certbot/conf/live" -name "fullchain.pem" | head -1)
        expiry_date=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
        echo "証明書期限: $expiry_date"
        
        # 30日以内に期限切れの場合は警告
        expiry_epoch=$(date -d "$expiry_date" +%s)
        current_epoch=$(date +%s)
        days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [[ $days_left -lt 30 ]]; then
            echo "⚠️  警告: SSL証明書が ${days_left} 日後に期限切れです"
        else
            echo "✅ SSL証明書: 正常 (${days_left}日間有効)"
        fi
    else
        echo "❌ SSL証明書が見つかりません"
    fi
}

# ログのローテーション
rotate_logs() {
    echo "=== ログローテーション実行 ==="
    
    local log_dir="$PROJECT_ROOT/logs"
    local max_size="100M"
    local max_age=30  # 日数
    
    if [[ -d "$log_dir" ]]; then
        echo "30日以上古いログファイルを削除..."
        find "$log_dir" -name "*.log" -mtime +$max_age -delete
        
        echo "サイズが大きいログファイルを圧縮..."
        find "$log_dir" -name "*.log" -size +$max_size -exec gzip {} \;
        
        echo "ログローテーション完了"
    fi
}

# データベースの最適化（PostgreSQL使用時）
optimize_database() {
    echo "=== データベース最適化 ==="
    
    if docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" ps postgres | grep -q "Up"; then
        echo "PostgreSQL統計情報を更新中..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" exec -T postgres \
            psql -U "$POSTGRES_USER" -d aituber -c "ANALYZE;"
        
        echo "不要な領域をクリーンアップ中..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" exec -T postgres \
            psql -U "$POSTGRES_USER" -d aituber -c "VACUUM;"
        
        echo "データベース最適化完了"
    else
        echo "PostgreSQLサービスが実行されていません"
    fi
}

# セキュリティ更新の確認
check_security_updates() {
    echo "=== セキュリティ更新確認 ==="
    
    # Docker イメージの更新確認
    echo "Dockerイメージの更新を確認中..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" pull --quiet
    
    # npm の脆弱性スキャン
    echo "npm パッケージの脆弱性をスキャン中..."
    cd "$PROJECT_ROOT"
    if npm audit --audit-level=high --production; then
        echo "✅ 高リスクの脆弱性は見つかりませんでした"
    else
        echo "⚠️  高リスクの脆弱性が見つかりました。npm audit fix を実行することを検討してください"
    fi
}

# パフォーマンス監視
monitor_performance() {
    echo "=== パフォーマンス監視 ==="
    
    # CPU使用率の監視
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        echo "⚠️  CPU使用率が高いです: ${cpu_usage}%"
    else
        echo "✅ CPU使用率: ${cpu_usage}%"
    fi
    
    # メモリ使用率の監視
    memory_usage=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
    if (( $(echo "$memory_usage > 85" | bc -l) )); then
        echo "⚠️  メモリ使用率が高いです: ${memory_usage}%"
    else
        echo "✅ メモリ使用率: ${memory_usage}%"
    fi
    
    # ディスク使用率の監視
    disk_usage=$(df / | awk 'NR==2 {print $5}' | cut -d'%' -f1)
    if [[ $disk_usage -gt 85 ]]; then
        echo "⚠️  ディスク使用率が高いです: ${disk_usage}%"
    else
        echo "✅ ディスク使用率: ${disk_usage}%"
    fi
    
    # レスポンス時間の測定
    echo "アプリケーションのレスポンス時間を測定中..."
    response_time=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3000/api/health)
    if (( $(echo "$response_time > 5" | bc -l) )); then
        echo "⚠️  レスポンス時間が遅いです: ${response_time}秒"
    else
        echo "✅ レスポンス時間: ${response_time}秒"
    fi
}

# 自動バックアップ
auto_backup() {
    echo "=== 自動バックアップ実行 ==="
    
    local backup_dir="$PROJECT_ROOT/backups/auto_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # データベースバックアップ
    if docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" ps postgres | grep -q "Up"; then
        echo "データベースをバックアップ中..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" exec -T postgres \
            pg_dump -U "$POSTGRES_USER" aituber > "$backup_dir/database.sql"
    fi
    
    # 設定ファイルのバックアップ
    echo "設定ファイルをバックアップ中..."
    cp "$PROJECT_ROOT/.env.production" "$backup_dir/"
    cp -r "$PROJECT_ROOT/nginx" "$backup_dir/"
    
    # アップロードファイルのバックアップ
    if [[ -d "$PROJECT_ROOT/public/images/uploaded" ]]; then
        echo "アップロードファイルをバックアップ中..."
        cp -r "$PROJECT_ROOT/public/images/uploaded" "$backup_dir/"
    fi
    
    # 古いバックアップの削除（7日以上前）
    find "$PROJECT_ROOT/backups" -type d -name "auto_*" -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    
    echo "バックアップ完了: $backup_dir"
}

# SSL証明書の更新
renew_ssl() {
    echo "=== SSL証明書更新 ==="
    
    echo "Let's Encrypt証明書を更新中..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" exec -T certbot \
        certbot renew --webroot -w /var/www/certbot --quiet
    
    # nginxに設定再読み込みを指示
    docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" exec nginx \
        nginx -s reload
    
    echo "SSL証明書更新完了"
}

# 全体メンテナンス
full_maintenance() {
    echo "=== 全体メンテナンス実行 ==="
    
    check_system_health
    echo ""
    
    rotate_logs
    echo ""
    
    optimize_database
    echo ""
    
    check_security_updates
    echo ""
    
    auto_backup
    echo ""
    
    renew_ssl
    echo ""
    
    echo "全体メンテナンス完了"
}

# メイン処理
case "$ACTION" in
    "health")
        check_system_health
        ;;
    "logs")
        rotate_logs
        ;;
    "db")
        optimize_database
        ;;
    "security")
        check_security_updates
        ;;
    "performance")
        monitor_performance
        ;;
    "backup")
        auto_backup
        ;;
    "ssl")
        renew_ssl
        ;;
    "maintenance")
        full_maintenance
        ;;
    *)
        echo "使用方法: $0 [health|logs|db|security|performance|backup|ssl|maintenance]"
        exit 1
        ;;
esac