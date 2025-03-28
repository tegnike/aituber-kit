# 外部连接模式设置

## 概述

外部连接模式是一项允许AITuberKit通过WebSocket与外部应用程序连接的功能。使用此模式，您可以从外部应用程序发送文本消息，让AITuberKit角色说话。

::: warning 关于测试版功能
**此外部连接模式目前作为测试版提供。**

- 规格可能会在没有通知的情况下更改
- 操作可能不稳定
- 在生产环境中使用前请进行充分测试
- 如果您发现任何错误或问题，我们将感谢您的反馈
  :::

**环境变量**:

```bash
# 启用外部连接模式
NEXT_PUBLIC_EXTERNAL_LINKAGE_MODE=true
```

## 特点和用途

外部连接模式具有以下特点和用途：

- 接受来自外部应用程序的文本输入
- 与自定义应用程序集成
- 与其他AI服务连接
- 用作虚拟直播的扩展

## 限制

启用外部连接模式时，以下功能将被禁用：

- 对话持续模式
- 实时API模式

此外，启用外部连接模式时请注意以下几点：

- AI处理必须在外部应用程序端完成
- AITuberKit仅负责接收文本和生成语音和动作

## 设置步骤

1. 在AITuberKit设置界面中将"外部连接模式"设置为ON
2. WebSocket连接将自动在"ws://localhost:8000/ws"启动
3. 从外部应用程序通过WebSocket连接

## WebSocket通信格式

来自外部应用程序的输入格式：

```json
{
  "text": "想让角色说的文本",
  "role": "assistant",
  "emotion": "neutral",
  "type": "message"
}
```

参数说明：

- `text`：让角色说的文本内容（必需）
- `role`：消息的角色。通常使用"assistant"（必需）
- `emotion`：情感表达（可选，默认为"neutral"）
  - 可用值："neutral", "happy", "sad", "angry", "relaxed", "surprised"
- `type`：消息类型（可选）
  - 使用"start"开始新的响应块

例如，您可以使用以下Python代码连接：

```python
import websocket
import json

def send_message(text, emotion="neutral"):
    ws = websocket.create_connection("ws://localhost:8000/ws")
    message = {
        "text": text,
        "role": "assistant",
        "emotion": emotion,
        "type": "message"
    }
    ws.send(json.dumps(message))
    ws.close()

send_message("你好！你好吗？", "happy")
```

## 连接状态通知

通过WebSocket连接时，屏幕上将显示以下通知：

- 连接尝试期间："正在尝试WebSocket连接"
- 连接成功时："WebSocket连接成功"
- 发生错误时："发生WebSocket连接错误"
- 连接结束时："WebSocket连接已结束"

如果连接有问题，请检查这些通知。

::: tip
使用外部连接模式时，您可能需要在防火墙设置中开放WebSocket端口（8000）。此外，如果连接断开，系统将每2秒尝试重新连接一次。
:::
