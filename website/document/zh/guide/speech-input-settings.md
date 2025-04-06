# 语音输入设置

## 概述

语音输入设置允许您配置麦克风语音识别的工作方式。您可以在两种方法之间选择：使用浏览器的语音识别API（WebSpeech API）或使用OpenAI的Text-to-Speech API。

**环境变量**:

```bash
# 语音识别模式（browser/whisper）
NEXT_PUBLIC_SPEECH_RECOGNITION_MODE=browser

# 语音识别超时（秒）
NEXT_PUBLIC_INITIAL_SPEECH_TIMEOUT=30

# 静音检测超时（秒）
NEXT_PUBLIC_NO_SPEECH_TIMEOUT=2

# 显示静音进度条（true/false）
NEXT_PUBLIC_SHOW_SILENCE_PROGRESS_BAR=true

# 连续麦克风输入模式（true/false）
NEXT_PUBLIC_CONTINUOUS_MIC_LISTENING_MODE=false

# OpenAI API密钥（用于OpenAI TTS模式）
NEXT_PUBLIC_OPENAI_KEY=

# 转录模型（whisper-1, gpt-4o-transcribe, gpt-4o-mini-transcribe）
NEXT_PUBLIC_WHISPER_TRANSCRIPTION_MODEL=whisper-1
```

## 麦克风输入方法

麦克风输入有以下方法：

1. **使用键盘快捷键**

   - 按住Alt键（Mac上为Option键）接受语音输入
   - 说完后松开键发送请求

2. **使用麦克风按钮**
   - 点击屏幕底部的麦克风按钮开始语音输入
   - 说完后再次点击按钮发送请求
   - 您也可以在其他设置中设置"静音检测超时"，自动停止语音输入并发送

## 语音识别模式

选择用于语音输入的识别引擎。

1. **浏览器语音识别**：使用浏览器内置的WebSpeech API。不需要互联网连接，识别结果实时显示。语言自动跟随浏览器设置。
2. **OpenAI TTS**：使用OpenAI的TTS API。可能进行更准确的识别，但需要API密钥。语音数据在录音完成后发送到服务器，因此在识别发生前需要一点时间。

您可以通过点击按钮在这些选项之间切换。

::: warning 注意
通常，推荐使用浏览器语音识别模式，因为它具有更高的准确性和更快的识别速度。但是，如果您使用的浏览器不支持WebSpeech API，如Firefox，请选择OpenAI TTS模式。
:::

::: warning 注意
在实时API模式和音频模式下，只能使用浏览器语音识别。
:::

## 1. 浏览器语音识别设置

当选择浏览器语音识别模式时，以下设置可用。

### 语音识别超时

设置语音识别开始后检测到第一次发言的等待时间。如果在此时间内未检测到发言，语音识别将自动停止。<br>
如果设置为0秒，等待时间将无限制。

您可以使用滑块在0到60秒范围内调整。

### 静音检测超时

设置在语音输入过程中检测到静音时自动完成语音识别的时间。如果设置为0秒，将不会因静音检测而自动完成。

您可以使用滑块在0到10秒范围内调整。

### 显示静音进度条

设置在语音输入过程中检测到静音时是否显示进度条。启用后，静音超时前的剩余时间将以进度条形式显示。

### 连续麦克风输入

当AI说话结束时自动重新开始麦克风输入。设定的静音时间过后将自动发送。<br>
如果未发生语音识别并超过设定时间，连续麦克风输入将自动关闭。如果您希望始终保持开启状态，请将语音识别超时设置为0秒。

::: warning 注意
在实时API模式下，语音识别超时、静音检测超时、静音进度条显示和连续麦克风输入设置将被禁用。
:::

## 2. OpenAI API设置

当选择OpenAI TTS模式时，需要以下设置。

### OpenAI API密钥

输入用于OpenAI TTS模式的OpenAI API密钥。您可以从OpenAI控制面板获取API密钥。

### 模型选择

选择要使用的OpenAI模型。

以下模型可用：

- **whisper-1**：标准Whisper模型
- **gpt-4o-transcribe**：基于GPT-4o的高性能模型
- **gpt-4o-mini-transcribe**：基于GPT-4o-mini的轻量级模型

模型在准确性、速度和成本方面有所不同。

## 注意事项

- 浏览器语音识别的准确性和支持的语言因使用的浏览器和操作系统而异。
- 使用OpenAI API时，可能会产生API密钥使用费用。
