# AI设置

## 概述

AITuberKit与多个AI服务合作，实现角色的对话能力。本页介绍AI设置的基本内容和支持的AI服务。

**环境变量**:

```bash
# AI服务选择
# openai, anthropic, google, azure, groq, cohere,
# mistralai, perplexity, fireworks, deepseek, localLlm, dify
NEXT_PUBLIC_SELECT_AI_SERVICE=openai

# 选择的AI模型名称
NEXT_PUBLIC_SELECT_AI_MODEL=gpt-4o-2024-11-20

# 保留的过去消息数量
NEXT_PUBLIC_MAX_PAST_MESSAGES=10

# 调整对话随机性的温度参数（0.0-2.0）
NEXT_PUBLIC_TEMPERATURE=0.7

# 最大令牌数
NEXT_PUBLIC_MAX_TOKENS=4096
```

## 支持的AI服务

AITuberKit支持以下AI服务：

- OpenAI GPT
- Anthropic Claude
- Google Gemini
- Azure OpenAI
- Groq
- Cohere
- Mistral AI
- Perplexity
- Fireworks
- DeepSeek
- LM Studio
- Ollama
- Dify
- 自定义API

使用每项服务都需要相应的API密钥。

::: tip
API密钥可能会产生使用费用。使用前请检查各服务的价格结构。
:::

## 对话设置

在AITuberKit中，与AI对话可以进行以下设置：

- **保留的过去消息数量**：设置作为对话历史保留的消息数量。消息越多，对上下文的理解越好，但API使用成本也会增加。
- **温度设置**：调整响应的随机性。值越高，响应越多样化；值越低，响应越确定性。
- **最大令牌数**：设置响应的最大令牌数。此值因使用的AI模型而异。
