import '@charcoal-ui/icons'
import type { AppProps } from 'next/app'
import React, { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { useRouter } from 'next/router'

import { isLanguageSupported } from '@/features/constants/settings'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import menuStore from '@/features/stores/menu'
import '@/styles/globals.css'
import migrateStore from '@/utils/migrateStore'
import i18n from '../lib/i18n'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    const hs = homeStore.getState()
    const ss = settingsStore.getState()

    if (hs.userOnboarded) {
      i18n.changeLanguage(ss.selectLanguage)
      return
    }

    migrateStore()

    const browserLanguage = navigator.language
    const languageCode = browserLanguage.match(/^zh/i)
      ? 'zh'
      : browserLanguage.split('-')[0].toLowerCase()

    let language = ss.selectLanguage
    if (!language) {
      language = isLanguageSupported(languageCode) ? languageCode : 'ja'
    }
    i18n.changeLanguage(language)
    settingsStore.setState({ selectLanguage: language })

    homeStore.setState({ userOnboarded: true })
  }, [])

  // URLパラメータからスライド関連の設定を取得
  useEffect(() => {
    // クエリパラメータが準備できたら処理
    if (!router.isReady) return

    const { slide, autoplay } = router.query

    // スライド名が指定された場合
    if (typeof slide === 'string' && slide) {
      console.log(`スライドを自動選択: ${slide}`)
      
      // スライドモードを有効化
      settingsStore.setState({ slideMode: true })
      
      // 強制的に初期状態にリセット
      slideStore.setState({ 
        isPlaying: false,
        currentSlide: 0,
        isAutoplay: false
      });
      
      // スライドを選択（この時点ではまだロード中）
      slideStore.setState({ selectedSlideDocs: slide })
      
      // スライドを表示
      menuStore.setState({ slideVisible: true })
      
      // 自動再生が指定された場合
      if (autoplay === 'true') {
        console.log('スライドの自動再生モードを設定します')
        
        // イントロダクションを非表示にする
        homeStore.setState({ showIntroduction: false })
        
        // 自動再生モードを設定
        slideStore.setState({ isAutoplay: true })
        
        // 再生自体はslides.tsxのマークダウン変換完了後のタイミングで行う
        // そのため、ここではisPlayingの設定は行わない
      } else {
        // 自動再生ではない場合、明示的にフラグをオフに
        slideStore.setState({ isAutoplay: false })
      }
    }
  }, [router.isReady, router.query])

  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
