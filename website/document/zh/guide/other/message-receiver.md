# API设置

## 概述

接受来自外部源的AI角色指令的设置。启用此功能后，您可以通过专用API让AI角色说话。

**环境变量**:

```bash
# 启用外部指令接收设置（true/false）
NEXT_PUBLIC_MESSAGE_RECEIVER_ENABLED=false
```

## 启用功能

您可以切换接受来自外部源的指令功能的开/关状态。开启时，会自动生成客户端ID。

:::tip 提示
发送来自外部源的消息时需要生成的客户端ID。
:::

## 消息发送页面

启用后，将显示"打开消息发送页面"链接。从此页面，您可以指示AI角色从外部源说话。

消息发送页面提供三种发送消息的方法：

### 1. 让AI角色直接说话（direct_send）

- 让AI角色按原样说出输入的消息
- 如果发送多条消息，它们将按顺序处理
- 使用AITuberKit设置中选择的语音模型

**API请求示例**:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages": ["你好，今天天气真好。", "请告诉我你今天的日程安排。"]}' \
  'http://localhost:3000/api/messages/?clientId=YOUR_CLIENT_ID&type=direct_send'
```

### 2. 用AI生成回答然后说话（ai_generate）

- AI从输入消息生成回应，然后AI角色说出该回应
- 如果发送多条消息，它们将按顺序处理
- 使用AITuberKit设置中选择的AI模型和语音模型
- 如何设置系统提示：
  - 要使用AITuberKit系统提示，设置`useCurrentSystemPrompt: true`
  - 要使用自定义系统提示，在`systemPrompt`参数中指定，并设置`useCurrentSystemPrompt: false`
- 要加载过去的对话历史，您可以在系统提示或用户消息的任何位置包含字符串`[conversation_history]`

**API请求示例**:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"systemPrompt": "You are a helpful assistant.", "useCurrentSystemPrompt": false, "messages": ["请告诉我你今天的日程安排。"]}' \
  'http://localhost:3000/api/messages/?clientId=YOUR_CLIENT_ID&type=ai_generate'
```

### 3. 发送用户输入（user_input）

- 发送的消息处理方式与从AITuberKit输入表单输入的情况相同
- 如果发送多条消息，它们将按顺序处理
- 使用AITuberKit设置中选择的AI模型和语音模型
- 使用AITuberKit的系统提示和对话历史

**API请求示例**:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages": ["你好，今天天气真好。", "请告诉我你今天的日程安排。"]}' \
  'http://localhost:3000/api/messages/?clientId=YOUR_CLIENT_ID&type=user_input'
```

## API响应

对每个API请求的响应作为包含请求处理结果的JSON对象返回。响应包括有关已处理消息和处理状态的信息。

:::tip 提示
在消息发送页面上，每种发送方法表单的底部都有一个响应显示区域，您可以在其中查看来自API的响应。
:::

## 注意事项

- 客户端ID用于限制来自外部源的访问。注意不要泄露给第三方。
- 在短时间内发送大量消息可能会导致处理延迟。
- 接受来自外部源的指令的功能涉及安全风险。仅在受信任的环境中启用。
