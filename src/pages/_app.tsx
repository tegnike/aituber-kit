import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import React from 'react'
import { Analytics } from '@vercel/analytics/react'

import '@/styles/globals.css'
import '@/styles/themes.css'

const AppInitializer = dynamic(() => import('@/components/appInitializer'), {
  ssr: false,
})

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        {router.pathname !== '/' && router.pathname !== '/aituber' && (
          <meta name="robots" content="noindex,nofollow" />
        )}
      </Head>
      {router.pathname !== '/aituber' && <AppInitializer />}
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
