#!/bin/bash

cd "$(dirname "$0")"

echo "============================================"
echo "  AITuberKit - Starting..."
echo "============================================"
echo ""

if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed or not in PATH."
    echo "Please install Node.js from https://nodejs.org/"
    read -p "Press Enter to close..."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] npm install failed."
        read -p "Press Enter to close..."
        exit 1
    fi
    echo ""
fi

echo "Starting development server..."
echo "Press Ctrl+C to stop the server."
echo ""

# Open browser automatically after server starts
(sleep 3 && open http://localhost:3000) &

npm run dev

read -p "Press Enter to close..."
