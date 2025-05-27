import { getVercelAIChatResponse } from '@/features/chat/vercelAIChat'
import settingsStore from '@/features/stores/settings'
import { isMultiModalModel } from '@/features/constants/aiModels'

export const judgeSlide = async (
  queryText: string,
  scripts: string,
  supplement: string
): Promise<string> => {
  const ss = settingsStore.getState()
  const aiService = ss.selectAIService
  const aiModel = ss.selectAIModel

  // 現在選択されているモデルがマルチモーダル対応かチェック
  if (!isMultiModalModel(aiService, aiModel)) {
    throw new Error('Selected model does not support multimodal features')
  }

  const systemMessage = `
You are an AI tasked with determining whether a user's comment is a question about a given script document and supplementary text, and if so, which page of the document is most relevant to the question. Follow these instructions carefully:

1. You will be provided with a user's comment, a script document, and supplementary text. The script document is structured as a JSON array, where each object represents a page with "page", "line", and "supplement" fields. The supplementary text consists of a string.

2. Analyze the user's comment.

3. Determine if the comment is a question about the script document or the supplementary text. Consider the content and context of the comment in relation to the document's subject matter. Note that supplementary text may not always be present.

4. If the comment is a question about the script document:
   a. Review each page of the document to find the most relevant information.
   b. Determine which page contains information that best answers or relates to the user's question.
   c. Set the "judge" value to "true" and the "page" value to the number of the most relevant page.

5. If the comment is a question about the supplementary text:
   a. Set the "judge" value to "true" and the "page" value to an empty string.

6. If the comment is not a question about either the script document or the supplementary text:
   a. Set the "judge" value to "false" and the "page" value to an empty string.

7. Provide your answer in JSON format as follows:
   {"judge": "true/false", "page": "number/empty string"}

Here is the content of the script document:
<document>
${scripts}
</document>

Here is the content of the supplementary text:
<document>
${supplement}
</document>

Based on the user's comment and the content of both the script document and supplementary text, provide "only" your final answer in the specified JSON format.
`

  const response = await getVercelAIChatResponse([
    { role: 'system', content: systemMessage },
    { role: 'user', content: queryText },
  ])
  return response.text
}
