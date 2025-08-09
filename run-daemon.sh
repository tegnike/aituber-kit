#!/bin/bash

# AITuberKit デーモン実行スクリプト
# Daemon execution script for AITuberKit

set -e

# 設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/aituber-kit.pid"
LOG_FILE="$SCRIPT_DIR/aituber-kit.log"
ERROR_LOG_FILE="$SCRIPT_DIR/aituber-kit-error.log"

# 使用方法を表示
show_usage() {
    echo "使用方法 / Usage:"
    echo "  $0 {start|stop|restart|status|logs}"
    echo ""
    echo "コマンド / Commands:"
    echo "  start   - サーバーをデーモンとして起動"
    echo "  stop    - デーモンを停止"
    echo "  restart - デーモンを再起動"
    echo "  status  - デーモンの状態を確認"
    echo "  logs    - ログをリアルタイムで表示"
    echo ""
    echo "環境変数 / Environment Variables:"
    echo "  NODE_ENV=production  # 本番モード"
    echo "  PORT=3000           # ポート番号（デフォルト: 3000）"
}

# PIDファイルからPIDを取得
get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    else
        echo ""
    fi
}

# プロセスが実行中かチェック
is_running() {
    local pid=$(get_pid)
    if [ -n "$pid" ] && ps -p "$pid" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# ステータス表示
show_status() {
    if is_running; then
        local pid=$(get_pid)
        echo "✅ AITuberKit は実行中です (PID: $pid)"
        echo "✅ AITuberKit is running (PID: $pid)"
        
        # メモリ使用量とCPU使用量を表示
        if command -v ps &> /dev/null; then
            local mem_cpu=$(ps -p "$pid" -o pid,ppid,%mem,%cpu,cmd --no-headers 2>/dev/null || echo "N/A")
            echo "📊 リソース使用量: $mem_cpu"
            echo "📊 Resource usage: $mem_cpu"
        fi
        
        # ポート使用状況
        if command -v lsof &> /dev/null; then
            local port_info=$(lsof -p "$pid" -i 2>/dev/null | grep LISTEN || echo "ポート情報取得失敗")
            echo "🌐 ポート情報: $port_info"
            echo "🌐 Port info: $port_info"
        fi
        
        return 0
    else
        echo "❌ AITuberKit は停止しています"
        echo "❌ AITuberKit is not running"
        return 1
    fi
}

# デーモン開始
start_daemon() {
    if is_running; then
        echo "⚠️  AITuberKit は既に実行中です"
        echo "⚠️  AITuberKit is already running"
        show_status
        return 1
    fi

    echo "🚀 AITuberKit をデーモンとして起動しています..."
    echo "🚀 Starting AITuberKit as daemon..."

    # ログファイルを初期化
    : > "$LOG_FILE"
    : > "$ERROR_LOG_FILE"

    # バックグラウンドでサーバーを起動
    cd "$SCRIPT_DIR"
    
    # 環境に応じてコマンドを選択
    if [ "${NODE_ENV}" = "production" ]; then
        echo "🏭 本番モードで起動します..."
        echo "🏭 Starting in production mode..."
        
        # ビルドが必要かチェック
        if [ ! -d ".next" ] || [ "package.json" -nt ".next" ]; then
            echo "🔨 ビルドを実行しています..."
            echo "🔨 Running build..."
            npm run build >> "$LOG_FILE" 2>> "$ERROR_LOG_FILE"
        fi
        
        nohup npm start >> "$LOG_FILE" 2>> "$ERROR_LOG_FILE" &
    else
        echo "🔧 開発モードで起動します..."
        echo "🔧 Starting in development mode..."
        nohup npm run dev >> "$LOG_FILE" 2>> "$ERROR_LOG_FILE" &
    fi

    local pid=$!
    echo $pid > "$PID_FILE"

    # 起動確認（10秒待機）
    sleep 3
    if is_running; then
        echo "✅ AITuberKit が正常に起動しました (PID: $pid)"
        echo "✅ AITuberKit started successfully (PID: $pid)"
        echo "📋 ログファイル: $LOG_FILE"
        echo "📋 Log file: $LOG_FILE"
        echo "📋 エラーログ: $ERROR_LOG_FILE"
        echo "📋 Error log: $ERROR_LOG_FILE"
        
        # ポート情報を表示
        local port=${PORT:-3000}
        if [ "${NODE_ENV}" != "production" ]; then
            echo "🌐 http://localhost:$port でアクセスできます"
            echo "🌐 Access at http://localhost:$port"
        fi
        
        return 0
    else
        echo "❌ AITuberKit の起動に失敗しました"
        echo "❌ Failed to start AITuberKit"
        echo "📋 エラーログを確認してください: $ERROR_LOG_FILE"
        echo "📋 Check error log: $ERROR_LOG_FILE"
        rm -f "$PID_FILE"
        return 1
    fi
}

# デーモン停止
stop_daemon() {
    if ! is_running; then
        echo "ℹ️  AITuberKit は既に停止しています"
        echo "ℹ️  AITuberKit is already stopped"
        rm -f "$PID_FILE"
        return 0
    fi

    local pid=$(get_pid)
    echo "🛑 AITuberKit を停止しています (PID: $pid)..."
    echo "🛑 Stopping AITuberKit (PID: $pid)..."

    # グレースフル停止
    kill -TERM "$pid" 2>/dev/null || true

    # 停止を待機（最大30秒）
    local count=0
    while is_running && [ $count -lt 30 ]; do
        echo "⏳ 停止処理を待機中... ($((count + 1))/30)"
        echo "⏳ Waiting for graceful shutdown... ($((count + 1))/30)"
        sleep 1
        count=$((count + 1))
    done

    # まだ実行中なら強制終了
    if is_running; then
        echo "💥 グレースフル停止がタイムアウトしました。強制終了します..."
        echo "💥 Graceful shutdown timed out. Force killing..."
        kill -KILL "$pid" 2>/dev/null || true
        sleep 2
    fi

    # 最終確認
    if is_running; then
        echo "❌ プロセスの停止に失敗しました"
        echo "❌ Failed to stop process"
        return 1
    else
        echo "✅ AITuberKit が正常に停止しました"
        echo "✅ AITuberKit stopped successfully"
        rm -f "$PID_FILE"
        return 0
    fi
}

# ログ表示
show_logs() {
    if [ ! -f "$LOG_FILE" ]; then
        echo "❌ ログファイルが見つかりません: $LOG_FILE"
        echo "❌ Log file not found: $LOG_FILE"
        return 1
    fi

    echo "📋 AITuberKit ログを表示しています..."
    echo "📋 Showing AITuberKit logs..."
    echo "📋 Ctrl+C で終了します / Press Ctrl+C to exit"
    echo "----------------------------------------"
    
    tail -f "$LOG_FILE"
}

# メイン処理
case "${1:-}" in
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    restart)
        echo "🔄 AITuberKit を再起動しています..."
        echo "🔄 Restarting AITuberKit..."
        stop_daemon
        sleep 2
        start_daemon
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    *)
        show_usage
        exit 1
        ;;
esac