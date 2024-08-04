import { useTranslation } from 'react-i18next';

import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants';
import store from '@/features/stores/app';
import { TextButton } from '../textButton';

const Character = () => {
  const selectAIService = store((s) => s.selectAIService);

  const characterName = store((s) => s.characterName);
  const showCharacterName = store((s) => s.showCharacterName);
  const systemPrompt = store((s) => s.systemPrompt);

  const { t } = useTranslation();

  return (
    <>
      <div className="my-40">
        <div className="my-16 typography-20 font-bold">
          {t('CharacterName')}
        </div>
        <input
          className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
          type="text"
          placeholder={t('CharacterName')}
          value={characterName}
          onChange={(e) => store.setState({ characterName: e.target.value })}
        />

        <div className="my-16 typography-20 font-bold">
          {t('ShowCharacterName')}
        </div>
        <div className="my-8">
          <TextButton
            onClick={() =>
              store.setState((s) => ({
                showCharacterName: !s.showCharacterName,
              }))
            }
          >
            {showCharacterName ? t('StatusOn') : t('StatusOff')}
          </TextButton>
        </div>
      </div>

      <div className="my-40">
        <div className="my-8">
          <div className="my-16 typography-20 font-bold">
            {t('CharacterSettingsPrompt')}
          </div>
          {selectAIService === 'dify' && (
            <div className="my-16">{t('DifyInstruction')}</div>
          )}
          <TextButton
            onClick={() => store.setState({ systemPrompt: SYSTEM_PROMPT })}
          >
            {t('CharacterSettingsReset')}
          </TextButton>
        </div>
        <textarea
          value={systemPrompt}
          onChange={(e) => store.setState({ systemPrompt: e.target.value })}
          className="px-16 py-8 bg-surface1 hover:bg-surface1-hover h-168 rounded-8 w-full"
        ></textarea>
      </div>
    </>
  );
};
export default Character;
