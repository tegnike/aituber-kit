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
  selectAIService: string;
  setSelectAIService: (service: string) => void;
  selectAIModel: string;
  setSelectAIModel: (model: string) => void;
  openAiKey: string;
  onChangeOpenAiKey: (key: string) => void;
  anthropicKey: string;
  onChangeAnthropicKey: (key: string) => void;
  systemPrompt: string;
  chatLog: Message[];
  codeLog: Message[];
  koeiroParam: KoeiroParam;
  assistantMessage: string;
  koeiromapKey: string;
  voicevoxSpeaker: string;
  googleTtsType: string;
  stylebertvits2ServerUrl: string;
  onChangeStyleBertVits2ServerUrl: (key: string) => void;
  stylebertvits2ModelId: string;
  onChangeStyleBertVits2ModelId: (key: string) => void;
  youtubeMode: boolean;
  youtubeApiKey: string;
  youtubeLiveId: string;
  onChangeSystemPrompt: (systemPrompt: string) => void;
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
  selectAIService,
  setSelectAIService,
  selectAIModel,
  setSelectAIModel,
  openAiKey,
  onChangeOpenAiKey,
  anthropicKey,
  onChangeAnthropicKey,
  systemPrompt,
  chatLog,
  codeLog,
  koeiroParam,
  assistantMessage,
  koeiromapKey,
  voicevoxSpeaker,
  googleTtsType,
  stylebertvits2ServerUrl,
  stylebertvits2ModelId,
  youtubeMode,
  youtubeApiKey,
  youtubeLiveId,
  onChangeSystemPrompt,
  onChangeChatLog,
  onChangeCodeLog,
  onChangeKoeiromapParam,
  handleClickResetChatLog,
  handleClickResetCodeLog,
  handleClickResetSystemPrompt,
  onChangeKoeiromapKey,
  onChangeVoicevoxSpeaker,
  onChangeGoogleTtsType,
  onChangeStyleBertVits2ServerUrl,
  onChangeStyleBertVits2ModelId,
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

  const handleOpenAiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeOpenAiKey(event.target.value);
    },
    [onChangeOpenAiKey]
  );

  const handleAnthropicKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeAnthropicKey(event.target.value);
    },
    [onChangeAnthropicKey]
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

  const handleChangeStyleBertVits2ServerUrl = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeStyleBertVits2ServerUrl(event.target.value);
    },
    [onChangeStyleBertVits2ServerUrl]
  );

  const handleChangeStyleBertVits2ModelId = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeStyleBertVits2ModelId(event.target.value);
    },
    [onChangeStyleBertVits2ModelId]
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
          selectAIService={selectAIService}
          setSelectAIService={setSelectAIService}
          selectAIModel={selectAIModel}
          setSelectAIModel={setSelectAIModel}
          openAiKey={openAiKey}
          onChangeOpenAiKey={handleOpenAiKeyChange}
          anthropicKey={anthropicKey}
          onChangeAnthropicKey={handleAnthropicKeyChange}
          chatLog={chatLog}
          codeLog={codeLog}
          systemPrompt={systemPrompt}
          koeiroParam={koeiroParam}
          koeiromapKey={koeiromapKey}
          voicevoxSpeaker={voicevoxSpeaker}
          googleTtsType={googleTtsType}
          stylebertvits2ServerUrl={stylebertvits2ServerUrl}
          stylebertvits2ModelId={stylebertvits2ModelId}
          youtubeMode={youtubeMode}
          youtubeApiKey={youtubeApiKey}
          youtubeLiveId={youtubeLiveId}
          onClickClose={() => setShowSettings(false)}
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
          onChangeStyleBertVits2ServerUrl={handleChangeStyleBertVits2ServerUrl}
          onChangeStyleBertVits2ModelId={handleChangeStyleBertVits2ModelId}
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
