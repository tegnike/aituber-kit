# AI Settings

## Overview

AITuberKit works with multiple AI services to enable character conversation capabilities. This page explains the basic content of AI settings and the supported AI services.

**Environment Variables**:

```bash
# AI service selection
# openai, anthropic, google, azure, groq, cohere,
# mistralai, perplexity, fireworks, deepseek, localLlm, dify
NEXT_PUBLIC_SELECT_AI_SERVICE=openai

# Selected AI model name
NEXT_PUBLIC_SELECT_AI_MODEL=gpt-4o-2024-11-20

# Number of past messages to retain
NEXT_PUBLIC_MAX_PAST_MESSAGES=10

# Temperature parameter to adjust conversation randomness (0.0-2.0)
NEXT_PUBLIC_TEMPERATURE=0.7

# Maximum number of tokens
NEXT_PUBLIC_MAX_TOKENS=4096
```

## Supported AI Services

AITuberKit supports the following AI services:

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
- Local LLM
- Dify

Using each service requires the corresponding API key.

::: tip
API keys may incur usage fees. Please check the pricing structure of each service before using.
:::

## Conversation Settings

In AITuberKit, the following settings are available for conversations with AI:

- **Number of Past Messages to Retain**: Sets the number of messages to retain as conversation history. More messages provide better context understanding but increase API usage costs.
- **Temperature Setting**: Adjusts the randomness of responses. Higher values result in more diverse responses, while lower values result in more deterministic responses.
- **Maximum Number of Tokens**: Sets the maximum number of tokens for responses. This value varies depending on the AI model being used.
