import type { GetServerSidePropsContext } from 'next'
import { isOfficialSite } from '@/utils/officialSite'

type OfficialSiteTextResponseOptions = {
  body: string
  contentType: string
}

export const sendOfficialSiteTextResponse = (
  context: GetServerSidePropsContext,
  { body, contentType }: OfficialSiteTextResponseOptions
) => {
  if (!isOfficialSite()) return { notFound: true as const }

  context.res.setHeader('Content-Type', contentType)
  context.res.setHeader(
    'Cache-Control',
    'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
  )
  context.res.write(body)
  context.res.end()

  return { props: {} }
}
