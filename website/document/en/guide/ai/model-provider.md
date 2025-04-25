# AI Service Settings

## Overview

In AITuberKit, you can select and use various AI services (OpenAI, Anthropic, Google Gemini, etc.). These settings allow you to select the AI service and model to use, set API keys, and more.

## Supported AI Services

AITuberKit supports the following AI services:

- OpenAI - Provides high-performance models such as GPT-4o, GPT-4.5
- Anthropic - Provides Claude 3.5 Sonnet, Claude 3.7 Sonnet, etc.
- Google Gemini - Provides Gemini 2.0 Flash, Gemini 1.5 series
- Azure OpenAI - OpenAI models on the Azure platform
- Groq - Provides various models specialized for fast inference
- Cohere - Provides Command-R series
- Mistral AI - Provides Mistral Large, Open Mistral, etc.
- Perplexity - Provides Llama 3.1 Sonar series
- Fireworks - Provides optimized implementations of Llama, Mixtral, etc.
- DeepSeek - Provides DeepSeek Chat, DeepSeek Reasoner
- LM Studio - Provides a local LLM execution environment
- Ollama - Provides a local LLM execution environment
- Dify - Custom chatbot building platform
- Custom API - Use your own API

## OpenAI

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-...
```

**Supported Models**:

- gpt-4o-2024-11-20
- gpt-4.5-preview-2025-02-27
- gpt-4o-mini-2024-07-18
- chatgpt-4o-latest

**Getting an API Key**:
API keys can be obtained from [OpenAI's API keys page](https://platform.openai.com/account/api-keys).

## Anthropic

```bash
# Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-...
```

**Supported Models**:

- claude-3-5-sonnet-20241022
- claude-3-7-sonnet-20250219
- claude-3-opus-20240229
- claude-3-5-haiku-20241022

**Getting an API Key**:
API keys can be obtained from the [Anthropic Console](https://console.anthropic.com).

## Google Gemini

```bash
# Google Gemini API Key
GOOGLE_API_KEY=...
```

**Supported Models**:

- gemini-2.0-flash-001
- gemini-1.5-flash-latest
- gemini-1.5-flash-8b-latest
- gemini-1.5-pro-latest

**Getting an API Key**:
API keys can be obtained from [Google AI Studio](https://aistudio.google.com/app/apikey?hl=en).

#### Google Search Grounding Feature

With Google Gemini, you can use the "Search Grounding" feature, which utilizes real-time web searches when generating AI responses.

```bash
# Enable Search Grounding feature
NEXT_PUBLIC_USE_SEARCH_GROUNDING=true
```

::: tip
The Search Grounding feature is only available with Google Gemini 1.5 Flash, Gemini 1.5 Pro, and Gemini 2.0 Flash models.
:::

## Azure OpenAI

```bash
# Azure OpenAI API Key
AZURE_API_KEY=...
# Azure OpenAI Endpoint
AZURE_ENDPOINT="https://RESOURCE_NAME.openai.azure.com/openai/deployments/DEPLOYMENT_NAME/chat/completions?api-version=API_VERSION"
```

**Getting an API Key**:
API keys can be obtained from the [Azure Portal](https://portal.azure.com/#view/Microsoft_Azure_AI/AzureOpenAI/keys).

## Groq

```bash
# Groq API Key
GROQ_API_KEY=...
```

**Supported Models**:

- gemma2-9b-it
- llama-3.3-70b-versatile
- llama3-8b-8192
- mixtral-8x7b-32768

**Getting an API Key**:
API keys can be obtained from the [Groq Dashboard](https://console.groq.com/keys).

## Cohere

```bash
# Cohere API Key
COHERE_API_KEY=...
```

**Supported Models**:

- command-r-plus
- command-r-plus-08-2024
- command-r
- command-r-08-2024
- command-light
- command-light-nightly
- command-nightly

**Getting an API Key**:
API keys can be obtained from the [Cohere Dashboard](https://dashboard.cohere.com/api-keys).

## Mistral AI

```bash
# Mistral AI API Key
MISTRALAI_API_KEY=...
```

**Supported Models**:

- mistral-large-latest
- open-mistral-nemo
- codestral-latest
- mistral-embed

**Getting an API Key**:
API keys can be obtained from the [Mistral AI Dashboard](https://console.mistral.ai/api-keys/).

## Perplexity

```bash
# Perplexity API Key
PERPLEXITY_API_KEY=...
```

**Supported Models**:

- llama-3.1-sonar-small-128k-online
- llama-3.1-sonar-large-128k-online
- llama-3.1-sonar-huge-128k-online
- llama-3.1-sonar-small-128k-chat
- llama-3.1-sonar-large-128k-chat

**Getting an API Key**:
API keys can be obtained from the [Perplexity Dashboard](https://www.perplexity.ai/settings/api).

## Fireworks

```bash
# Fireworks API Key
FIREWORKS_API_KEY=...
```

**Supported Models**:

- firefunction-v2
- llama-v3p1-405b-instruct
- llama-v3p1-70b-instruct
- llama-v3p1-8b-instruct
- llama-v3-70b-instruct
- mixtral-8x22b-instruct
- mixtral-8x7b-instruct

**Getting an API Key**:
API keys can be obtained from the [Fireworks Dashboard](https://fireworks.ai/account/api-keys).

## DeepSeek

```bash
# DeepSeek API Key
DEEPSEEK_API_KEY=...
```

**Supported Models**:

- deepseek-chat
- deepseek-reasoner

**Getting an API Key**:
API keys can be obtained from the [DeepSeek Platform](https://platform.deepseek.com/api_keys).

## LM Studio, Ollama

```bash
# Local LLM URL
# ex. LM Studio: http://localhost:1234/v1/chat/completions
# ex. Ollama: http://localhost:11434/v1/chat/completions
NEXT_PUBLIC_LOCAL_LLM_URL=""
# Local LLM Model
NEXT_PUBLIC_LOCAL_LLM_MODEL=""
```

To use a local LLM, you need to set up and start a separate server.

**Setup Example**: [How to Set Up Ollama](https://note.com/schroneko/n/n8b1a5bbc740b)

## Dify

Dify is a platform that allows you to easily build custom chatbots.

```bash
# Dify API Key
DIFY_API_KEY=""
# Dify API URL
DIFY_URL=""
```

::: warning Note
Dify only supports "Chatbot" or "Agent" type applications.<br>
Also, when using Dify, the number of past messages to retain and system prompts need to be configured on the Dify side.<br>
If you're not getting satisfactory responses, try deleting the conversation history before asking again.
:::

## Custom API

To use a custom API, set the following environment variables:

```bash
# Custom API URL
NEXT_PUBLIC_CUSTOM_API_URL=""
# Custom API Headers
NEXT_PUBLIC_CUSTOM_API_HEADERS=""
# Custom API Body
NEXT_PUBLIC_CUSTOM_API_BODY=""
# Enable system messages in custom API (true/false)
NEXT_PUBLIC_INCLUDE_SYSTEM_MESSAGES_IN_CUSTOM_API=true
```

::: warning Note
Streaming mode is always enabled for this API. Please pay attention to the response format.<br>
While we have tested with OpenAI-compatible APIs and some other APIs, we cannot guarantee operation with all APIs.
:::
