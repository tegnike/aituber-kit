import { buildExternalSlideMarkdown } from '@/features/presentation/externalSlideMarkdown'
import type {
  PresentationSection,
  PresentationSlide,
} from '@/features/presentation/presentationTypes'

const asset = {
  id: 'diagram',
  type: 'image' as const,
  url: 'http://127.0.0.1:9892/assets/diagram.png',
  alt: '説明図',
  credit: 'AI-generated',
}

const slide = (
  overrides: Partial<PresentationSlide> = {}
): PresentationSlide => ({
  id: 'slide-2',
  markdown: '# 質問・評価・説明を一つの流れに\n\n- 24時間受検',
  pauseAfter: false,
  assets: [asset],
  ...overrides,
})

const section: PresentationSection = {
  id: 'news-01',
  title: 'AIアバター面接、評価の理由まで説明へ',
  slides: [slide({ id: 'slide-1' }), slide()],
}

describe('buildExternalSlideMarkdown', () => {
  it('1枚目はSection名へ置換せず元のSlide見出しを維持する', () => {
    const overview = slide({
      id: 'slide-1',
      markdown:
        '<!-- _class: news-overview -->\n\n# リアルタイムAIアバターは「顔」だけではない',
      assets: [
        {
          ...asset,
          sourceUrl: 'https://example.com/article',
        },
      ],
    })

    const markdown = buildExternalSlideMarkdown(
      { ...section, title: 'リアルタイムAIアバター、「1秒」が生死を分ける' },
      overview,
      0
    )

    expect(markdown).toContain('# リアルタイムAIアバターは「顔」だけではない')
    expect(markdown).not.toContain(
      '# リアルタイムAIアバター、「1秒」が生死を分ける'
    )
  })

  it('1枚目に見出しがない場合だけSection名へフォールバックする', () => {
    const markdown = buildExternalSlideMarkdown(
      section,
      slide({ id: 'slide-1', markdown: '本文だけです' }),
      0
    )

    expect(markdown).toContain(`# ${section.title}`)
  })

  it('2枚目以降のAssetを画像付き2カラムMarkdownへ変換する', () => {
    const markdown = buildExternalSlideMarkdown(section, slide(), 1)

    expect(markdown).toContain('<!-- _class: news-photo-main -->')
    expect(markdown).toContain('# 質問・評価・説明を一つの流れに')
    expect(markdown).toContain(
      '![説明図](http://127.0.0.1:9892/assets/diagram.png)'
    )
  })

  it('Markdown内に画像がある場合はAssetを重複追加しない', () => {
    const original =
      '<!-- _class: news-photo-main -->\n\n# 見出し\n\n![既存画像](https://example.com/image.png)'

    expect(
      buildExternalSlideMarkdown(section, slide({ markdown: original }), 1)
    ).toBe(original)
  })

  it('明示されたテンプレートclassを上書きせず画像だけ追加する', () => {
    const markdown = buildExternalSlideMarkdown(
      section,
      slide({ markdown: '<!-- _class: news-flow -->\n\n# 流れ' }),
      1
    )

    expect(markdown).toContain('<!-- _class: news-flow -->')
    expect(markdown).not.toContain('news-photo-main')
    expect(markdown).toContain('![説明図]')
  })
})
