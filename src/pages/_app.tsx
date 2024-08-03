import '@charcoal-ui/icons';
import type { AppProps } from 'next/app';
import React, { useEffect } from 'react';

import store from '@/features/stores/app';
import '@/styles/globals.css';
import i18n from '../lib/i18n';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const s = store.getState();

    if (s) {
      // TODO: (7741) initialize selectLanguage as empty, not JP
      i18n.changeLanguage(s.selectLanguage.toLowerCase());
    } else {
      const browserLanguage = navigator.language;
      const languageCode = browserLanguage.match(/^zh/i)
        ? 'zh'
        : browserLanguage.split('-')[0].toLowerCase();
      i18n.changeLanguage(languageCode);
    }
  });
  return <Component {...pageProps} />;
}
