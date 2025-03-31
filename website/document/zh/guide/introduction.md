# 介绍

## 概述

AITuberKit是一个开源工具包，使任何人都能轻松构建与AI角色聊天的Web应用程序。它以AI角色互动和AITuber直播功能为核心，并配备了各种扩展功能。

## 主要功能

### 1. AI角色互动

- 使用各种LLM API密钥轻松与AI角色聊天
- 支持多模态，能够识别摄像头画面和上传的图像来生成回答
- 保留最近的对话作为记忆

### 2. AITuber直播

- 获取YouTube直播评论，AI角色自动回应
- 对话持续模式使角色即使在没有评论时也能主动发言
- 以"#"开头的评论不会被读出

### 3. 其他功能

- **外部连接模式**：通过WebSocket与服务器应用程序连接，实现更高级的功能
- **幻灯片模式**：AI角色自动展示幻灯片的模式
- **Realtime API模式**：使用OpenAI的Realtime API实现低延迟对话和函数执行

## 支持的角色模型

- **3D模型**：VRM文件
- **2D模型**：Live2D文件（Cubism 3及以上版本）

### 支持的LLM

- OpenAI
- Anthropic
- Google Gemini
- Azure OpenAI
- Groq
- Cohere
- Mistral AI
- Perplexity
- Fireworks
- 本地LLM
- Dify

## 支持的语音合成引擎

- VOICEVOX
- Koeiromap
- Google Text-to-Speech
- Style-Bert-VITS2
- AivisSpeech
- GSVI TTS
- ElevenLabs
- OpenAI
- Azure OpenAI
- Nijivoice

## 系统要求

- Node.js: ^20.0.0
- npm: ^10.0.0

## 安全注意事项

本仓库适用于个人使用、本地开发，以及采取适当安全措施的商业用途。但在部署到Web环境时，请注意以下几点：

- **API密钥处理**：系统设计为通过后端服务器调用AI服务（OpenAI、Anthropic等）和TTS服务，因此需要妥善管理API密钥。

### 生产环境使用

在生产环境中使用时，建议采取以下方法之一：

1. **实现后端服务器**：在服务器端管理API密钥，避免客户端直接访问API
2. **向用户提供适当的说明**：如果用户使用自己的API密钥，请解释安全注意事项
3. **实现访问限制**：根据需要实现适当的身份验证和授权机制

## 支持和社区

- [GitHub](https://github.com/tegnike/aituber-kit)
- [Discord](https://discord.gg/5rHEue52nZ)
- [X (Twitter)](https://x.com/tegnike)

## 许可证

从v2.0.0版本开始，本项目采用**自定义许可证**。详情请查看[许可证页面](/zh/guide/license)。
