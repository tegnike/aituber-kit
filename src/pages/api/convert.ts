import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { createCanvas } from 'canvas'
import { OpenAI } from 'openai'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

export const config = {
  api: {
    bodyParser: false,
  },
}

const systemPrompt = `あなたはプレゼンテーションのプロです。画像でスライドが与えられますので、
    初めて聞く人でもわかりやすいセリフを作成してください。以下の制約を守るようにしてください
    - 初めと終わりのあいさつは不要です
    - セリフは日本語で作成
    - セリフでアルファベットを使う場合はその部分のみカタカナにすること
    - 改行は入れないこと
    - セリフの量は100秒程度で話せる量にすること
    - 出力フォーマットは以下のjsonフォーマットの通りにすること。またjson以外の回答はしないこと
    {{
    "line": str,
    "notes": str
    }}
    - lineにはセリフ、notesにはセリフの内容を補強する内容を入れてください。
    - notesの内容を元に質問を回答するため補足情報などを書くようにしてください。
    `

const ScriptsReasoning = z.object({
  line: z.string(),
  notes: z.string(),
})

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
  model: string
) {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  })
  const response = await openai.beta.chat.completions.parse({
    model: `${model}`,
    messages: [
      { role: 'system', content: systemPrompt },
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
    response_format: zodResponseFormat(ScriptsReasoning, 'scripts_reasoning'),
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
    let markdownContent = '---\nmarp: true\n---\n' // Markdownの初期コンテンツ

    for (let i = 0; i < images.length; i++) {
      const imgBase64 = images[i]
      if (apiKey && model) {
        const slideLine = await createSlideLine(imgBase64, apiKey, model)
        slideLine.page = i // ページ番号を追加
        scriptList.push(slideLine)
      } else {
        throw new Error('API Key and Model must not be undefined')
      }

      // Markdownコンテンツの形成
      markdownContent += `![bg](${imgBase64})\n\n---\n`
    }

    // MarkdownファイルとJSONファイルを保存
    fs.writeFileSync(markdownPath, markdownContent)
    fs.writeFileSync(jsonPath, JSON.stringify(scriptList, null, 2))

    res.status(200).json({ message: 'PDFが変換されました' })
  })
}

export default handler
