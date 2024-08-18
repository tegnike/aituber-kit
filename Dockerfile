# ベースイメージとしてNode.js 20を使用
FROM node:20

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN npm run build

# 3000番ポートを公開
EXPOSE 3000

# アプリケーションを起動
CMD ["npm", "start"]
