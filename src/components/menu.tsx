import React, {
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';

import { Message } from '@/features/messages/messages';
import { testVoice } from '@/features/messages/speakCharacter';
import store from '@/features/stores/app';
import menuStore from '@/features/stores/menu';
import { ViewerContext } from '@/features/vrmViewer/viewerContext';
import { AssistantText } from './assistantText';
import { ChatLog } from './chatLog';
import { CodeLog } from './codeLog';
import { IconButton } from './iconButton';
import { Settings } from './settings';
import { Webcam } from './webcam';

type Props = {
  chatLog: Message[];
  codeLog: Message[];
  assistantMessage: string;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeCodeLog: (index: number, text: string) => void;
  handleClickResetChatLog: () => void;
  handleClickResetCodeLog: () => void;
  changeEnglishToJapanese: boolean;
  setChangeEnglishToJapanese: (show: boolean) => void;
  setBackgroundImageUrl: (url: string) => void;
  onChangeModalImage: (image: string) => void;
  triggerShutter: boolean;
  onChangeWebcamStatus: (show: boolean) => void;
};
export const Menu = ({
  chatLog,
  codeLog,
  assistantMessage,
  onChangeChatLog,
  onChangeCodeLog,
  handleClickResetChatLog,
  handleClickResetCodeLog,
  changeEnglishToJapanese,
  setChangeEnglishToJapanese,
  setBackgroundImageUrl,
  onChangeModalImage,
  triggerShutter,
  onChangeWebcamStatus,
}: Props) => {
  const selectAIService = store((s) => s.selectAIService);
  const selectAIModel = store((s) => s.selectAIModel);
  const webSocketMode = store((s) => s.webSocketMode);

  const [showSettings, setShowSettings] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const { viewer } = useContext(ViewerContext);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const [showSettingsButton, setShowSettingsButton] = useState(true);

  const handleClickTestVoice = (speaker: string) => {
    testVoice(viewer, speaker);
  };

  const handleChangeVrmFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const file = files[0];
      if (!file) return;

      const file_type = file.name.split('.').pop();

      if (file_type === 'vrm') {
        const blob = new Blob([file], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        viewer.loadVrm(url);
      }

      event.target.value = '';
    },
    [viewer],
  );

  const handleChangeBgFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const imageUrl = URL.createObjectURL(file);
        setBackgroundImageUrl(imageUrl);
      }
    },
    [setBackgroundImageUrl],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === '.') {
        setShowSettings((prevState) => !prevState);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleChangeModalImage = useCallback(
    (image: string) => {
      onChangeModalImage(image);
    },
    [onChangeModalImage],
  );

  const handleChangeImageFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          onChangeModalImage(imageUrl);
        };
        reader.readAsDataURL(file);
      }
    },
    [onChangeModalImage],
  );

  // カメラが開いているかどうかの状態変更
  useEffect(() => {
    console.log('onChangeWebcamStatus');
    onChangeWebcamStatus(showWebcam);
    if (showWebcam) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(() => {
          setShowPermissionModal(false);
        })
        .catch(() => {
          setShowPermissionModal(true);
        });
    }
  }, [showWebcam]);

  return (
    <>
      <div className="absolute z-10 m-24">
        <div className="grid md:grid-flow-col gap-[8px]">
          <div className="md:order-1 order-2">
            {showSettingsButton && (
              <IconButton
                iconName="24/Settings"
                isProcessing={false}
                onClick={() => setShowSettings(true)}
              ></IconButton>
            )}
          </div>
          <div className="md:order-2 order-1">
            {showChatLog ? (
              <IconButton
                iconName="24/CommentOutline"
                label={webSocketMode ? t('CodeLog') : t('ChatLog')}
                isProcessing={false}
                onClick={() => setShowChatLog(false)}
              />
            ) : (
              <IconButton
                iconName="24/CommentFill"
                label={webSocketMode ? t('CodeLog') : t('ChatLog')}
                isProcessing={false}
                disabled={chatLog.length <= 0}
                onClick={() => setShowChatLog(true)}
              />
            )}
          </div>
          <div className="order-3">
            <IconButton
              iconName="24/Camera"
              isProcessing={false}
              onClick={() => setShowWebcam(!showWebcam)}
              disabled={
                !(
                  selectAIService === 'openai' &&
                  ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'].includes(
                    selectAIModel,
                  )
                )
              }
            />
          </div>
          <div className="order-4">
            <IconButton
              iconName="24/AddImage"
              isProcessing={false}
              onClick={() => imageFileInputRef.current?.click()}
              disabled={
                !(
                  selectAIService === 'openai' &&
                  ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'].includes(
                    selectAIModel,
                  )
                )
              }
            />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              ref={imageFileInputRef}
              onChange={handleChangeImageFile}
            />
          </div>
        </div>
      </div>
      {webSocketMode
        ? showChatLog && <CodeLog messages={codeLog} />
        : showChatLog && <ChatLog messages={chatLog} />}
      {showSettings && (
        <Settings
          chatLog={chatLog}
          codeLog={codeLog}
          onClickClose={() => setShowSettings(false)}
          onChangeChatLog={onChangeChatLog}
          onChangeCodeLog={onChangeCodeLog}
          onClickResetChatLog={handleClickResetChatLog}
          onClickResetCodeLog={handleClickResetCodeLog}
          changeEnglishToJapanese={changeEnglishToJapanese}
          setChangeEnglishToJapanese={setChangeEnglishToJapanese}
          onClickTestVoice={handleClickTestVoice}
          showSettingsButton={showSettingsButton}
          onChangeShowSettingsButton={setShowSettingsButton}
        />
      )}
      {!showChatLog && assistantMessage && (
        <AssistantText message={assistantMessage} />
      )}
      {showWebcam && navigator.mediaDevices && (
        <Webcam
          onChangeModalImage={handleChangeModalImage}
          triggerShutter={triggerShutter}
          showWebcam={showWebcam}
        />
      )}
      {showPermissionModal && (
        <div className="modal">
          <div className="modal-content">
            <p>カメラの使用を許可してください。</p>
            <button onClick={() => setShowPermissionModal(false)}>
              閉じる
            </button>
          </div>
        </div>
      )}
      <input
        type="file"
        className="hidden"
        accept=".vrm"
        ref={(fileInput) => {
          if (!fileInput) {
            menuStore.setState({ fileInput: null });
            return;
          }

          menuStore.setState({ fileInput });
        }}
        onChange={handleChangeVrmFile}
      />
      <input
        type="file"
        className="hidden"
        accept="image/*"
        ref={(bgFileInput) => {
          if (!bgFileInput) {
            menuStore.setState({ bgFileInput: null });
            return;
          }

          menuStore.setState({ bgFileInput });
        }}
        onChange={handleChangeBgFile}
      />
    </>
  );
};
