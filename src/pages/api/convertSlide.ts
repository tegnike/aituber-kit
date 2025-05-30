import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { createCanvas } from 'canvas'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

import { AIService } from '@/features/constants/settings'
import { isMultiModalModel } from '@/features/constants/aiModels'

type AIServiceConfig = Record<AIService, () => any>

export const config = {
  api: {
    bodyParser: false,
  },
}

export const schema = z.object({
  line: z.string(),
  notes: z.string(),
  page: z.number().optional(),
})

const systemPrompt = `You are a presentation expert. Given an image of a slide, 
    please create a script that is easy to understand for first-time listeners. Please follow these constraints:
    - No need for opening and closing greetings
    - Create the script in {{language}}
    - If the language is Japanese, use hiragana or katakana instead of alphabet words
    - Do not include line breaks
    - The script for each slide should be no longer than about 60 seconds of speech
    - The output format should follow the JSON format below. Do not provide any response other than JSON
    {{
    "line": str,
    "notes": str
    }}
    - Put the script in "line", and any supporting content that couldn't be included in the script in "notes".
    - Do not include any links in either the "line" or "notes" fields
    `

const systemPromptForAnthropic = `You are an AI assistant tasked with creating a presentation script based on an image of a slide. Your goal is to produce a script that is easy to understand for first-time listeners, along with supporting notes, all in a specific JSON format. Follow these instructions carefully:

1. You must follow the below constraints:
   You must create the script in {{language}}
   You will be provided with an image of a presentation slide that you will analyze to create the script.

2. Begin by carefully analyzing the slide image. Look for:
   - The main title or topic
   - Key points or bullet points
   - Any graphs, charts, or visual elements
   - Important numbers or statistics
   - Overall theme or message of the slide

3. Create a script based on the slide content that:
   - Is easy to understand for first-time listeners
   - Can be spoken in approximately 60 seconds
   - Does not include opening or closing greetings
   - Explains the main points of the slide clearly and concisely
   - Describes any visual elements if they are crucial to understanding the content

4. If the specified language is Japanese, use hiragana or katakana instead of alphabet words

5. Prepare additional notes that couldn't be included in the main script due to time constraints or complexity. These notes should provide extra context, explanations, or examples that support the main script.

6. Format your response strictly as a JSON object with two fields:
   - "line": Contains the main script (string)
   - "notes": Contains the supporting notes (string)

7. Ensure that:
   - The script does not include line breaks
   - Neither the "line" nor "notes" fields contain any links
   - The entire response is valid JSON

Here's an example of a good response format:
<example>
{
  "line": "This slide showcases our company's revenue growth over the past five years. We've seen a steady increase from $1 million in 2018 to $5 million in 2022, representing a 400% growth. The graph clearly illustrates this upward trend, with the steepest rise occurring between 2020 and 2021.",
  "notes": "Key factors contributing to growth: 1. Launch of new product line in 2020. 2. Expansion into international markets in 2021. 3. Improved customer retention strategies. Consider discussing challenges faced during COVID-19 pandemic and how they were overcome."
}
</example>

Here's an example of a bad response format:
<example>
{
  "line": "Hello everyone! Today we'll be discussing our company's revenue growth.

  As you can see from the slide, our revenue has increased significantly over the past five years.

  In 2018, we started at $1 million, and by 2022, we reached $5 million. That's an impressive 400% growth!

  The graph clearly shows this upward trend. Notice how the line gets steeper between 2020 and 2021? That was a particularly good year for us.

  Thank you for your attention!",
  "notes": "For more information, visit our website at www.ourcompany.com"
}
</example>

Remember:
- Do not include any content outside of the JSON structure
- Ensure the script ("line") can be spoken in about 60 seconds
- Do not include links in either field
- Avoid line breaks in the script
- Focus on creating clear, concise content that first-time listeners can easily understand

Now, analyze the provided slide image and create the appropriate JSON response.`

async function convertPdfToImages(pdfBuffer: Buffer): Promise<string[]> {
  // PDFファイルを読み込む
  const pdfData = new Uint8Array(pdfBuffer)
  const pdf = await pdfjsLib.getDocument({
    data: pdfData,
    standardFontDataUrl: './node_modules/pdfjs-dist/standard_fonts/',
  }).promise
  const pageCount = pdf.numPages
  const images: string[] = []

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.0 })

    // Canvasを作成
    const canvas = createCanvas(viewport.width, viewport.height)
    const context = canvas.getContext('2d')

    // ページをレンダリング
    const renderContext = {
      canvasContext: context as any,
      viewport: viewport,
    }
    await page.render(renderContext).promise

    // CanvasをBase64フォーマットに変換
    const imgBuffer = canvas.toBuffer('image/png')
    const base64Image = imgBuffer.toString('base64')
    images.push(`data:image/png;base64,${base64Image}`)
  }

  return images
}

interface SlideLineResponse {
  line: string
  notes: string
  page?: number
}

async function createSlideLine(
  imageBase64: string,
  apiKey: string,
  aiService: string,
  model: string,
  selectLanguage: string,
  previousResult: string | null
): Promise<SlideLineResponse> {
  const additionalPrompt = previousResult
    ? `Previous slide content: ${previousResult}`
    : 'This is the first slide.'

  // マルチモーダル対応のチェック
  if (!isMultiModalModel(aiService as AIService, model)) {
    throw new Error(`Model ${model} does not support multimodal features`)
  }

  const aiServiceConfig: Partial<AIServiceConfig> = {
    openai: () => createOpenAI({ apiKey }),
    anthropic: () => createAnthropic({ apiKey }),
    google: () => createGoogleGenerativeAI({ apiKey }),
    // 他のプロバイダーは必要に応じて追加
  }

  const aiServiceInstance = aiServiceConfig[aiService as AIService]

  if (!aiServiceInstance) {
    throw new Error(
      `AI service ${aiService} is not supported for slide conversion`
    )
  }

  const instance = aiServiceInstance()

  let response: any
  try {
    if (aiService == 'anthropic') {
      response = await generateObject({
        model: instance(model),
        messages: [
          {
            role: 'system',
            content: `${systemPromptForAnthropic.replace('{{language}}', selectLanguage)}\n${additionalPrompt}`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe the image in detail.',
              },
              {
                type: 'image',
                image: `${imageBase64}`,
              },
            ],
          },
        ],
        schema: schema,
      })
    } else {
      response = await generateObject({
        model: instance(model),
        messages: [
          {
            role: 'system',
            content: `${systemPrompt.replace('{{language}}', selectLanguage)}\n${additionalPrompt}`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe the image in detail.',
              },
              {
                type: 'image',
                image: `${imageBase64}`,
              },
            ],
          },
        ],
        output: 'no-schema',
        mode: 'json',
      })
    }
  } catch (error) {
    console.error('AI service request error:', error)
    throw new Error(`Failed to request AI service: ${error}`)
  }

  if (!response || !response.object) {
    throw new Error('Invalid response from AI service')
  }

  return response.object as unknown as SlideLineResponse
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = formidable({ multiples: true })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'Form parse error' })
      return
    }

    const getField = (fieldName: string) => {
      const field = fields[fieldName]
      return Array.isArray(field) ? field[0] : field
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    const folderName = getField('folderName')
    const aiService = getField('aiService')
    const apiKey = getField('apiKey')
    const model = getField('model')
    const selectLanguage = getField('selectLanguage')

    if (!file) {
      res.status(400).send('No file uploaded')
      return
    }

    const pdfBuffer = fs.readFileSync(file.filepath)
    const images = await convertPdfToImages(pdfBuffer)
    const slideDir = path.join(
      process.cwd(),
      'public',
      'slides',
      folderName || 'defaultFolder'
    )
    const markdownPath = path.join(slideDir, 'slides.md')
    const jsonPath = path.join(slideDir, 'scripts.json')

    // 生成されたスライドデータを保存するディレクトリを作成
    if (!fs.existsSync(slideDir)) {
      fs.mkdirSync(slideDir, { recursive: true })
    }

    const scriptList: unknown[] = []
    let markdownContent = '---\nmarp: true' // Markdownの初期コンテンツ
    let previousResult: string | null = null

    console.log('start convert')

    const language = getLanguage(selectLanguage)

    for (let i = 0; i < images.length; i++) {
      const imgBase64 = images[i]
      if (aiService && apiKey && model) {
        try {
          const slideLine = await createSlideLine(
            imgBase64,
            apiKey,
            aiService,
            model,
            language,
            previousResult
          )
          slideLine.page = i // ページ番号を追加
          scriptList.push(slideLine)
          console.log(`=== slideLine ${i} ===`)
          console.log(slideLine.line)
          previousResult = slideLine.line
        } catch (error) {
          console.error(`Error processing slide ${i}:`, error)
          res.status(500).json({ error: `Error processing slide ${i}` })
          return
        }
      } else {
        res
          .status(500)
          .json({ error: 'API Key and Model must not be undefined' })
        return
      }

      // Markdownコンテンツの形成
      markdownContent += `\n---\n![bg](${imgBase64})\n`
    }

    console.log('end convert')

    // MarkdownファイルとJSONファイルを保存
    try {
      fs.writeFileSync(markdownPath, markdownContent)
      fs.writeFileSync(jsonPath, JSON.stringify(scriptList, null, 2))
    } catch (error) {
      console.error('Error occurred while saving files:', error)
      res.status(500).json({ error: `Failed to save files: ${error}` })
      return
    }

    res.status(200).json({ message: 'PDF has been converted' })
  })
}

function getLanguage(selectLanguage: string | undefined) {
  if (!selectLanguage) {
    return 'Japanese'
  }
  switch (selectLanguage) {
    case 'ja':
      return 'Japanese'
    case 'en':
      return 'English'
    case 'zh':
      return 'Chinese'
    case 'ko':
      return 'Korean'
    case 'vi':
      return 'Vietnamese'
    case 'fr':
      return 'French'
    case 'es':
      return 'Spanish'
    case 'pt':
      return 'Portuguese'
    case 'de':
      return 'German'
    case 'ru':
      return 'Russian'
    case 'it':
      return 'Italian'
    case 'ar':
      return 'Arabic'
    case 'hi':
      return 'Hindi'
    case 'pl':
      return 'Polish'
    case 'th':
      return 'Thai'
    default:
      return 'Japanese'
  }
}

export default handler
