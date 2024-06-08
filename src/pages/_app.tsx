import "@/styles/globals.css";
import type { AppProps } from "next/app";
import "@charcoal-ui/icons";
import React, { useEffect, useState } from 'react';
import i18n from '../lib/i18n';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const storedData = window.localStorage.getItem('chatVRMParams');
    if (storedData) {
      const params = JSON.parse(storedData);
      if (params.selectLanguage) {
        i18n.changeLanguage(params.selectLanguage.toLowerCase());
      }
    } else {
      const browserLanguage = navigator.language;
      const languageCode = browserLanguage.match(/^zh/i) ? 'zh' : browserLanguage.split('-')[0].toLowerCase();
      i18n.changeLanguage(languageCode);
    }
  })
  return <Component {...pageProps} />;
}
