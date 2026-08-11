import Head from 'next/head'
import { isOfficialSite } from '@/utils/officialSite'

export const SITE_NAME = 'AITuberKit'
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://aituberkit.com'
export const SITE_TITLE =
  'AITuberKit｜AIキャラクターとの会話・AITuber配信をブラウザで体験'
export const SITE_DESCRIPTION =
  'AITuberKitは、AIキャラクターとの会話やAITuber配信をブラウザで体験・構築できるオープンソースのツールキットです。VRM・Live2D・PNGTuber、各種LLM・音声合成、YouTubeコメント連携に対応しています。'

const serializeStructuredData = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c')

type MetaProps = {
  canonicalPath?: string
  description?: string
  title?: string
  structuredData?: Record<string, unknown> | Record<string, unknown>[]
}

export const Meta = ({
  canonicalPath = '/',
  description = SITE_DESCRIPTION,
  title = SITE_TITLE,
  structuredData,
}: MetaProps) => {
  const officialSite = isOfficialSite()
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const imageUrl = `${SITE_URL}/ogp.png`
  const defaultStructuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: ['AITuber Kit', 'AI Tuber Kit', 'AIチューバーキット'],
      url: `${SITE_URL}/`,
      inLanguage: 'ja',
      description: SITE_DESCRIPTION,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: SITE_NAME,
      alternateName: ['AITuber Kit', 'AI Tuber Kit', 'AIチューバーキット'],
      applicationCategory: 'MultimediaApplication',
      applicationSubCategory: 'AI character and VTuber application',
      operatingSystem: 'Web browser, Windows, macOS, Linux',
      url: `${SITE_URL}/`,
      image: imageUrl,
      description: SITE_DESCRIPTION,
      inLanguage: 'ja',
      codeRepository: 'https://github.com/tegnike/aituber-kit',
      softwareHelp: 'https://docs.aituberkit.com/',
    },
  ]
  const jsonLd = structuredData
    ? [
        ...defaultStructuredData,
        ...(Array.isArray(structuredData) ? structuredData : [structuredData]),
      ]
    : defaultStructuredData

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="robots"
        content={
          officialSite
            ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
            : 'noindex,nofollow'
        }
      />
      {officialSite && (
        <>
          <link rel="canonical" href={canonicalUrl} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={imageUrl} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="AITuberKit" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="og:site_name" content={SITE_NAME} />
          <meta property="og:locale" content="ja_JP" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={imageUrl} />
          <meta name="twitter:image:alt" content="AITuberKit" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: serializeStructuredData(jsonLd),
            }}
          />
        </>
      )}
    </Head>
  )
}
