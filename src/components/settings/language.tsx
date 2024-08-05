import i18n from 'i18next';
import { useTranslation } from 'react-i18next';

import settingsStore from '@/features/stores/settings';

const Language = () => {
  const selectLanguage = settingsStore((s) => s.selectLanguage);

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

            const ss = settingsStore.getState();
            const jpVoiceSelected =
              ss.selectVoice === 'voicevox' || ss.selectVoice === 'koeiromap';

            switch (newLanguage) {
              case 'JP':
                settingsStore.setState({
                  selectLanguage: 'JP',
                  selectVoiceLanguage: 'ja-JP',
                });

                i18n.changeLanguage('ja');
                break;
              case 'EN':
                settingsStore.setState({ selectLanguage: 'EN' });

                if (jpVoiceSelected) {
                  settingsStore.setState({ selectVoice: 'google' });
                }
                settingsStore.setState({ selectVoiceLanguage: 'en-US' });

                i18n.changeLanguage('en');
                break;
              case 'ZH':
                settingsStore.setState({ selectLanguage: 'ZH' });

                if (jpVoiceSelected) {
                  settingsStore.setState({ selectVoice: 'google' });
                }
                settingsStore.setState({ selectVoiceLanguage: 'zh-TW' });

                i18n.changeLanguage('zh-TW');
                break;
              case 'KO':
                settingsStore.setState({ selectLanguage: 'KO' });

                if (jpVoiceSelected) {
                  settingsStore.setState({ selectVoice: 'google' });
                }
                settingsStore.setState({ selectVoiceLanguage: 'ko-KR' });

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
