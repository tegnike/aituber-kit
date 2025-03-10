# 音频模式设置

## 概述

在AITuberKit中，您可以使用音频模式，该模式利用OpenAI提供的Audio API功能，以自然语音对文本或语音输入做出响应。此模式作为与实时API模式不同的功能提供。

**环境变量**:

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

## 支持的模型

音频模式支持以下模型：

- gpt-4o-audio-preview-2024-12-17
- gpt-4o-mini-audio-preview-2024-12-17
- gpt-4o-audio-preview-2024-10-01

## 设置方法

要使用音频模式，请按照以下步骤操作：

1. 选择OpenAI作为AI服务
2. 设置OpenAI API密钥
3. 打开音频模式
4. 根据需要选择输入类型和语音

### 传输类型设置

在音频模式下，您可以选择两种传输方法：

- **文本**：使用Web Speech API在发送前转录语音输入
- **语音**：直接从麦克风将语音数据发送到实时API

### 语音类型设置

在音频模式下，可以使用以下语音类型：

- alloy, coral, echo, verse, ballad, ash, shimmer, sage

每种语音都有不同的特点，允许您为角色选择最佳语音。

## 限制

- 目前仅支持OpenAI的服务
- 不能与外部连接模式或实时API模式一起使用
- 可能比其他模式产生更高的API使用费用
