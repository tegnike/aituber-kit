# AI設定

## 概要

AITuberKitでは、複数のAIサービスと連携して、キャラクターの会話能力を実現します。このページでは、AI設定の基本的な内容と、サポートされているAIサービスについて説明します。

**環境変数**:

```bash
# AIサービスの選択
# openai, anthropic, google, azure, groq, cohere,
# mistralai, perplexity, fireworks, deepseek, localLlm, dify
NEXT_PUBLIC_SELECT_AI_SERVICE=openai

# 選択するAIモデル名
NEXT_PUBLIC_SELECT_AI_MODEL=gpt-4o-2024-11-20

# 過去のメッセージ保持数
NEXT_PUBLIC_MAX_PAST_MESSAGES=10

# 会話のランダム性を調整する温度パラメータ（0.0～2.0）
NEXT_PUBLIC_TEMPERATURE=0.7

# 最大トークン数
NEXT_PUBLIC_MAX_TOKENS=4096
```

## サポートされているAIサービス

AITuberKitは以下のAIサービスをサポートしています：

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
- ローカルLLM
- Dify

各サービスの利用には、対応するAPIキーが必要です。

::: tip
APIキーには利用料金が発生する場合があります。各サービスの料金体系を確認してから利用してください。
:::

## 会話設定

AITuberKitでは、AIとの会話に関する以下の設定が可能です：

- **過去のメッセージ保持数**: 会話の履歴として保持するメッセージの数を設定します。数が多いほど文脈を理解した応答が得られますが、APIの利用コストが増加します。
- **温度設定**: 応答のランダム性を調整できます。値が高いほど多様な応答になり、低いほど決定的な応答になります。
- **最大トークン数**: 応答の最大トークン数を設定します。この値は利用中のAIモデルによって異なります。
