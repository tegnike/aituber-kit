import type { GetServerSideProps } from 'next'
import { sendOfficialSiteTextResponse } from '@/utils/officialSiteTextResponse'

const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://aituberkit.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://aituberkit.com/aituber/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
`

export const getServerSideProps: GetServerSideProps = async (context) =>
  sendOfficialSiteTextResponse(context, {
    body,
    contentType: 'application/xml; charset=utf-8',
  })

export default function SitemapXml() {
  return null
}
