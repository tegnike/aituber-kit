#!/bin/bash

# AITuberKit サーバー再起動スクリプト
# Server restart script for AITuberKit

set -e

echo "🔄 AITuberKit サーバーを再起動しています..."
echo "🔄 Restarting AITuberKit server..."

# PIDファイルの場所
PID_FILE="./aituber-kit.pid"

# 既存のプロセスを停止
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "🛑 既存のサーバー (PID: $PID) を停止しています..."
        echo "🛑 Stopping existing server (PID: $PID)..."
        kill -TERM $PID
        
        # プロセス終了を待機（最大30秒）
        WAIT_COUNT=0
        while ps -p $PID > /dev/null 2>&1 && [ $WAIT_COUNT -lt 30 ]; do
            echo "⏳ サーバーの停止を待機中... ($((WAIT_COUNT + 1))/30)"
            echo "⏳ Waiting for server to stop... ($((WAIT_COUNT + 1))/30)"
            sleep 1
            WAIT_COUNT=$((WAIT_COUNT + 1))
        done
        
        # まだ動いている場合は強制終了
        if ps -p $PID > /dev/null 2>&1; then
            echo "💥 強制終了しています..."
            echo "💥 Force killing..."
            kill -KILL $PID
            sleep 2
        fi
        
        echo "✅ 既存のサーバーが停止しました"
        echo "✅ Existing server stopped"
    else
        echo "ℹ️  PIDファイルは存在しますが、プロセスは動作していません"
        echo "ℹ️  PID file exists but process is not running"
    fi
    rm -f "$PID_FILE"
else
    echo "ℹ️  実行中のサーバーが見つかりませんでした"
    echo "ℹ️  No running server found"
fi

# 少し待機
sleep 2

# 新しいサーバーを起動
echo "🚀 新しいサーバーを起動しています..."
echo "🚀 Starting new server..."

# バックグラウンドでstart.shを実行
nohup ./start.sh > aituber-kit.log 2>&1 &
NEW_PID=$!

# PIDを保存
echo $NEW_PID > "$PID_FILE"

echo "✅ サーバーが再起動しました (PID: $NEW_PID)"
echo "✅ Server restarted successfully (PID: $NEW_PID)"
echo "📋 ログファイル: aituber-kit.log"
echo "📋 Log file: aituber-kit.log"

# 起動確認（5秒待機してプロセスが生きているかチェック）
sleep 5
if ps -p $NEW_PID > /dev/null 2>&1; then
    echo "🎉 サーバーが正常に起動しました！"
    echo "🎉 Server started successfully!"
    
    # 開発モードの場合はポートを表示
    if [ "${NODE_ENV}" != "production" ]; then
        echo "🌐 http://localhost:3000 でアクセスできます"
        echo "🌐 Access at http://localhost:3000"
    fi
else
    echo "❌ サーバーの起動に失敗しました。ログを確認してください: aituber-kit.log"
    echo "❌ Server failed to start. Check logs: aituber-kit.log"
    rm -f "$PID_FILE"
    exit 1
fi