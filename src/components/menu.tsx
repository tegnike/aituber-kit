import { IconButton } from "./iconButton";
import { Message } from "@/features/messages/messages";
import { KoeiroParam } from "@/features/constants/koeiroParam";
import { ChatLog } from "./chatLog";
import { CodeLog } from "./codeLog";
import React, { useCallback, useContext, useRef, useState } from "react";
import { Settings } from "./settings";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { AssistantText } from "./assistantText";
import { useTranslation } from 'react-i18next';
import { testVoice } from "@/features/messages/speakCharacter";

type Props = {
  openAiKey: string;
  systemPrompt: string;
  chatLog: Message[];
  codeLog: Message[];
  koeiroParam: KoeiroParam;
  assistantMessage: string;
  koeiromapKey: string;
  voicevoxSpeaker: string;
  googleTtsType: string;
  youtubeMode: boolean;
  youtubeApiKey: string;
  youtubeLiveId: string;
  onChangeSystemPrompt: (systemPrompt: string) => void;
  onChangeAiKey: (key: string) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeCodeLog: (index: number, text: string) => void;
  onChangeKoeiromapParam: (param: KoeiroParam) => void;
  handleClickResetChatLog: () => void;
  handleClickResetCodeLog: () => void;
  handleClickResetSystemPrompt: () => void;
  onChangeKoeiromapKey: (key: string) => void;
  onChangeVoicevoxSpeaker: (speaker: string) => void;
  onChangeGoogleTtsType: (key: string) => void;
  onChangeYoutubeMode: (mode: boolean) => void;
  onChangeYoutubeApiKey: (key: string) => void;
  onChangeYoutubeLiveId: (key: string) => void;
  webSocketMode: boolean;
  changeWebSocketMode: (show: boolean) => void;
  selectVoice: string;
  setSelectVoice: (show: string) => void;
  selectLanguage: string;
  setSelectLanguage: (show: string) => void;
  setSelectVoiceLanguage: (show: string) => void;
};
export const Menu = ({
  openAiKey,
  systemPrompt,
  chatLog,
  codeLog,
  koeiroParam,
  assistantMessage,
  koeiromapKey,
  voicevoxSpeaker,
  googleTtsType,
  youtubeMode,
  youtubeApiKey,
  youtubeLiveId,
  onChangeSystemPrompt,
  onChangeAiKey,
  onChangeChatLog,
  onChangeCodeLog,
  onChangeKoeiromapParam,
  handleClickResetChatLog,
  handleClickResetCodeLog,
  handleClickResetSystemPrompt,
  onChangeKoeiromapKey,
  onChangeVoicevoxSpeaker,
  onChangeGoogleTtsType,
  onChangeYoutubeMode,
  onChangeYoutubeApiKey,
  onChangeYoutubeLiveId,
  webSocketMode,
  changeWebSocketMode,
  selectVoice,
  setSelectVoice,
  selectLanguage,
  setSelectLanguage,
  setSelectVoiceLanguage,
}: Props) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const { viewer } = useContext(ViewerContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleChangeSystemPrompt = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChangeSystemPrompt(event.target.value);
    },
    [onChangeSystemPrompt]
  );

  const handleAiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeAiKey(event.target.value);
    },
    [onChangeAiKey]
  );

  const handleChangeKoeiromapKey = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeKoeiromapKey(event.target.value);
    },
    [onChangeKoeiromapKey]
  );

  const handleVoicevoxSpeakerChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onChangeVoicevoxSpeaker(event.target.value);
    },
    [onChangeVoicevoxSpeaker]
  );

  const handleChangeGoogleTtsType = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeGoogleTtsType(event.target.value);
    },
    [onChangeGoogleTtsType]
  );

  const handleYoutubeApiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeYoutubeApiKey(event.target.value);
    },
    [onChangeYoutubeApiKey]
  );

  const handleYoutubeLiveIdChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeYoutubeLiveId(event.target.value);
    },
    [onChangeYoutubeLiveId]
  );

  const handleChangeKoeiroParam = useCallback(
    (x: number, y: number) => {
      onChangeKoeiromapParam({
        speakerX: x,
        speakerY: y,
      });
    },
    [onChangeKoeiromapParam]
  );

  const handleWebSocketMode = useCallback(
    (show: boolean) => {
      changeWebSocketMode(show);
      if (webSocketMode) {
        onChangeYoutubeMode(false);
      }
    },
    [changeWebSocketMode, webSocketMode, onChangeYoutubeMode]
  );
  const handleClickOpenVrmFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClickTestVoice = (speaker: string) => {
    testVoice(viewer, speaker);
  };

  const handleChangeVrmFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const file = files[0];
      if (!file) return;

      const file_type = file.name.split(".").pop();

      if (file_type === "vrm") {
        const blob = new Blob([file], { type: "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);
        viewer.loadVrm(url);
      }

      event.target.value = "";
    },
    [viewer]
  );

  return (
    <>
      <div className="absolute z-10 m-24">
        <div className="grid grid-flow-col gap-[8px]">
          <IconButton
            iconName="24/Settings"
            isProcessing={false}
            onClick={() => setShowSettings(true)}
          ></IconButton>
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
      </div>
      {
        webSocketMode ? 
          (showChatLog && <CodeLog messages={codeLog} />) :
          (showChatLog && <ChatLog messages={chatLog} />)
      }
      {showSettings && (
        <Settings
          openAiKey={openAiKey}
          chatLog={chatLog}
          codeLog={codeLog}
          systemPrompt={systemPrompt}
          koeiroParam={koeiroParam}
          koeiromapKey={koeiromapKey}
          voicevoxSpeaker={voicevoxSpeaker}
          googleTtsType={googleTtsType}
          youtubeMode={youtubeMode}
          youtubeApiKey={youtubeApiKey}
          youtubeLiveId={youtubeLiveId}
          onClickClose={() => setShowSettings(false)}
          onChangeAiKey={handleAiKeyChange}
          onChangeSystemPrompt={handleChangeSystemPrompt}
          onChangeChatLog={onChangeChatLog}
          onChangeCodeLog={onChangeCodeLog}
          onChangeKoeiroParam={handleChangeKoeiroParam}
          onClickOpenVrmFile={handleClickOpenVrmFile}
          onClickResetChatLog={handleClickResetChatLog}
          onClickResetCodeLog={handleClickResetCodeLog}
          onClickResetSystemPrompt={handleClickResetSystemPrompt}
          onChangeKoeiromapKey={handleChangeKoeiromapKey}
          onChangeVoicevoxSpeaker={handleVoicevoxSpeakerChange}
          onChangeGoogleTtsType={handleChangeGoogleTtsType}
          onChangeYoutubeMode={onChangeYoutubeMode}
          onChangeYoutubeApiKey={handleYoutubeApiKeyChange}
          onChangeYoutubeLiveId={handleYoutubeLiveIdChange}
          webSocketMode={webSocketMode}
          onChangeWebSocketMode={handleWebSocketMode}
          selectVoice = {selectVoice}
          setSelectVoice = {setSelectVoice}
          selectLanguage = {selectLanguage}
          setSelectLanguage = {setSelectLanguage}
          setSelectVoiceLanguage = {setSelectVoiceLanguage}
          onClickTestVoice={handleClickTestVoice}
        />
      )}
      {!showChatLog && assistantMessage && (
        <AssistantText message={assistantMessage} />
      )}
      <input
        type="file"
        className="hidden"
        accept=".vrm"
        ref={fileInputRef}
        onChange={handleChangeVrmFile}
      />
    </>
  );
};
