import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { testVoice } from '@/features/messages/speakCharacter';
import store from '@/features/stores/app';
import homeStore from '@/features/stores/home';
import menuStore from '@/features/stores/menu';
import { AssistantText } from './assistantText';
import { ChatLog } from './chatLog';
import { CodeLog } from './codeLog';
import { IconButton } from './iconButton';
import { Settings } from './settings';
import { Webcam } from './webcam';

type Props = {
  assistantMessage: string;
  setBackgroundImageUrl: (url: string) => void;
  onChangeWebcamStatus: (show: boolean) => void;
};
export const Menu = ({
  assistantMessage,
  setBackgroundImageUrl,
  onChangeWebcamStatus,
}: Props) => {
  const selectAIService = store((s) => s.selectAIService);
  const selectAIModel = store((s) => s.selectAIModel);
  const webSocketMode = store((s) => s.webSocketMode);
  const chatLog = store((s) => s.chatLog);

  const [showSettings, setShowSettings] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const [showSettingsButton, setShowSettingsButton] = useState(true);

  const handleClickTestVoice = (speaker: string) => {
    testVoice(speaker);
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

        const s = store.getState();
        s.viewer.loadVrm(url);
      }

      event.target.value = '';
    },
    [],
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
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const imageUrl = e.target?.result as string;
                    homeStore.setState({ modalImage: imageUrl });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
        </div>
      </div>
      {webSocketMode ? showChatLog && <CodeLog /> : showChatLog && <ChatLog />}
      {showSettings && (
        <Settings
          onClickClose={() => setShowSettings(false)}
          onClickTestVoice={handleClickTestVoice}
          showSettingsButton={showSettingsButton}
          onChangeShowSettingsButton={setShowSettingsButton}
        />
      )}
      {!showChatLog && assistantMessage && (
        <AssistantText message={assistantMessage} />
      )}
      {showWebcam && navigator.mediaDevices && <Webcam />}
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
