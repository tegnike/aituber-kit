# 基本設定

## 概要

AITuberKitの基本設定について説明します。環境変数による設定方法については[環境変数一覧](/guide/environment-variables)をご覧ください。

## 言語設定

**環境変数**:

```bash
# デフォルト言語の設定（以下のいずれかの値を指定）
# ja: 日本語, en: 英語, ko: 韓国語, zh: 中国語(繁体字), vi: ベトナム語
# fr: フランス語, es: スペイン語, pt: ポルトガル語, de: ドイツ語
# ru: ロシア語, it: イタリア語, ar: アラビア語, hi: ヒンディー語, pl: ポーランド語
NEXT_PUBLIC_SELECT_LANGUAGE=en
```

AITuberKitは多言語対応しており、以下の言語から選択できます：

- アラビア語 (Arabic)
- 英語 (English)
- フランス語 (French)
- ドイツ語 (German)
- ヒンディー語 (Hindi)
- イタリア語 (Italian)
- 日本語 (Japanese)
- 韓国語 (Korean)
- ポーランド語 (Polish)
- ポルトガル語 (Portuguese)
- ロシア語 (Russian)
- スペイン語 (Spanish)
- タイ語 (Thai)
- 中国語（繁体字）(Traditional Chinese)
- ベトナム語 (Vietnamese)

::: warning 注意
日本語以外の言語を選択すると、日本語専用の音声サービス（VOICEVOX、KOEIROMAP、AivisSpeech、NijiVoice）が選択されている場合は、自動的にGoogle音声合成に切り替わります。
:::

## 背景画像の設定

**環境変数**:

```bash
# 背景画像のパス
NEXT_PUBLIC_BACKGROUND_IMAGE_PATH=/bg-c.png
```

アプリケーションの背景画像をカスタマイズすることができます。「背景画像を変更」ボタンをクリックして、お好みの画像をアップロードしてください。

また、永続化する場合は、設定したい画像を`public/bg-c.png`という名称で保存してください。

環境変数でファイル名を指定することも可能です。

## 回答欄を表示する

会話履歴が表示されていないときに、AIの回答テキストを画面上に表示するかどうかを設定できます。

**環境変数**:

```bash
# 回答欄の表示設定（true/false）
NEXT_PUBLIC_SHOW_ASSISTANT_TEXT=true
```

![回答欄を表示する](/images/basic_3efh5.png)

## 回答欄にキャラクター名を表示する

回答欄にキャラクター名を表示するかどうかを設定できます。

**環境変数**:

```bash
# キャラクター名表示設定（true/false）
NEXT_PUBLIC_SHOW_CHARACTER_NAME=true
```

## 操作パネル表示

画面右上に操作パネルを表示するかどうかを設定できます。

:::tip ヒント
設定画面は Mac では `Cmd + .`、Windows では `Ctrl + .` のショートカットでも表示できます。
:::

**環境変数**:

```bash
# 操作パネル表示設定（true/false）
NEXT_PUBLIC_SHOW_CONTROL_PANEL=true
```
