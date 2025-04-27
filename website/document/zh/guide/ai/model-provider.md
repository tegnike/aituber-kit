# AI服务设置

## 概述

在AITuberKit中，您可以选择并使用各种AI服务（OpenAI、Anthropic、Google Gemini等）。这些设置允许您选择要使用的AI服务和模型，设置API密钥等。

## 支持的AI服务

AITuberKit支持以下AI服务：

- OpenAI - 提供GPT-4o、GPT-4.5等高性能模型
- Anthropic - 提供Claude 3.5 Sonnet、Claude 3.7 Sonnet等
- Google Gemini - 提供Gemini 2.0 Flash、Gemini 1.5系列
- Azure OpenAI - Azure平台上的OpenAI模型
- Groq - 提供专注于快速推理的各种模型
- Cohere - 提供Command-R系列
- Mistral AI - 提供Mistral Large、Open Mistral等
- Perplexity - 提供Llama 3.1 Sonar系列
- Fireworks - 提供Llama、Mixtral等的优化实现
- DeepSeek - 提供DeepSeek Chat、DeepSeek Reasoner
- LM Studio - 提供本地LLM执行环境
- Ollama - 提供本地LLM执行环境
- Dify - 自定义聊天机器人构建平台
- 自定义API - 使用自己的API

## OpenAI

```bash
# OpenAI API密钥
OPENAI_API_KEY=sk-...
```

**支持的模型**:

- gpt-4o-2024-11-20
- gpt-4.5-preview-2025-02-27
- gpt-4o-mini-2024-07-18
- chatgpt-4o-latest

**获取API密钥**:
可以从[OpenAI的API keys页面](https://platform.openai.com/account/api-keys)获取API密钥。

## Anthropic

```bash
# Anthropic API密钥
ANTHROPIC_API_KEY=sk-ant-...
```

**支持的模型**:

- claude-3-5-sonnet-20241022
- claude-3-7-sonnet-20250219
- claude-3-opus-20240229
- claude-3-5-haiku-20241022

**获取API密钥**:
可以从[Anthropic控制台](https://console.anthropic.com)获取API密钥。

## Google Gemini

```bash
# Google Gemini API密钥
GOOGLE_API_KEY=...
```

**支持的模型**:

- gemini-2.0-flash-001
- gemini-1.5-flash-latest
- gemini-1.5-flash-8b-latest
- gemini-1.5-pro-latest

**获取API密钥**:
可以从[Google AI Studio](https://aistudio.google.com/app/apikey?hl=zh)获取API密钥。

#### Google搜索接地功能

使用Google Gemini，您可以使用"搜索接地"功能，该功能在生成AI响应时利用实时网络搜索。

```bash
# 启用搜索接地功能
NEXT_PUBLIC_USE_SEARCH_GROUNDING=true
```

::: tip
搜索接地功能仅适用于Google Gemini 1.5 Flash、Gemini 1.5 Pro和Gemini 2.0 Flash模型。
:::

## Azure OpenAI

```bash
# Azure OpenAI API密钥
AZURE_API_KEY=...
# Azure OpenAI端点
AZURE_ENDPOINT="https://RESOURCE_NAME.openai.azure.com/openai/deployments/DEPLOYMENT_NAME/chat/completions?api-version=API_VERSION"
```

**获取API密钥**:
可以从[Azure门户](https://portal.azure.com/#view/Microsoft_Azure_AI/AzureOpenAI/keys)获取API密钥。

## Groq

```bash
# Groq API密钥
GROQ_API_KEY=...
```

**支持的模型**:

- gemma2-9b-it
- llama-3.3-70b-versatile
- llama3-8b-8192
- mixtral-8x7b-32768

**获取API密钥**:
可以从[Groq仪表板](https://console.groq.com/keys)获取API密钥。

## Cohere

```bash
# Cohere API密钥
COHERE_API_KEY=...
```

**支持的模型**:

- command-r-plus
- command-r-plus-08-2024
- command-r
- command-r-08-2024
- command-light
- command-light-nightly
- command-nightly

**获取API密钥**:
可以从[Cohere仪表板](https://dashboard.cohere.com/api-keys)获取API密钥。

## Mistral AI

```bash
# Mistral AI API密钥
MISTRALAI_API_KEY=...
```

**支持的模型**:

- mistral-large-latest
- open-mistral-nemo
- codestral-latest
- mistral-embed

**获取API密钥**:
可以从[Mistral AI仪表板](https://console.mistral.ai/api-keys/)获取API密钥。

## Perplexity

```bash
# Perplexity API密钥
PERPLEXITY_API_KEY=...
```

**支持的模型**:

- llama-3.1-sonar-small-128k-online
- llama-3.1-sonar-large-128k-online
- llama-3.1-sonar-huge-128k-online
- llama-3.1-sonar-small-128k-chat
- llama-3.1-sonar-large-128k-chat

**获取API密钥**:
可以从[Perplexity仪表板](https://www.perplexity.ai/settings/api)获取API密钥。

## Fireworks

```bash
# Fireworks API密钥
FIREWORKS_API_KEY=...
```

**支持的模型**:

- firefunction-v2
- llama-v3p1-405b-instruct
- llama-v3p1-70b-instruct
- llama-v3p1-8b-instruct
- llama-v3-70b-instruct
- mixtral-8x22b-instruct
- mixtral-8x7b-instruct

**获取API密钥**:
可以从[Fireworks仪表板](https://fireworks.ai/account/api-keys)获取API密钥。

## DeepSeek

```bash
# DeepSeek API密钥
DEEPSEEK_API_KEY=...
```

**支持的模型**:

- deepseek-chat
- deepseek-reasoner

**获取API密钥**:
可以从[DeepSeek平台](https://platform.deepseek.com/api_keys)获取API密钥。

## LM Studio, Ollama

```bash
# 本地LLM URL
# 例如 Ollama: http://localhost:11434/v1/chat/completions
# 例如 LM Studio: http://localhost:1234/v1/chat/completions
NEXT_PUBLIC_LOCAL_LLM_URL=""
# 本地LLM模型
NEXT_PUBLIC_LOCAL_LLM_MODEL=""
```

要使用本地LLM，您需要设置并启动单独的服务器。

**设置示例**: [如何设置Ollama](https://note.com/schroneko/n/n8b1a5bbc740b)

## Dify

Dify是一个允许您轻松构建自定义聊天机器人的平台。

```bash
# Dify API密钥
DIFY_API_KEY=""
# Dify API URL
DIFY_URL=""
```

::: warning 注意
Dify仅支持"聊天机器人"或"代理"类型的应用程序。<br>
此外，使用Dify时，过去消息的保留数量和系统提示需要在Dify端进行设置。<br>
如果无法获得良好的回答，请删除对话历史记录后再次提问。
:::

## 自定义API

要使用自定义API，请设置以下环境变量：

```bash
# 自定义API URL
NEXT_PUBLIC_CUSTOM_API_URL=""
# 自定义API Headers
NEXT_PUBLIC_CUSTOM_API_HEADERS=""
# 自定义API Body
NEXT_PUBLIC_CUSTOM_API_BODY=""
# 在自定义API中启用系统消息（true/false）
NEXT_PUBLIC_INCLUDE_SYSTEM_MESSAGES_IN_CUSTOM_API=true
```

::: warning 注意
此API始终启用流式模式。请注意返回格式。<br>
虽然我们测试了OpenAI兼容的API和一些其他API，但我们不能保证所有API都能正常运行。
:::
