import { useState, useCallback } from "react";
import { Link } from "./link";
import { IconButton } from "./iconButton";
import i18n from "i18next";
import { useTranslation, Trans } from 'react-i18next';

type Props = {
  dontShowIntroduction: boolean;
  onChangeDontShowIntroduction: (dontShowIntroduction: boolean) => void;
  selectLanguage: string;
  setSelectLanguage: (show: string) => void;
  setSelectVoiceLanguage: (show: string) => void;
};
export const Introduction = ({
  dontShowIntroduction,
  onChangeDontShowIntroduction,
  selectLanguage,
  setSelectLanguage,
  setSelectVoiceLanguage
}: Props) => {
  const [opened, setOpened] = useState(true);

  const handleDontShowIntroductionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeDontShowIntroduction(event.target.checked);
      updateLanguage();
    },
    [onChangeDontShowIntroduction]
  );

  const { t } = useTranslation();

  const updateLanguage = () => {
    console.log('i18n.language', i18n.language);  // 'ja'
    // selectLanguage: "JP"
    const languageCode = i18n.language.toUpperCase();
    setSelectLanguage(languageCode);
    setSelectVoiceLanguage(getVoiceLanguageCode(languageCode));
  }

  const getVoiceLanguageCode = (selectLanguage: string) => {
    switch (selectLanguage) {
      case 'JP':
        return 'ja-JP';
      case 'EN':
        return 'en-US';
      case 'ZH':
        return 'zh-TW';
      case 'zh-TW':
        return 'zh-TW';
      default:
        return 'ja-JP';  
    }
  }

  return opened ? (
    <div className="absolute z-40 w-full h-full px-24 py-40 bg-black/30 font-M_PLUS_2">
      <div className="relative mx-auto my-auto max-w-3xl max-h-full p-24 overflow-auto bg-white rounded-16">
      <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={() => {
            setOpened(false);
            updateLanguage();
          }}
          className="absolute top-8 right-8 bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled text-white"
        ></IconButton>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary ">
            {t('AboutThisApplication')}
          </div>
          <div>
            <Trans i18nKey="AboutThisApplicationDescription" />
          </div>
        </div>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            {t('TechnologyIntroduction')}
          </div>
          <div>
            <Trans i18nKey="TechnologyIntroductionDescription1" components={{ b: <b /> }} />
            <Link
              url={
                "https://github.com/pixiv/ChatVRM"
              }
              label={t('TechnologyIntroductionLink1')}
            />
            {t('TechnologyIntroductionDescription2')}
          </div>
          <div className="my-16">
            {t('TechnologyIntroductionDescription3')}
            <Link
              url={"https://github.com/pixiv/three-vrm"}
              label={"@pixiv/three-vrm"}
            />
            {t('TechnologyIntroductionDescription4')}
            <Link
              url={
                "https://openai.com/blog/introducing-chatgpt-and-whisper-apis"
              }
              label={"OpenAI API"}
            />
            {t('TechnologyIntroductionDescription5')}
            <Link url={"https://developers.rinna.co.jp/product/#product=koeiromap-free"} label={"Koemotion"} />
            {t('TechnologyIntroductionDescription6')}
            <Link
              url={"https://note.com/nike_cha_n/n/ne98acb25e00f"}
              label={t('TechnologyIntroductionLink2')}
            />
            {t('TechnologyIntroductionDescription7')}
          </div>
          <div className="my-16">
            {t('SourceCodeDescription1')}
            <br />
            {t('RepositoryURL')}<span> </span>
            <Link
              url={"https://github.com/tegnike/nike-ChatVRM"}
              label={"https://github.com/tegnike/nike-ChatVRM"}
            />
          </div>
        </div>

        {/* dontShowIntroductionのチェックボックスを表示 */}
        <div className="my-24">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={dontShowIntroduction}
              onChange={handleDontShowIntroductionChange}
              className="mr-8"
            />
            <span>{t('DontShowIntroductionNextTime')}</span>
          </label>
        </div>

        <div className="my-24">
          <button
            onClick={() => {
              setOpened(false);
              updateLanguage();
            }}
            className="font-bold bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled text-white px-24 py-8 rounded-oval"
          >
           {t('Close')}
          </button>
        </div>

        {selectLanguage === 'JP' && (
          <div className="my-24">
            <p>You can select the language from the settings. English and Traditional Chinese are available.</p>
          </div>
        )}
      </div>
    </div>
  ) : null;
};
