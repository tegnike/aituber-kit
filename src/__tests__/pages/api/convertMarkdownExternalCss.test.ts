import {
  createExternalPresentationMarpit,
  externalPresentationCss,
} from '@/pages/api/convertMarkdown'

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
})
