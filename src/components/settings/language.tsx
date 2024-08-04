import i18n from 'i18next';
import { useTranslation } from 'react-i18next';

import store from '@/features/stores/app';

const Language = () => {
  const selectLanguage = store((s) => s.selectLanguage);

  const { t } = useTranslation();

  return (
    <div className="my-40">
      <div className="my-16 typography-20 font-bold">{t('Language')}</div>
      <div className="my-8">
        <select
          className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8"
          value={selectLanguage}
          onChange={(e) => {
            const newLanguage = e.target.value;

            const s = store.getState();
            const jpVoiceSelected =
              s.selectVoice === 'voicevox' || s.selectVoice === 'koeiromap';

            switch (newLanguage) {
              case 'JP':
                store.setState({
                  selectLanguage: 'JP',
                  selectVoiceLanguage: 'ja-JP',
                });

                i18n.changeLanguage('ja');
                break;
              case 'EN':
                store.setState({ selectLanguage: 'EN' });

                if (jpVoiceSelected) {
                  store.setState({ selectVoice: 'google' });
                }
                store.setState({ selectVoiceLanguage: 'en-US' });

                i18n.changeLanguage('en');
                break;
              case 'ZH':
                store.setState({ selectLanguage: 'ZH' });

                if (jpVoiceSelected) {
                  store.setState({ selectVoice: 'google' });
                }
                store.setState({ selectVoiceLanguage: 'zh-TW' });

                i18n.changeLanguage('zh-TW');
                break;
              case 'KO':
                store.setState({ selectLanguage: 'KO' });

                if (jpVoiceSelected) {
                  store.setState({ selectVoice: 'google' });
                }
                store.setState({ selectVoiceLanguage: 'ko-KR' });

                i18n.changeLanguage('ko');
                break;
              default:
                break;
            }
          }}
        >
          <option value="JP">日本語 - Japanese</option>
          <option value="EN">英語 - English</option>
          <option value="ZH">繁體中文 - Traditional Chinese</option>
          <option value="KO">韓語 - Korean</option>
        </select>
      </div>
    </div>
  );
};
export default Language;
