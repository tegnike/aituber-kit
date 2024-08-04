import { useTranslation } from 'react-i18next';

import store from '@/features/stores/app';
import homeStore from '@/features/stores/home';
import menuStore from '@/features/stores/menu';
import { TextButton } from '../textButton';

const YouTube = () => {
  const youtubeApiKey = store((s) => s.youtubeApiKey);
  const youtubeMode = store((s) => s.youtubeMode);
  const youtubeLiveId = store((s) => s.youtubeLiveId);

  const selectAIService = store((s) => s.selectAIService);

  const conversationContinuityMode = store((s) => s.conversationContinuityMode);

  const { t } = useTranslation();

  const handleChangeYoutubeMode = (youtubeMode: boolean) => {
    store.setState({ youtubeMode });

    if (youtubeMode) {
      homeStore.setState({ modalImage: '' });
      menuStore.setState({ showWebcam: false });
    }
  };

  return (
    <div className="my-40">
      <div className="my-16 typography-20 font-bold">{t('YoutubeMode')}</div>
      <div className="my-8">
        {youtubeMode ? (
          <TextButton onClick={() => handleChangeYoutubeMode(false)}>
            {t('StatusOn')}
          </TextButton>
        ) : (
          <TextButton onClick={() => handleChangeYoutubeMode(true)}>
            {t('StatusOff')}
          </TextButton>
        )}
      </div>
      <div className="my-16">
        {(() => {
          if (youtubeMode) {
            return (
              <>
                <div className="">{t('YoutubeInfo')}</div>
                <div className="my-16 typography-20 font-bold">
                  {t('YoutubeAPIKey')}
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={youtubeApiKey}
                  onChange={(e) =>
                    store.setState({
                      youtubeApiKey: e.target.value,
                    })
                  }
                />
                <div className="my-16 typography-20 font-bold">
                  {t('YoutubeLiveID')}
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={youtubeLiveId}
                  onChange={(e) =>
                    store.setState({
                      youtubeLiveId: e.target.value,
                    })
                  }
                />
                <div className="my-16 typography-20 font-bold">
                  {t('ConversationContinuityMode')}
                </div>
                <div className="my-8">
                  {t('ConversationContinuityModeInfo')}
                </div>
                <div className="my-8">
                  {t('ConversationContinuityModeInfo2')}
                </div>
                <div className="my-8">
                  {t('ConversationContinuityModeInfo3')}
                </div>
                {conversationContinuityMode ? (
                  <TextButton
                    onClick={() =>
                      store.setState({
                        conversationContinuityMode: false,
                      })
                    }
                    disabled={
                      selectAIService !== 'openai' &&
                      selectAIService !== 'anthropic'
                    }
                  >
                    {t('StatusOn')}
                  </TextButton>
                ) : (
                  <TextButton
                    onClick={() =>
                      store.setState({
                        conversationContinuityMode: true,
                      })
                    }
                    disabled={
                      selectAIService !== 'openai' &&
                      selectAIService !== 'anthropic'
                    }
                  >
                    {t('StatusOff')}
                  </TextButton>
                )}
              </>
            );
          }
        })()}
      </div>
    </div>
  );
};
export default YouTube;
