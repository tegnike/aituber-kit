#!/bin/bash

# AITuberKit サーバー起動スクリプト
# Server startup script for AITuberKit

set -e

echo "🚀 AITuberKit サーバーを起動しています..."
echo "🚀 Starting AITuberKit server..."

# Node.js のバージョンチェック
if ! command -v node &> /dev/null; then
    echo "❌ Node.js がインストールされていません。Node.js 20.0.0以上をインストールしてください。"
    echo "❌ Node.js is not installed. Please install Node.js 20.0.0 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Node.js のバージョンが古すぎます。現在: $(node -v), 必要: v20.0.0以上"
    echo "⚠️  Node.js version is too old. Current: $(node -v), Required: v20.0.0 or higher"
    exit 1
fi

# 依存関係のインストールチェック
if [ ! -d "node_modules" ]; then
    echo "📦 依存関係をインストールしています..."
    echo "📦 Installing dependencies..."
    npm install
fi

# ビルド（本番用）
if [ "${NODE_ENV}" = "production" ]; then
    echo "🔨 本番用ビルドを実行しています..."
    echo "🔨 Building for production..."
    npm run build
    
    echo "✅ サーバーを本番モードで起動しています..."
    echo "✅ Starting server in production mode..."
    exec npm start
else
    echo "🔧 開発モードでサーバーを起動しています..."
    echo "🔧 Starting server in development mode..."
    exec npm run dev
fi