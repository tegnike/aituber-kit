import Head from 'next/head'
export const Meta = () => {
  const title = 'AITuberKit'
  const description =
    'Webブラウザだけで誰でも簡単にAIキャラと会話したり、Youtubeで配信したりできます。'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aituberkit.com'
  const imageUrl = `${siteUrl}/ogp.png`
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:type" content="website" />
      {siteUrl && <meta property="og:url" content={siteUrl} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Head>
  )
}
