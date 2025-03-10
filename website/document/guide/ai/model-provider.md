# AIサービス設定

## 概要

AITuberKitでは、様々なAIサービス（OpenAI、Anthropic、Google Geminiなど）を選択して利用することができます。この設定では、利用するAIサービスとモデルの選択、APIキーの設定などを行います。

## サポートされているAIサービス

AITuberKitは以下のAIサービスをサポートしています：

- OpenAI - GPT-4o、GPT-4.5などの高性能モデルを提供
- Anthropic - Claude 3.5 Sonnet、Claude 3.7 Sonnetなどを提供
- Google Gemini - Gemini 2.0 Flash、Gemini 1.5シリーズを提供
- Azure OpenAI - Azureプラットフォーム上のOpenAIモデル
- Groq - 高速推論に特化した様々なモデルを提供
- Cohere - Command-Rシリーズを提供
- Mistral AI - Mistral Large、Open Mistralなどを提供
- Perplexity - Llama 3.1 Sonarシリーズを提供
- Fireworks - Llama、Mixtralなどの最適化実装を提供
- DeepSeek - DeepSeek Chat、DeepSeek Reasonerを提供
- ローカルLLM - Ollamaなどのローカル実行環境と連携
- Dify - カスタムチャットボット構築プラットフォーム

## OpenAI

```bash
# OpenAI API キー
OPENAI_API_KEY=sk-...
```

**対応モデル**:

- gpt-4o-2024-11-20
- gpt-4.5-preview-2025-02-27
- gpt-4o-mini-2024-07-18
- chatgpt-4o-latest

**APIキーの取得**:
APIキーは[OpenAIのAPI keysページ](https://platform.openai.com/account/api-keys)から取得できます。

## Anthropic

```bash
# Anthropic API キー
ANTHROPIC_API_KEY=sk-ant-...
```

**対応モデル**:

- claude-3-5-sonnet-20241022
- claude-3-7-sonnet-20250219
- claude-3-opus-20240229
- claude-3-5-haiku-20241022

**APIキーの取得**:
APIキーは[Anthropicコンソール](https://console.anthropic.com)から取得できます。

## Google Gemini

```bash
# Google Gemini API キー
GOOGLE_API_KEY=...
```

**対応モデル**:

- gemini-2.0-flash-001
- gemini-1.5-flash-latest
- gemini-1.5-flash-8b-latest
- gemini-1.5-pro-latest

**APIキーの取得**:
APIキーは[Google AI Studio](https://aistudio.google.com/app/apikey?hl=ja)から取得できます。

#### Googleサーチグラウンディング機能

Google Geminiでは、AIの回答生成時にリアルタイムでウェブ検索を活用する「サーチグラウンディング」機能が利用できます。

```bash
# サーチグラウンディング機能の有効化
NEXT_PUBLIC_USE_SEARCH_GROUNDING=true
```

::: tip
サーチグラウンディング機能は、Google Gemini 1.5 Flash、Gemini 1.5 Pro、Gemini 2.0 Flashモデルでのみ利用可能です。
:::

## Azure OpenAI

```bash
# Azure OpenAI API キー
AZURE_API_KEY=...
# Azure OpenAI エンドポイント
AZURE_ENDPOINT="https://RESOURCE_NAME.openai.azure.com/openai/deployments/DEPLOYMENT_NAME/chat/completions?api-version=API_VERSION"
```

**APIキーの取得**:
APIキーは[Azureポータル](https://portal.azure.com/#view/Microsoft_Azure_AI/AzureOpenAI/keys)から取得できます。

## Groq

```bash
# Groq API キー
GROQ_API_KEY=...
```

**対応モデル**:

- gemma2-9b-it
- llama-3.3-70b-versatile
- llama3-8b-8192
- mixtral-8x7b-32768

**APIキーの取得**:
APIキーは[Groqダッシュボード](https://console.groq.com/keys)から取得できます。

## Cohere

```bash
# Cohere API キー
COHERE_API_KEY=...
```

**対応モデル**:

- command-r-plus
- command-r-plus-08-2024
- command-r
- command-r-08-2024
- command-light
- command-light-nightly
- command-nightly

**APIキーの取得**:
APIキーは[Cohereダッシュボード](https://dashboard.cohere.com/api-keys)から取得できます。

## Mistral AI

```bash
# Mistral AI API キー
MISTRALAI_API_KEY=...
```

**対応モデル**:

- mistral-large-latest
- open-mistral-nemo
- codestral-latest
- mistral-embed

**APIキーの取得**:
APIキーは[Mistral AIダッシュボード](https://console.mistral.ai/api-keys/)から取得できます。

## Perplexity

```bash
# Perplexity API キー
PERPLEXITY_API_KEY=...
```

**対応モデル**:

- llama-3.1-sonar-small-128k-online
- llama-3.1-sonar-large-128k-online
- llama-3.1-sonar-huge-128k-online
- llama-3.1-sonar-small-128k-chat
- llama-3.1-sonar-large-128k-chat

**APIキーの取得**:
APIキーは[Perplexityダッシュボード](https://www.perplexity.ai/settings/api)から取得できます。

## Fireworks

```bash
# Fireworks API キー
FIREWORKS_API_KEY=...
```

**対応モデル**:

- firefunction-v2
- llama-v3p1-405b-instruct
- llama-v3p1-70b-instruct
- llama-v3p1-8b-instruct
- llama-v3-70b-instruct
- mixtral-8x22b-instruct
- mixtral-8x7b-instruct

**APIキーの取得**:
APIキーは[Fireworksダッシュボード](https://fireworks.ai/account/api-keys)から取得できます。

## DeepSeek

```bash
# DeepSeek API キー
DEEPSEEK_API_KEY=...
```

**対応モデル**:

- deepseek-chat
- deepseek-reasoner

**APIキーの取得**:
APIキーは[DeepSeekプラットフォーム](https://platform.deepseek.com/api_keys)から取得できます。

## ローカルLLM

```bash
# ローカルLLM URL
# ex. Ollama: http://localhost:11434/v1/chat/completions
# ex. LM Studio: http://localhost:1234/v1/chat/completions
NEXT_PUBLIC_LOCAL_LLM_URL=""
# ローカルLLMモデル
NEXT_PUBLIC_LOCAL_LLM_MODEL=""
```

ローカルLLMを利用する場合は、別途サーバーの設定と起動が必要です。

**設定例**: [Ollamaの設定方法](https://note.com/schroneko/n/n8b1a5bbc740b)

## Dify

Difyはカスタムチャットボットを簡単に構築できるプラットフォームです。

```bash
# Dify API キー
DIFY_API_KEY=""
# Dify API URL
DIFY_URL=""
```

::: warning 注意
Difyでは、「チャットボット」または「エージェント」タイプのアプリケーションのみ対応しています。また、Dify使用時は過去のメッセージの保持数やシステムプロンプトは、Dify側で設定する必要があります。
:::
