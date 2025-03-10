# 实时API设置

## 概述

实时API是OpenAI提供的功能，可实现更自然、延迟更低的对话体验。通过缩短传统处理流程，允许AI直接从语音输入响应，从而实现更流畅的通信。

**环境变量**:

```bash
# 启用实时API模式
NEXT_PUBLIC_REALTIME_API_MODE=false

# 使用实时API时在前端环境变量中设置
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

## 支持的模型

实时API支持以下模型：

- gpt-4o-realtime-preview-2024-12-17
- gpt-4o-mini-realtime-preview-2024-12-17
- gpt-4o-realtime-preview-2024-10-01

## 功能和特点

### 工作原理和优势

实时API利用WebSocket通信，与传统的RESTful API相比具有以下优势：

- 几乎零延迟的实时响应
- 反映语音细微差别和语调的自然响应
- 缩短处理流程（减少语音→文本→AI文本→语音的转换步骤）

### 处理流程比较

**传统流程**：

1. 用户用语音说话
2. 语音转录为文本
3. 文本传递给AI以获取文本响应
4. 文本转换为语音并播放

**实时API流程**：

1. 用户用语音说话
2. 语音传递给AI以获取语音响应

## 设置方法

要使用实时API，请按照以下步骤操作：

1. 选择OpenAI或Azure OpenAI作为AI服务
2. 设置OpenAI API密钥（以及Azure OpenAI的相关设置）
3. 打开实时API模式
4. 根据需要选择传输类型和语音

### 传输类型设置

在实时API模式下，您可以选择两种传输方法：

- **文本**：使用Web Speech API在发送前转录语音输入
- **语音**：直接从麦克风将语音数据发送到实时API

::: warning 注意
实时API模式仅支持麦克风输入。不支持文本输入。
对于日语，选择"文本"传输类型可能会提高语音识别准确性。
:::

### 语音类型设置

根据服务的不同，可以使用不同的语音类型：

**OpenAI**：

- alloy, coral, echo, verse, ballad, ash, shimmer, sage

**Azure OpenAI**：

- amuch, dan, elan, marilyn, breeze, cove, ember, jupiter, alloy, echo, shimmer

::: warning 注意
如果更改API密钥、Azure端点、语音类型、AI模型或角色设置中的角色提示，需要按更新按钮重新启动WebSocket会话。
:::

## 检查连接状态

关闭设置屏幕后，左上角会显示连接状态。确保显示"成功"。如果显示"尝试中"或"已关闭"，请检查API密钥是否正确设置。

## 函数执行功能

在实时API模式下，您可以使用函数调用（Function Calling）。AI使用这个功能来执行特定操作。

### 内置函数

默认情况下，实现了`get_current_weather`函数，您可以通过询问"XX的当前天气如何"来获取天气信息。

### 添加自定义函数

1. **定义函数**

在`src/components/realtimeAPITools.json`文件中添加函数定义：

```json
[
  {
    "type": "function",
    "name": "get_current_weather",
    "description": "Retrieves the current weather for a given timezone, latitude, longitude coordinate pair. Specify a label for the location.",
    "parameters": {
      "type": "object",
      "properties": {
        "latitude": {
          "type": "number",
          "description": "Latitude"
        },
        "longitude": {
          "type": "number",
          "description": "Longitude"
        },
        "timezone": {
          "type": "string",
          "description": "Timezone"
        },
        "location": {
          "type": "string",
          "description": "Name of the location"
        }
      },
      "required": ["timezone", "latitude", "longitude", "location"]
    }
  }
]
```

2. **实现函数**

在`src/components/realtimeAPITools.tsx`文件中实现实际函数：

```tsx
class RealtimeAPITools {
  async get_current_weather(
    latitude: number,
    longitude: number,
    timezone: string,
    location: string
  ): Promise<string> {
    // 函数实现
    // ...
    return `天气信息：${location}的当前温度是${temperature}°C，天气状况是${weatherStatus}。`
  }
}
```

::: tip
如果函数执行需要时间，可以在函数定义的`description`中添加以下文本，提示AI在执行函数前先说些什么：

```
Please respond to the user before calling the tool.
```

在角色设置中添加以下内容也很有效：

```
使用工具时，如有必要，请告知用户需要等待。
```

:::

## 限制

- 目前仅支持OpenAI或Azure OpenAI
- 不能与外部连接模式、音频模式或Youtube模式一起使用
- 日语语音识别准确性可能因环境而不稳定
- 文本数据和语音数据之间可能出现不一致
- 无法使用传统的基于文本的情感控制（例如，`[happy]你好`）
- 与其他模型相比成本更高

## 管理对话历史

在实时API中，对话历史保存在每个会话中，会话结束时删除。当您按"更新实时API设置"按钮时，会话将重置，对话历史将被清除。当前的AITuberKit不实现将过去的对话历史带到新会话的功能。

::: warning 注意
由于每个会话自动保存对话，在同一屏幕上继续对话将增加成本。建议使用后重新加载浏览器。
:::
