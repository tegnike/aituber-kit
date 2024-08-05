import '@charcoal-ui/icons';
import type { AppProps } from 'next/app';
import React, { useEffect } from 'react';

import settingsStore from '@/features/stores/settings';
import '@/styles/globals.css';
import i18n from '../lib/i18n';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const ss = settingsStore.getState();

    if (ss) {
      // TODO: (7741) initialize selectLanguage as empty, not JP
      i18n.changeLanguage(ss.selectLanguage.toLowerCase());
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
