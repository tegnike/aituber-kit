#!/bin/bash

# AITuberKit サーバー停止スクリプト
# Server stop script for AITuberKit

set -e

echo "🛑 AITuberKit サーバーを停止しています..."
echo "🛑 Stopping AITuberKit server..."

# PIDファイルの場所
PID_FILE="./aituber-kit.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    
    if ps -p $PID > /dev/null 2>&1; then
        echo "🔄 サーバー (PID: $PID) を停止しています..."
        echo "🔄 Stopping server (PID: $PID)..."
        
        # 通常の終了シグナルを送信
        kill -TERM $PID
        
        # プロセス終了を待機（最大30秒）
        WAIT_COUNT=0
        while ps -p $PID > /dev/null 2>&1 && [ $WAIT_COUNT -lt 30 ]; do
            echo "⏳ 停止処理を待機中... ($((WAIT_COUNT + 1))/30)"
            echo "⏳ Waiting for graceful shutdown... ($((WAIT_COUNT + 1))/30)"
            sleep 1
            WAIT_COUNT=$((WAIT_COUNT + 1))
        done
        
        # まだ動いている場合は強制終了
        if ps -p $PID > /dev/null 2>&1; then
            echo "💥 グレースフル停止がタイムアウトしました。強制終了しています..."
            echo "💥 Graceful shutdown timed out. Force killing..."
            kill -KILL $PID
            sleep 2
        fi
        
        # 最終確認
        if ps -p $PID > /dev/null 2>&1; then
            echo "❌ プロセスの停止に失敗しました"
            echo "❌ Failed to stop process"
            exit 1
        else
            echo "✅ サーバーが正常に停止しました"
            echo "✅ Server stopped successfully"
        fi
    else
        echo "ℹ️  PIDファイルは存在しますが、プロセスは既に停止しています"
        echo "ℹ️  PID file exists but process is already stopped"
    fi
    
    # PIDファイルを削除
    rm -f "$PID_FILE"
    echo "🗑️  PIDファイルを削除しました"
    echo "🗑️  PID file removed"
else
    echo "ℹ️  PIDファイルが見つかりません。サーバーは動作していない可能性があります。"
    echo "ℹ️  PID file not found. Server might not be running."
    
    # Node.jsプロセスを探して停止する（念のため）
    echo "🔍 Next.jsプロセスを検索しています..."
    echo "🔍 Searching for Next.js processes..."
    
    NEXT_PIDS=$(pgrep -f "next.*dev\|next.*start" 2>/dev/null || true)
    if [ -n "$NEXT_PIDS" ]; then
        echo "⚠️  Next.jsプロセスが見つかりました: $NEXT_PIDS"
        echo "⚠️  Found Next.js processes: $NEXT_PIDS"
        echo "🛑 これらのプロセスを停止しますか？ [y/N]"
        echo "🛑 Do you want to stop these processes? [y/N]"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            for pid in $NEXT_PIDS; do
                echo "🔄 PID $pid を停止しています..."
                echo "🔄 Stopping PID $pid..."
                kill -TERM $pid 2>/dev/null || true
            done
            sleep 3
            # まだ残っているプロセスがあれば強制終了
            REMAINING_PIDS=$(pgrep -f "next.*dev\|next.*start" 2>/dev/null || true)
            if [ -n "$REMAINING_PIDS" ]; then
                echo "💥 強制終了しています: $REMAINING_PIDS"
                echo "💥 Force killing: $REMAINING_PIDS"
                for pid in $REMAINING_PIDS; do
                    kill -KILL $pid 2>/dev/null || true
                done
            fi
            echo "✅ プロセスを停止しました"
            echo "✅ Processes stopped"
        fi
    else
        echo "ℹ️  Next.jsプロセスは見つかりませんでした"
        echo "ℹ️  No Next.js processes found"
    fi
fi

# ログファイルの情報
if [ -f "aituber-kit.log" ]; then
    echo "📋 ログファイル 'aituber-kit.log' は保持されています"
    echo "📋 Log file 'aituber-kit.log' is preserved"
fi

echo "🏁 停止処理が完了しました"
echo "🏁 Stop process completed"