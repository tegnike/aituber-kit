import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { createCanvas } from 'canvas'
import { OpenAI } from 'openai'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

export const config = {
  api: {
    bodyParser: false,
  },
}

const systemPrompt = `You are a presentation expert. Given an image of a slide, 
    please create a script that is easy to understand for first-time listeners. Please follow these constraints:
    - No need for opening and closing greetings
    - Create the script in {{language}}
    - If the language is Japanese, use katakana only for parts that use the alphabet
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

async function createSlideLine(
  imageBase64: string,
  apiKey: string,
  model: string,
  selectLanguage: string,
  previousResult: string | null
) {
  const client = new OpenAI({ apiKey })
  const additionalPrompt = previousResult
    ? `Previous slide content: ${previousResult}`
    : 'This is the first slide.'

  const response = await client.chat.completions.create({
    model: `${model}`,
    messages: [
      {
        role: 'system',
        content: `${systemPrompt.replace('{{language}}', selectLanguage)}\n${additionalPrompt}`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `${imageBase64}`,
            },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message?.content || '{}')
  return result
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = formidable({ multiples: true })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).send('Form parse error')
      return
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    const folderName = Array.isArray(fields.folderName)
      ? fields.folderName[0]
      : fields.folderName
    const apiKey = Array.isArray(fields.apiKey)
      ? fields.apiKey[0]
      : fields.apiKey
    const model = Array.isArray(fields.model) ? fields.model[0] : fields.model
    const selectLanguage = Array.isArray(fields.selectLanguage)
      ? fields.selectLanguage[0]
      : fields.selectLanguage

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
      if (apiKey && model) {
        const slideLine = await createSlideLine(
          imgBase64,
          apiKey,
          model,
          language,
          previousResult
        )
        slideLine.page = i // ページ番号を追加
        scriptList.push(slideLine)
        console.log(`=== slideLine ${i} ===`)
        console.log(slideLine.line)
        previousResult = slideLine.line
      } else {
        throw new Error('API Key and Model must not be undefined')
      }

      // Markdownコンテンツの形成
      markdownContent += `\n---\n![bg](${imgBase64})\n`
    }

    console.log('end convert')

    // MarkdownファイルとJSONファイルを保存
    fs.writeFileSync(markdownPath, markdownContent)
    fs.writeFileSync(jsonPath, JSON.stringify(scriptList, null, 2))

    res.status(200).json({ message: 'PDFが変換されました' })
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
    case 'zh-TW':
      return 'Chinese'
    case 'ko':
      return 'Korean'
    default:
      return 'Japanese'
  }
}

export default handler
