import type { GetServerSideProps } from 'next'
import { sendOfficialSiteTextResponse } from '@/utils/officialSiteTextResponse'

const body = `User-agent: *
Allow: /
Disallow: /api
Disallow: /embed
Disallow: /send-message
Disallow: /slide-editor

Sitemap: https://aituberkit.com/sitemap.xml
`

export const getServerSideProps: GetServerSideProps = async (context) =>
  sendOfficialSiteTextResponse(context, {
    body,
    contentType: 'text/plain; charset=utf-8',
  })

export default function RobotsTxt() {
  return null
}
