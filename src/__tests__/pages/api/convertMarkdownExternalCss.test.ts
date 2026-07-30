import {
  createExternalPresentationMarpit,
  externalPresentationCss,
} from '@/pages/api/convertMarkdown'
import { newsTemplateCss } from '@/features/presentation/newsTemplateCss'

describe('external presentation CSS', () => {
  it('screen表示でもスライドに不透明な背景を与える', () => {
    expect(externalPresentationCss).toContain(
      'div.marpit > svg > foreignObject > section {'
    )
    expect(externalPresentationCss).toContain('background: #f4f7ff;')
  })

  it('GitHub形式の表をtable要素へ変換する', () => {
    const markdown = `<!-- _class: news-latency -->

# 約900ミリ秒の内訳

| 工程 | 記事の目安 |
|---|---:|
| 音声認識 | 150ミリ秒 |`
    const rendered = createExternalPresentationMarpit().render(markdown)

    expect(rendered.html).toContain('<table>')
    expect(rendered.html).toContain('<th>工程</th>')
    expect(rendered.html).toContain(
      '<td style="text-align:right">150ミリ秒</td>'
    )
    expect(rendered.html).not.toContain('|---|---:|')
  })

  it('guardrailの箇条書きを専用レイアウトで表示する', () => {
    const markdown = `<!-- _class: news-guardrail -->

# 本人返信の境界

- **人格** 投稿ごとに口調と設定を保てるか
- **表示** AIによる返信だと分かるか
- **安全** 不適切な投稿を止められるか
- **選択** 返信を望まない利用者が制御できるか

安心して続けられる境界を確かめる`
    const rendered = createExternalPresentationMarpit().render(markdown)

    expect(rendered.html).toMatch(/<section[^>]*class="news-guardrail"[^>]*>/)
    expect(rendered.html).toContain('<ul>')
    expect(rendered.html).toContain('<strong>人格</strong>')
    expect(externalPresentationCss).toContain(
      'section.news-guardrail > ul > li'
    )
  })

  it('glossaryの箇条書きを大きな用語リストで表示する', () => {
    const markdown = `<!-- _class: news-glossary -->

# Vtkoolは三つの仕組みを組み合わせる

- **対話** 生成AIと会話フローで質問に答える
- **キャラクター表現** Live2D、VRM、音声、表情、モーションを組み合わせる
- **Web導入** FAQや教材を回答に利用し、外部サイトへ埋め込む`
    const rendered = createExternalPresentationMarpit().render(markdown)

    expect(rendered.html).toMatch(/<section[^>]*class="news-glossary"[^>]*>/)
    expect(rendered.html).toContain('<ul>')
    expect(rendered.html).toContain('<strong>対話</strong>')
    expect(newsTemplateCss).toContain('section.news-glossary ul')
    expect(newsTemplateCss).toContain('section.news-glossary li strong')
    expect(newsTemplateCss).toMatch(
      /section\.news-glossary ul \{[\s\S]*?font-size:26px;/
    )
  })
})
