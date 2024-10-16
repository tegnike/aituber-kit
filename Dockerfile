# ベースイメージとしてNode.js 20を使用
FROM node:20

# 必要なシステムライブラリをインストール
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci

# アプリケーションのソースコードをコピー
COPY . .

# 3000番ポートを公開
EXPOSE 3000

# 開発モードでアプリケーションを起動
CMD ["npm", "run", "dev"]
