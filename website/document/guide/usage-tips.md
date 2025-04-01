# 活用TIPS

## 概要

AITuberKitをより便利に使いこなすためのヒントやコツを紹介します。設定画面からは見つけにくい機能や、快適に利用するためのテクニックを知ることで、AITuberKitの可能性を広げましょう。

## カラーテーマの変更

AITuberKitのカラーテーマは、`tailwind.config.js`ファイルの`colors`セクションを編集することで簡単に変更できます。このファイルには、アプリケーション全体で使用される色が定義されています。

```javascript
colors: {
  primary: '#856292',
  'primary-hover': '#8E76A1',
  'primary-press': '#988BB0',
  // その他の色定義...
}
```

これらの色コードを変更するだけで、アプリケーション全体の見た目を一新できます。例えば、モノクロなテーマにするには以下のように変更します：

```javascript
colors: {
  primary: '#505050',
  'primary-hover': '#707070',
  'primary-press': '#909090',
  'primary-disabled': '#5050504D',
  secondary: '#303030',
  'secondary-hover': '#404040',
  'secondary-press': '#606060',
  'secondary-disabled': '#3030304D',
  'text-primary': '#202020',
  'base-light': '#F5F5F5',
  'base-dark': '#1A1A1A',
  // トースト用の色も必要に応じて変更
}
```

![カラーテーマの変更](/images/usage-tips_lfsd4.png)

:::tip
色設定の変更は少し複雑に感じるかもしれませんが、AIアシスタントに依頼すると簡単です。例えば「tailwind.config.jsのカラーテーマをモノクロに変更してください」とAIに指示するだけで、適切な色コードを提案してもらえます。カスタムカラーテーマの作成や、既存テーマの微調整にもAIが役立ちます。
:::
