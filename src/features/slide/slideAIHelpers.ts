import { Message } from '@/features/messages/messages'
import { getOpenAIChatResponse } from '@/features/chat/openAiChat'
import { getAnthropicChatResponse } from '@/features/chat/anthropicChat'
import settingsStore from '@/features/stores/settings'

export const judgeSlide = async (
  queryText: string,
  scripts: string,
  supplement: string
): Promise<string> => {
  const ss = settingsStore.getState()

  const systemMessage = `
You are an AI tasked with determining whether a user's comment is a question about a given document and, if so, which page of the document is most relevant to the question. Follow these instructions carefully:

1. You will be provided with a user's comment and a document. The document is structured as a JSON array, where each object represents a page with "page", "line", and "notes" fields.

2. Analyze the user's comment

3. Determine if the comment is a question about the document. Consider the content and context of the comment in relation to the document's subject matter.

4. If the comment is a question about the document:
   a. Review each page of the document to find the most relevant information.
   b. Determine which page contains information that best answers or relates to the user's question.
   c. Set the "judge" value to "true" and the "page" value to the number of the most relevant page.

5. If the comment is not a question about the document:
   a. Set the "judge" value to "false" and the "page" value to an empty string.

6. Provide your answer in JSON format as follows:
   {"judge": "true/false", "page": "number/empty string"}

Here is the document content:
<document>
${scripts}
</document>

Based on the user's comment and the document content, provide "only" your final answer in the specified JSON format.
`

  if (ss.selectAIService === 'openai') {
    const response = await getOpenAIChatResponse(
      [
        { role: 'system', content: systemMessage },
        { role: 'user', content: queryText },
      ],
      ss.openAiKey,
      ss.selectAIModel
    )
    return response.message
  } else if (ss.selectAIService === 'anthropic') {
    const response = await getAnthropicChatResponse(
      [
        { role: 'system', content: systemMessage },
        { role: 'user', content: queryText },
      ],
      ss.anthropicKey,
      ss.selectAIModel
    )
    return response.message
  } else {
    throw new Error('Unsupported AI service')
  }
}
