# 环境变量列表

## 概述

本页面说明了AITuberKit可以使用的所有环境变量。这些环境变量可以在`.env`文件中设置，以自定义应用程序的行为。

::: tip
所有环境变量的示例都列在`.env.example`文件中。复制此文件以创建`.env`文件。
:::

## 基本设置

详情请参阅[基本设置](/guide/basic-settings)。

```bash
# 默认语言设置（指定以下值之一）
# ja: 日语, en: 英语, ko: 韩语, zh: 中文(繁体), vi: 越南语
# fr: 法语, es: 西班牙语, pt: 葡萄牙语, de: 德语
# ru: 俄语, it: 意大利语, ar: 阿拉伯语, hi: 印地语, pl: 波兰语
NEXT_PUBLIC_SELECT_LANGUAGE=en

# 用日语发音英语单词的设置（true/false）
NEXT_PUBLIC_CHANGE_ENGLISH_TO_JAPANESE=false

# 背景图片路径
NEXT_PUBLIC_BACKGROUND_IMAGE_PATH=/bg-c.png

# 助手文本显示设置（true/false）
NEXT_PUBLIC_SHOW_ASSISTANT_TEXT=true

# 角色名称显示设置（true/false）
NEXT_PUBLIC_SHOW_CHARACTER_NAME=true

# 控制面板显示设置（true/false）
NEXT_PUBLIC_SHOW_CONTROL_PANEL=true

# 角色预设菜单显示设置（true/false）
NEXT_PUBLIC_SHOW_CHARACTER_PRESET_MENU=true
```

## 角色设置

详情请参阅[角色设置](/guide/character/common)。

### 通用设置

```bash
# 角色名称
NEXT_PUBLIC_CHARACTER_NAME=Nike-chan

# 使用的模型类型（vrm或live2d）
NEXT_PUBLIC_MODEL_TYPE=vrm

# 自定义预设名称
NEXT_PUBLIC_CUSTOM_PRESET_NAME1="预设1"
NEXT_PUBLIC_CUSTOM_PRESET_NAME2="预设2"
NEXT_PUBLIC_CUSTOM_PRESET_NAME3="预设3"
NEXT_PUBLIC_CUSTOM_PRESET_NAME4="预设4"
NEXT_PUBLIC_CUSTOM_PRESET_NAME5="预设5"

# 角色预设
NEXT_PUBLIC_CHARACTER_PRESET1="你是一个名叫Nike的AI助手。"
NEXT_PUBLIC_CHARACTER_PRESET2="你是一个名叫Nike的AI助手。"
NEXT_PUBLIC_CHARACTER_PRESET3="你是一个名叫Nike的AI助手。"
NEXT_PUBLIC_CHARACTER_PRESET4="你是一个名叫Nike的AI助手。"
NEXT_PUBLIC_CHARACTER_PRESET5="你是一个名叫Nike的AI助手。"
```

### VRM设置

```bash
# 所选VRM模型的路径
NEXT_PUBLIC_SELECTED_VRM_PATH=/vrm/default.vrm
```

### Live2D设置

```bash
# 所选Live2D模型的模型文件路径
NEXT_PUBLIC_SELECTED_LIVE2D_PATH=/live2d/modername/model3.json

# 情绪设置（可以用逗号指定多个）
NEXT_PUBLIC_NEUTRAL_EMOTIONS=Neutral
NEXT_PUBLIC_HAPPY_EMOTIONS=Happy,Happy2
NEXT_PUBLIC_SAD_EMOTIONS=Sad,Sad2,Troubled
NEXT_PUBLIC_ANGRY_EMOTIONS=Angry,Focus
NEXT_PUBLIC_RELAXED_EMOTIONS=Relaxed
NEXT_PUBLIC_SURPRISED_EMOTIONS=Surprised

# 动作组设置
NEXT_PUBLIC_IDLE_MOTION_GROUP=Idle
NEXT_PUBLIC_NEUTRAL_MOTION_GROUP=Neutral
NEXT_PUBLIC_HAPPY_MOTION_GROUP=Happy
NEXT_PUBLIC_SAD_MOTION_GROUP=Sad
NEXT_PUBLIC_ANGRY_MOTION_GROUP=Angry
NEXT_PUBLIC_RELAXED_MOTION_GROUP=Relaxed
NEXT_PUBLIC_SURPRISED_MOTION_GROUP=Surprised
```

## AI设置

详情请参阅[AI设置](/guide/ai/common)。

### 通用设置

```bash
# AI服务选择
# openai, anthropic, google, azure, groq, cohere,
# mistralai, perplexity, fireworks, deepseek, localLlm, dify
NEXT_PUBLIC_SELECT_AI_SERVICE=openai

# 所选AI模型名称
NEXT_PUBLIC_SELECT_AI_MODEL=gpt-4o-2024-11-20

# 保留的过去消息数量
NEXT_PUBLIC_MAX_PAST_MESSAGES=10

# 调整对话随机性的温度参数（0.0-2.0）
NEXT_PUBLIC_TEMPERATURE=0.7

# 最大令牌数
NEXT_PUBLIC_MAX_TOKENS=4096
```

### AI服务设置

```bash
# OpenAI API密钥
OPENAI_API_KEY=sk-...

# Anthropic API密钥
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini API密钥
GOOGLE_API_KEY=...

# 启用搜索接地功能
NEXT_PUBLIC_USE_SEARCH_GROUNDING=true

# Azure OpenAI API密钥
AZURE_API_KEY=...
# Azure OpenAI端点
AZURE_ENDPOINT="https://RESOURCE_NAME.openai.azure.com/openai/deployments/DEPLOYMENT_NAME/chat/completions?api-version=API_VERSION"

# Groq API密钥
GROQ_API_KEY=...

# Cohere API密钥
COHERE_API_KEY=...

# Mistral AI API密钥
MISTRALAI_API_KEY=...

# Perplexity API密钥
PERPLEXITY_API_KEY=...

# Fireworks API密钥
FIREWORKS_API_KEY=...

# DeepSeek API密钥
DEEPSEEK_API_KEY=...

# 本地LLM URL
# 例如 Ollama: http://localhost:11434/v1/chat/completions
# 例如 LM Studio: http://localhost:1234/v1/chat/completions
NEXT_PUBLIC_LOCAL_LLM_URL=""
# 本地LLM模型
NEXT_PUBLIC_LOCAL_LLM_MODEL=""

# Dify API密钥
DIFY_API_KEY=""
# Dify API URL
DIFY_URL=""

# 自定义API URL
NEXT_PUBLIC_CUSTOM_API_URL=""
# 自定义API头
NEXT_PUBLIC_CUSTOM_API_HEADERS=""
# 自定义API主体
NEXT_PUBLIC_CUSTOM_API_BODY=""
```

### 实时API设置

```bash
# 启用实时API模式
NEXT_PUBLIC_REALTIME_API_MODE=false

# 使用Realtime API时在前端环境变量中设置
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
NEXT_PUBLIC_AZURE_API_KEY=...
NEXT_PUBLIC_AZURE_ENDPOINT=...

# 实时API模式内容类型（input_text或input_audio）
NEXT_PUBLIC_REALTIME_API_MODE_CONTENT_TYPE=input_text

# 实时API模式语音
# OpenAI: alloy, coral, echo, verse, ballad, ash, shimmer, sage
# Azure: alloy, amuch, breeze, cove, dan, echo, elan, ember, jupiter, marilyn, shimmer
NEXT_PUBLIC_REALTIME_API_MODE_VOICE=alloy
```

### 音频模式设置

```bash
# 启用音频模式
NEXT_PUBLIC_AUDIO_MODE=false

# 使用Audio API时在前端环境变量中设置
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# 音频模式输入类型（input_text或input_audio）
NEXT_PUBLIC_AUDIO_MODE_INPUT_TYPE=input_text

# 音频模式语音（alloy, coral, echo, verse, ballad, ash, shimmer, sage）
NEXT_PUBLIC_AUDIO_MODE_VOICE=alloy
```

### 外部链接模式设置

```bash
# 启用外部链接模式
NEXT_PUBLIC_EXTERNAL_LINKAGE_MODE=true
```

## 语音合成设置

详情请参阅[语音合成设置](/guide/voice-settings)。

```bash
# 使用的语音合成引擎
# voicevox, koeiromap, google, stylebertvits2, aivis_speech,
# gsvitts, elevenlabs, openai, azure, nijivoice
NEXT_PUBLIC_SELECT_VOICE=voicevox

# VOICEVOX
# 服务器URL
VOICEVOX_SERVER_URL=http://localhost:50021
# 说话者ID
NEXT_PUBLIC_VOICEVOX_SPEAKER=46
# 速度
NEXT_PUBLIC_VOICEVOX_SPEED=1.0
# 音高
NEXT_PUBLIC_VOICEVOX_PITCH=0.0
# 语调
NEXT_PUBLIC_VOICEVOX_INTONATION=1.0

# Koeiromap
# API密钥
NEXT_PUBLIC_KOEIROMAP_KEY=

# Google Text-to-Speech
# 认证JSON文件的路径
GOOGLE_APPLICATION_CREDENTIALS="./credentials.json"
# API密钥
GOOGLE_TTS_KEY=""
# 语言/模型设置
NEXT_PUBLIC_GOOGLE_TTS_TYPE=

# Style-Bert-VITS2
# 服务器URL
STYLEBERTVITS2_SERVER_URL=""
# API密钥
STYLEBERTVITS2_API_KEY=""
# 模型ID
NEXT_PUBLIC_STYLEBERTVITS2_MODEL_ID=0
# 风格
NEXT_PUBLIC_STYLEBERTVITS2_STYLE=Neutral
# SDP/DP混合比例
NEXT_PUBLIC_STYLEBERTVITS2_SDP_RATIO=0.2
# 说话速度
NEXT_PUBLIC_STYLEBERTVITS2_LENGTH=1.0

# AivisSpeech
# 服务器URL
AIVIS_SPEECH_SERVER_URL=http://localhost:10101
# 说话者ID
NEXT_PUBLIC_AIVIS_SPEECH_SPEAKER=888753760
# 速度
NEXT_PUBLIC_AIVIS_SPEECH_SPEED=1.0
# 音高
NEXT_PUBLIC_AIVIS_SPEECH_PITCH=0.0
# 语调
NEXT_PUBLIC_AIVIS_SPEECH_INTONATION=1.0

# GSVI TTS
# 服务器URL
NEXT_PUBLIC_GSVI_TTS_URL=http://127.0.0.1:5000/tts
# 模型ID
NEXT_PUBLIC_GSVI_TTS_MODEL_ID=0
# 批处理大小
NEXT_PUBLIC_GSVI_TTS_BATCH_SIZE=2
# 说话速率
NEXT_PUBLIC_GSVI_TTS_SPEECH_RATE=1.0

# ElevenLabs
# API密钥
ELEVENLABS_API_KEY=""
# 语音ID
ELEVENLABS_VOICE_ID=""

# OpenAI TTS
# API密钥
OPENAI_TTS_KEY=""
# 语音类型
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# 模型
NEXT_PUBLIC_OPENAI_TTS_MODEL=tts-1
# 说话速度
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0

# Azure OpenAPI TTS
# API密钥
AZURE_TTS_KEY=""
# 端点
AZURE_TTS_ENDPOINT=""
# 语音类型
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# 说话速度
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0

# Nijivoice
# API密钥
NIJIVOICE_API_KEY=""
# 说话者ID
NEXT_PUBLIC_NIJIVOICE_ACTOR_ID=""
# 说话速度
NEXT_PUBLIC_NIJIVOICE_SPEED=1.0
# 情感水平
NEXT_PUBLIC_NIJIVOICE_EMOTIONAL_LEVEL=0.0
# 语音持续时间
NEXT_PUBLIC_NIJIVOICE_SOUND_DURATION=1.0
```

## 语音输入设置

```bash
# 语音识别模式（browser, whisper）
NEXT_PUBLIC_SPEECH_RECOGNITION_MODE=browser

# 语音识别超时（秒）
NEXT_PUBLIC_INITIAL_SPEECH_TIMEOUT=5.0

# 静音检测超时（秒）
NEXT_PUBLIC_NO_SPEECH_TIMEOUT=2.0

# 显示静音进度条（true/false）
NEXT_PUBLIC_SHOW_SILENCE_PROGRESS_BAR=true

# 连续麦克风输入模式（true/false）
NEXT_PUBLIC_CONTINUOUS_MIC_LISTENING_MODE=false

# OpenAI API密钥（用于OpenAI TTS模式）
NEXT_PUBLIC_OPENAI_KEY=

# 转录模型（whisper-1, gpt-4o-transcribe, gpt-4o-mini-transcribe）
NEXT_PUBLIC_WHISPER_TRANSCRIPTION_MODEL=whisper-1
```

## YouTube设置

详情请参阅[YouTube设置](/guide/youtube-settings)。

```bash
# 是否启用YouTube模式（true/false）
NEXT_PUBLIC_YOUTUBE_MODE=false

# YouTube API密钥
NEXT_PUBLIC_YOUTUBE_API_KEY=

# YouTube直播ID
NEXT_PUBLIC_YOUTUBE_LIVE_ID=
```

## 幻灯片设置

详情请参阅[幻灯片设置](/guide/slide-settings)。

```bash
# 设置幻灯片模式的初始状态（true/false）
NEXT_PUBLIC_SLIDE_MODE=false
```

## 其他设置

### 高级设置

详情请参阅[高级设置](/guide/other/advanced-settings)。

```bash
# 背景视频使用设置（true/false）
NEXT_PUBLIC_USE_VIDEO_AS_BACKGROUND=false

# 时间戳包含设置（true/false）
NEXT_PUBLIC_INCLUDE_TIMESTAMP_IN_USER_MESSAGE=false

# 预设问题显示设置（true/false）
NEXT_PUBLIC_SHOW_PRESET_QUESTIONS=false

# 预设问题（可以用逗号指定多个）
NEXT_PUBLIC_PRESET_QUESTIONS=

```

### API设置

详情请参阅[API设置](/guide/other/message-receiver)。

```bash
# 启用外部指令接收（true/false）
NEXT_PUBLIC_MESSAGE_RECEIVER_ENABLED=false
```

### 其他

```bash
# 介绍屏幕显示设置（true/false）
NEXT_PUBLIC_SHOW_INTRODUCTION="true"
```
