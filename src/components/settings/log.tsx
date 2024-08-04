import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import store from '@/features/stores/app';
import { TextButton } from '../textButton';

const Log = () => {
  const selectAIService = store((s) => s.selectAIService);

  const chatLog = store((s) => s.chatLog);

  const { t } = useTranslation();

  return (
    <div className="my-40">
      <div className="my-8 grid-cols-2">
        <div className="my-16 typography-20 font-bold">
          {t('ConversationHistory')}
        </div>
        <div className="my-8">
          {selectAIService !== 'dify'
            ? t('ConversationHistoryInfo')
            : t('DifyInfo2')}
        </div>
        <TextButton
          onClick={() => {
            store.setState({
              difyConversationId: '',
              chatLog: [],
              codeLog: [],
            });
          }}
        >
          {t('ConversationHistoryReset')}
        </TextButton>
      </div>

      {chatLog.length > 0 && (
        <div className="my-8">
          {chatLog.map((value, index) => {
            return (
              <div
                key={index}
                className="my-8 grid grid-flow-col  grid-cols-[min-content_1fr] gap-x-fixed"
              >
                <div className="w-[64px] py-8">
                  {value.role === 'assistant' ? 'Character' : 'You'}
                </div>
                {typeof value.content == 'string' ? (
                  <input
                    key={index}
                    className="bg-surface1 hover:bg-surface1-hover rounded-8 w-full px-16 py-8"
                    type="text"
                    value={value.content}
                    onChange={(e) => {
                      handleChangeChatLog(index, e.target.value);
                      handleChangeCodeLog(index, e.target.value);
                    }}
                  ></input>
                ) : (
                  <Image
                    src={value.content[1].image_url.url}
                    alt="画像"
                    width={500}
                    height={500}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default Log;

const handleChangeChatLog = (targetIndex: number, text: string) => {
  const s = store.getState();

  const newChatLog = s.chatLog.map((m, i) => {
    return i === targetIndex ? { role: m.role, content: text } : m;
  });

  store.setState({ chatLog: newChatLog });
};

const handleChangeCodeLog = (targetIndex: number, text: string) => {
  const s = store.getState();

  const newCodeLog = s.codeLog.map((m, i) => {
    return i === targetIndex ? { role: m.role, content: text } : m;
  });

  store.setState({ chatLog: newCodeLog });
};
