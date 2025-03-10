# 环境变量列表

## 概述

本页介绍AITuberKit中可以使用的所有环境变量。这些环境变量可以在`.env`文件中设置，以自定义应用程序的行为。

::: tip
所有环境变量的示例都列在`.env.example`文件中。复制此文件以创建`.env`文件。
:::

## 基本设置

详情请参阅[基本设置](/zh/guide/basic-settings)。

```bash
# 默认语言设置
NEXT_PUBLIC_SELECT_LANGUAGE=en

# 背景图像路径
NEXT_PUBLIC_BACKGROUND_IMAGE_PATH=/bg-c.png

# 回答框显示设置（true/false）
NEXT_PUBLIC_SHOW_ASSISTANT_TEXT=true

# 角色名称显示设置（true/false）
NEXT_PUBLIC_SHOW_CHARACTER_NAME=true

# 控制面板显示设置（true/false）
NEXT_PUBLIC_SHOW_CONTROL_PANEL=true
```

## 角色设置

详情请参阅[角色设置](/zh/guide/character/common)。

```bash
# 角色名称
NEXT_PUBLIC_CHARACTER_NAME=Nike酱

# 使用的模型类型（vrm或live2d）
NEXT_PUBLIC_MODEL_TYPE=vrm

# 系统提示
NEXT_PUBLIC_SYSTEM_PROMPT="你是一个名叫Nike的AI助手..."
```

## AI设置

详情请参阅[AI设置](/zh/guide/ai/common)。

```bash
# AI服务选择
NEXT_PUBLIC_SELECT_AI_SERVICE=openai

# 选择的AI模型名称
NEXT_PUBLIC_SELECT_AI_MODEL=gpt-4o-2024-11-20

# 保留的过去消息数量
NEXT_PUBLIC_MAX_PAST_MESSAGES=10

# 温度参数（0.0-2.0）
NEXT_PUBLIC_TEMPERATURE=0.7

# 最大令牌数
NEXT_PUBLIC_MAX_TOKENS=4096
```

## 语音设置

详情请参阅[语音设置](/zh/guide/voice-settings)。

```bash
# 使用的语音合成引擎
NEXT_PUBLIC_SELECT_VOICE=voicevox
```

## YouTube设置

详情请参阅[YouTube设置](/zh/guide/youtube-settings)。

```bash
# 是否启用YouTube模式（true/false）
NEXT_PUBLIC_YOUTUBE_MODE=false

# YouTube API密钥
NEXT_PUBLIC_YOUTUBE_API_KEY=

# YouTube直播ID
NEXT_PUBLIC_YOUTUBE_LIVE_ID=
```

## 幻灯片设置

详情请参阅[幻灯片设置](/zh/guide/slide-settings)。

```bash
# 设置幻灯片模式的初始状态（true/false）
NEXT_PUBLIC_SLIDE_MODE=false
```

## 其他设置

详情请参阅[高级设置](/zh/guide/other/advanced-settings)和[API设置](/zh/guide/other/message-receiver)。

```bash
# 使用视频作为背景设置（true/false）
NEXT_PUBLIC_USE_VIDEO_AS_BACKGROUND=false

# 启用外部指令接收设置（true/false）
NEXT_PUBLIC_MESSAGE_RECEIVER_ENABLED=false

# 介绍屏幕显示设置（true/false）
NEXT_PUBLIC_SHOW_INTRODUCTION="true"
```

有关所有环境变量的完整列表，请参阅项目根目录中的`.env.example`文件。
