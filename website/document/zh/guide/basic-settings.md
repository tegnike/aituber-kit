# 基本设置

## 概述

本页介绍AITuberKit的基本设置。关于使用环境变量进行配置的方法，请参阅[环境变量列表](/zh/guide/environment-variables)。

## 语言设置

**环境变量**:

```bash
# 默认语言设置（指定以下值之一）
# ja: 日语, en: 英语, ko: 韩语, zh: 中文(繁体), vi: 越南语
# fr: 法语, es: 西班牙语, pt: 葡萄牙语, de: 德语
# ru: 俄语, it: 意大利语, ar: 阿拉伯语, hi: 印地语, pl: 波兰语
NEXT_PUBLIC_SELECT_LANGUAGE=en
```

AITuberKit支持多种语言，您可以从以下语言中选择：

- 阿拉伯语 (Arabic)
- 英语 (English)
- 法语 (French)
- 德语 (German)
- 印地语 (Hindi)
- 意大利语 (Italian)
- 日语 (Japanese)
- 韩语 (Korean)
- 波兰语 (Polish)
- 葡萄牙语 (Portuguese)
- 俄语 (Russian)
- 西班牙语 (Spanish)
- 泰语 (Thai)
- 中文（繁体）(Traditional Chinese)
- 越南语 (Vietnamese)

::: warning 注意
如果选择日语以外的语言，且已选择日语专用的语音服务（VOICEVOX、KOEIROMAP、AivisSpeech、NijiVoice），系统将自动切换到Google语音合成。
:::

## 英语单词读取设置

您可以设置是否在日语中读取英语单词。

:::tip
此设置仅在选择日语时显示。
:::

**环境变量**:

```bash
# 英语单词读取设置（true/false）
NEXT_PUBLIC_CHANGE_ENGLISH_TO_JAPANESE=false
```

## 背景图像设置

**环境变量**:

```bash
# 背景图像路径
NEXT_PUBLIC_BACKGROUND_IMAGE_PATH=/bg-c.png
```

您可以自定义应用程序的背景图像。点击"更改背景图像"按钮上传您喜欢的图像。

要使其持久化，请将所需图像保存为`public/bg-c.png`。

您也可以使用环境变量指定文件名。

## 显示回答框

您可以设置在不显示对话历史时是否在屏幕上显示AI的回答文本。

**环境变量**:

```bash
# 回答框显示设置（true/false）
NEXT_PUBLIC_SHOW_ASSISTANT_TEXT=true
```

![显示回答框](/images/basic_3efh5.png)

## 在回答框中显示角色名称

您可以设置是否在回答框中显示角色名称。

**环境变量**:

```bash
# 角色名称显示设置（true/false）
NEXT_PUBLIC_SHOW_CHARACTER_NAME=true
```

## 控制面板显示

您可以设置是否在屏幕右上角显示控制面板。

:::tip 提示
设置界面也可以通过Mac上的`Cmd + .`或Windows上的`Ctrl + .`快捷键显示。
如果您使用智能手机，也可以通过长按屏幕左上角（约1秒）来显示。
:::

**环境变量**:

```bash
# 控制面板显示设置（true/false）
NEXT_PUBLIC_SHOW_CONTROL_PANEL=true
```
