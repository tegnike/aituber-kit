import '@charcoal-ui/icons';
import type { AppProps } from 'next/app';
import React, { useEffect } from 'react';

import { isLanguageSupported } from '@/features/constants/settings';
import homeStore from '@/features/stores/home';
import settingsStore from '@/features/stores/settings';
import '@/styles/globals.css';
import i18n from '../lib/i18n';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const hs = homeStore.getState();
    const ss = settingsStore.getState();

    if (hs.userOnboarded) {
      i18n.changeLanguage(ss.selectLanguage);
      return;
    }

    const browserLanguage = navigator.language;
    const languageCode = browserLanguage.match(/^zh/i)
      ? 'zh'
      : browserLanguage.split('-')[0].toLowerCase();

    const language = isLanguageSupported(languageCode) ? languageCode : 'ja';
    i18n.changeLanguage(language);
    settingsStore.setState({ selectLanguage: language });

    // TODO: (7741) implement a migration from the old local storage:
    // 1. `chatVRMParams` to `settings` and `home` stores
    // 2. selectLanguage value, e.g. JP to ja

    homeStore.setState({ userOnboarded: true });
  }, []);

  return <Component {...pageProps} />;
}
