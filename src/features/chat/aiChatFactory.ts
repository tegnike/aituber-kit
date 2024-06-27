import { Message } from "@/features/messages/messages";
import { getOpenAIChatResponseStream } from "./openAiChat";
import { getAnthropicChatResponseStream } from "./anthropicChat";
import { getGoogleChatResponseStream } from "./googleChat";
import { getLocalLLMChatResponseStream } from "./localLLMChat";
import { getGroqChatResponseStream } from "./groqChat";
import { getDifyChatResponseStream } from "./difyChat";

export type AIService = "openai" | "anthropic" | "google" | "localLlm" | "groq" | "dify";

export interface AIServiceConfig {
  openai: { key: string; model: string };
  anthropic: { key: string; model: string };
  google: { key: string; model: string };
  localLlm: { url: string; model: string };
  groq: { key: string; model: string };
  dify: { 
    key: string; 
    url: string;
    conversationId: string;
    setConversationId: (id: string) => void;
  };
}

export async function getAIChatResponseStream(
  service: AIService,
  messages: Message[],
  config: AIServiceConfig
): Promise<ReadableStream<string> | null> {
  switch (service) {
    case "openai":
      return getOpenAIChatResponseStream(messages, config.openai.key, config.openai.model);
    case "anthropic":
      return getAnthropicChatResponseStream(messages, config.anthropic.key, config.anthropic.model);
    case "google":
      return getGoogleChatResponseStream(messages, config.google.key, config.google.model);
    case "localLlm":
      return getLocalLLMChatResponseStream(messages, config.localLlm.url, config.localLlm.model);
    case "groq":
      return getGroqChatResponseStream(messages, config.groq.key, config.groq.model);
    case "dify":
      return getDifyChatResponseStream(
        messages,
        config.dify.key,
        config.dify.url,
        config.dify.conversationId,
        config.dify.setConversationId
      );
    default:
      throw new Error(`Unsupported AI service: ${service}`);
  }
}
