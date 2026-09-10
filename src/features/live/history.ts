// GPT-Live startup input accepts at most 128 messages.
export const LIVE_HISTORY_MAX_MESSAGES = 128
export const LIVE_HISTORY_MAX_TOKENS = 8192
export const LIVE_INSTRUCTIONS_MAX_TOKENS = 16384

export function selectLiveHistory(
  messages: readonly { role: string; content?: unknown }[],
  maxPastMessages: number
): { role: 'user' | 'assistant'; content: string }[] {
  const count = Number.isFinite(maxPastMessages)
    ? Math.min(
        LIVE_HISTORY_MAX_MESSAGES,
        Math.max(0, Math.floor(maxPastMessages))
      )
    : 0
  if (count === 0) return []
  return messages
    .filter(
      (message): message is { role: 'user' | 'assistant'; content: string } =>
        ['user', 'assistant'].includes(message.role) &&
        typeof message.content === 'string'
    )
    .slice(-count)
    .map(({ role, content }) => ({ role, content }))
}
